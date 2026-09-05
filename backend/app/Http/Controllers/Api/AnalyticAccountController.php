<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyticAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticAccountController extends Controller
{
    private function authorizeAnalyticAccess(): void
    {
        $user = request()->user();
        if (! $user || (! $user->isAdmin() && ! $user->isManager() && ! $user->isAccountant())) {
            abort(403, 'Unauthorized access to analytic accounts.');
        }
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeAnalyticAccess();

        $query = AnalyticAccount::query();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($name = $request->query('name')) {
            $query->where('name', 'like', "%{$name}%");
        }

        if ($code = $request->query('code')) {
            $query->where('code', 'like', "%{$code}%");
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $analytics = $query->orderBy('name')->get()->map(function ($account) {
            $budgetLines = DB::table('budget_lines')
                ->join('budgets', 'budgets.id', '=', 'budget_lines.budget_id')
                ->where('budget_lines.analytic_account_id', $account->id)
                ->whereIn('budgets.status', ['confirm', 'draft'])
                ->select(
                    'budgets.id as budget_id',
                    'budgets.name as budget_name',
                    'budgets.start_date',
                    'budgets.end_date',
                    'budget_lines.type as line_type',
                    'budget_lines.committed_amount'
                )
                ->get();

            $hasExceeded = false;
            $maxExceeded = 0;
            $exceededBudgetName = null;

            foreach ($budgetLines as $bl) {
                $committed = (float) $bl->committed_amount;
                if ($committed <= 0) continue;

                $query = DB::table('invoice_line_items')
                    ->join('invoices', 'invoices.id', '=', 'invoice_line_items.invoice_id')
                    ->where('invoice_line_items.analytic_account_id', $account->id)
                    ->where('invoices.status', '!=', 'draft')
                    ->where('invoices.status', '!=', 'void');

                if ($bl->start_date && $bl->end_date) {
                    $query->whereBetween('invoices.invoice_date', [$bl->start_date, $bl->end_date]);
                }

                if ($bl->line_type === 'income') {
                    $query->where('invoices.type', '=', 'receivable');
                } else {
                    $query->where('invoices.type', '=', 'payable');
                }

                $achieved = (float) $query->sum('invoice_line_items.line_total');
                if ($achieved > $committed) {
                    $hasExceeded = true;
                    $diff = $achieved - $committed;
                    if ($diff > $maxExceeded) {
                        $maxExceeded = $diff;
                        $exceededBudgetName = $bl->budget_name;
                    }
                }
            }

            $arr = $account->toArray();
            $arr['has_budget_exceeded'] = $hasExceeded;
            $arr['max_exceeded_amount'] = round($maxExceeded, 2);
            $arr['exceeded_budget_name'] = $exceededBudgetName;
            return $arr;
        });

        return response()->json([
            'success' => true,
            'data' => $analytics,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAnalyticAccess();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'type' => 'required|in:income,expense',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if (array_key_exists('code', $validated) && trim((string)$validated['code']) === '') {
            $validated['code'] = null;
        }
        if (array_key_exists('description', $validated) && trim((string)$validated['description']) === '') {
            $validated['description'] = null;
        }

        $analytic = AnalyticAccount::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Analytic account created successfully',
            'data' => $analytic,
        ], 201);
    }

    public function show(AnalyticAccount $analyticAccount): JsonResponse
    {
        $this->authorizeAnalyticAccess();
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
                $query->whereBetween('invoices.invoice_date', [$bl->start_date, $bl->end_date]);
            }

            if ($bl->line_type === 'income') {
                $query->where('invoices.type', '=', 'receivable');
            } else {
                $query->where('invoices.type', '=', 'payable');
            }

            $achieved = (float) $query->sum('invoice_line_items.line_total');
            $committed = (float) $bl->committed_amount;
            $isExceeded = ($committed > 0 && $achieved > $committed);
            $exceededAmount = $isExceeded ? round($achieved - $committed, 2) : 0;
            $achievedPercent = $committed > 0 ? round(($achieved / $committed) * 100, 1) : 0;

            $relatedBudgets[] = [
                'budget_id' => $bl->budget_id,
                'budget_name' => $bl->budget_name,
                'start_date' => $bl->start_date,
                'end_date' => $bl->end_date,
                'status' => $bl->budget_status,
                'committed' => $committed,
                'achieved' => $achieved,
                'is_exceeded' => $isExceeded,
                'exceeded_amount' => $exceededAmount,
                'achieved_percent' => $achievedPercent,
            ];
        }

        $exceededBudgets = array_filter($relatedBudgets, fn($b) => !empty($b['is_exceeded']));
        $hasBudgetExceeded = count($exceededBudgets) > 0;
        $maxExceededAmount = $hasBudgetExceeded ? max(array_column($exceededBudgets, 'exceeded_amount')) : 0;

        return response()->json([
            'success' => true,
            'data' => array_merge($analyticAccount->toArray(), [
                'related_budgets' => $relatedBudgets,
                'has_budget_exceeded' => $hasBudgetExceeded,
                'exceeded_budgets' => array_values($exceededBudgets),
                'max_exceeded_amount' => $maxExceededAmount,
            ]),
        ]);
    }

    public function update(Request $request, AnalyticAccount $analyticAccount): JsonResponse
    {
        $this->authorizeAnalyticAccess();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'nullable|string|max:50',
            'type' => 'sometimes|in:income,expense',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if (array_key_exists('code', $validated) && trim((string)$validated['code']) === '') {
            $validated['code'] = null;
        }
        if (array_key_exists('description', $validated) && trim((string)$validated['description']) === '') {
            $validated['description'] = null;
        }

        $analyticAccount->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Analytic account updated successfully',
            'data' => $analyticAccount,
        ]);
    }

    public function destroy(AnalyticAccount $analyticAccount): JsonResponse
    {
        $this->authorizeAnalyticAccess();

        $analyticAccount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Analytic account deleted successfully',
        ]);
    }
}
