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
        $query = Budget::with(['originalBudget', 'revisedBudget', 'lines.analyticAccount']);

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
            $formatted = $this->formatBudget($b);
            $totalCommitted += $formatted['total_committed'];
            $totalAchieved += $formatted['total_achieved'];
            return $formatted;
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
            'responsible_id' => 'nullable|integer',
            'responsible_type' => 'nullable|string|in:customer,vendor,user',
            'lines' => 'required|array|min:1',
            'lines.*.analytic_account_id' => 'required|exists:analytic_accounts,id',
            'lines.*.type' => 'required|in:income,expense',
            'lines.*.committed_amount' => 'required|numeric|min:0',
        ]);

        if (!empty($validated['responsible_id'])) {
            $type = $validated['responsible_type'] ?? 'customer';
            $valid = false;
            if ($type === 'vendor') {
                $valid = \App\Models\Vendor::where('id', $validated['responsible_id'])->exists();
            } elseif ($type === 'user') {
                $valid = \App\Models\User::where('id', $validated['responsible_id'])->exists();
            } else {
                $valid = \App\Models\Customer::where('id', $validated['responsible_id'])->exists() ||
                         \App\Models\Vendor::where('id', $validated['responsible_id'])->exists();
                if (!$valid) {
                    $valid = \App\Models\User::where('id', $validated['responsible_id'])->exists();
                }
            }
            if (!$valid) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected responsible contact is invalid.',
                    'errors' => ['responsible_id' => ['The selected responsible contact is invalid.']],
                ], 422);
            }
        }

        return DB::transaction(function () use ($validated) {
            $budget = Budget::create([
                'name' => $validated['name'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'responsible_id' => $validated['responsible_id'] ?? null,
                'responsible_type' => $validated['responsible_type'] ?? 'customer',
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

            $budget->load(['originalBudget', 'revisedBudget', 'lines.analyticAccount']);

            return response()->json([
                'success' => true,
                'message' => 'Budget created in Draft state',
                'data' => $this->formatBudget($budget),
            ], 201);
        });
    }

    public function show(Budget $budget): JsonResponse
    {
        $budget->load(['originalBudget', 'revisedBudget', 'lines.analyticAccount']);

        return response()->json([
            'success' => true,
            'data' => $this->formatBudget($budget),
        ]);
    }

    public function update(Request $request, Budget $budget): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'responsible_id' => 'nullable|integer',
            'responsible_type' => 'nullable|string|in:customer,vendor,user',
            'lines' => 'sometimes|array',
            'lines.*.analytic_account_id' => 'required|exists:analytic_accounts,id',
            'lines.*.type' => 'required|in:income,expense',
            'lines.*.committed_amount' => 'required|numeric|min:0',
        ]);

        if (array_key_exists('responsible_id', $validated) && !empty($validated['responsible_id'])) {
            $type = $validated['responsible_type'] ?? 'customer';
            $valid = false;
            if ($type === 'vendor') {
                $valid = \App\Models\Vendor::where('id', $validated['responsible_id'])->exists();
            } elseif ($type === 'user') {
                $valid = \App\Models\User::where('id', $validated['responsible_id'])->exists();
            } else {
                $valid = \App\Models\Customer::where('id', $validated['responsible_id'])->exists() ||
                         \App\Models\Vendor::where('id', $validated['responsible_id'])->exists();
            }
            if (!$valid) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected responsible contact is invalid.',
                    'errors' => ['responsible_id' => ['The selected responsible contact is invalid.']],
                ], 422);
            }
        }

        return DB::transaction(function () use ($validated, $budget) {
            $updateData = [
                'name' => $validated['name'] ?? $budget->name,
                'start_date' => $validated['start_date'] ?? $budget->start_date,
                'end_date' => $validated['end_date'] ?? $budget->end_date,
            ];
            if (array_key_exists('responsible_id', $validated)) {
                $updateData['responsible_id'] = $validated['responsible_id'];
                $updateData['responsible_type'] = $validated['responsible_type'] ?? 'customer';
            }
            $budget->update($updateData);

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

            $budget->load(['originalBudget', 'revisedBudget', 'lines.analyticAccount']);

            return response()->json([
                'success' => true,
                'message' => 'Budget updated successfully',
                'data' => $this->formatBudget($budget),
            ]);
        });
    }

    public function confirm(Budget $budget): JsonResponse
    {
        $budget->update(['status' => 'confirm']);
        $budget->load(['originalBudget', 'revisedBudget', 'lines.analyticAccount']);

        return response()->json([
            'success' => true,
            'message' => 'Budget confirmed successfully',
            'data' => $this->formatBudget($budget),
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
                'responsible_type' => $budget->responsible_type ?? 'customer',
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

            $revisedBudget->load(['originalBudget', 'lines.analyticAccount']);

            return response()->json([
                'success' => true,
                'message' => 'New revised budget created. Original budget moved to Revised state.',
                'data' => $this->formatBudget($revisedBudget),
            ], 201);
        });
    }

    public function cancel(Budget $budget): JsonResponse
    {
        $budget->update(['status' => 'cancelled']);
        $budget->load(['originalBudget', 'revisedBudget', 'lines.analyticAccount']);

        return response()->json([
            'success' => true,
            'message' => 'Budget marked as cancelled',
            'data' => $this->formatBudget($budget),
        ]);
    }

    public function destroy(Budget $budget): JsonResponse
    {
        if ($budget->status === 'confirm') {
            return response()->json([
                'success' => false,
                'message' => 'Confirmed budgets cannot be deleted directly. Cancel the budget first.',
            ], 422);
        }

        $budget->delete();

        return response()->json([
            'success' => true,
            'message' => 'Budget deleted successfully.',
        ]);
    }

    /**
     * Format a budget record consistently with lines, KPIs, and responsible contact info.
     */
    private function formatBudget(Budget $b): array
    {
        $computed = $b->computed_lines;
        $bCommitted = (float) array_sum(array_column($computed, 'committed_amount'));
        $bAchieved = (float) array_sum(array_column($computed, 'achieved_amount'));

        $arr = $b->toArray();
        $arr['computed_lines'] = $computed;
        $arr['total_committed'] = $bCommitted;
        $arr['total_achieved'] = $bAchieved;
        $arr['progress_percent'] = $bCommitted > 0 ? round(($bAchieved / $bCommitted) * 100, 2) : 0;

        // Ensure responsible contact is properly resolved
        $arr['responsible'] = $b->responsible_contact;

        if ($b->originalBudget) {
            $arr['original_budget'] = [
                'id' => $b->originalBudget->id,
                'name' => $b->originalBudget->name,
                'status' => $b->originalBudget->status,
            ];
        }

        if ($b->revisedBudget) {
            $arr['revised_budget'] = [
                'id' => $b->revisedBudget->id,
                'name' => $b->revisedBudget->name,
                'status' => $b->revisedBudget->status,
            ];
        }

        return $arr;
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
            ->where('invoice_line_items.analytic_account_id', $analyticId)
            ->where('invoices.status', '!=', 'draft')
            ->where('invoices.status', '!=', 'void');

        if ($startDate && $endDate) {
            $query->whereBetween('invoices.invoice_date', [$startDate, $endDate]);
        }

        if ($type === 'income') {
            $query->where('invoices.type', '=', 'receivable');
        } else {
            $query->where('invoices.type', '=', 'payable');
        }

        $transactions = $query->select(
            'invoices.id as invoice_id',
            'invoices.invoice_number',
            'invoices.type as invoice_type',
            'invoices.party_type',
            'invoices.party_id',
            'invoices.invoice_date as issue_date',
            'invoices.status',
            'invoice_line_items.description',
            'invoice_line_items.quantity',
            'invoice_line_items.unit_price',
            'invoice_line_items.line_total'
        )->get()->map(function ($tx) {
            $partyName = '—';
            if ($tx->party_type === 'customer') {
                $partyName = \App\Models\Customer::find($tx->party_id)?->name ?? 'Customer';
            } elseif ($tx->party_type === 'vendor') {
                $partyName = \App\Models\Vendor::find($tx->party_id)?->name ?? 'Vendor';
            }
            $tx->customer_name = $tx->party_type === 'customer' ? $partyName : null;
            $tx->vendor_name = $tx->party_type === 'vendor' ? $partyName : null;
            $tx->party_name = $partyName;
            return $tx;
        });

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }
}
