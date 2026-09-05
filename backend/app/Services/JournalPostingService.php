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
     */
    public static function postInvoice(Invoice $invoice, User $user): JournalEntry
    {
        return DB::transaction(function () use ($invoice, $user) {
            $nextNum = self::generateEntryNumber();
            $accounts = Account::whereIn('code', [
                '1110', '1120', '1130', '1140', '2110', '2121', '2122', '2123',
                '2131', '2132', '2133', '4100', '4300', '5100'
            ])->get()->keyBy('code');

            $je = JournalEntry::create([
                'entry_number' => $nextNum,
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $invoice->id,
                'description' => "Auto-posted on approval: {$invoice->invoice_number} ({$invoice->party_type})",
                'posting_date' => $invoice->invoice_date ?? now()->toDateString(),
                'fiscal_year' => (int) now()->format('Y'),
                'period' => (int) now()->format('n'),
                'status' => 'posted',
                'posted_by' => $user->id,
                'posted_at' => now(),
                'created_by' => $user->id,
            ]);

            if ($invoice->type === 'receivable') {
                // AR Invoice (Customer Tax Invoice)
                // Dr. 1120 Accounts Receivable (Total)
                self::createLine($je, $accounts['1120'], $invoice->total_amount, 0, "AR Receivable for {$invoice->invoice_number}", $invoice->invoice_number);

                // Dr. 4300 Discount Allowed (if discount)
                if ($invoice->discount_amount > 0) {
                    self::createLine($je, $accounts['4300'], $invoice->discount_amount, 0, "Discount allowance", $invoice->invoice_number);
                }

                // Cr. 4100 Sales Revenue (Subtotal)
                self::createLine($je, $accounts['4100'], 0, $invoice->subtotal, "Sales revenue", $invoice->invoice_number);

                // Cr. GST Outputs
                if ($invoice->is_interstate) {
                    if ($invoice->igst_amount > 0) {
                        self::createLine($je, $accounts['2123'], 0, $invoice->igst_amount, "18% Integrated GST Output", $invoice->invoice_number);
                    }
                } else {
                    if ($invoice->cgst_amount > 0) {
                        self::createLine($je, $accounts['2121'], 0, $invoice->cgst_amount, "9% Central GST Output", $invoice->invoice_number);
                    }
                    if ($invoice->sgst_amount > 0) {
                        self::createLine($je, $accounts['2122'], 0, $invoice->sgst_amount, "9% State GST Output", $invoice->invoice_number);
                    }
                }
            } else {
                // AP Bill (Vendor Tax Bill)
                // Dr. 1130 Inventory or 5100 Expense (Subtotal)
                self::createLine($je, $accounts['1130'], $invoice->subtotal, 0, "Inventory purchase asset", $invoice->invoice_number);

                // Dr. GST Input Tax Credits (Receivables)
                if ($invoice->is_interstate) {
                    if ($invoice->igst_amount > 0) {
                        self::createLine($je, $accounts['2133'], $invoice->igst_amount, 0, "18% Integrated GST Input Credit", $invoice->invoice_number);
                    }
                } else {
                    if ($invoice->cgst_amount > 0) {
                        self::createLine($je, $accounts['2131'], $invoice->cgst_amount, 0, "9% Central GST Input Credit", $invoice->invoice_number);
                    }
                    if ($invoice->sgst_amount > 0) {
                        self::createLine($je, $accounts['2132'], $invoice->sgst_amount, 0, "9% State GST Input Credit", $invoice->invoice_number);
                    }
                }

                // Cr. 2110 Accounts Payable (Total)
                self::createLine($je, $accounts['2110'], 0, $invoice->total_amount, "AP Payable for {$invoice->invoice_number}", $invoice->invoice_number);
            }

            // Recalculate affected account balances
            foreach ($accounts as $acc) {
                $acc->recalculateBalance();
            }

            return $je;
        });
    }

    /**
     * Auto-post Goods Receipt clearing entry on PO receipt.
     */
    public static function postGoodsReceipt(PurchaseOrder $po, User $user): JournalEntry
    {
        return DB::transaction(function () use ($po, $user) {
            $nextNum = self::generateEntryNumber();
            $accounts = Account::whereIn('code', ['1130', '1140'])->get()->keyBy('code');

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

            // Dr. 1130 Inventory (Subtotal)
            self::createLine($je, $accounts['1130'], $po->subtotal, 0, "Stock intake at cost", $po->po_number);

            // Cr. 1140 GRNI Clearing (Subtotal)
            self::createLine($je, $accounts['1140'], 0, $po->subtotal, "Goods Received Not Invoiced", $po->po_number);

            $accounts['1130']->recalculateBalance();
            $accounts['1140']->recalculateBalance();

            return $je;
        });
    }

    /**
     * Auto-post COGS inventory relief entry on Sales Order delivery.
     */
    public static function postSalesDelivery(SalesOrder $so, User $user): JournalEntry
    {
        return DB::transaction(function () use ($so, $user) {
            $nextNum = self::generateEntryNumber();
            $accounts = Account::whereIn('code', ['5100', '1130'])->get()->keyBy('code');

            $so->load('items.product');
            $totalCost = 0.00;
            foreach ($so->items as $item) {
                $costPerUnit = $item->product ? (float) $item->product->cost_price : (float) $item->unit_price * 0.6;
                $totalCost += ($costPerUnit * (float) $item->quantity_delivered);
            }
            $totalCost = round($totalCost, 2);

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
                    'debit' => $line->credit, // Swapped!
                    'credit' => $line->debit, // Swapped!
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
        $year = now()->format('Y');
        $count = JournalEntry::whereYear('created_at', $year)->count() + 1;
        return sprintf("JE-%s-%04d", $year, $count);
    }
}
