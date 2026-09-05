<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Services\RealtimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
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
            'normal_balance' => ['required', 'in:debit,credit'],
            'opening_balance' => ['nullable', 'numeric'],
            'description' => ['nullable', 'string'],
        ]);

        $opening = (float) ($validated['opening_balance'] ?? 0);
        $account = Account::create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'type' => $validated['type'],
            'sub_type' => $validated['sub_type'] ?? null,
            'parent_id' => $validated['parent_id'] ?? null,
            'normal_balance' => $validated['normal_balance'],
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

        return response()->json([
            'account' => $account,
            'ledger' => $paginated,
        ]);
    }
}
