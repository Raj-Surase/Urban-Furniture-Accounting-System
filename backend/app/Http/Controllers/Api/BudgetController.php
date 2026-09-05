<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\BudgetLine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Budget::with(['responsible', 'originalBudget', 'revisedBudget']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $budgets = $query->orderByDesc('id')->get();

        // Calculate summary KPIs across all budgets
        $totalBudgets = $budgets->count();
        $totalCommitted = 0;
        $totalAchieved = 0;

        $budgetList = $budgets->map(function ($b) use (&$totalCommitted, &$totalAchieved) {
            $computed = $b->computed_lines;
            $bCommitted = array_sum(array_column($computed, 'committed_amount'));
            $bAchieved = array_sum(array_column($computed, 'achieved_amount'));
            $totalCommitted += $bCommitted;
            $totalAchieved += $bAchieved;

            $arr = $b->toArray();
            $arr['computed_lines'] = $computed;
            $arr['total_committed'] = $bCommitted;
            $arr['total_achieved'] = $bAchieved;
            $arr['progress_percent'] = $bCommitted > 0 ? round(($bAchieved / $bCommitted) * 100, 2) : 0;
            return $arr;
        });

        return response()->json([
            'success' => true,
            'data' => $budgetList,
            'kpis' => [
                'total_budgets' => $totalBudgets,
                'total_committed' => $totalCommitted,
                'total_achieved' => $totalAchieved,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'responsible_id' => 'nullable|exists:customers,id',
            'lines' => 'required|array|min:1',
            'lines.*.analytic_account_id' => 'required|exists:analytic_accounts,id',
            'lines.*.type' => 'required|in:income,expense',
            'lines.*.committed_amount' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $budget = Budget::create([
                'name' => $validated['name'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'responsible_id' => $validated['responsible_id'] ?? null,
                'status' => 'draft',
            ]);

            foreach ($validated['lines'] as $lineData) {
                BudgetLine::create([
                    'budget_id' => $budget->id,
                    'analytic_account_id' => $lineData['analytic_account_id'],
                    'type' => $lineData['type'],
                    'committed_amount' => $lineData['committed_amount'],
                ]);
            }

            $budget->load(['responsible', 'lines.analyticAccount']);
            $res = $budget->toArray();
            $res['computed_lines'] = $budget->computed_lines;

            return response()->json([
                'success' => true,
                'message' => 'Budget created in Draft state',
                'data' => $res,
            ], 201);
        });
    }

    public function show(Budget $budget): JsonResponse
    {
        $budget->load(['responsible', 'originalBudget', 'revisedBudget', 'lines.analyticAccount']);
        $res = $budget->toArray();
        $res['computed_lines'] = $budget->computed_lines;

        return response()->json([
            'success' => true,
            'data' => $res,
        ]);
    }

    public function update(Request $request, Budget $budget): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'responsible_id' => 'nullable|exists:customers,id',
            'lines' => 'sometimes|array',
            'lines.*.analytic_account_id' => 'required|exists:analytic_accounts,id',
            'lines.*.type' => 'required|in:income,expense',
            'lines.*.committed_amount' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $budget) {
            $budget->update([
                'name' => $validated['name'] ?? $budget->name,
                'start_date' => $validated['start_date'] ?? $budget->start_date,
                'end_date' => $validated['end_date'] ?? $budget->end_date,
                'responsible_id' => array_key_exists('responsible_id', $validated) ? $validated['responsible_id'] : $budget->responsible_id,
            ]);

            if (isset($validated['lines'])) {
                $budget->lines()->delete();
                foreach ($validated['lines'] as $lineData) {
                    BudgetLine::create([
                        'budget_id' => $budget->id,
                        'analytic_account_id' => $lineData['analytic_account_id'],
                        'type' => $lineData['type'],
                        'committed_amount' => $lineData['committed_amount'],
                    ]);
                }
            }

            $budget->load(['responsible', 'lines.analyticAccount']);
            $res = $budget->toArray();
            $res['computed_lines'] = $budget->computed_lines;

            return response()->json([
                'success' => true,
                'message' => 'Budget updated successfully',
                'data' => $res,
            ]);
        });
    }

    public function confirm(Budget $budget): JsonResponse
    {
        $budget->update(['status' => 'confirm']);

        return response()->json([
            'success' => true,
            'message' => 'Budget confirmed successfully',
            'data' => array_merge($budget->fresh(['responsible', 'lines.analyticAccount'])->toArray(), [
                'computed_lines' => $budget->computed_lines,
            ]),
        ]);
    }

    public function revise(Budget $budget): JsonResponse
    {
        if ($budget->status !== 'confirm') {
            return response()->json([
                'success' => false,
                'message' => 'Only confirmed budgets can be revised',
            ], 422);
        }

        return DB::transaction(function () use ($budget) {
            // New name: original name + " Revised"
            $newName = trim($budget->name);
            if (!str_ends_with(strtolower($newName), 'revised')) {
                $newName .= ' Revised';
            }

            $revisedBudget = Budget::create([
                'name' => $newName,
                'start_date' => $budget->start_date,
                'end_date' => $budget->end_date,
                'responsible_id' => $budget->responsible_id,
                'status' => 'draft',
                'original_budget_id' => $budget->id,
            ]);

            // Clone lines
            foreach ($budget->lines as $line) {
                BudgetLine::create([
                    'budget_id' => $revisedBudget->id,
                    'analytic_account_id' => $line->analytic_account_id,
                    'type' => $line->type,
                    'committed_amount' => $line->committed_amount,
                ]);
            }

            // Update original budget status to 'revised' and link revised budget
            $budget->update([
                'status' => 'revised',
                'revised_budget_id' => $revisedBudget->id,
            ]);

            $revisedBudget->load(['responsible', 'originalBudget', 'lines.analyticAccount']);

            return response()->json([
                'success' => true,
                'message' => 'New revised budget created. Original budget moved to Revised state.',
                'data' => array_merge($revisedBudget->toArray(), [
                    'computed_lines' => $revisedBudget->computed_lines,
                ]),
            ], 201);
        });
    }

    public function cancel(Budget $budget): JsonResponse
    {
        $budget->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Budget marked as cancelled',
            'data' => $budget,
        ]);
    }

    /**
     * Get list of invoices/bills matching an analytic account for this budget period
     */
    public function analyticTransactions(Request $request, Budget $budget): JsonResponse
    {
        $request->validate([
            'analytic_account_id' => 'required|exists:analytic_accounts,id',
            'type' => 'required|in:income,expense',
        ]);

        $analyticId = $request->analytic_account_id;
        $type = $request->type;
        $startDate = $budget->start_date?->format('Y-m-d') ?? $budget->start_date;
        $endDate = $budget->end_date?->format('Y-m-d') ?? $budget->end_date;

        $query = DB::table('invoice_line_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_line_items.invoice_id')
            ->leftJoin('customers', 'customers.id', '=', 'invoices.customer_id')
            ->leftJoin('vendors', 'vendors.id', '=', 'invoices.vendor_id')
            ->where('invoice_line_items.analytic_account_id', $analyticId)
            ->where('invoices.status', '!=', 'draft')
            ->where('invoices.status', '!=', 'void');

        if ($startDate && $endDate) {
            $query->whereBetween('invoices.issue_date', [$startDate, $endDate]);
        }

        if ($type === 'income') {
            $query->where(function ($q) {
                $q->where('invoices.invoice_type', '!=', 'vendor')
                  ->orWhereNull('invoices.invoice_type');
            });
        } else {
            $query->where('invoices.invoice_type', '=', 'vendor');
        }

        $transactions = $query->select(
            'invoices.id as invoice_id',
            'invoices.invoice_number',
            'invoices.invoice_type',
            'invoices.issue_date',
            'invoices.status',
            'customers.name as customer_name',
            'vendors.name as vendor_name',
            'invoice_line_items.description',
            'invoice_line_items.quantity',
            'invoice_line_items.unit_price',
            'invoice_line_items.line_total'
        )->get();

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }
}
