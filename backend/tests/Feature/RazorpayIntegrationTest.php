<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\SalesOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RazorpayIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer;
    protected Account $bankAccount;
    protected Account $arAccount;
    protected Account $revAccount;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'admin']);

        $this->bankAccount = Account::firstOrCreate(
            ['code' => '1110'],
            [
                'name' => 'Cash and Bank',
                'type' => 'asset',
                'sub_type' => 'cash_bank',
                'normal_balance' => 'debit',
                'current_balance' => 100000.00,
                'is_active' => true,
            ]
        );

        $this->arAccount = Account::firstOrCreate(
            ['code' => '1120'],
            [
                'name' => 'Accounts Receivable',
                'type' => 'asset',
                'sub_type' => 'receivables',
                'normal_balance' => 'debit',
                'current_balance' => 0.00,
                'is_active' => true,
            ]
        );

        Account::firstOrCreate(
            ['code' => '2110'],
            [
                'name' => 'Accounts Payable',
                'type' => 'liability',
                'sub_type' => 'payables',
                'normal_balance' => 'credit',
                'current_balance' => 0.00,
                'is_active' => true,
            ]
        );

        $this->revAccount = Account::firstOrCreate(
            ['code' => '4100'],
            [
                'name' => 'Sales Revenue',
                'type' => 'revenue',
                'sub_type' => 'operating_revenue',
                'normal_balance' => 'credit',
                'current_balance' => 0.00,
                'is_active' => true,
            ]
        );

        $this->customer = Customer::create([
            'name' => 'Acme Corporation',
            'code' => 'CUST-ACME',
            'email' => 'finance@acme.corp',
            'phone' => '+919876543210',
            'receivable_account_id' => $this->arAccount->id,
            'credit_limit' => 500000.00,
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);
    }

    private function createApprovedInvoice(float $amount = 10000.00): Invoice
    {
        $invoice = Invoice::create([
            'invoice_number' => 'INV-2026-' . rand(1000, 9999),
            'type' => 'receivable',
            'status' => 'approved',
            'party_type' => 'customer',
            'party_id' => $this->customer->id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'subtotal' => $amount,
            'discount_amount' => 0.00,
            'tax_amount' => 0.00,
            'cgst_amount' => 0.00,
            'sgst_amount' => 0.00,
            'igst_amount' => 0.00,
            'total_amount' => $amount,
            'amount_paid' => 0.00,
            'balance_due' => $amount,
            'currency' => 'INR',
            'created_by' => $this->user->id,
            'approved_by' => $this->user->id,
            'approved_at' => now(),
        ]);

        InvoiceLineItem::create([
            'invoice_id' => $invoice->id,
            'description' => 'Office Workstations',
            'quantity' => 1,
            'unit_price' => $amount,
            'tax_rate' => 0,
            'line_total' => $amount,
            'account_id' => $this->revAccount->id,
        ]);

        return $invoice;
    }

    public function test_can_create_razorpay_order_for_invoice(): void
    {
        $invoice = $this->createApprovedInvoice(25000.00);

        $response = $this->actingAs($this->user)
            ->postJson('/api/razorpay/order', [
                'invoice_id' => $invoice->id,
                'amount' => 25000.00,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'transaction' => ['id', 'transaction_number', 'status', 'amount'],
                    'order' => ['id', 'amount', 'currency'],
                    'key_id',
                ],
            ]);

        $this->assertDatabaseHas('payment_transactions', [
            'source_type' => Invoice::class,
            'source_id' => $invoice->id,
            'amount' => 25000.00,
            'status' => PaymentTransaction::STATUS_ORDER_CREATED,
        ]);
    }

    public function test_cannot_create_order_for_void_or_paid_invoice(): void
    {
        $invoice = $this->createApprovedInvoice(10000.00);
        $invoice->status = 'paid';
        $invoice->balance_due = 0.00;
        $invoice->amount_paid = 10000.00;
        $invoice->save();

        $response = $this->actingAs($this->user)
            ->postJson('/api/razorpay/order', [
                'invoice_id' => $invoice->id,
            ]);

        $response->assertStatus(422);
    }

    public function test_can_verify_and_capture_payment_with_balanced_gl_posting(): void
    {
        $invoice = $this->createApprovedInvoice(50000.00);

        // Step 1: Create order
        $orderRes = $this->actingAs($this->user)
            ->postJson('/api/razorpay/order', [
                'invoice_id' => $invoice->id,
                'amount' => 50000.00,
            ]);
        $orderRes->assertStatus(201);
        $orderId = $orderRes->json('data.order.id');

        // Step 2: Verify payment
        $paymentId = 'pay_test_' . bin2hex(random_bytes(6));
        $secret = config('services.razorpay.key_secret');
        $signature = hash_hmac('sha256', $orderId . '|' . $paymentId, $secret);

        $verifyRes = $this->actingAs($this->user)
            ->postJson('/api/razorpay/verify', [
                'razorpay_order_id' => $orderId,
                'razorpay_payment_id' => $paymentId,
                'razorpay_signature' => $signature,
            ]);

        $verifyRes->assertStatus(200);

        // Verify transaction is captured
        $this->assertDatabaseHas('payment_transactions', [
            'razorpay_order_id' => $orderId,
            'razorpay_payment_id' => $paymentId,
            'status' => PaymentTransaction::STATUS_CAPTURED,
        ]);

        // Verify Invoice is paid
        $invoice->refresh();
        $this->assertEquals(50000.00, (float) $invoice->amount_paid);
        $this->assertEquals(0.00, (float) $invoice->balance_due);
        $this->assertEquals('paid', $invoice->status);

        // Verify Payment voucher exists
        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'amount' => 50000.00,
            'payment_method' => 'razorpay',
            'reference_number' => $paymentId,
            'status' => 'cleared',
        ]);

        $payment = Payment::where('reference_number', $paymentId)->first();
        $this->assertNotNull($payment);

        // Verify balanced General Ledger journal entry was posted
        $je = JournalEntry::where('reference_type', Payment::class)
            ->where('reference_id', $payment->id)
            ->first();

        $this->assertNotNull($je);
        $this->assertTrue($je->isBalanced());
        $this->assertEquals(50000.00, (float) $je->total_debit);
        $this->assertEquals(50000.00, (float) $je->total_credit);
    }

    public function test_verification_is_idempotent(): void
    {
        $invoice = $this->createApprovedInvoice(20000.00);

        $orderRes = $this->actingAs($this->user)
            ->postJson('/api/razorpay/order', [
                'invoice_id' => $invoice->id,
                'amount' => 20000.00,
            ]);
        $orderId = $orderRes->json('data.order.id');

        $paymentId = 'pay_test_' . bin2hex(random_bytes(6));
        $secret = config('services.razorpay.key_secret');
        $signature = hash_hmac('sha256', $orderId . '|' . $paymentId, $secret);

        // First verification
        $res1 = $this->actingAs($this->user)
            ->postJson('/api/razorpay/verify', [
                'razorpay_order_id' => $orderId,
                'razorpay_payment_id' => $paymentId,
                'razorpay_signature' => $signature,
            ]);
        $res1->assertStatus(200);

        // Second verification should succeed without duplicate payment creation
        $res2 = $this->actingAs($this->user)
            ->postJson('/api/razorpay/verify', [
                'razorpay_order_id' => $orderId,
                'razorpay_payment_id' => $paymentId,
                'razorpay_signature' => $signature,
            ]);
        $res2->assertStatus(200);

        $invoice->refresh();
        $this->assertEquals(20000.00, (float) $invoice->amount_paid);
        $this->assertEquals(1, $invoice->payments()->count());
    }

    public function test_invalid_signature_is_rejected(): void
    {
        $invoice = $this->createApprovedInvoice(15000.00);

        $orderRes = $this->actingAs($this->user)
            ->postJson('/api/razorpay/order', [
                'invoice_id' => $invoice->id,
                'amount' => 15000.00,
            ]);
        $orderId = $orderRes->json('data.order.id');

        $response = $this->actingAs($this->user)
            ->postJson('/api/razorpay/verify', [
                'razorpay_order_id' => $orderId,
                'razorpay_payment_id' => 'pay_invalid_123',
                'razorpay_signature' => 'invalid_signature_hash',
            ]);

        $response->assertStatus(422);

        $this->assertDatabaseHas('payment_transactions', [
            'razorpay_order_id' => $orderId,
            'status' => PaymentTransaction::STATUS_FAILED,
        ]);
    }

    public function test_can_process_refund_and_restore_invoice_balance(): void
    {
        $invoice = $this->createApprovedInvoice(30000.00);

        $orderRes = $this->actingAs($this->user)
            ->postJson('/api/razorpay/order', [
                'invoice_id' => $invoice->id,
                'amount' => 30000.00,
            ]);
        $orderId = $orderRes->json('data.order.id');

        $paymentId = 'pay_test_' . bin2hex(random_bytes(6));
        $signature = hash_hmac('sha256', $orderId . '|' . $paymentId, config('services.razorpay.key_secret'));

        $this->actingAs($this->user)
            ->postJson('/api/razorpay/verify', [
                'razorpay_order_id' => $orderId,
                'razorpay_payment_id' => $paymentId,
                'razorpay_signature' => $signature,
            ]);

        $txn = PaymentTransaction::where('razorpay_order_id', $orderId)->first();

        // Process full refund
        $refundRes = $this->actingAs($this->user)
            ->postJson("/api/payment-transactions/{$txn->id}/refund", [
                'amount' => 30000.00,
                'reason' => 'Customer requested order cancellation',
            ]);

        $refundRes->assertStatus(200);

        $txn->refresh();
        $this->assertEquals(PaymentTransaction::STATUS_REFUNDED, $txn->status);

        // Invoice balance is restored
        $invoice->refresh();
        $this->assertEquals(0.00, (float) $invoice->amount_paid);
        $this->assertEquals(30000.00, (float) $invoice->balance_due);
        $this->assertEquals('approved', $invoice->status);
    }

    public function test_can_create_order_for_sales_order_advance(): void
    {
        $so = SalesOrder::create([
            'so_number' => 'SO-2026-0001',
            'customer_id' => $this->customer->id,
            'status' => 'confirmed',
            'order_date' => now()->toDateString(),
            'subtotal' => 45000.00,
            'total_amount' => 45000.00,
            'created_by' => $this->user->id,
        ]);

        $res = $this->actingAs($this->user)
            ->postJson('/api/razorpay/order', [
                'sales_order_id' => $so->id,
                'amount' => 15000.00,
            ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('payment_transactions', [
            'source_type' => SalesOrder::class,
            'source_id' => $so->id,
            'amount' => 15000.00,
            'flow_type' => PaymentTransaction::FLOW_SALES_ORDER_ADVANCE,
        ]);
    }

    public function test_webhook_payment_captured_processes_transaction(): void
    {
        $invoice = $this->createApprovedInvoice(12000.00);

        $orderRes = $this->actingAs($this->user)
            ->postJson('/api/razorpay/order', [
                'invoice_id' => $invoice->id,
                'amount' => 12000.00,
            ]);
        $orderId = $orderRes->json('data.order.id');
        $paymentId = 'pay_webhook_' . bin2hex(random_bytes(6));

        $webhookPayload = json_encode([
            'entity' => 'event',
            'event' => 'payment.captured',
            'payload' => [
                'payment' => [
                    'entity' => [
                        'id' => $paymentId,
                        'order_id' => $orderId,
                        'amount' => 1200000,
                        'currency' => 'INR',
                        'status' => 'captured',
                        'method' => 'upi',
                    ],
                ],
            ],
        ]);

        $secret = config('services.razorpay.webhook_secret');
        $signature = hash_hmac('sha256', $webhookPayload, $secret);

        $res = $this->postJson('/api/razorpay/webhook', json_decode($webhookPayload, true), [
            'X-Razorpay-Signature' => $signature,
        ]);

        $res->assertStatus(200);

        $this->assertDatabaseHas('payment_transactions', [
            'razorpay_order_id' => $orderId,
            'status' => PaymentTransaction::STATUS_CAPTURED,
        ]);

        $invoice->refresh();
        $this->assertEquals(12000.00, (float) $invoice->amount_paid);
        $this->assertEquals('paid', $invoice->status);
    }

    public function test_webhook_payment_failed_records_failure_state(): void
    {
        $invoice = $this->createApprovedInvoice(8000.00);

        $orderRes = $this->actingAs($this->user)
            ->postJson('/api/razorpay/order', [
                'invoice_id' => $invoice->id,
                'amount' => 8000.00,
            ]);
        $orderId = $orderRes->json('data.order.id');

        $webhookPayload = json_encode([
            'entity' => 'event',
            'event' => 'payment.failed',
            'payload' => [
                'payment' => [
                    'entity' => [
                        'id' => 'pay_fail_' . bin2hex(random_bytes(6)),
                        'order_id' => $orderId,
                        'error_code' => 'BAD_REQUEST_ERROR',
                        'error_description' => 'Card expired',
                    ],
                ],
            ],
        ]);

        $secret = config('services.razorpay.webhook_secret');
        $signature = hash_hmac('sha256', $webhookPayload, $secret);

        $res = $this->postJson('/api/razorpay/webhook', json_decode($webhookPayload, true), [
            'X-Razorpay-Signature' => $signature,
        ]);

        $res->assertStatus(200);

        $this->assertDatabaseHas('payment_transactions', [
            'razorpay_order_id' => $orderId,
            'status' => PaymentTransaction::STATUS_FAILED,
            'error_code' => 'BAD_REQUEST_ERROR',
        ]);
    }

    public function test_can_sync_transaction_status_from_gateway(): void
    {
        $invoice = $this->createApprovedInvoice(18000.00);

        $orderRes = $this->actingAs($this->user)
            ->postJson('/api/razorpay/order', [
                'invoice_id' => $invoice->id,
                'amount' => 18000.00,
            ]);
        $orderId = $orderRes->json('data.order.id');

        $txn = PaymentTransaction::where('razorpay_order_id', $orderId)->first();
        $this->assertEquals(PaymentTransaction::STATUS_ORDER_CREATED, $txn->status);

        // Sync from gateway
        $res = $this->actingAs($this->user)
            ->postJson("/api/payment-transactions/{$txn->id}/sync");

        $res->assertStatus(200);
        $txn->refresh();
        $this->assertEquals(PaymentTransaction::STATUS_CAPTURED, $txn->status);
    }
}

