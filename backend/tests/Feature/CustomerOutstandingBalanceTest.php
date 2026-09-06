<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerOutstandingBalanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin_balance_test@example.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
        ]);
    }

    public function test_customer_outstanding_balance_calculation(): void
    {
        $customer = Customer::create([
            'name' => 'Acme Corporation',
            'code' => 'CUST-001',
            'contact_person' => 'Jane Doe',
            'email' => 'jane@acme.test',
            'phone' => '+91 98000 00001',
            'created_by' => $this->admin->id,
        ]);

        // Invoices with various statuses
        // 1. approved -> counts
        Invoice::create([
            'invoice_number' => 'INV-001',
            'type' => 'receivable',
            'status' => 'approved',
            'party_type' => 'customer',
            'party_id' => $customer->id,
            'invoice_date' => '2026-09-01',
            'due_date' => '2026-10-01',
            'subtotal' => 1000.00,
            'tax_amount' => 180.00,
            'total_amount' => 1180.00,
            'balance_due' => 1180.00,
            'created_by' => $this->admin->id,
        ]);

        // 2. partially_paid -> counts
        Invoice::create([
            'invoice_number' => 'INV-002',
            'type' => 'receivable',
            'status' => 'partially_paid',
            'party_type' => 'customer',
            'party_id' => $customer->id,
            'invoice_date' => '2026-09-02',
            'due_date' => '2026-10-02',
            'subtotal' => 2000.00,
            'tax_amount' => 360.00,
            'total_amount' => 2360.00,
            'balance_due' => 1360.00,
            'created_by' => $this->admin->id,
        ]);

        // 3. overdue -> counts
        Invoice::create([
            'invoice_number' => 'INV-003',
            'type' => 'receivable',
            'status' => 'overdue',
            'party_type' => 'customer',
            'party_id' => $customer->id,
            'invoice_date' => '2026-08-01',
            'due_date' => '2026-08-31',
            'subtotal' => 500.00,
            'tax_amount' => 90.00,
            'total_amount' => 590.00,
            'balance_due' => 590.00,
            'created_by' => $this->admin->id,
        ]);

        // 4. paid -> excluded
        Invoice::create([
            'invoice_number' => 'INV-004',
            'type' => 'receivable',
            'status' => 'paid',
            'party_type' => 'customer',
            'party_id' => $customer->id,
            'invoice_date' => '2026-08-01',
            'due_date' => '2026-08-31',
            'subtotal' => 500.00,
            'tax_amount' => 90.00,
            'total_amount' => 590.00,
            'balance_due' => 0.00,
            'created_by' => $this->admin->id,
        ]);

        // 5. draft -> excluded
        Invoice::create([
            'invoice_number' => 'INV-005',
            'type' => 'receivable',
            'status' => 'draft',
            'party_type' => 'customer',
            'party_id' => $customer->id,
            'invoice_date' => '2026-09-05',
            'due_date' => '2026-10-05',
            'subtotal' => 3000.00,
            'tax_amount' => 540.00,
            'total_amount' => 3540.00,
            'balance_due' => 3540.00,
            'created_by' => $this->admin->id,
        ]);

        // Expected sum: 1180 + 1360 + 590 = 3130.00

        // Test API index endpoint
        $response = $this->actingAs($this->admin)->getJson('/api/customers');
        $response->assertOk();
        $data = $response->json('data');
        $this->assertNotEmpty($data);
        $customerItem = collect($data)->firstWhere('id', $customer->id);
        $this->assertNotNull($customerItem);
        $this->assertEquals(3130.00, (float) $customerItem['outstanding_balance']);

        // Test API show endpoint
        $showResponse = $this->actingAs($this->admin)->getJson("/api/customers/{$customer->id}");
        $showResponse->assertOk();
        $this->assertEquals(3130.00, (float) $showResponse->json('data.outstanding_balance'));
    }

    public function test_customer_zero_balance_when_no_invoices(): void
    {
        $customer = Customer::create([
            'name' => 'Empty Customer',
            'code' => 'CUST-002',
            'contact_person' => 'Bob Smith',
            'email' => 'bob@empty.test',
            'phone' => '+91 98000 00002',
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson("/api/customers/{$customer->id}");
        $response->assertOk();
        $this->assertEquals(0.00, (float) $response->json('data.outstanding_balance'));
    }

    public function test_vendor_outstanding_balance_calculation(): void
    {
        $vendor = Vendor::create([
            'name' => 'Timber Suppliers Ltd',
            'code' => 'VEND-001',
            'contact_person' => 'Alice Green',
            'email' => 'alice@timber.test',
            'phone' => '+91 98000 00003',
            'created_by' => $this->admin->id,
        ]);

        Invoice::create([
            'invoice_number' => 'BILL-001',
            'type' => 'payable',
            'status' => 'approved',
            'party_type' => 'vendor',
            'party_id' => $vendor->id,
            'invoice_date' => '2026-09-01',
            'due_date' => '2026-10-01',
            'subtotal' => 5000.00,
            'tax_amount' => 900.00,
            'total_amount' => 5900.00,
            'balance_due' => 5900.00,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/vendors');
        $response->assertOk();
        $vendorItem = collect($response->json('data'))->firstWhere('id', $vendor->id);
        $this->assertNotNull($vendorItem);
        $this->assertEquals(5900.00, (float) $vendorItem['outstanding_balance']);

        $showResponse = $this->actingAs($this->admin)->getJson("/api/vendors/{$vendor->id}");
        $showResponse->assertOk();
        $this->assertEquals(5900.00, (float) $showResponse->json('data.outstanding_balance'));
    }
}

