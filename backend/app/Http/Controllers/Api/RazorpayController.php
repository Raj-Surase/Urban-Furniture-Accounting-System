<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\SalesOrder;
use App\Services\PaymentTransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RazorpayController extends Controller
{
    protected PaymentTransactionService $transactionService;

    public function __construct(PaymentTransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Create a new Razorpay order for an invoice or sales order.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function createOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invoice_id' => ['nullable', 'required_without:sales_order_id', 'exists:invoices,id'],
            'sales_order_id' => ['nullable', 'required_without:invoice_id', 'exists:sales_orders,id'],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
        ]);

        try {
            if (!empty($validated['invoice_id'])) {
                $invoice = Invoice::findOrFail($validated['invoice_id']);
                $amount = !empty($validated['amount']) ? (float) $validated['amount'] : (float) $invoice->balance_due;

                $result = $this->transactionService->initiateInvoicePayment($invoice, $amount, $request->user());

                return response()->json([
                    'message' => 'Razorpay order created successfully for invoice settlement.',
                    'data' => $result,
                ], 201);
            }

            if (!empty($validated['sales_order_id'])) {
                $so = SalesOrder::findOrFail($validated['sales_order_id']);
                $amount = !empty($validated['amount']) ? (float) $validated['amount'] : (float) $so->total_amount;

                $result = $this->transactionService->initiateSalesOrderAdvance($so, $amount, $request->user());

                return response()->json([
                    'message' => 'Razorpay order created successfully for sales order advance.',
                    'data' => $result,
                ], 201);
            }

            return response()->json(['message' => 'Neither invoice_id nor sales_order_id was supplied.'], 422);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Razorpay order creation exception', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to initiate online payment: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cryptographically verify payment signature and settle general ledger records.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function verifyPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'razorpay_order_id' => ['required', 'string'],
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_signature' => ['required', 'string'],
        ]);

        try {
            $transaction = $this->transactionService->verifyAndCapture(
                $validated['razorpay_order_id'],
                $validated['razorpay_payment_id'],
                $validated['razorpay_signature'],
                $request->user()
            );

            return response()->json([
                'message' => 'Payment verified successfully and general ledger updated.',
                'data' => $transaction,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Razorpay verify exception', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Internal error during payment verification.'], 500);
        }
    }

    /**
     * Public Razorpay Webhook receiver.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $signature = $request->header('X-Razorpay-Signature', '');
        $rawPayload = $request->getContent();

        try {
            $result = $this->transactionService->processWebhook($rawPayload, $signature);
            return response()->json($result);
        } catch (\Throwable $e) {
            Log::warning('Razorpay webhook processing error', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * List all payment transactions with filters.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function indexTransactions(Request $request): JsonResponse
    {
        $query = PaymentTransaction::with(['source', 'party', 'payment', 'creator'])->latest();

        // Standard users only see transactions they initiated or their associated invoices
        if (!$request->user()->isAdmin() && !$request->user()->isManager() && !$request->user()->isAccountant()) {
            $query->where('created_by', $request->user()->id);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($flow = $request->query('flow_type')) {
            $query->where('flow_type', $flow);
        }

        if ($direction = $request->query('direction')) {
            $query->where('direction', $direction);
        }

        if ($partyId = $request->query('party_id')) {
            $query->where('party_id', $partyId);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('transaction_number', 'like', "%{$search}%")
                  ->orWhere('razorpay_order_id', 'like', "%{$search}%")
                  ->orWhere('razorpay_payment_id', 'like', "%{$search}%");
            });
        }

        $perPage = $request->query('per_page', 'all');
        if ($perPage === 'all' || $perPage === '-1') {
            $transactions = $query->get();
            return response()->json([
                'data' => $transactions,
                'total' => $transactions->count(),
            ]);
        }

        $transactions = $query->paginate(is_numeric($perPage) ? (int) $perPage : 20);
        return response()->json($transactions);
    }

    /**
     * View detailed record of a single transaction.
     *
     * @param  PaymentTransaction  $transaction
     * @return JsonResponse
     */
    public function showTransaction(PaymentTransaction $transaction): JsonResponse
    {
        $user = request()->user();
        if ($user && ! $user->isAdmin() && ! $user->isManager() && ! $user->isAccountant()) {
            if ($transaction->created_by !== $user->id) {
                abort(403, 'Unauthorized access to transaction.');
            }
        }

        $transaction->load(['source', 'party', 'payment', 'creator']);

        return response()->json([
            'data' => $transaction,
        ]);
    }

    /**
     * Query gateway to sync pending/stuck transaction state.
     *
     * @param  PaymentTransaction  $transaction
     * @param  Request             $request
     * @return JsonResponse
     */
    public function syncTransaction(PaymentTransaction $transaction, Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || (! $user->isAdmin() && ! $user->isManager() && ! $user->isAccountant())) {
            abort(403, 'Unauthorized. Manager or Accountant privileges required.');
        }

        try {
            $updated = $this->transactionService->syncGatewayStatus($transaction, $request->user());
            return response()->json([
                'message' => "Transaction {$updated->transaction_number} synchronized with gateway. Status: {$updated->status}",
                'data' => $updated,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to sync gateway status: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Issue refund through Razorpay and adjust accounting records.
     *
     * @param  PaymentTransaction  $transaction
     * @param  Request             $request
     * @return JsonResponse
     */
    public function refundTransaction(PaymentTransaction $transaction, Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || (! $user->isAdmin() && ! $user->isManager() && ! $user->isAccountant())) {
            abort(403, 'Unauthorized. Manager or Accountant privileges required.');
        }

        $validated = $request->validate([
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        try {
            $amount = isset($validated['amount']) ? (float) $validated['amount'] : null;
            $refunded = $this->transactionService->processRefund(
                $transaction,
                $amount,
                $validated['reason'],
                $request->user()
            );

            return response()->json([
                'message' => "Refund successfully executed via Razorpay ({$refunded->razorpay_refund_id}).",
                'data' => $refunded,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Refund failed: ' . $e->getMessage(),
            ], 422);
        }
    }
}

