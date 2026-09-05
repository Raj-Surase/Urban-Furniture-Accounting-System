<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyticAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AnalyticAccount::query();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $analytics = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $analytics,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'type' => 'required|in:income,expense',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $analytic = AnalyticAccount::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Analytic account created successfully',
            'data' => $analytic,
        ], 201);
    }

    public function show(AnalyticAccount $analyticAccount): JsonResponse
    {
        // Find all budgets where this analytic account is used
        $budgetLines = DB::table('budget_lines')
            ->join('budgets', 'budgets.id', '=', 'budget_lines.budget_id')
            ->where('budget_lines.analytic_account_id', $analyticAccount->id)
            ->select(
                'budgets.id as budget_id',
                'budgets.name as budget_name',
                'budgets.start_date',
                'budgets.end_date',
                'budgets.status as budget_status',
                'budget_lines.type as line_type',
                'budget_lines.committed_amount'
            )
            ->get();

        $relatedBudgets = [];
        foreach ($budgetLines as $bl) {
            // Calculate achieved amount for this budget line
            $query = DB::table('invoice_line_items')
                ->join('invoices', 'invoices.id', '=', 'invoice_line_items.invoice_id')
                ->where('invoice_line_items.analytic_account_id', $analyticAccount->id)
                ->where('invoices.status', '!=', 'draft')
                ->where('invoices.status', '!=', 'void');

            if ($bl->start_date && $bl->end_date) {
                $query->whereBetween('invoices.issue_date', [$bl->start_date, $bl->end_date]);
            }

            if ($bl->line_type === 'income') {
                $query->where(function ($q) {
                    $q->where('invoices.invoice_type', '!=', 'vendor')
                      ->orWhereNull('invoices.invoice_type');
                });
            } else {
                $query->where('invoices.invoice_type', '=', 'vendor');
            }

            $achieved = (float) $query->sum('invoice_line_items.line_total');

            $relatedBudgets[] = [
                'budget_id' => $bl->budget_id,
                'budget_name' => $bl->budget_name,
                'start_date' => $bl->start_date,
                'end_date' => $bl->end_date,
                'status' => $bl->budget_status,
                'committed' => (float) $bl->committed_amount,
                'achieved' => $achieved,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => array_merge($analyticAccount->toArray(), [
                'related_budgets' => $relatedBudgets,
            ]),
        ]);
    }

    public function update(Request $request, AnalyticAccount $analyticAccount): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'nullable|string|max:50',
            'type' => 'sometimes|in:income,expense',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $analyticAccount->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Analytic account updated successfully',
            'data' => $analyticAccount,
        ]);
    }

    public function destroy(AnalyticAccount $analyticAccount): JsonResponse
    {
        $analyticAccount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Analytic account deleted successfully',
        ]);
    }
}
