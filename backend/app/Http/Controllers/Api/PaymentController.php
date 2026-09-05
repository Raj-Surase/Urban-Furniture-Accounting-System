<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\JournalPostingService;
use App\Services\RealtimeService;
use App\Services\SequenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class PaymentController extends Controller
{
    /**
     * List all payments with optional filters (type, status, search by number).
     * Returns paginated results with invoice and bank account relations eager-loaded.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Payment::class);

        $query = Payment::with(['invoice', 'bankAccount', 'creator', 'reconciler', 'party'])->latest();

        if ($type = $request->query('type')) {
            if ($type === 'customer_receipt') {
                $query->where('type', 'received');
            } elseif ($type === 'vendor_payment') {
                $query->where('type', 'made');
            } else {
                $query->where('type', $type);
            }
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('payment_number', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%");
            });
        }

        $payments = $query->paginate($request->query('per_page', 20));

        return response()->json($payments);
    }

    /**
     * Record a new payment and auto-post a double-entry journal entry.
     * If an invoice_id is provided, reconciles balance_due and updates invoice status.
     * Auto-generates payment number in PAY-YYYY-NNNN format.
     *
     * @param  Request  $request
     * @return JsonResponse  201 on success
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Payment::class);

        // Normalize aliases and fallback fields
        $data = $request->all();

        // 1. If invoice_id is provided, auto-fill party and type if missing
        if (!empty($data['invoice_id'])) {
            $invoice = Invoice::find($data['invoice_id']);
            if ($invoice) {
                if (empty($data['party_type'])) {
                    $data['party_type'] = $invoice->party_type;
                }
                if (empty($data['party_id'])) {
                    $data['party_id'] = $invoice->party_id;
                }
                if (empty($data['type']) && empty($data['payment_type'])) {
                    $data['type'] = ($invoice->type === 'receivable' || $invoice->party_type === 'customer') ? 'received' : 'made';
                }
            }
        }

        // 2. Map payment_type -> type
        if (empty($data['type']) && !empty($data['payment_type'])) {
            if ($data['payment_type'] === 'customer_receipt') {
                $data['type'] = 'received';
            } elseif ($data['payment_type'] === 'vendor_payment') {
                $data['type'] = 'made';
            } else {
                $data['type'] = $data['payment_type'];
            }
        }

        // 3. Map customer_id / vendor_id -> party_type & party_id
        if (empty($data['party_id'])) {
            if (!empty($data['customer_id'])) {
                $data['party_type'] = 'customer';
                $data['party_id'] = $data['customer_id'];
                if (empty($data['type'])) {
                    $data['type'] = 'received';
                }
            } elseif (!empty($data['vendor_id'])) {
                $data['party_type'] = 'vendor';
                $data['party_id'] = $data['vendor_id'];
                if (empty($data['type'])) {
                    $data['type'] = 'made';
                }
            }
        }

        // 4. If party_id exists but party_type is missing, infer from type / payment_type
        if (!empty($data['party_id']) && empty($data['party_type'])) {
            if (($data['type'] ?? '') === 'received' || ($data['payment_type'] ?? '') === 'customer_receipt') {
                $data['party_type'] = 'customer';
            } elseif (($data['type'] ?? '') === 'made' || ($data['payment_type'] ?? '') === 'vendor_payment') {
                $data['party_type'] = 'vendor';
            }
        }

        $request->merge($data);

        $validated = $request->validate([
            'type' => ['required', 'in:received,made'],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'party_type' => ['required', 'in:customer,vendor'],
            'party_id' => ['required', 'integer'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['required', 'in:bank_transfer,cheque,cash,upi'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'bank_account_id' => ['nullable', 'exists:accounts,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $year = now()->format('Y');
        $payNumber = SequenceService::generate('PAY', (int) $year, 4);

        $defaultBank = Account::where('code', '1110')->first();
        $bankAccountId = $validated['bank_account_id'] ?? $defaultBank?->id;

        return DB::transaction(function () use ($validated, $payNumber, $bankAccountId, $request) {
            $payment = Payment::create([
                'payment_number' => $payNumber,
                'type' => $validated['type'],
                'invoice_id' => $validated['invoice_id'] ?? null,
                'party_type' => $validated['party_type'],
                'party_id' => $validated['party_id'],
                'amount' => (float) $validated['amount'],
                'payment_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'bank_account_id' => $bankAccountId,
                'status' => 'cleared',
                'notes' => $validated['notes'] ?? null,
                'reconciled_by' => $request->user()->id,
                'reconciled_at' => now(),
                'created_by' => $request->user()->id,
            ]);

            // Reconcile against Invoice if specified
            if ($payment->invoice_id) {
                $invoice = Invoice::find($payment->invoice_id);
                if ($invoice) {
                    $invoice->amount_paid += $payment->amount;
                    $invoice->balance_due = max(0, $invoice->total_amount - $invoice->amount_paid);

                    if ($invoice->balance_due <= 0.01) {
                        $invoice->status = 'paid';
                        $invoice->payment_date = $payment->payment_date;
                    } else {
                        $invoice->status = 'partially_paid';
                    }
                    $invoice->save();
                }
            }

            // Auto-post double-entry journal entry for the payment
            $je = JournalPostingService::postPayment($payment, $request->user());

            $payment->load(['invoice', 'bankAccount', 'creator', 'party']);

            RealtimeService::broadcast('payment:recorded', [
                'payment' => $payment->toArray(),
                'journal_entry' => $je->entry_number,
            ], 'treasury');

            return response()->json([
                'message' => "Payment {$payment->payment_number} recorded and general ledger updated ({$je->entry_number}).",
                'data' => $payment,
                'journal_entry' => $je,
            ], 201);
        });
    }

    /**
     * Retrieve a single payment with invoice, bank account, and creator relations.
     *
     * @param  Payment  $payment  Route-model-bound payment
     * @return JsonResponse
     */
    public function show(Payment $payment): JsonResponse
    {
        Gate::authorize('view', $payment);

        $payment->load(['invoice', 'bankAccount', 'creator', 'reconciler', 'party']);

        return response()->json([
            'data' => $payment,
        ]);
    }

    /**
     * Mark a pending payment as cleared and stamp reconciled_by / reconciled_at.
     * Broadcasts a realtime event to the treasury channel.
     *
     * @param  Request  $request
     * @param  Payment  $payment
     * @return JsonResponse
     */
    public function reconcile(Request $request, Payment $payment): JsonResponse
    {
        Gate::authorize('reconcile', $payment);

        $payment->status = 'cleared';
        $payment->reconciled_by = $request->user()->id;
        $payment->reconciled_at = now();
        $payment->save();

        RealtimeService::broadcast('payment:reconciled', [
            'id' => $payment->id,
            'payment_number' => $payment->payment_number,
            'status' => 'cleared',
            'reconciled_by' => $request->user()->name,
        ], 'treasury');

        return response()->json([
            'message' => 'Payment marked as reconciled and cleared',
            'data' => $payment,
        ]);
    }

    /**
     * Delete a payment record.
     * Note: reversing journal entries must be handled separately.
     *
     * @param  Payment  $payment
     * @return JsonResponse
     */
    public function destroy(Payment $payment): JsonResponse
    {
        Gate::authorize('delete', $payment);

        $id = $payment->id;
        $payment->delete();

        RealtimeService::broadcast('payment:deleted', ['id' => $id], 'treasury');

        return response()->json([
            'message' => 'Payment record deleted',
            'id' => $id,
        ]);
    }
}
