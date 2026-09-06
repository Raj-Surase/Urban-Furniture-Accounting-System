<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReportController extends Controller
{
    /**
     * Trial Balance statement ensuring Total Debits == Total Credits.
     * Supports optional from_date and to_date filters.
     */
    public function trialBalance(Request $request): JsonResponse
    {
        Gate::authorize('viewFinancial', Account::class);

        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date');

        $accountsQuery = Account::with(['journalLines' => function ($q) use ($fromDate, $toDate) {
            $q->whereHas('journalEntry', function ($jeQ) use ($fromDate, $toDate) {
                $jeQ->where('status', 'posted');
                if ($fromDate) {
                    $jeQ->where('posting_date', '>=', $fromDate);
                }
                if ($toDate) {
                    $jeQ->where('posting_date', '<=', $toDate);
                }
            });
        }])->orderBy('code', 'asc');

        $accounts = $accountsQuery->get();

        $rows = [];
        $sumDebits = 0.00;
        $sumCredits = 0.00;

        foreach ($accounts as $acc) {
            $totalDebit = (float) $acc->journalLines->sum('debit');
            $totalCredit = (float) $acc->journalLines->sum('credit');

            // If date range is not specified and opening balance exists, include opening balance
            if (!$fromDate && !$toDate && (float) $acc->opening_balance > 0) {
                if ($acc->normal_balance === 'debit') {
                    $totalDebit += (float) $acc->opening_balance;
                } else {
                    $totalCredit += (float) $acc->opening_balance;
                }
            }

            $net = $totalDebit - $totalCredit;
            $debitBal = 0.00;
            $creditBal = 0.00;

            if ($net > 0) {
                $debitBal = $net;
            } elseif ($net < 0) {
                $creditBal = abs($net);
            }

            $sumDebits += $debitBal;
            $sumCredits += $creditBal;

            $rows[] = [
                'id' => $acc->id,
                'code' => $acc->code,
                'name' => $acc->name,
                'type' => $acc->type,
                'normal_balance' => $acc->normal_balance,
                'debit_balance' => round($debitBal, 2),
                'credit_balance' => round($creditBal, 2),
            ];
        }

        return response()->json([
            'as_of_date' => $toDate ?: now()->toDateString(),
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'rows' => $rows,
            'total_debit' => round($sumDebits, 2),
            'total_credit' => round($sumCredits, 2),
            'difference' => round(abs($sumDebits - $sumCredits), 2),
            'is_balanced' => abs($sumDebits - $sumCredits) < 0.01,
        ]);
    }

    /**
     * Income Statement / Profit & Loss statement.
     * Supports optional from_date and to_date filters.
     */
    public function incomeStatement(Request $request): JsonResponse
    {
        Gate::authorize('viewFinancial', Account::class);

        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date');

        $accounts = Account::with(['journalLines' => function ($q) use ($fromDate, $toDate) {
            $q->whereHas('journalEntry', function ($jeQ) use ($fromDate, $toDate) {
                $jeQ->where('status', 'posted');
                if ($fromDate) {
                    $jeQ->where('posting_date', '>=', $fromDate);
                }
                if ($toDate) {
                    $jeQ->where('posting_date', '<=', $toDate);
                }
            });
        }])
            ->whereIn('type', ['revenue', 'expense'])
            ->orderBy('code', 'asc')
            ->get();

        $revenues = [];
        $expenses = [];
        $totalRevenue = 0.00;
        $cogsTotal = 0.00;
        $operatingExpenses = 0.00;

        $includeZero = $request->boolean('include_zero', false);

        foreach ($accounts as $acc) {
            $debits = (float) $acc->journalLines->sum('debit');
            $credits = (float) $acc->journalLines->sum('credit');

            if ($acc->type === 'revenue') {
                $bal = $credits - $debits;
                $totalRevenue += $bal;
                if ($includeZero || abs($bal) > 0.001) {
                    $revenues[] = [
                        'code' => $acc->code,
                        'name' => $acc->name,
                        'sub_type' => $acc->sub_type,
                        'amount' => round($bal, 2),
                    ];
                }
            } else {
                $bal = $debits - $credits;
                if ($acc->code === '5100') {
                    $cogsTotal += $bal;
                } else {
                    $operatingExpenses += $bal;
                }
                if ($includeZero || abs($bal) > 0.001) {
                    $expenses[] = [
                        'code' => $acc->code,
                        'name' => $acc->name,
                        'sub_type' => $acc->sub_type,
                        'amount' => round($bal, 2),
                    ];
                }
            }
        }

        $grossProfit = $totalRevenue - $cogsTotal;
        $netProfit = $grossProfit - $operatingExpenses;

        $periodLabel = 'Fiscal Year ' . now()->format('Y');
        if ($fromDate && $toDate) {
            $periodLabel = $fromDate . ' to ' . $toDate;
        } elseif ($fromDate) {
            $periodLabel = 'Since ' . $fromDate;
        } elseif ($toDate) {
            $periodLabel = 'Up to ' . $toDate;
        }

        return response()->json([
            'period' => $periodLabel,
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'revenues' => $revenues,
            'total_revenue' => round($totalRevenue, 2),
            'cogs' => round($cogsTotal, 2),
            'gross_profit' => round($grossProfit, 2),
            'expenses' => $expenses,
            'operating_expenses' => round($operatingExpenses, 2),
            'net_profit' => round($netProfit, 2),
        ]);
    }

    /**
     * Balance Sheet Statement (Assets = Liabilities + Equity).
     * Supports optional from_date and to_date filters.
     */
    public function balanceSheet(Request $request): JsonResponse
    {
        Gate::authorize('viewFinancial', Account::class);

        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date', $request->query('as_of_date'));

        $accounts = Account::with(['journalLines' => function ($q) use ($toDate) {
            $q->whereHas('journalEntry', function ($jeQ) use ($toDate) {
                $jeQ->where('status', 'posted');
                if ($toDate) {
                    $jeQ->where('posting_date', '<=', $toDate);
                }
            });
        }])
            ->whereIn('type', ['asset', 'liability', 'equity'])
            ->orderBy('code', 'asc')
            ->get();

        $assets = [];
        $liabilities = [];
        $equity = [];

        $totalAssets = 0.00;
        $totalLiabilities = 0.00;
        $totalEquity = 0.00;

        $includeZero = $request->boolean('include_zero', false);

        foreach ($accounts as $acc) {
            $debits = (float) $acc->journalLines->sum('debit');
            $credits = (float) $acc->journalLines->sum('credit');

            // Add opening balance if no specific date filter restricts it
            if ((float) $acc->opening_balance > 0) {
                if ($acc->normal_balance === 'debit') {
                    $debits += (float) $acc->opening_balance;
                } else {
                    $credits += (float) $acc->opening_balance;
                }
            }

            if ($acc->type === 'asset') {
                $bal = ($acc->normal_balance === 'debit') ? ($debits - $credits) : ($credits - $debits);
                $totalAssets += ($acc->normal_balance === 'debit') ? $bal : -$bal;
                if ($includeZero || abs($bal) > 0.001) {
                    $assets[] = [
                        'code' => $acc->code,
                        'name' => $acc->name,
                        'sub_type' => $acc->sub_type,
                        'amount' => round($bal, 2),
                    ];
                }
            } elseif ($acc->type === 'liability') {
                $bal = $credits - $debits;
                $totalLiabilities += $bal;
                if ($includeZero || abs($bal) > 0.001) {
                    $liabilities[] = [
                        'code' => $acc->code,
                        'name' => $acc->name,
                        'sub_type' => $acc->sub_type,
                        'amount' => round($bal, 2),
                    ];
                }
            } else {
                $bal = $credits - $debits;
                $totalEquity += $bal;
                if ($includeZero || abs($bal) > 0.001) {
                    $equity[] = [
                        'code' => $acc->code,
                        'name' => $acc->name,
                        'sub_type' => $acc->sub_type,
                        'amount' => round($bal, 2),
                    ];
                }
            }
        }

        // Calculate Net Income from P&L up to to_date
        $pnlAccounts = Account::with(['journalLines' => function ($q) use ($fromDate, $toDate) {
            $q->whereHas('journalEntry', function ($jeQ) use ($fromDate, $toDate) {
                $jeQ->where('status', 'posted');
                if ($fromDate) {
                    $jeQ->where('posting_date', '>=', $fromDate);
                }
                if ($toDate) {
                    $jeQ->where('posting_date', '<=', $toDate);
                }
            });
        }])->whereIn('type', ['revenue', 'expense'])->get();

        $netIncome = 0.00;
        foreach ($pnlAccounts as $pnl) {
            $dr = (float) $pnl->journalLines->sum('debit');
            $cr = (float) $pnl->journalLines->sum('credit');
            if ($pnl->type === 'revenue') {
                $netIncome += ($cr - $dr);
            } else {
                $netIncome -= ($dr - $cr);
            }
        }

        $totalEquityWithIncome = $totalEquity + $netIncome;

        return response()->json([
            'as_of_date' => $toDate ?: now()->toDateString(),
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'assets' => $assets,
            'total_assets' => round($totalAssets, 2),
            'liabilities' => $liabilities,
            'total_liabilities' => round($totalLiabilities, 2),
            'equity' => $equity,
            'current_period_net_income' => round($netIncome, 2),
            'total_equity' => round($totalEquityWithIncome, 2),
            'total_liabilities_and_equity' => round($totalLiabilities + $totalEquityWithIncome, 2),
            'is_balanced' => abs($totalAssets - ($totalLiabilities + $totalEquityWithIncome)) < 0.05,
        ]);
    }

    /**
     * Accounts Receivable Aging analysis (30 / 60 / 90 / 90+ days).
     * Supports optional from_date and to_date filters.
     */
    public function arAging(Request $request): JsonResponse
    {
        Gate::authorize('viewFinancial', Account::class);

        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date');

        $query = Invoice::where('type', 'receivable')
            ->whereIn('status', ['approved', 'partially_paid'])
            ->where('balance_due', '>', 0);

        if ($fromDate) {
            $query->where('invoice_date', '>=', $fromDate);
        }
        if ($toDate) {
            $query->where('invoice_date', '<=', $toDate);
        }

        $invoices = $query->get();

        $today = $toDate ? Carbon::parse($toDate) : now();
        $buckets = [
            'current' => 0.00,
            'days_1_30' => 0.00,
            'days_31_60' => 0.00,
            'days_61_90' => 0.00,
            'over_90' => 0.00,
            'total' => 0.00,
        ];

        $customerAging = [];

        foreach ($invoices as $inv) {
            $due = Carbon::parse($inv->due_date);
            $bal = (float) $inv->balance_due;
            $buckets['total'] += $bal;

            $bucketKey = 'current';
            if ($today->gt($due)) {
                $daysOver = abs($today->diffInDays($due));
                if ($daysOver <= 30) {
                    $bucketKey = 'days_1_30';
                } elseif ($daysOver <= 60) {
                    $bucketKey = 'days_31_60';
                } elseif ($daysOver <= 90) {
                    $bucketKey = 'days_61_90';
                } else {
                    $bucketKey = 'over_90';
                }
            }
            $buckets[$bucketKey] += $bal;

            $custId = $inv->party_id;
            if (!isset($customerAging[$custId])) {
                $customer = Customer::find($custId);
                $customerAging[$custId] = [
                    'customer_id' => $custId,
                    'customer_name' => $customer?->name ?? 'Unknown Customer',
                    'current' => 0.00,
                    'days_1_30' => 0.00,
                    'days_31_60' => 0.00,
                    'days_61_90' => 0.00,
                    'over_90' => 0.00,
                    'total_due' => 0.00,
                ];
            }

            $customerAging[$custId][$bucketKey] += $bal;
            $customerAging[$custId]['total_due'] += $bal;
        }

        return response()->json([
            'as_of_date' => $today->toDateString(),
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'summary' => $buckets,
            'by_customer' => array_values($customerAging),
        ]);
    }

    /**
     * Accounts Payable Aging analysis.
     * Supports optional from_date and to_date filters.
     */
    public function apAging(Request $request): JsonResponse
    {
        Gate::authorize('viewFinancial', Account::class);

        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date');

        $query = Invoice::where('type', 'payable')
            ->whereIn('status', ['approved', 'partially_paid'])
            ->where('balance_due', '>', 0);

        if ($fromDate) {
            $query->where('invoice_date', '>=', $fromDate);
        }
        if ($toDate) {
            $query->where('invoice_date', '<=', $toDate);
        }

        $bills = $query->get();

        $today = $toDate ? Carbon::parse($toDate) : now();
        $buckets = [
            'current' => 0.00,
            'days_1_30' => 0.00,
            'days_31_60' => 0.00,
            'days_61_90' => 0.00,
            'over_90' => 0.00,
            'total' => 0.00,
        ];

        $vendorAging = [];

        foreach ($bills as $bill) {
            $due = Carbon::parse($bill->due_date);
            $bal = (float) $bill->balance_due;
            $buckets['total'] += $bal;

            $bucketKey = 'current';
            if ($today->gt($due)) {
                $daysOver = abs($today->diffInDays($due));
                if ($daysOver <= 30) {
                    $bucketKey = 'days_1_30';
                } elseif ($daysOver <= 60) {
                    $bucketKey = 'days_31_60';
                } elseif ($daysOver <= 90) {
                    $bucketKey = 'days_61_90';
                } else {
                    $bucketKey = 'over_90';
                }
            }
            $buckets[$bucketKey] += $bal;

            $venId = $bill->party_id;
            if (!isset($vendorAging[$venId])) {
                $vendor = Vendor::find($venId);
                $vendorAging[$venId] = [
                    'vendor_id' => $venId,
                    'vendor_name' => $vendor?->name ?? 'Unknown Vendor',
                    'current' => 0.00,
                    'days_1_30' => 0.00,
                    'days_31_60' => 0.00,
                    'days_61_90' => 0.00,
                    'over_90' => 0.00,
                    'total_due' => 0.00,
                ];
            }

            $vendorAging[$venId][$bucketKey] += $bal;
            $vendorAging[$venId]['total_due'] += $bal;
        }

        return response()->json([
            'as_of_date' => $today->toDateString(),
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'summary' => $buckets,
            'by_vendor' => array_values($vendorAging),
        ]);
    }

    /**
     * GST Summary report detailing CGST, SGST, IGST input and output balances.
     * Supports optional from_date and to_date filters.
     */
    public function gstSummary(Request $request): JsonResponse
    {
        Gate::authorize('viewFinancial', Account::class);

        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date');

        $gstCodes = ['2121', '2122', '2123', '2131', '2132', '2133'];
        $accounts = Account::with(['journalLines' => function ($q) use ($fromDate, $toDate) {
            $q->whereHas('journalEntry', function ($jeQ) use ($fromDate, $toDate) {
                $jeQ->where('status', 'posted');
                if ($fromDate) {
                    $jeQ->where('posting_date', '>=', $fromDate);
                }
                if ($toDate) {
                    $jeQ->where('posting_date', '<=', $toDate);
                }
            });
        }])->whereIn('code', $gstCodes)->get()->keyBy('code');

        $cgstOutput = isset($accounts['2121']) ? (float) $accounts['2121']->journalLines->sum('credit') - (float) $accounts['2121']->journalLines->sum('debit') : 0.00;
        $sgstOutput = isset($accounts['2122']) ? (float) $accounts['2122']->journalLines->sum('credit') - (float) $accounts['2122']->journalLines->sum('debit') : 0.00;
        $igstOutput = isset($accounts['2123']) ? (float) $accounts['2123']->journalLines->sum('credit') - (float) $accounts['2123']->journalLines->sum('debit') : 0.00;

        $cgstInput = isset($accounts['2131']) ? (float) $accounts['2131']->journalLines->sum('debit') - (float) $accounts['2131']->journalLines->sum('credit') : 0.00;
        $sgstInput = isset($accounts['2132']) ? (float) $accounts['2132']->journalLines->sum('debit') - (float) $accounts['2132']->journalLines->sum('credit') : 0.00;
        $igstInput = isset($accounts['2133']) ? (float) $accounts['2133']->journalLines->sum('debit') - (float) $accounts['2133']->journalLines->sum('credit') : 0.00;

        $totalOutput = $cgstOutput + $sgstOutput + $igstOutput;
        $totalInput = $cgstInput + $sgstInput + $igstInput;
        $netPayable = max(0, $totalOutput - $totalInput);
        $inputCreditCarryover = max(0, $totalInput - $totalOutput);

        return response()->json([
            'as_of_date' => $toDate ?: now()->toDateString(),
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'output_tax' => [
                'cgst_output' => round($cgstOutput, 2),
                'sgst_output' => round($sgstOutput, 2),
                'igst_output' => round($igstOutput, 2),
                'total_output' => round($totalOutput, 2),
            ],
            'input_tax_credit' => [
                'cgst_input' => round($cgstInput, 2),
                'sgst_input' => round($sgstInput, 2),
                'igst_input' => round($igstInput, 2),
                'total_input_credit' => round($totalInput, 2),
            ],
            'net_gst_payable' => round($netPayable, 2),
            'input_credit_carryover' => round($inputCreditCarryover, 2),
        ]);
    }
}
