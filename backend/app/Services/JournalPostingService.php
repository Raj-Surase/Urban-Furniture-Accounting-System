<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Payment;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class JournalPostingService
{
    /**
     * Automatically post double-entry General Ledger entry on Invoice Approval.
     * Guaranteed to balance debits and credits strictly.
     */
    public static function postInvoice(Invoice $invoice, User $user): JournalEntry
    {
        return DB::transaction(function () use ($invoice, $user) {
            $nextNum = self::generateEntryNumber();
            $accounts = Account::whereIn('code', [
                '1110', '1120', '1130', '1140', '2110', '2121', '2122', '2123',
                '2131', '2132', '2133', '4100', '4200', '4300', '5100', '5200', '5300'
            ])->get()->keyBy('code');

            $year = (int) now()->format('Y');
            $period = (int) now()->format('n');

            $je = JournalEntry::create([
                'entry_number' => $nextNum,
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $invoice->id,
                'description' => "Auto-posted on approval: {$invoice->invoice_number} ({$invoice->party_type})",
                'posting_date' => $invoice->invoice_date ?? now()->toDateString(),
                'fiscal_year' => $year,
                'period' => $period,
                'status' => 'posted',
                'posted_by' => $user->id,
                'posted_at' => now(),
                'created_by' => $user->id,
            ]);

            $invoice->load('items.account');

            if ($invoice->type === 'receivable') {
                // AR Invoice (Customer Tax Invoice)
                // Dr. 1120 Accounts Receivable (Total amount due)
                self::createLine($je, $accounts['1120'], $invoice->total_amount, 0, "AR Receivable for {$invoice->invoice_number}", $invoice->invoice_number);

                // Dr. 4300 Discount Allowed (if discount granted)
                if ((float) $invoice->discount_amount > 0) {
                    $discAcc = $accounts['4300'] ?? $accounts['1120'];
                    self::createLine($je, $discAcc, (float) $invoice->discount_amount, 0, "Discount allowance", $invoice->invoice_number);
                }

                // Cr. Revenue Account(s) (Subtotal)
                if ($invoice->items->isNotEmpty()) {
                    $itemsByAccount = $invoice->items->groupBy('account_id');
                    foreach ($itemsByAccount as $accId => $groupItems) {
                        $lineAcc = Account::find($accId) ?? $accounts['4100'];
                        $groupSubtotal = (float) $groupItems->sum(function ($it) {
                            return (float) $it->quantity * (float) $it->unit_price;
                        });
                        if ($groupSubtotal > 0) {
                            self::createLine($je, $lineAcc, 0, $groupSubtotal, "Sales revenue", $invoice->invoice_number);
                        }
                    }
                } else {
                    self::createLine($je, $accounts['4100'], 0, (float) $invoice->subtotal, "Sales revenue", $invoice->invoice_number);
                }

                // Cr. GST Outputs
                if ((float) $invoice->cgst_amount > 0 && isset($accounts['2121'])) {
                    self::createLine($je, $accounts['2121'], 0, (float) $invoice->cgst_amount, "9% Central GST Output", $invoice->invoice_number);
                }
                if ((float) $invoice->sgst_amount > 0 && isset($accounts['2122'])) {
                    self::createLine($je, $accounts['2122'], 0, (float) $invoice->sgst_amount, "9% State GST Output", $invoice->invoice_number);
                }
                if ((float) $invoice->igst_amount > 0 && isset($accounts['2123'])) {
                    self::createLine($je, $accounts['2123'], 0, (float) $invoice->igst_amount, "18% Integrated GST Output", $invoice->invoice_number);
                }
            } else {
                // AP Bill (Vendor Tax Bill)
                // Net taxable asset/expense value (Subtotal minus vendor discount)
                $netSubtotal = round((float) $invoice->subtotal - (float) $invoice->discount_amount, 2);

                // Dr. 1130 Inventory / Expense accounts (Net Subtotal)
                if ($invoice->items->isNotEmpty()) {
                    $itemsByAccount = $invoice->items->groupBy('account_id');
                    foreach ($itemsByAccount as $accId => $groupItems) {
                        $lineAcc = Account::find($accId) ?? $accounts['1130'];
                        $groupNet = (float) $groupItems->sum(function ($it) {
                            $gross = (float) $it->quantity * (float) $it->unit_price;
                            $disc = $gross * ((float) $it->discount_percent / 100);
                            return $gross - $disc;
                        });
                        if ($groupNet > 0) {
                            self::createLine($je, $lineAcc, $groupNet, 0, "Inventory purchase asset", $invoice->invoice_number);
                        }
                    }
                } else {
                    self::createLine($je, $accounts['1130'], $netSubtotal, 0, "Inventory purchase asset", $invoice->invoice_number);
                }

                // Dr. GST Input Tax Credits
                if ((float) $invoice->cgst_amount > 0 && isset($accounts['2131'])) {
                    self::createLine($je, $accounts['2131'], (float) $invoice->cgst_amount, 0, "9% Central GST Input Credit", $invoice->invoice_number);
                }
                if ((float) $invoice->sgst_amount > 0 && isset($accounts['2132'])) {
                    self::createLine($je, $accounts['2132'], (float) $invoice->sgst_amount, 0, "9% State GST Input Credit", $invoice->invoice_number);
                }
                if ((float) $invoice->igst_amount > 0 && isset($accounts['2133'])) {
                    self::createLine($je, $accounts['2133'], (float) $invoice->igst_amount, 0, "18% Integrated GST Input Credit", $invoice->invoice_number);
                }

                // Cr. 2110 Accounts Payable (Total invoice amount due)
                self::createLine($je, $accounts['2110'], 0, (float) $invoice->total_amount, "AP Payable for {$invoice->invoice_number}", $invoice->invoice_number);
            }

            // Adjust residual rounding difference to ensure total debit == total credit to the penny
            $totalDebit = round((float) $je->lines()->sum('debit'), 2);
            $totalCredit = round((float) $je->lines()->sum('credit'), 2);
            $diff = round($totalDebit - $totalCredit, 2);

            if (abs($diff) > 0 && abs($diff) <= 0.05) {
                if ($diff > 0) {
                    // Debits exceed credits by $diff; adjust credit line
                    $targetCreditLine = $je->lines()->where('credit', '>', 0)->latest('id')->first();
                    if ($targetCreditLine) {
                        $targetCreditLine->credit = round($targetCreditLine->credit + $diff, 2);
                        $targetCreditLine->save();
                    }
                } else {
                    // Credits exceed debits by abs($diff); adjust debit line
                    $targetDebitLine = $je->lines()->where('debit', '>', 0)->latest('id')->first();
                    if ($targetDebitLine) {
                        $targetDebitLine->debit = round($targetDebitLine->debit + abs($diff), 2);
                        $targetDebitLine->save();
                    }
                }
            }

            // Strictly verify that the entry balances
            $je->refresh();
            if (!$je->isBalanced()) {
                throw new \RuntimeException(
                    "Cannot commit unbalanced journal entry {$je->entry_number}: " .
                    "Total Debit {$je->total_debit} != Total Credit {$je->total_credit}."
                );
            }

            // Recalculate affected account balances
            $touchedAccounts = $je->lines()->pluck('account_id')->unique();
            foreach ($touchedAccounts as $accId) {
                $acc = Account::find($accId);
                $acc?->recalculateBalance();
            }

            return $je;
        });
    }

    /**
     * Auto-post Goods Receipt clearing entry on PO receipt.
     */
    public static function postGoodsReceipt(PurchaseOrder $po, User $user, ?float $receivedValue = null): JournalEntry
    {
        return DB::transaction(function () use ($po, $user, $receivedValue) {
            $nextNum = self::generateEntryNumber();
            $accounts = Account::whereIn('code', ['1130', '1140'])->get()->keyBy('code');

            $amount = ($receivedValue !== null && $receivedValue > 0)
                ? round($receivedValue, 2)
                : (float) $po->subtotal;

            $je = JournalEntry::create([
                'entry_number' => $nextNum,
                'type' => 'auto',
                'reference_type' => PurchaseOrder::class,
                'reference_id' => $po->id,
                'description' => "Goods Receipt inventory intake for {$po->po_number}",
                'posting_date' => $po->delivery_date ?? now()->toDateString(),
                'fiscal_year' => (int) now()->format('Y'),
                'period' => (int) now()->format('n'),
                'status' => 'posted',
                'posted_by' => $user->id,
                'posted_at' => now(),
                'created_by' => $user->id,
            ]);

            // Dr. 1130 Inventory
            self::createLine($je, $accounts['1130'], $amount, 0, "Stock intake at cost", $po->po_number);

            // Cr. 1140 GRNI Clearing
            self::createLine($je, $accounts['1140'], 0, $amount, "Goods Received Not Invoiced", $po->po_number);

            $accounts['1130']->recalculateBalance();
            $accounts['1140']->recalculateBalance();

            return $je;
        });
    }

    /**
     * Auto-post COGS inventory relief entry on Sales Order delivery.
     */
    public static function postSalesDelivery(SalesOrder $so, User $user, ?float $deliveredCost = null): JournalEntry
    {
        return DB::transaction(function () use ($so, $user, $deliveredCost) {
            $nextNum = self::generateEntryNumber();
            $accounts = Account::whereIn('code', ['5100', '1130'])->get()->keyBy('code');

            if ($deliveredCost !== null && $deliveredCost > 0) {
                $totalCost = round($deliveredCost, 2);
            } else {
                $so->load('items.product');
                $totalCost = 0.00;
                foreach ($so->items as $item) {
                    $costPerUnit = $item->product ? (float) $item->product->cost_price : (float) $item->unit_price * 0.6;
                    $totalCost += ($costPerUnit * (float) $item->quantity_delivered);
                }
                $totalCost = round($totalCost, 2);
            }

            $je = JournalEntry::create([
                'entry_number' => $nextNum,
                'type' => 'auto',
                'reference_type' => SalesOrder::class,
                'reference_id' => $so->id,
                'description' => "COGS & Inventory relief for delivered {$so->so_number}",
                'posting_date' => $so->delivery_date ?? now()->toDateString(),
                'fiscal_year' => (int) now()->format('Y'),
                'period' => (int) now()->format('n'),
                'status' => 'posted',
                'posted_by' => $user->id,
                'posted_at' => now(),
                'created_by' => $user->id,
            ]);

            // Dr. 5100 COGS
            self::createLine($je, $accounts['5100'], $totalCost, 0, "Cost of Goods Sold on delivery", $so->so_number);

            // Cr. 1130 Inventory
            self::createLine($je, $accounts['1130'], 0, $totalCost, "Inventory stock reduction", $so->so_number);

            $accounts['5100']->recalculateBalance();
            $accounts['1130']->recalculateBalance();

            return $je;
        });
    }

    /**
     * Auto-post Payment entry against Bank/Cash.
     */
    public static function postPayment(Payment $payment, User $user): JournalEntry
    {
        return DB::transaction(function () use ($payment, $user) {
            $nextNum = self::generateEntryNumber();
            $accounts = Account::whereIn('code', ['1110', '1120', '2110'])->get()->keyBy('code');

            $bankAccount = $payment->bankAccount ?? $accounts['1110'];

            $je = JournalEntry::create([
                'entry_number' => $nextNum,
                'type' => 'auto',
                'reference_type' => Payment::class,
                'reference_id' => $payment->id,
                'description' => "Treasury entry for {$payment->payment_number} ({$payment->type})",
                'posting_date' => $payment->payment_date ?? now()->toDateString(),
                'fiscal_year' => (int) now()->format('Y'),
                'period' => (int) now()->format('n'),
                'status' => 'posted',
                'posted_by' => $user->id,
                'posted_at' => now(),
                'created_by' => $user->id,
            ]);

            if ($payment->type === 'received') {
                // Dr. Bank/Cash
                self::createLine($je, $bankAccount, $payment->amount, 0, "Receipt into {$bankAccount->name}", $payment->payment_number);
                // Cr. Accounts Receivable
                self::createLine($je, $accounts['1120'], 0, $payment->amount, "Settlement of customer receivable", $payment->payment_number);
            } else {
                // Dr. Accounts Payable
                self::createLine($je, $accounts['2110'], $payment->amount, 0, "Settlement of vendor payable", $payment->payment_number);
                // Cr. Bank/Cash
                self::createLine($je, $bankAccount, 0, $payment->amount, "Disbursement from {$bankAccount->name}", $payment->payment_number);
            }

            $bankAccount->recalculateBalance();
            $accounts['1120']->recalculateBalance();
            $accounts['2110']->recalculateBalance();

            return $je;
        });
    }

    /**
     * Post a Contra Reversal Journal Entry on Voiding.
     */
    public static function voidInvoice(Invoice $invoice, User $user): ?JournalEntry
    {
        $origJE = JournalEntry::where('reference_type', Invoice::class)
            ->where('reference_id', $invoice->id)
            ->where('status', 'posted')
            ->first();

        if (!$origJE) {
            return null;
        }

        return DB::transaction(function () use ($origJE, $invoice, $user) {
            $nextNum = self::generateEntryNumber();
            $reversal = JournalEntry::create([
                'entry_number' => $nextNum,
                'type' => 'reversal',
                'reference_type' => Invoice::class,
                'reference_id' => $invoice->id,
                'description' => "Contra Reversal entry for voided {$invoice->invoice_number} (Ref: {$origJE->entry_number})",
                'posting_date' => now()->toDateString(),
                'fiscal_year' => (int) now()->format('Y'),
                'period' => (int) now()->format('n'),
                'status' => 'posted',
                'reversed_entry_id' => $origJE->id,
                'posted_by' => $user->id,
                'posted_at' => now(),
                'created_by' => $user->id,
            ]);

            $origJE->load('lines.account');
            foreach ($origJE->lines as $line) {
                JournalEntryLine::create([
                    'journal_entry_id' => $reversal->id,
                    'account_id' => $line->account_id,
                    'account_code' => $line->account_code,
                    'account_name' => $line->account_name,
                    'debit' => $line->credit, // Swapped
                    'credit' => $line->debit, // Swapped
                    'description' => "Reversal: " . $line->description,
                    'reference' => "VOID-" . $invoice->invoice_number,
                ]);

                $line->account?->recalculateBalance();
            }

            $origJE->status = 'reversed';
            $origJE->save();

            return $reversal;
        });
    }

    private static function createLine(JournalEntry $je, Account $account, float $debit, float $credit, ?string $desc = null, ?string $ref = null): JournalEntryLine
    {
        return JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'account_id' => $account->id,
            'account_code' => $account->code,
            'account_name' => $account->name,
            'debit' => round($debit, 2),
            'credit' => round($credit, 2),
            'description' => $desc,
            'reference' => $ref,
        ]);
    }

    private static function generateEntryNumber(): string
    {
        return SequenceService::generate('JE', (int) now()->format('Y'), 4);
    }
}
