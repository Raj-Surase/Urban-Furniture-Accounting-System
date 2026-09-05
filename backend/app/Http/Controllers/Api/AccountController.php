<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Services\RealtimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class AccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Account::class);

        $query = Account::with('parent')->orderBy('code', 'asc');

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $accounts = $query->get();

        return response()->json([
            'data' => $accounts,
            'total' => $accounts->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Account::class);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:accounts,code'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:asset,liability,equity,revenue,expense'],
            'sub_type' => ['nullable', 'string', 'max:50'],
            'parent_id' => ['nullable', 'exists:accounts,id'],
            'normal_balance' => ['nullable', 'in:debit,credit'],
            'opening_balance' => ['nullable', 'numeric'],
            'description' => ['nullable', 'string'],
        ]);

        $normalBalance = $validated['normal_balance'] ?? (in_array($validated['type'], ['asset', 'expense']) ? 'debit' : 'credit');
        $opening = (float) ($validated['opening_balance'] ?? 0);
        $account = Account::create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'type' => $validated['type'],
            'sub_type' => $validated['sub_type'] ?? null,
            'parent_id' => $validated['parent_id'] ?? null,
            'normal_balance' => $normalBalance,
            'opening_balance' => $opening,
            'current_balance' => $opening,
            'description' => $validated['description'] ?? null,
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]);

        RealtimeService::broadcast('account:created', $account->toArray(), 'accounts');

        return response()->json([
            'message' => 'Account created successfully',
            'data' => $account,
        ], 201);
    }

    public function show(Account $account): JsonResponse
    {
        Gate::authorize('view', $account);

        $account->load(['parent', 'children']);

        return response()->json([
            'data' => $account,
        ]);
    }

    public function update(Request $request, Account $account): JsonResponse
    {
        Gate::authorize('update', $account);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'sub_type' => ['nullable', 'string', 'max:50'],
            'parent_id' => ['nullable', 'exists:accounts,id'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $account->update($validated);

        RealtimeService::broadcast('account:updated', $account->toArray(), 'accounts');

        return response()->json([
            'message' => 'Account updated successfully',
            'data' => $account,
        ]);
    }

    public function destroy(Account $account): JsonResponse
    {
        Gate::authorize('delete', $account);

        if ($account->journalLines()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete account with existing journal entry lines.',
            ], 422);
        }

        $id = $account->id;
        $account->delete();

        RealtimeService::broadcast('account:deleted', ['id' => $id], 'accounts');

        return response()->json([
            'message' => 'Account deleted successfully',
            'id' => $id,
        ]);
    }

    public function ledger(Request $request, Account $account): JsonResponse
    {
        Gate::authorize('view', $account);

        $perPage = (int) $request->query('per_page', 50);

        // Fetch chronological lines to compute accurate running balance
        $allLines = $account->journalLines()
            ->with(['journalEntry'])
            ->orderBy('id', 'asc')
            ->get();

        $running = (float) ($account->opening_balance ?? 0);
        $isCreditNormal = in_array(strtolower($account->normal_balance ?? ($account->type === 'asset' || $account->type === 'expense' ? 'debit' : 'credit')), ['credit']);

        foreach ($allLines as $line) {
            $debit = (float) ($line->debit ?? 0);
            $credit = (float) ($line->credit ?? 0);
            if ($isCreditNormal) {
                $running += ($credit - $debit);
            } else {
                $running += ($debit - $credit);
            }
            $line->running_balance = round($running, 2);
        }

        // Show newest first for ledger view
        $reversed = $allLines->reverse()->values();

        $page = (int) ($request->query('page') ?: LengthAwarePaginator::resolveCurrentPage());
        $total = $reversed->count();
        $items = $reversed->slice(($page - 1) * $perPage, $perPage)->values();

        $paginated = new LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        // Check if any invoice line items associated with this account are linked to analytic accounts with exceeded budgets
        $analyticAccountIds = DB::table('invoice_line_items')
            ->where('account_id', $account->id)
            ->whereNotNull('analytic_account_id')
            ->distinct()
            ->pluck('analytic_account_id');

        $exceededBudgets = [];
        if ($analyticAccountIds->isNotEmpty()) {
            $budgetLines = DB::table('budget_lines')
                ->join('budgets', 'budgets.id', '=', 'budget_lines.budget_id')
                ->join('analytic_accounts', 'analytic_accounts.id', '=', 'budget_lines.analytic_account_id')
                ->whereIn('budget_lines.analytic_account_id', $analyticAccountIds)
                ->whereIn('budgets.status', ['confirm', 'draft'])
                ->select(
                    'budgets.id as budget_id',
                    'budgets.name as budget_name',
                    'budgets.start_date',
                    'budgets.end_date',
                    'analytic_accounts.name as analytic_name',
                    'budget_lines.analytic_account_id',
                    'budget_lines.committed_amount',
                    'budget_lines.type as line_type'
                )
                ->get();

            foreach ($budgetLines as $bl) {
                $committed = (float) $bl->committed_amount;
                if ($committed <= 0) continue;

                $query = DB::table('invoice_line_items')
                    ->join('invoices', 'invoices.id', '=', 'invoice_line_items.invoice_id')
                    ->where('invoice_line_items.analytic_account_id', $bl->analytic_account_id)
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
                    $exceededBudgets[] = [
                        'budget_id' => $bl->budget_id,
                        'budget_name' => $bl->budget_name,
                        'analytic_id' => $bl->analytic_account_id,
                        'analytic_name' => $bl->analytic_name,
                        'committed_amount' => $committed,
                        'achieved_amount' => $achieved,
                        'exceeded_amount' => round($achieved - $committed, 2),
                        'percentage' => round(($achieved / $committed) * 100, 2),
                    ];
                }
            }
        }

        return response()->json([
            'account' => $account,
            'ledger' => $paginated,
            'exceeded_budgets' => $exceededBudgets,
        ]);
    }
}
