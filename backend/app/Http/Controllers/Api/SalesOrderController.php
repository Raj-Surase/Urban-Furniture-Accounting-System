<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Services\GstService;
use App\Services\JournalPostingService;
use App\Services\RealtimeService;
use App\Services\SequenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class SalesOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', SalesOrder::class);

        $query = SalesOrder::with(['customer', 'items.product', 'creator', 'approver'])->latest();

        if (!$request->user()->isAdmin() && !$request->user()->isManager()) {
            $query->where('created_by', $request->user()->id);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($customerId = $request->query('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('so_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $orders = $query->paginate($request->query('per_page', 20));

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', SalesOrder::class);

        $items = $request->input('items', []);
        if (is_array($items)) {
            foreach ($items as $k => $it) {
                if (isset($it['quantity']) && !isset($it['quantity_ordered'])) {
                    $items[$k]['quantity_ordered'] = $it['quantity'];
                }
                if (isset($it['gst_rate']) && !isset($it['tax_rate'])) {
                    $items[$k]['tax_rate'] = $it['gst_rate'];
                }
            }
            $request->merge(['items' => $items]);
        }

        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'order_date' => ['required', 'date'],
            'expected_delivery_date' => ['nullable', 'date'],
            'place_of_supply' => ['nullable', 'string', 'max:100'],
            'shipping_address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'terms_conditions' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity_ordered' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $customer = Customer::findOrFail($validated['customer_id']);
        $placeOfSupply = $validated['place_of_supply'] ?? ($customer->state ?? 'Maharashtra (27)');
        $isInterstate = GstService::isInterstate($placeOfSupply, $customer->gstin);

        $year = now()->format('Y');
        $soNumber = SequenceService::generate('SO', (int) $year, 4);

        return DB::transaction(function () use ($validated, $customer, $placeOfSupply, $isInterstate, $soNumber, $request) {
            $subtotal = 0.00;
            $discountTotal = 0.00;
            $cgstTotal = 0.00;
            $sgstTotal = 0.00;
            $igstTotal = 0.00;

            $itemsData = [];
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                $qty = (float) $item['quantity_ordered'];
                $price = (float) $item['unit_price'];
                $discPct = (float) ($item['discount_percent'] ?? 0);
                $taxRate = (float) ($item['tax_rate'] ?? ($product?->gst_rate ?? 18.00));

                $lineGross = round($qty * $price, 2);
                $lineDiscount = round($lineGross * ($discPct / 100), 2);
                $lineTaxable = $lineGross - $lineDiscount;

                $gst = GstService::calculate($lineTaxable, $taxRate, $isInterstate);

                $subtotal += $lineGross;
                $discountTotal += $lineDiscount;
                $cgstTotal += $gst['cgst_amount'];
                $sgstTotal += $gst['sgst_amount'];
                $igstTotal += $gst['igst_amount'];

                $itemsData[] = [
                    'product_id' => $product->id,
                    'hsn_code' => $product->hsn_code ?? '94018000',
                    'description' => $product->name,
                    'quantity_ordered' => $qty,
                    'quantity_delivered' => 0.00,
                    'unit_price' => $price,
                    'discount_percent' => $discPct,
                    'tax_rate' => $taxRate,
                    'cgst_rate' => $gst['cgst_rate'],
                    'cgst_amount' => $gst['cgst_amount'],
                    'sgst_rate' => $gst['sgst_rate'],
                    'sgst_amount' => $gst['sgst_amount'],
                    'igst_rate' => $gst['igst_rate'],
                    'igst_amount' => $gst['igst_amount'],
                    'tax_amount' => $gst['tax_amount'],
                    'line_total' => $gst['total_amount'],
                ];
            }

            $totalTax = $cgstTotal + $sgstTotal + $igstTotal;
            $totalAmount = ($subtotal - $discountTotal) + $totalTax;

            $so = SalesOrder::create([
                'so_number' => $soNumber,
                'customer_id' => $customer->id,
                'status' => 'draft',
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'place_of_supply' => $placeOfSupply,
                'is_interstate' => $isInterstate,
                'gstin' => $customer->gstin,
                'subtotal' => $subtotal,
                'discount_amount' => $discountTotal,
                'tax_amount' => $totalTax,
                'cgst_amount' => $cgstTotal,
                'sgst_amount' => $sgstTotal,
                'igst_amount' => $igstTotal,
                'total_amount' => $totalAmount,
                'shipping_address' => $validated['shipping_address'] ?? $customer->shipping_address,
                'notes' => $validated['notes'] ?? null,
                'terms_conditions' => $validated['terms_conditions'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            foreach ($itemsData as $data) {
                $data['sales_order_id'] = $so->id;
                SalesOrderItem::create($data);
            }

            $so->load(['customer', 'items.product', 'creator']);

            RealtimeService::broadcast('so:created', $so->toArray(), 'sales_orders');

            return response()->json([
                'message' => 'Sales order drafted successfully',
                'data' => $so,
            ], 201);
        });
    }

    public function show(SalesOrder $salesOrder): JsonResponse
    {
        Gate::authorize('view', $salesOrder);

        $salesOrder->load(['customer', 'items.product', 'creator', 'approver', 'invoices']);

        return response()->json([
            'data' => $salesOrder,
        ]);
    }

    public function update(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        Gate::authorize('update', $salesOrder);

        $validated = $request->validate([
            'order_date' => ['sometimes', 'date'],
            'expected_delivery_date' => ['nullable', 'date'],
            'shipping_address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'terms_conditions' => ['nullable', 'string'],
        ]);

        $salesOrder->update($validated);
        $salesOrder->load(['customer', 'items.product']);

        RealtimeService::broadcast('so:updated', $salesOrder->toArray(), 'sales_orders');

        return response()->json([
            'message' => 'Sales order updated successfully',
            'data' => $salesOrder,
        ]);
    }

    public function confirm(SalesOrder $salesOrder): JsonResponse
    {
        Gate::authorize('confirm', $salesOrder);

        $salesOrder->status = 'confirmed';
        $salesOrder->save();

        RealtimeService::broadcast('so:confirmed', [
            'id' => $salesOrder->id,
            'so_number' => $salesOrder->so_number,
            'status' => 'confirmed',
        ], 'sales_orders');

        return response()->json([
            'message' => 'Sales order confirmed',
            'data' => $salesOrder,
        ]);
    }

    public function approve(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        Gate::authorize('approve', $salesOrder);

        $salesOrder->status = 'approved';
        $salesOrder->approved_by = $request->user()->id;
        $salesOrder->approved_at = now();
        $salesOrder->save();

        RealtimeService::broadcast('so:approved', [
            'id' => $salesOrder->id,
            'so_number' => $salesOrder->so_number,
            'status' => 'approved',
            'approved_by' => $request->user()->name,
        ], 'sales_orders');

        return response()->json([
            'message' => 'Sales order approved for fulfillment',
            'data' => $salesOrder,
        ]);
    }

    /**
     * Mark sales order delivered, decrement inventory, log audit movement, and auto-post COGS journal entry.
     */
    public function deliver(Request $request, SalesOrder $salesOrder): JsonResponse
    {
        Gate::authorize('deliver', $salesOrder);

        if ($salesOrder->status === 'delivered') {
            return response()->json(['message' => 'Sales order has already been fully delivered.'], 422);
        }

        $validated = $request->validate([
            'delivery_date' => ['nullable', 'date'],
            'items' => ['nullable', 'array'],
            'items.*.id' => ['required_with:items', 'exists:sales_order_items,id'],
            'items.*.quantity_delivered' => ['nullable', 'numeric', 'min:0'],
            'items.*.quantity' => ['nullable', 'numeric', 'min:0'],
        ]);

        return DB::transaction(function () use ($salesOrder, $validated, $request) {
            $salesOrder->load('items');
            $itemsToProcess = $validated['items'] ?? [];

            // If items array is not provided, auto-populate all pending items
            if (empty($itemsToProcess)) {
                $itemsToProcess = [];
                foreach ($salesOrder->items as $item) {
                    $pending = (float) $item->quantity_ordered - (float) $item->quantity_delivered;
                    if ($pending > 0) {
                        $itemsToProcess[] = [
                            'id' => $item->id,
                            'quantity_delivered' => $pending,
                        ];
                    }
                }
            }

            $allDelivered = true;
            $anyDelivered = false;
            $batchCost = 0.00;

            foreach ($itemsToProcess as $itemDel) {
                $soItem = SalesOrderItem::where('sales_order_id', $salesOrder->id)
                    ->where('id', $itemDel['id'])
                    ->firstOrFail();

                $deliveredDelta = (float) ($itemDel['quantity_delivered'] ?? $itemDel['quantity'] ?? 0);
                if ($deliveredDelta <= 0 && !isset($itemDel['quantity_delivered']) && !isset($itemDel['quantity'])) {
                    $deliveredDelta = max(0, (float) $soItem->quantity_ordered - (float) $soItem->quantity_delivered);
                }

                if ($deliveredDelta > 0) {
                    $anyDelivered = true;
                    $soItem->quantity_delivered += $deliveredDelta;
                    $soItem->save();

                    // Relieve inventory stock
                    $product = Product::findOrFail($soItem->product_id);
                    $product->current_stock -= $deliveredDelta;
                    $product->save();

                    $itemCost = (float) $product->cost_price ?: ((float) $soItem->unit_price * 0.6);
                    $lineCost = round($deliveredDelta * $itemCost, 2);
                    $batchCost += $lineCost;

                    // Log audit inventory movement
                    InventoryMovement::create([
                        'product_id' => $product->id,
                        'type' => 'sale',
                        'quantity' => -$deliveredDelta,
                        'unit_cost' => $itemCost,
                        'total_value' => -$lineCost,
                        'reference_type' => SalesOrder::class,
                        'reference_id' => $salesOrder->id,
                        'notes' => "Delivery dispatch for {$salesOrder->so_number}",
                        'performed_by' => $request->user()->id,
                    ]);

                    if ($product->isLowStock()) {
                        RealtimeService::broadcast('inventory:low_stock_alert', [
                            'product_id' => $product->id,
                            'sku' => $product->sku,
                            'name' => $product->name,
                            'current_stock' => $product->current_stock,
                            'reorder_point' => $product->reorder_point,
                        ], 'alerts');
                    }
                }

                if ($soItem->quantity_delivered < $soItem->quantity_ordered) {
                    $allDelivered = false;
                }
            }

            $salesOrder->delivery_date = $validated['delivery_date'] ?? now()->toDateString();
            $salesOrder->status = $allDelivered ? 'delivered' : ($anyDelivered ? 'partially_delivered' : $salesOrder->status);
            $salesOrder->save();

            // Auto-post Cost of Goods Sold journal entry
            $je = null;
            if ($batchCost > 0 || $anyDelivered) {
                $je = JournalPostingService::postSalesDelivery($salesOrder, $request->user(), $batchCost > 0 ? $batchCost : null);
            }

            RealtimeService::broadcast('so:delivered', [
                'id' => $salesOrder->id,
                'so_number' => $salesOrder->so_number,
                'status' => $salesOrder->status,
                'journal_entry' => $je?->entry_number,
            ], 'sales_orders');

            return response()->json([
                'message' => 'Sales order delivered, stock relieved, and COGS journal entry auto-posted.',
                'data' => $salesOrder->fresh(['items.product']),
                'journal_entry' => $je,
            ]);
        });
    }

    public function destroy(SalesOrder $salesOrder): JsonResponse
    {
        Gate::authorize('delete', $salesOrder);

        $id = $salesOrder->id;
        $salesOrder->delete();

        RealtimeService::broadcast('so:deleted', ['id' => $id], 'sales_orders');

        return response()->json([
            'message' => 'Sales order deleted successfully',
            'id' => $id,
        ]);
    }
}
