<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Vendor;
use App\Services\GstService;
use App\Services\JournalPostingService;
use App\Services\RealtimeService;
use App\Services\SequenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class PurchaseOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', PurchaseOrder::class);

        $query = PurchaseOrder::with(['vendor', 'items.product', 'creator', 'approver'])->latest();

        // Standard user sees only own created orders unless having view_any permission
        if (!$request->user()->isAdmin() && !$request->user()->isManager()) {
            $query->where('created_by', $request->user()->id);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($vendorId = $request->query('vendor_id')) {
            $query->where('vendor_id', $vendorId);
        }

        if ($poNumber = $request->query('po_number')) {
            $query->where('po_number', 'like', "%{$poNumber}%");
        }

        if ($from = $request->query('from_date')) {
            $query->where('order_date', '>=', $from);
        }

        if ($to = $request->query('to_date')) {
            $query->where('order_date', '<=', $to);
        }

        if ($request->has('is_custom')) {
            $isCustom = filter_var($request->query('is_custom'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isCustom !== null) {
                $query->where('is_custom', $isCustom);
            }
        }

        if ($wood = $request->query('custom_wood')) {
            $query->where(function ($wq) use ($wood) {
                $wq->where('customization_details->wood', 'like', "%{$wood}%")
                   ->orWhere('notes', 'like', "%{$wood}%");
            });
        }

        if ($minAmount = $request->query('min_amount')) {
            $query->where('total_amount', '>=', $minAmount);
        }

        if ($maxAmount = $request->query('max_amount')) {
            $query->where('total_amount', '<=', $maxAmount);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhere('customization_details', 'like', "%{$search}%")
                  ->orWhereHas('vendor', function ($vq) use ($search) {
                      $vq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->query('per_page', 20);
        if ($perPage === 'all' || $perPage === '-1') {
            $orders = $query->get();
            return response()->json([
                'data' => $orders,
                'total' => $orders->count(),
            ]);
        }

        $orders = $query->paginate(is_numeric($perPage) ? (int)$perPage : 20);

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', PurchaseOrder::class);

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
            'vendor_id' => ['required', 'exists:vendors,id'],
            'order_date' => ['required', 'date'],
            'expected_delivery_date' => ['nullable', 'date'],
            'place_of_supply' => ['nullable', 'string', 'max:100'],
            'is_custom' => ['nullable', 'boolean'],
            'customization_details' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
            'terms_conditions' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.analytic_account_id' => ['nullable', 'exists:analytic_accounts,id'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity_ordered' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $vendor = Vendor::findOrFail($validated['vendor_id']);
        $placeOfSupply = $validated['place_of_supply'] ?? ($vendor->state ?? 'Maharashtra (27)');
        $isInterstate = GstService::isInterstate($placeOfSupply, $vendor->gstin);

        $year = now()->format('Y');
        $poNumber = SequenceService::generate('PO', (int) $year, 4);

        return DB::transaction(function () use ($validated, $vendor, $placeOfSupply, $isInterstate, $poNumber, $request) {
            $subtotal = 0.00;
            $cgstTotal = 0.00;
            $sgstTotal = 0.00;
            $igstTotal = 0.00;

            $itemsData = [];
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                $qty = (float) $item['quantity_ordered'];
                $price = (float) $item['unit_price'];
                $lineTaxable = round($qty * $price, 2);
                $taxRate = (float) ($item['tax_rate'] ?? ($product?->gst_rate ?? 18.00));

                $gst = GstService::calculate($lineTaxable, $taxRate, $isInterstate);

                $subtotal += $lineTaxable;
                $cgstTotal += $gst['cgst_amount'];
                $sgstTotal += $gst['sgst_amount'];
                $igstTotal += $gst['igst_amount'];

                $itemsData[] = [
                    'product_id' => $product->id,
                    'analytic_account_id' => $item['analytic_account_id'] ?? null,
                    'hsn_code' => $product->hsn_code ?? '94018000',
                    'description' => $item['description'] ?? $product->name,
                    'quantity_ordered' => $qty,
                    'quantity_received' => 0.00,
                    'unit_price' => $price,
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
            $totalAmount = $subtotal + $totalTax;

            $isCustom = (bool) ($validated['is_custom'] ?? false);
            $customDetails = $validated['customization_details'] ?? null;
            if (!$isCustom && !empty($customDetails)) {
                $isCustom = true;
            }

            $po = PurchaseOrder::create([
                'po_number' => $poNumber,
                'vendor_id' => $vendor->id,
                'status' => 'draft',
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'place_of_supply' => $placeOfSupply,
                'is_interstate' => $isInterstate,
                'gstin' => $vendor->gstin,
                'subtotal' => $subtotal,
                'tax_amount' => $totalTax,
                'cgst_amount' => $cgstTotal,
                'sgst_amount' => $sgstTotal,
                'igst_amount' => $igstTotal,
                'discount_amount' => 0.00,
                'total_amount' => $totalAmount,
                'is_custom' => $isCustom,
                'customization_details' => $customDetails,
                'notes' => $validated['notes'] ?? null,
                'terms_conditions' => $validated['terms_conditions'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            foreach ($itemsData as $data) {
                $data['purchase_order_id'] = $po->id;
                PurchaseOrderItem::create($data);
            }

            $po->load(['vendor', 'items.product', 'creator']);

            RealtimeService::broadcast('po:created', $po->toArray(), 'purchase_orders');

            return response()->json([
                'message' => 'Purchase order drafted successfully',
                'data' => $po,
            ], 201);
        });
    }

    public function show(PurchaseOrder $purchaseOrder): JsonResponse
    {
        Gate::authorize('view', $purchaseOrder);

        $purchaseOrder->load(['vendor', 'items.product', 'creator', 'approver', 'invoices']);

        return response()->json([
            'data' => $purchaseOrder,
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        Gate::authorize('update', $purchaseOrder);

        $validated = $request->validate([
            'order_date' => ['sometimes', 'date'],
            'expected_delivery_date' => ['nullable', 'date'],
            'place_of_supply' => ['nullable', 'string', 'max:100'],
            'is_custom' => ['nullable', 'boolean'],
            'customization_details' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
            'terms_conditions' => ['nullable', 'string'],
        ]);

        $purchaseOrder->update($validated);
        $purchaseOrder->load(['vendor', 'items.product']);

        RealtimeService::broadcast('po:updated', $purchaseOrder->toArray(), 'purchase_orders');

        return response()->json([
            'message' => 'Purchase order updated successfully',
            'data' => $purchaseOrder,
        ]);
    }

    public function submit(PurchaseOrder $purchaseOrder): JsonResponse
    {
        Gate::authorize('submit', $purchaseOrder);

        $purchaseOrder->status = 'submitted';
        $purchaseOrder->save();

        RealtimeService::broadcast('po:submitted', [
            'id' => $purchaseOrder->id,
            'po_number' => $purchaseOrder->po_number,
            'status' => 'submitted',
        ], 'purchase_orders');

        return response()->json([
            'message' => 'Purchase order submitted for approval',
            'data' => $purchaseOrder,
        ]);
    }

    public function approve(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        Gate::authorize('approve', $purchaseOrder);

        $purchaseOrder->status = 'approved';
        $purchaseOrder->approved_by = $request->user()->id;
        $purchaseOrder->approved_at = now();
        $purchaseOrder->save();

        RealtimeService::broadcast('po:approved', [
            'id' => $purchaseOrder->id,
            'po_number' => $purchaseOrder->po_number,
            'status' => 'approved',
            'approved_by' => $request->user()->name,
        ], 'purchase_orders');

        return response()->json([
            'message' => 'Purchase order approved successfully',
            'data' => $purchaseOrder,
        ]);
    }

    public function reject(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        Gate::authorize('reject', $purchaseOrder);

        $validated = $request->validate([
            'rejected_reason' => ['required', 'string', 'max:500'],
        ]);

        $purchaseOrder->status = 'rejected';
        $purchaseOrder->rejected_reason = $validated['rejected_reason'];
        $purchaseOrder->approved_by = $request->user()->id;
        $purchaseOrder->approved_at = now();
        $purchaseOrder->save();

        RealtimeService::broadcast('po:rejected', [
            'id' => $purchaseOrder->id,
            'po_number' => $purchaseOrder->po_number,
            'status' => 'rejected',
            'reason' => $validated['rejected_reason'],
        ], 'purchase_orders');

        return response()->json([
            'message' => 'Purchase order rejected',
            'data' => $purchaseOrder,
        ]);
    }

    /**
     * Record receipt of goods, increment inventory, log audit movement, and auto-post GRNI clearing entry.
     */
    public function receive(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        Gate::authorize('receive', $purchaseOrder);

        if ($purchaseOrder->status === 'received') {
            return response()->json(['message' => 'Purchase order has already been fully received.'], 422);
        }

        $validated = $request->validate([
            'delivery_date' => ['nullable', 'date'],
            'items' => ['nullable', 'array'],
            'items.*.id' => ['required_with:items', 'exists:purchase_order_items,id'],
            'items.*.quantity_received' => ['nullable', 'numeric', 'min:0'],
            'items.*.quantity' => ['nullable', 'numeric', 'min:0'],
        ]);

        return DB::transaction(function () use ($purchaseOrder, $validated, $request) {
            $purchaseOrder->load('items');
            $itemsToProcess = $validated['items'] ?? [];

            // If items array is not provided, auto-populate all pending items
            if (empty($itemsToProcess)) {
                $itemsToProcess = [];
                foreach ($purchaseOrder->items as $item) {
                    $pending = (float) $item->quantity_ordered - (float) $item->quantity_received;
                    if ($pending > 0) {
                        $itemsToProcess[] = [
                            'id' => $item->id,
                            'quantity_received' => $pending,
                        ];
                    }
                }
            }

            $allReceived = true;
            $anyReceived = false;
            $batchValue = 0.00;

            foreach ($itemsToProcess as $itemRec) {
                $poItem = PurchaseOrderItem::where('purchase_order_id', $purchaseOrder->id)
                    ->where('id', $itemRec['id'])
                    ->firstOrFail();

                $receivedDelta = (float) ($itemRec['quantity_received'] ?? $itemRec['quantity'] ?? 0);
                if ($receivedDelta <= 0 && !isset($itemRec['quantity_received']) && !isset($itemRec['quantity'])) {
                    $receivedDelta = max(0, (float) $poItem->quantity_ordered - (float) $poItem->quantity_received);
                }

                if ($receivedDelta > 0) {
                    $anyReceived = true;
                    $poItem->quantity_received += $receivedDelta;
                    $poItem->save();

                    // Increment product inventory
                    $product = Product::findOrFail($poItem->product_id);
                    $product->current_stock += $receivedDelta;
                    $product->save();

                    $lineTotal = round($receivedDelta * (float) $poItem->unit_price, 2);
                    $batchValue += $lineTotal;

                    // Log audit inventory movement
                    InventoryMovement::create([
                        'product_id' => $product->id,
                        'type' => 'purchase',
                        'quantity' => $receivedDelta,
                        'unit_cost' => (float) $poItem->unit_price,
                        'total_value' => $lineTotal,
                        'reference_type' => PurchaseOrder::class,
                        'reference_id' => $purchaseOrder->id,
                        'notes' => "Goods receipt under {$purchaseOrder->po_number}",
                        'performed_by' => $request->user()->id,
                    ]);
                }

                if ($poItem->quantity_received < $poItem->quantity_ordered) {
                    $allReceived = false;
                }
            }

            $purchaseOrder->delivery_date = $validated['delivery_date'] ?? now()->toDateString();
            $purchaseOrder->status = $allReceived ? 'received' : ($anyReceived ? 'partially_received' : $purchaseOrder->status);
            $purchaseOrder->save();

            // Auto-post Goods Receipt Journal Entry (Dr. Inventory, Cr. GRNI Clearing) for received value
            $je = null;
            if ($batchValue > 0 || $anyReceived) {
                $je = JournalPostingService::postGoodsReceipt($purchaseOrder, $request->user(), $batchValue > 0 ? $batchValue : null);
            }

            RealtimeService::broadcast('po:goods_received', [
                'id' => $purchaseOrder->id,
                'po_number' => $purchaseOrder->po_number,
                'status' => $purchaseOrder->status,
                'journal_entry' => $je?->entry_number,
            ], 'purchase_orders');

            return response()->json([
                'message' => 'Goods receipt recorded, inventory updated, and GRNI journal entry auto-posted.',
                'data' => $purchaseOrder->fresh(['items.product']),
                'journal_entry' => $je,
            ]);
        });
    }

    public function destroy(PurchaseOrder $purchaseOrder): JsonResponse
    {
        Gate::authorize('delete', $purchaseOrder);

        $id = $purchaseOrder->id;
        $purchaseOrder->delete();

        RealtimeService::broadcast('po:deleted', ['id' => $id], 'purchase_orders');

        return response()->json([
            'message' => 'Purchase order deleted successfully',
            'id' => $id,
        ]);
    }
}
