<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vendor;
use App\Security\Rbac;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentVoucherTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Customer $customer;
    private Vendor $vendor;
    private Account $bankAccount;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@urbanfurniture.com',
            'password' => bcrypt('password'),
            'role' => Rbac::ROLE_ADMIN,
        ]);

        $this->customer = Customer::create([
            'code' => 'CUST-001',
            'name' => 'Urban Spaces Pvt Ltd',
            'created_by' => $this->admin->id,
        ]);

        $this->vendor = Vendor::create([
            'code' => 'VEN-001',
            'name' => 'Timber Woods Suppliers',
            'created_by' => $this->admin->id,
        ]);

        // Standard accounts
        $this->bankAccount = Account::create([
            'code' => '1110',
            'name' => 'Bank Current Account (HDFC)',
            'type' => 'asset',
            'sub_type' => 'bank',
            'normal_balance' => 'debit',
            'current_balance' => 100000.00,
            'is_active' => true,
            'created_by' => $this->admin->id,
        ]);

        Account::create([
            'code' => '1120',
            'name' => 'Accounts Receivable',
            'type' => 'asset',
            'sub_type' => 'accounts_receivable',
            'normal_balance' => 'debit',
            'current_balance' => 0.00,
            'is_active' => true,
            'created_by' => $this->admin->id,
        ]);

        Account::create([
            'code' => '2110',
            'name' => 'Accounts Payable',
            'type' => 'liability',
            'sub_type' => 'accounts_payable',
            'normal_balance' => 'credit',
            'current_balance' => 0.00,
            'is_active' => true,
            'created_by' => $this->admin->id,
        ]);
    }

    public function test_can_create_payment_voucher_with_frontend_fields_resolving_validation_error(): void
    {
        Sanctum::actingAs($this->admin);

        // This payload previously caused:
        // "The type field is required. The party type field is required. The party id field is required."
        $payload = [
            'payment_type' => 'customer_receipt',
            'customer_id' => $this->customer->id,
            'vendor_id' => null,
            'amount' => 15000.00,
            'payment_date' => '2026-09-05',
            'payment_method' => 'bank_transfer',
            'reference_number' => 'UTR-99887766',
            'notes' => 'Customer advance receipt for modular desks',
            'status' => 'reconciled',
        ];

        $response = $this->postJson('/api/payments', $payload);

        $response->assertCreated();
        $json = $response->json();

        $this->assertSame('received', $json['data']['type']);
        $this->assertSame('customer', $json['data']['party_type']);
        $this->assertEquals($this->customer->id, $json['data']['party_id']);
        $this->assertEquals(15000.00, (float) $json['data']['amount']);
        $this->assertSame('customer_receipt', $json['data']['payment_type']);
        $this->assertSame('Urban Spaces Pvt Ltd', $json['data']['customer']['name']);

        // Check journal entry auto-posted
        $this->assertNotNull($json['journal_entry']);
        $je = JournalEntry::find($json['journal_entry']['id']);
        $this->assertTrue($je->isBalanced());
        $this->assertEquals(15000.00, (float) $je->total_debit);
        $this->assertEquals(15000.00, (float) $je->total_credit);
    }

    public function test_can_create_vendor_payment_voucher_with_frontend_fields(): void
    {
        Sanctum::actingAs($this->admin);

        $payload = [
            'payment_type' => 'vendor_payment',
            'customer_id' => null,
            'vendor_id' => $this->vendor->id,
            'amount' => 8500.00,
            'payment_date' => '2026-09-05',
            'payment_method' => 'upi',
            'reference_number' => 'UPI-77665544',
            'notes' => 'Timber procurement payment',
        ];

        $response = $this->postJson('/api/payments', $payload);

        $response->assertCreated();
        $json = $response->json();

        $this->assertSame('made', $json['data']['type']);
        $this->assertSame('vendor', $json['data']['party_type']);
        $this->assertEquals($this->vendor->id, $json['data']['party_id']);
        $this->assertSame('vendor_payment', $json['data']['payment_type']);
        $this->assertSame('Timber Woods Suppliers', $json['data']['vendor']['name']);

        $je = JournalEntry::find($json['journal_entry']['id']);
        $this->assertTrue($je->isBalanced());
    }

    public function test_can_create_payment_voucher_with_standard_type_and_party_fields(): void
    {
        Sanctum::actingAs($this->admin);

        $payload = [
            'type' => 'received',
            'party_type' => 'customer',
            'party_id' => $this->customer->id,
            'amount' => 5000.00,
            'payment_date' => '2026-09-05',
            'payment_method' => 'cash',
            'reference_number' => 'CSH-001',
        ];

        $response = $this->postJson('/api/payments', $payload);
        $response->assertCreated();
        $this->assertSame('received', $response->json('data.type'));
        $this->assertSame('customer', $response->json('data.party_type'));
    }

    public function test_can_record_payment_for_invoice_with_inferred_party_and_type(): void
    {
        Sanctum::actingAs($this->admin);

        $invoice = Invoice::create([
            'invoice_number' => 'INV-2026-9001',
            'type' => 'receivable',
            'status' => 'approved',
            'party_type' => 'customer',
            'party_id' => $this->customer->id,
            'invoice_date' => '2026-09-05',
            'due_date' => '2026-10-05',
            'subtotal' => 10000.00,
            'tax_amount' => 1800.00,
            'total_amount' => 11800.00,
            'balance_due' => 11800.00,
            'created_by' => $this->admin->id,
        ]);

        $payload = [
            'invoice_id' => $invoice->id,
            'amount' => 11800.00,
            'payment_date' => '2026-09-05',
            'payment_method' => 'bank_transfer',
            'reference_number' => 'UTR-INV-SETTLE',
        ];

        $response = $this->postJson('/api/payments', $payload);
        $response->assertCreated();

        $invoice->refresh();
        $this->assertSame('paid', $invoice->status);
        $this->assertEquals(0.00, (float) $invoice->balance_due);
        $this->assertEquals(11800.00, (float) $invoice->amount_paid);
    }

    public function test_payment_index_includes_party_metadata_and_supports_filtering(): void
    {
        Sanctum::actingAs($this->admin);

        Payment::create([
            'payment_number' => 'PAY-2026-0001',
            'type' => 'received',
            'party_type' => 'customer',
            'party_id' => $this->customer->id,
            'amount' => 12000.00,
            'payment_date' => '2026-09-05',
            'payment_method' => 'bank_transfer',
            'status' => 'cleared',
            'bank_account_id' => $this->bankAccount->id,
            'created_by' => $this->admin->id,
        ]);

        Payment::create([
            'payment_number' => 'PAY-2026-0002',
            'type' => 'made',
            'party_type' => 'vendor',
            'party_id' => $this->vendor->id,
            'amount' => 7000.00,
            'payment_date' => '2026-09-05',
            'payment_method' => 'upi',
            'status' => 'cleared',
            'bank_account_id' => $this->bankAccount->id,
            'created_by' => $this->admin->id,
        ]);

        $res = $this->getJson('/api/payments');
        $res->assertOk();
        $data = $res->json('data');

        $this->assertCount(2, $data);
        $pay1 = collect($data)->firstWhere('payment_number', 'PAY-2026-0001');
        $this->assertNotNull($pay1);
        $this->assertSame('Urban Spaces Pvt Ltd', $pay1['customer']['name'] ?? $pay1['party']['name']);
        $this->assertSame('customer_receipt', $pay1['payment_type']);

        // Test filtering by customer_receipt
        $filteredRes = $this->getJson('/api/payments?type=customer_receipt');
        $filteredRes->assertOk();
        $this->assertCount(1, $filteredRes->json('data'));
        $this->assertSame('PAY-2026-0001', $filteredRes->json('data.0.payment_number'));
    }
}
