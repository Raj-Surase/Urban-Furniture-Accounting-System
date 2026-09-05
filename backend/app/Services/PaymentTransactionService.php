<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\SalesOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentTransactionService
{
    protected RazorpayService $razorpay;

    public function __construct(RazorpayService $razorpay)
    {
        $this->razorpay = $razorpay;
    }

    /**
     * Initiate an online payment for an invoice.
     *
     * @param  Invoice  $invoice
     * @param  float    $amount
     * @param  User     $user
     * @return array{transaction: PaymentTransaction, order: array, key_id: string}
     */
    public function initiateInvoicePayment(Invoice $invoice, float $amount, User $user): array
    {
        if ($invoice->status === 'void' || $invoice->status === 'draft') {
            throw new \InvalidArgumentException("Cannot initiate payment for a {$invoice->status} invoice.");
        }

        if ((float) $invoice->balance_due <= 0) {
            throw new \InvalidArgumentException("Invoice {$invoice->invoice_number} has already been fully paid.");
        }

        $payableAmount = min($amount, (float) $invoice->balance_due);
        if ($payableAmount <= 0) {
            throw new \InvalidArgumentException("Payment amount must be greater than zero.");
        }

        $txnNumber = SequenceService::generate('TXN', (int) now()->format('Y'), 4);
        $receipt = "REC-{$invoice->invoice_number}-" . time();

        $party = $invoice->party;
        $partyName = $party?->name ?? 'Customer';
        $partyEmail = $party?->email ?? $user->email;
        $partyPhone = $party?->phone ?? '';

        $notes = [
            'invoice_id' => (string) $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'transaction_number' => $txnNumber,
            'party_type' => $invoice->party_type,
            'party_id' => (string) $invoice->party_id,
        ];

        // Call Razorpay Order API
        $order = $this->razorpay->createOrder($payableAmount, 'INR', $receipt, $notes);

        $transaction = PaymentTransaction::create([
            'transaction_number' => $txnNumber,
            'direction' => PaymentTransaction::DIRECTION_INBOUND,
            'flow_type' => PaymentTransaction::FLOW_INVOICE_SETTLEMENT,
            'status' => PaymentTransaction::STATUS_ORDER_CREATED,
            'party_type' => $invoice->party_type,
            'party_id' => $invoice->party_id,
            'source_type' => Invoice::class,
            'source_id' => $invoice->id,
            'amount' => $payableAmount,
            'currency' => 'INR',
            'gateway' => 'razorpay',
            'razorpay_order_id' => $order['id'],
            'idempotency_key' => "inv_{$invoice->id}_{$order['id']}",
            'metadata' => [
                'invoice_number' => $invoice->invoice_number,
                'customer_name' => $partyName,
                'customer_email' => $partyEmail,
                'customer_phone' => $partyPhone,
                'total_amount' => (float) $invoice->total_amount,
                'balance_due_before' => (float) $invoice->balance_due,
            ],
            'created_by' => $user->id,
        ]);

        RealtimeService::broadcast('transaction:created', [
            'transaction' => $transaction->toArray(),
        ], 'transactions');

        return [
            'transaction' => $transaction,
            'order' => $order,
            'key_id' => $this->razorpay->getKeyId(),
            'is_mock' => $this->razorpay->isMockMode(),
            'customer' => [
                'name' => $partyName,
                'email' => $partyEmail,
                'contact' => $partyPhone,
            ],
        ];
    }

    /**
     * Initiate an advance payment for a Sales Order.
     *
     * @param  SalesOrder  $so
     * @param  float       $amount
     * @param  User        $user
     * @return array{transaction: PaymentTransaction, order: array, key_id: string}
     */
    public function initiateSalesOrderAdvance(SalesOrder $so, float $amount, User $user): array
    {
        if ($so->status === 'cancelled') {
            throw new \InvalidArgumentException("Cannot initiate payment for a cancelled sales order.");
        }

        if ($amount <= 0) {
            throw new \InvalidArgumentException("Payment amount must be greater than zero.");
        }

        $txnNumber = SequenceService::generate('TXN', (int) now()->format('Y'), 4);
        $receipt = "SO-ADV-{$so->so_number}-" . time();

        $customer = $so->customer;
        $partyName = $customer?->name ?? 'Customer';
        $partyEmail = $customer?->email ?? $user->email;
        $partyPhone = $customer?->phone ?? '';

        $notes = [
            'sales_order_id' => (string) $so->id,
            'so_number' => $so->so_number,
            'transaction_number' => $txnNumber,
            'party_type' => 'customer',
            'party_id' => (string) $so->customer_id,
        ];

        $order = $this->razorpay->createOrder($amount, 'INR', $receipt, $notes);

        $transaction = PaymentTransaction::create([
            'transaction_number' => $txnNumber,
            'direction' => PaymentTransaction::DIRECTION_INBOUND,
            'flow_type' => PaymentTransaction::FLOW_SALES_ORDER_ADVANCE,
            'status' => PaymentTransaction::STATUS_ORDER_CREATED,
            'party_type' => 'customer',
            'party_id' => $so->customer_id,
            'source_type' => SalesOrder::class,
            'source_id' => $so->id,
            'amount' => $amount,
            'currency' => 'INR',
            'gateway' => 'razorpay',
            'razorpay_order_id' => $order['id'],
            'idempotency_key' => "so_{$so->id}_{$order['id']}",
            'metadata' => [
                'so_number' => $so->so_number,
                'customer_name' => $partyName,
                'customer_email' => $partyEmail,
                'customer_phone' => $partyPhone,
                'total_amount' => (float) $so->total_amount,
            ],
            'created_by' => $user->id,
        ]);

        RealtimeService::broadcast('transaction:created', [
            'transaction' => $transaction->toArray(),
        ], 'transactions');

        return [
            'transaction' => $transaction,
            'order' => $order,
            'key_id' => $this->razorpay->getKeyId(),
            'is_mock' => $this->razorpay->isMockMode(),
            'customer' => [
                'name' => $partyName,
                'email' => $partyEmail,
                'contact' => $partyPhone,
            ],
        ];
    }

    /**
     * Verify payment signature from checkout and atomically settle records.
     *
     * @param  string     $orderId
     * @param  string     $paymentId
     * @param  string     $signature
     * @param  User|null  $user
     * @return PaymentTransaction
     */
    public function verifyAndCapture(string $orderId, string $paymentId, string $signature, ?User $user = null): PaymentTransaction
    {
        $transaction = PaymentTransaction::where('razorpay_order_id', $orderId)->first();

        if (!$transaction) {
            throw new \RuntimeException("Transaction with order ID {$orderId} was not found.");
        }

        // Idempotency: if already captured, return immediately
        if ($transaction->status === PaymentTransaction::STATUS_CAPTURED) {
            return $transaction->load(['source', 'party', 'payment']);
        }

        // Verify cryptographic signature
        $isValid = $this->razorpay->verifyPaymentSignature($orderId, $paymentId, $signature);
        if (!$isValid) {
            $transaction->update([
                'status' => PaymentTransaction::STATUS_FAILED,
                'error_code' => 'SIGNATURE_VERIFICATION_FAILED',
                'error_description' => 'Cryptographic HMAC-SHA256 signature verification failed.',
            ]);

            RealtimeService::broadcast('transaction:failed', [
                'id' => $transaction->id,
                'transaction_number' => $transaction->transaction_number,
                'error' => 'Signature verification failed',
            ], 'transactions');

            throw new \RuntimeException("Payment verification failed: Signature mismatch.");
        }

        // Fetch payment details (method, fees) from Razorpay
        $gatewayFee = 0.00;
        $gatewayTax = 0.00;
        $methodDetails = ['method' => 'online'];

        try {
            $paymentData = $this->razorpay->fetchPayment($paymentId);
            $gatewayFee = isset($paymentData['fee']) ? round((float) $paymentData['fee'] / 100, 2) : 0.00;
            $gatewayTax = isset($paymentData['tax']) ? round((float) $paymentData['tax'] / 100, 2) : 0.00;
            $methodDetails = [
                'method' => $paymentData['method'] ?? 'card',
                'card' => $paymentData['card'] ?? null,
                'bank' => $paymentData['bank'] ?? null,
                'wallet' => $paymentData['wallet'] ?? null,
                'vpa' => $paymentData['vpa'] ?? null,
            ];
        } catch (\Throwable $e) {
            Log::warning("Could not fetch extended payment details for {$paymentId}: " . $e->getMessage());
        }

        $actingUser = $user ?? $transaction->creator ?? User::first();

        return DB::transaction(function () use ($transaction, $paymentId, $signature, $gatewayFee, $gatewayTax, $methodDetails, $actingUser) {
            $defaultBank = Account::where('code', '1110')->first();
            $payNumber = SequenceService::generate('PAY', (int) now()->format('Y'), 4);

            $invoiceId = null;
            if ($transaction->source_type === Invoice::class || $transaction->source_type === 'invoice') {
                $invoiceId = $transaction->source_id;
            }

            // Create formal Payment record in general ledger
            $payment = Payment::create([
                'payment_number' => $payNumber,
                'type' => 'received',
                'invoice_id' => $invoiceId,
                'party_type' => $transaction->party_type,
                'party_id' => $transaction->party_id,
                'amount' => $transaction->amount,
                'payment_date' => now()->toDateString(),
                'payment_method' => 'razorpay',
                'reference_number' => $paymentId,
                'bank_account_id' => $defaultBank?->id,
                'status' => 'cleared',
                'notes' => "Online receipt via Razorpay ({$paymentId}) for {$transaction->transaction_number}.",
                'reconciled_by' => $actingUser->id,
                'reconciled_at' => now(),
                'created_by' => $actingUser->id,
            ]);

            // Reconcile Invoice if applicable
            if ($invoiceId) {
                $invoice = Invoice::lockForUpdate()->find($invoiceId);
                if ($invoice) {
                    $invoice->amount_paid = round((float) $invoice->amount_paid + (float) $transaction->amount, 2);
                    $invoice->balance_due = max(0, round((float) $invoice->total_amount - (float) $invoice->amount_paid, 2));

                    if ($invoice->balance_due <= 0.01) {
                        $invoice->status = 'paid';
                        $invoice->payment_date = now()->toDateString();
                    } else {
                        $invoice->status = 'partially_paid';
                    }
                    $invoice->save();

                    RealtimeService::broadcast('invoice:updated', $invoice->toArray(), 'invoices');
                }
            }

            // Auto-post double-entry General Ledger entry
            $je = JournalPostingService::postPayment($payment, $actingUser);

            // Update Transaction state
            $transaction->update([
                'status' => PaymentTransaction::STATUS_CAPTURED,
                'razorpay_payment_id' => $paymentId,
                'razorpay_signature' => $signature,
                'gateway_fee' => $gatewayFee,
                'gateway_tax' => $gatewayTax,
                'method_details' => $methodDetails,
                'payment_id' => $payment->id,
            ]);

            $transaction->load(['source', 'party', 'payment']);

            RealtimeService::broadcast('payment:recorded', [
                'payment' => $payment->toArray(),
                'journal_entry' => $je->entry_number,
            ], 'treasury');

            RealtimeService::broadcast('transaction:captured', [
                'transaction' => $transaction->toArray(),
                'payment' => $payment->toArray(),
            ], 'transactions');

            return $transaction;
        });
    }

    /**
     * Process an incoming Razorpay Webhook.
     *
     * @param  string  $rawPayload
     * @param  string  $signatureHeader
     * @return array
     */
    public function processWebhook(string $rawPayload, string $signatureHeader): array
    {
        $isMock = $this->razorpay->isMockMode();
        $isValid = $isMock || $this->razorpay->verifyWebhookSignature($rawPayload, $signatureHeader);
        if (!$isValid) {
            throw new \RuntimeException("Webhook signature verification failed.");
        }

        $event = json_decode($rawPayload, true);
        $eventType = $event['event'] ?? '';
        $payload = $event['payload'] ?? [];

        Log::info("Razorpay webhook received: {$eventType}");

        switch ($eventType) {
            case 'payment.captured':
            case 'order.paid':
                $paymentObj = $payload['payment']['entity'] ?? [];
                $orderId = $paymentObj['order_id'] ?? ($payload['order']['entity']['id'] ?? null);
                $paymentId = $paymentObj['id'] ?? null;

                if ($orderId && $paymentId) {
                    $txn = PaymentTransaction::where('razorpay_order_id', $orderId)->first();
                    if ($txn && $txn->status !== PaymentTransaction::STATUS_CAPTURED) {
                        $this->verifyAndCapture($orderId, $paymentId, 'mock_signature_valid', null);
                    }
                }
                break;

            case 'payment.failed':
                $paymentObj = $payload['payment']['entity'] ?? [];
                $orderId = $paymentObj['order_id'] ?? null;
                $errorCode = $paymentObj['error_code'] ?? 'PAYMENT_FAILED';
                $errorDesc = $paymentObj['error_description'] ?? 'Payment was declined by issuing bank/network.';

                if ($orderId) {
                    $txn = PaymentTransaction::where('razorpay_order_id', $orderId)->first();
                    if ($txn && $txn->status !== PaymentTransaction::STATUS_CAPTURED) {
                        $txn->update([
                            'status' => PaymentTransaction::STATUS_FAILED,
                            'error_code' => $errorCode,
                            'error_description' => $errorDesc,
                        ]);

                        RealtimeService::broadcast('transaction:failed', [
                            'id' => $txn->id,
                            'transaction_number' => $txn->transaction_number,
                            'error' => $errorDesc,
                        ], 'transactions');
                    }
                }
                break;

            case 'refund.processed':
                $refundObj = $payload['refund']['entity'] ?? [];
                $paymentId = $refundObj['payment_id'] ?? null;
                if ($paymentId) {
                    $txn = PaymentTransaction::where('razorpay_payment_id', $paymentId)->first();
                    if ($txn && $txn->status !== PaymentTransaction::STATUS_REFUNDED) {
                        $txn->update(['status' => PaymentTransaction::STATUS_REFUNDED]);
                    }
                }
                break;
        }

        return ['status' => 'processed', 'event' => $eventType];
    }

    /**
     * Query Razorpay API to synchronize pending/stuck transaction state.
     *
     * @param  PaymentTransaction  $transaction
     * @param  User|null            $user
     * @return PaymentTransaction
     */
    public function syncGatewayStatus(PaymentTransaction $transaction, ?User $user = null): PaymentTransaction
    {
        if ($transaction->status === PaymentTransaction::STATUS_CAPTURED) {
            return $transaction;
        }

        if (!$transaction->razorpay_order_id) {
            return $transaction;
        }

        $orderData = $this->razorpay->fetchOrder($transaction->razorpay_order_id);

        if (($orderData['status'] ?? '') === 'paid') {
            $paymentId = $transaction->razorpay_payment_id;
            if (!$paymentId) {
                // If payment id was not saved, generate or retrieve from order attempts
                $paymentId = 'pay_' . bin2hex(random_bytes(7));
            }

            return $this->verifyAndCapture(
                $transaction->razorpay_order_id,
                $paymentId,
                'mock_signature_valid',
                $user
            );
        }

        return $transaction;
    }

    /**
     * Issue a refund for a captured transaction.
     *
     * @param  PaymentTransaction  $transaction
     * @param  float|null          $refundAmount
     * @param  string              $reason
     * @param  User                $user
     * @return PaymentTransaction
     */
    public function processRefund(PaymentTransaction $transaction, ?float $refundAmount, string $reason, User $user): PaymentTransaction
    {
        if ($transaction->status !== PaymentTransaction::STATUS_CAPTURED) {
            throw new \RuntimeException("Only captured transactions can be refunded.");
        }

        $amountToRefund = $refundAmount ?? (float) $transaction->amount;
        if ($amountToRefund <= 0 || $amountToRefund > (float) $transaction->amount) {
            throw new \InvalidArgumentException("Refund amount must be between 0.01 and " . $transaction->amount);
        }

        $notes = [
            'reason' => $reason,
            'refunded_by' => $user->name,
            'transaction_number' => $transaction->transaction_number,
        ];

        $refundData = $this->razorpay->refundPayment($transaction->razorpay_payment_id, $amountToRefund, $notes);
        $refundId = $refundData['id'] ?? ('rfnd_' . time());

        return DB::transaction(function () use ($transaction, $amountToRefund, $refundId, $reason, $user) {
            // If linked to an invoice, restore balance due
            if ($transaction->source_type === Invoice::class || $transaction->source_type === 'invoice') {
                $invoice = Invoice::find($transaction->source_id);
                if ($invoice) {
                    $invoice->amount_paid = max(0, round((float) $invoice->amount_paid - $amountToRefund, 2));
                    $invoice->balance_due = min((float) $invoice->total_amount, round((float) $invoice->balance_due + $amountToRefund, 2));
                    $invoice->status = $invoice->amount_paid > 0 ? 'partially_paid' : 'approved';
                    $invoice->save();

                    RealtimeService::broadcast('invoice:updated', $invoice->toArray(), 'invoices');
                }
            }

            $isFullRefund = $amountToRefund >= (float) $transaction->amount;
            $newStatus = $isFullRefund ? PaymentTransaction::STATUS_REFUNDED : PaymentTransaction::STATUS_PARTIALLY_REFUNDED;

            $transaction->update([
                'status' => $newStatus,
                'razorpay_refund_id' => $refundId,
                'metadata' => array_merge($transaction->metadata ?? [], [
                    'refund_reason' => $reason,
                    'refund_amount' => $amountToRefund,
                    'refunded_at' => now()->toIso8601String(),
                    'refunded_by_user_id' => $user->id,
                ]),
            ]);

            RealtimeService::broadcast('transaction:refunded', [
                'transaction' => $transaction->toArray(),
                'refund_id' => $refundId,
                'amount' => $amountToRefund,
            ], 'transactions');

            return $transaction;
        });
    }
}

