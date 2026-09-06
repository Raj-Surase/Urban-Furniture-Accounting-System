<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\Product;
use App\Models\Vendor;
use App\Services\GstService;
use App\Services\JournalPostingService;
use App\Services\RealtimeService;
use App\Services\SequenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class InvoiceController extends Controller
{
    /**
     * List paginated invoices with optional filters (type, status, overdue, search).
     * Admins and managers see all invoices; standard users see only their own.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Invoice::class);

        $query = Invoice::with(['items.product', 'creator', 'approver'])->latest();

        $canViewAll = $request->user()->isAdmin() ||
                      $request->user()->isManager() ||
                      $request->user()->isAccountant() ||
                      $request->user()->role === \App\Models\User::ROLE_USER ||
                      $request->user()->hasPermission(\App\Security\Rbac::PERMISSION_INVOICES_VIEW_ANY);

        if (!$canViewAll) {
            $query->where('created_by', $request->user()->id);
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($request->boolean('overdue')) {
            $query->where('due_date', '<', now()->toDateString())
                  ->whereIn('status', ['approved', 'partially_paid']);
        }

        if ($invNumber = $request->query('invoice_number')) {
            $query->where('invoice_number', 'like', "%{$invNumber}%");
        }

        if ($partyId = $request->query('party_id')) {
            $query->where('party_id', $partyId);
        }

        if ($from = $request->query('from_date')) {
            $query->where('invoice_date', '>=', $from);
        }

        if ($to = $request->query('to_date')) {
            $query->where('invoice_date', '<=', $to);
        }

        if ($minAmount = $request->query('min_amount')) {
            $query->where('total_amount', '>=', $minAmount);
        }

        if ($maxAmount = $request->query('max_amount')) {
            $query->where('total_amount', '<=', $maxAmount);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('party', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->query('per_page', 'all');
        if ($perPage === 'all' || $perPage === '-1') {
            $invoices = $query->get()->map(function ($inv) {
                $inv->party = $inv->party;
                if ($inv->party_type === 'customer') {
                    $inv->customer = $inv->party;
                } elseif ($inv->party_type === 'vendor') {
                    $inv->vendor = $inv->party;
                }
                return $inv;
            });
            return response()->json([
                'data' => $invoices,
                'total' => $invoices->count(),
            ]);
        }

        $invoices = $query->paginate(is_numeric($perPage) ? (int)$perPage : 20);

        // Attach party metadata
        $invoices->getCollection()->transform(function ($inv) {
            $inv->party = $inv->party;
            if ($inv->party_type === 'customer') {
                $inv->customer = $inv->party;
            } elseif ($inv->party_type === 'vendor') {
                $inv->vendor = $inv->party;
            }
            return $inv;
        });

        return response()->json($invoices);
    }

    /**
     * Validate and draft a new invoice with GST-split line items.
     * Auto-generates invoice number (INV-YYYY-NNNN or BILL-YYYY-NNNN).
     * All line-item calculations run inside a DB transaction.
     *
     * @param  Request  $request
     * @return JsonResponse  201 on success
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Invoice::class);

        $validated = $request->validate([
            'type' => ['required', 'in:receivable,payable'],
            'party_type' => ['required', 'in:customer,vendor'],
            'party_id' => ['required', 'integer'],
            'reference_type' => ['nullable', 'string'],
            'reference_id' => ['nullable', 'integer'],
            'invoice_date' => ['required', 'date'],
            'due_date' => ['required', 'date'],
            'place_of_supply' => ['nullable', 'string', 'max:100'],
            'payment_terms_days' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.account_id' => ['nullable', 'exists:accounts,id'],
            'items.*.analytic_account_id' => ['nullable', 'exists:analytic_accounts,id'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $party = null;
        if ($validated['party_type'] === 'customer') {
            $party = Customer::findOrFail($validated['party_id']);
        } else {
            $party = Vendor::findOrFail($validated['party_id']);
        }

        $placeOfSupply = $validated['place_of_supply'] ?? ($party->state ?? 'Maharashtra (27)');
        $isInterstate = GstService::isInterstate($placeOfSupply, $party->gstin);

        $year = now()->format('Y');
        $prefix = $validated['type'] === 'receivable' ? 'INV' : 'BILL';
        $invNumber = SequenceService::generate($prefix, (int) $year, 4);

        return DB::transaction(function () use ($validated, $party, $placeOfSupply, $isInterstate, $invNumber, $request) {
            $subtotal = 0.00;
            $discountTotal = 0.00;
            $cgstTotal = 0.00;
            $sgstTotal = 0.00;
            $igstTotal = 0.00;

            $defaultRevenue = Account::where('code', '4100')->first();
            $defaultInventory = Account::where('code', '1130')->first();

            $itemsData = [];
            foreach ($validated['items'] as $item) {
                $product = !empty($item['product_id']) ? Product::find($item['product_id']) : null;
                $qty = (float) $item['quantity'];
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

                $accountId = $item['account_id'] ?? null;
                if (!$accountId) {
                    $accountId = $validated['type'] === 'receivable'
                        ? ($product?->revenue_account_id ?? $defaultRevenue?->id)
                        : ($product?->inventory_account_id ?? $defaultInventory?->id);
                }

                $itemsData[] = [
                    'product_id' => $product?->id,
                    'account_id' => $accountId,
                    'analytic_account_id' => $item['analytic_account_id'] ?? null,
                    'hsn_code' => $product?->hsn_code ?? '94018000',
                    'description' => $item['description'],
                    'quantity' => $qty,
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

            $invoice = Invoice::create([
                'invoice_number' => $invNumber,
                'type' => $validated['type'],
                'status' => 'draft',
                'reference_type' => $validated['reference_type'] ?? null,
                'reference_id' => $validated['reference_id'] ?? null,
                'party_type' => $validated['party_type'],
                'party_id' => $party->id,
                'place_of_supply' => $placeOfSupply,
                'is_interstate' => $isInterstate,
                'gstin' => $party->gstin,
                'invoice_date' => $validated['invoice_date'],
                'due_date' => $validated['due_date'],
                'subtotal' => $subtotal,
                'discount_amount' => $discountTotal,
                'tax_amount' => $totalTax,
                'cgst_amount' => $cgstTotal,
                'sgst_amount' => $sgstTotal,
                'igst_amount' => $igstTotal,
                'total_amount' => $totalAmount,
                'amount_paid' => 0.00,
                'balance_due' => $totalAmount,
                'payment_terms_days' => $validated['payment_terms_days'] ?? ($party->payment_terms_days ?? 30),
                'currency' => 'INR',
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            foreach ($itemsData as $data) {
                $data['invoice_id'] = $invoice->id;
                InvoiceLineItem::create($data);
            }

            $invoice->load(['items.product', 'items.account', 'creator']);
            $invoice->party = $party;

            RealtimeService::broadcast('invoice:created', $invoice->toArray(), 'invoices');

            return response()->json([
                'message' => 'Invoice drafted successfully',
                'data' => $invoice,
            ], 201);
        });
    }

    /**
     * Retrieve a single invoice with related line items, payments, and party info.
     *
     * @param  Invoice  $invoice  Route-model-bound invoice instance
     * @return JsonResponse
     */
    public function show(Invoice $invoice): JsonResponse
    {
        Gate::authorize('view', $invoice);

        $invoice->load(['items.product', 'items.account', 'payments', 'creator', 'approver']);
        $invoice->party = $invoice->party;
        if ($invoice->party_type === 'customer') {
            $invoice->customer = $invoice->party;
        } elseif ($invoice->party_type === 'vendor') {
            $invoice->vendor = $invoice->party;
        }

        return response()->json([
            'data' => $invoice,
        ]);
    }

    /**
     * Update editable fields on a draft invoice (date, due date, notes).
     * Only draft invoices may be modified after creation.
     *
     * @param  Request  $request
     * @param  Invoice  $invoice
     * @return JsonResponse
     */
    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        Gate::authorize('update', $invoice);

        $validated = $request->validate([
            'invoice_date' => ['sometimes', 'date'],
            'due_date' => ['sometimes', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $invoice->update($validated);
        $invoice->load('items.product');

        RealtimeService::broadcast('invoice:updated', $invoice->toArray(), 'invoices');

        return response()->json([
            'message' => 'Invoice updated successfully',
            'data' => $invoice,
        ]);
    }

    /**
     * Authorize and auto-post balanced double-entry General Ledger entry.
     */
    public function approve(Request $request, Invoice $invoice): JsonResponse
    {
        Gate::authorize('approve', $invoice);

        if ($invoice->status === 'approved') {
            return response()->json(['message' => 'Invoice is already approved.'], 422);
        }

        try {
            return DB::transaction(function () use ($invoice, $request) {
                $invoice->status = 'approved';
                $invoice->approved_by = $request->user()->id;
                $invoice->approved_at = now();
                $invoice->save();

                // Auto-post double-entry journal entry!
                $je = JournalPostingService::postInvoice($invoice, $request->user());

                RealtimeService::broadcast('invoice:approved', [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'status' => 'approved',
                    'journal_entry' => $je->entry_number,
                    'approved_by' => $request->user()->name,
                ], 'invoices');

                return response()->json([
                    'message' => "Invoice {$invoice->invoice_number} approved and balanced General Ledger entry auto-posted ({$je->entry_number}).",
                    'data' => $invoice->fresh(['items']),
                    'journal_entry' => $je,
                ]);
            });
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => 'Failed to approve invoice: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Void approved invoice and post contra reversal journal entry.
     */
    public function void(Request $request, Invoice $invoice): JsonResponse
    {
        Gate::authorize('void', $invoice);

        if ($invoice->status === 'void') {
            return response()->json(['message' => 'Invoice is already voided.'], 422);
        }

        return DB::transaction(function () use ($invoice, $request) {
            $invoice->status = 'void';
            $invoice->save();

            // Post Contra Reversal entry
            $reversal = JournalPostingService::voidInvoice($invoice, $request->user());

            RealtimeService::broadcast('invoice:voided', [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'status' => 'void',
                'reversal_entry' => $reversal?->entry_number,
            ], 'invoices');

            return response()->json([
                'message' => "Invoice {$invoice->invoice_number} voided and contra reversal journal entry posted.",
                'data' => $invoice,
                'reversal_entry' => $reversal,
            ]);
        });
    }

    /**
     * Hard-delete a draft invoice. Approved or paid invoices must be voided instead.
     * Broadcasts a realtime deletion event to subscribed clients.
     *
     * @param  Invoice  $invoice
     * @return JsonResponse
     */
    public function destroy(Invoice $invoice): JsonResponse
    {
        Gate::authorize('delete', $invoice);

        $id = $invoice->id;
        $invoice->delete();

        RealtimeService::broadcast('invoice:deleted', ['id' => $id], 'invoices');

        return response()->json([
            'message' => 'Invoice deleted successfully',
            'id' => $id,
        ]);
    }
}
