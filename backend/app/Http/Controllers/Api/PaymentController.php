<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\JournalPostingService;
use App\Services\RealtimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Payment::class);

        $query = Payment::with(['invoice', 'bankAccount', 'creator', 'reconciler'])->latest();

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where('payment_number', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%");
        }

        $payments = $query->paginate($request->query('per_page', 20));

        return response()->json($payments);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Payment::class);

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
        $count = Payment::whereYear('created_at', $year)->count() + 1;
        $payNumber = sprintf("PAY-%s-%04d", $year, $count);

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

            $payment->load(['invoice', 'bankAccount', 'creator']);

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

    public function show(Payment $payment): JsonResponse
    {
        Gate::authorize('view', $payment);

        $payment->load(['invoice', 'bankAccount', 'creator', 'reconciler']);

        return response()->json([
            'data' => $payment,
        ]);
    }

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
