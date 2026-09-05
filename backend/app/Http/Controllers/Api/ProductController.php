<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\InventoryMovement;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Product;
use App\Services\RealtimeService;
use App\Services\SequenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Product::class);

        $query = Product::with(['inventoryAccount', 'cogsAccount', 'revenueAccount'])
            ->orderBy('id', 'desc');

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($request->boolean('low_stock')) {
            $query->whereColumn('current_stock', '<=', 'reorder_point');
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('hsn_code', 'like', "%{$search}%");
            });
        }

        $products = $query->paginate($request->query('per_page', 20));

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Product::class);

        if ($request->has('price') && ! $request->has('unit_price')) {
            $request->merge(['unit_price' => $request->input('price')]);
        }
        if ($request->has('min_stock_alert') && ! $request->has('minimum_stock')) {
            $request->merge(['minimum_stock' => $request->input('min_stock_alert')]);
        }
        if ($request->has('initial_stock') && ! $request->has('current_stock')) {
            $request->merge(['current_stock' => $request->input('initial_stock')]);
        }

        $validated = $request->validate([
            'sku' => ['required', 'string', 'max:50', 'unique:products,sku'],
            'name' => ['required', 'string', 'max:255'],
            'hsn_code' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'type' => ['nullable', 'string', 'in:goods,service,combo'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'gst_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'unit_of_measure' => ['nullable', 'string', 'max:20'],
            'current_stock' => ['nullable', 'numeric', 'min:0'],
            'minimum_stock' => ['nullable', 'numeric', 'min:0'],
            'reorder_point' => ['nullable', 'numeric', 'min:0'],
            'inventory_account_id' => ['nullable', 'exists:accounts,id'],
            'cogs_account_id' => ['nullable', 'exists:accounts,id'],
            'revenue_account_id' => ['nullable', 'exists:accounts,id'],
        ]);

        $defaultInventory = Account::where('code', '1130')->first();
        $defaultCogs = Account::where('code', '5100')->first();
        $defaultRevenue = Account::where('code', '4100')->first();

        $product = Product::create([
            'sku' => $validated['sku'],
            'name' => $validated['name'],
            'hsn_code' => $validated['hsn_code'] ?? '94018000',
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'type' => $validated['type'] ?? 'goods',
            'unit_price' => (float) $validated['unit_price'],
            'cost_price' => (float) $validated['cost_price'],
            'gst_rate' => (float) ($validated['gst_rate'] ?? 18.00),
            'unit_of_measure' => $validated['unit_of_measure'] ?? 'unit',
            'current_stock' => (float) ($validated['current_stock'] ?? 0),
            'minimum_stock' => (float) ($validated['minimum_stock'] ?? 5),
            'reorder_point' => (float) ($validated['reorder_point'] ?? 10),
            'inventory_account_id' => $validated['inventory_account_id'] ?? $defaultInventory?->id,
            'cogs_account_id' => $validated['cogs_account_id'] ?? $defaultCogs?->id,
            'revenue_account_id' => $validated['revenue_account_id'] ?? $defaultRevenue?->id,
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]);

        $product->load(['inventoryAccount', 'cogsAccount', 'revenueAccount']);

        RealtimeService::broadcast('product:created', $product->toArray(), 'inventory');

        return response()->json([
            'message' => 'Product created successfully',
            'data' => $product,
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        Gate::authorize('view', $product);

        $product->load(['inventoryAccount', 'cogsAccount', 'revenueAccount', 'movements' => function ($q) {
            $q->latest()->limit(20);
        }]);

        return response()->json([
            'data' => $product,
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        Gate::authorize('update', $product);

        if ($request->has('price') && ! $request->has('unit_price')) {
            $request->merge(['unit_price' => $request->input('price')]);
        }
        if ($request->has('min_stock_alert') && ! $request->has('minimum_stock')) {
            $request->merge(['minimum_stock' => $request->input('min_stock_alert')]);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'hsn_code' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'category' => ['sometimes', 'string', 'max:100'],
            'type' => ['sometimes', 'string', 'in:goods,service,combo'],
            'unit_price' => ['sometimes', 'numeric', 'min:0'],
            'cost_price' => ['sometimes', 'numeric', 'min:0'],
            'gst_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'unit_of_measure' => ['sometimes', 'string', 'max:20'],
            'minimum_stock' => ['sometimes', 'numeric', 'min:0'],
            'reorder_point' => ['sometimes', 'numeric', 'min:0'],
            'inventory_account_id' => ['nullable', 'exists:accounts,id'],
            'cogs_account_id' => ['nullable', 'exists:accounts,id'],
            'revenue_account_id' => ['nullable', 'exists:accounts,id'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $product->update($validated);
        $product->load(['inventoryAccount', 'cogsAccount', 'revenueAccount']);

        RealtimeService::broadcast('product:updated', $product->toArray(), 'inventory');

        return response()->json([
            'message' => 'Product updated successfully',
            'data' => $product,
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        Gate::authorize('delete', $product);

        $id = $product->id;
        $product->delete();

        RealtimeService::broadcast('product:deleted', ['id' => $id], 'inventory');

        return response()->json([
            'message' => 'Product deleted successfully',
            'id' => $id,
        ]);
    }

    /**
     * Manual inventory stock adjustment with General Ledger entry.
     */
    public function adjust(Request $request, Product $product): JsonResponse
    {
        Gate::authorize('adjust', $product);

        $validated = $request->validate([
            'quantity_delta' => ['required', 'numeric'], // positive = found, negative = shrinkage/loss
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $delta = (float) $validated['quantity_delta'];
        if ($delta == 0) {
            return response()->json(['message' => 'Adjustment quantity cannot be zero.'], 422);
        }

        $cost = (float) $product->cost_price;
        $totalVal = round($cost * $delta, 2);

        DB::transaction(function () use ($product, $delta, $cost, $totalVal, $validated, $request) {
            $product->current_stock += $delta;
            $product->save();

            // Record Movement
            InventoryMovement::create([
                'product_id' => $product->id,
                'type' => 'adjustment',
                'quantity' => $delta,
                'unit_cost' => $cost,
                'total_value' => $totalVal,
                'reference_type' => null,
                'reference_id' => null,
                'notes' => $validated['reason'] . ($validated['notes'] ? " - " . $validated['notes'] : ""),
                'performed_by' => $request->user()->id,
            ]);

            // Auto-post General Ledger Adjustment entry
            $accounts = Account::whereIn('code', ['1130', '5300'])->get()->keyBy('code');
            if (isset($accounts['1130']) && isset($accounts['5300'])) {
                $year = now()->format('Y');
                $jeNum = SequenceService::generate('JE', (int) $year, 4);

                $je = JournalEntry::create([
                    'entry_number' => $jeNum,
                    'type' => 'adjustment',
                    'description' => "Inventory adjustment: {$product->name} ({$validated['reason']})",
                    'posting_date' => now()->toDateString(),
                    'fiscal_year' => (int) $year,
                    'period' => (int) now()->format('n'),
                    'status' => 'posted',
                    'posted_by' => $request->user()->id,
                    'posted_at' => now(),
                    'created_by' => $request->user()->id,
                ]);

                $absVal = abs($totalVal);
                if ($delta < 0) {
                    // Loss / Shrinkage: Dr. 5300 Adjustment Expense, Cr. 1130 Inventory
                    JournalEntryLine::create([
                        'journal_entry_id' => $je->id,
                        'account_id' => $accounts['5300']->id,
                        'account_code' => '5300',
                        'account_name' => 'Inventory Shrinkage & Adjustments',
                        'debit' => $absVal,
                        'credit' => 0,
                        'description' => "Stock reduction: {$validated['reason']}",
                        'reference' => $product->sku,
                    ]);
                    JournalEntryLine::create([
                        'journal_entry_id' => $je->id,
                        'account_id' => $accounts['1130']->id,
                        'account_code' => '1130',
                        'account_name' => 'Inventory (Finished Furniture)',
                        'debit' => 0,
                        'credit' => $absVal,
                        'description' => "Inventory relief",
                        'reference' => $product->sku,
                    ]);
                } else {
                    // Gain: Dr. 1130 Inventory, Cr. 5300 Adjustment Recovery
                    JournalEntryLine::create([
                        'journal_entry_id' => $je->id,
                        'account_id' => $accounts['1130']->id,
                        'account_code' => '1130',
                        'account_name' => 'Inventory (Finished Furniture)',
                        'debit' => $absVal,
                        'credit' => 0,
                        'description' => "Inventory surplus count",
                        'reference' => $product->sku,
                    ]);
                    JournalEntryLine::create([
                        'journal_entry_id' => $je->id,
                        'account_id' => $accounts['5300']->id,
                        'account_code' => '5300',
                        'account_name' => 'Inventory Shrinkage & Adjustments',
                        'debit' => 0,
                        'credit' => $absVal,
                        'description' => "Surplus credit: {$validated['reason']}",
                        'reference' => $product->sku,
                    ]);
                }

                $accounts['1130']->recalculateBalance();
                $accounts['5300']->recalculateBalance();
            }
        });

        // Check if low stock alert is triggered
        if ($product->isLowStock()) {
            RealtimeService::broadcast('inventory:low_stock_alert', [
                'product_id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'current_stock' => $product->current_stock,
                'reorder_point' => $product->reorder_point,
            ], 'alerts');
        }

        RealtimeService::broadcast('product:stock_adjusted', $product->toArray(), 'inventory');

        return response()->json([
            'message' => 'Stock adjusted successfully',
            'product' => $product,
        ]);
    }
}
