<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\Product;
use App\Models\User;
use App\Security\Rbac;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceAccessControlTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $accountant;
    protected User $standardUser;
    protected User $customerUser;
    protected Customer $customer;
    protected Invoice $adminInvoice;
    protected Invoice $accountantInvoice;
    protected Invoice $userInvoice;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@urbanfurniture.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
        ]);

        $this->accountant = User::create([
            'name' => 'Accountant User',
            'email' => 'accountant@urbanfurniture.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ACCOUNTANT,
        ]);

        $this->standardUser = User::create([
            'name' => 'Staff User',
            'email' => 'staff@urbanfurniture.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_USER,
            'is_customer' => false,
            'is_vendor' => false,
        ]);

        $this->customerUser = User::create([
            'name' => 'Customer User',
            'email' => 'customer@client.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_CUSTOMER,
            'is_customer' => true,
            'is_vendor' => false,
        ]);

        $this->customer = Customer::create([
            'name' => 'Azure Interiors',
            'code' => 'CUST-AZURE-01',
            'email' => 'contact@azure.test',
            'phone' => '+91 98000 11111',
            'city' => 'Pune',
            'state' => 'Maharashtra (27)',
            'gstin' => '27AABCA1234F1Z5',
            'created_by' => $this->admin->id,
        ]);

        $product = Product::create([
            'sku' => 'CHAIR-EXEC-01',
            'name' => 'Executive Office Chair',
            'type' => 'goods',
            'unit_price' => 12000.00,
            'gst_rate' => 18.00,
            'hsn_code' => '94018000',
            'is_active' => true,
            'current_stock' => 50,
        ]);

        // 1. Invoice created by Admin
        $this->adminInvoice = Invoice::create([
            'invoice_number' => 'INV-2026-0001',
            'type' => 'receivable',
            'status' => 'approved',
            'party_type' => 'customer',
            'party_id' => $this->customer->id,
            'invoice_date' => '2026-09-01',
            'due_date' => '2026-10-01',
            'subtotal' => 24000.00,
            'tax_amount' => 4320.00,
            'cgst_amount' => 2160.00,
            'sgst_amount' => 2160.00,
            'igst_amount' => 0.00,
            'total_amount' => 28320.00,
            'amount_paid' => 0.00,
            'balance_due' => 28320.00,
            'created_by' => $this->admin->id,
        ]);

        $account = \App\Models\Account::create([
            'code' => '4100',
            'name' => 'Sales Revenue',
            'type' => 'revenue',
            'sub_type' => 'operating_revenue',
            'normal_balance' => 'credit',
            'opening_balance' => 0.00,
            'current_balance' => 0.00,
            'is_active' => true,
            'created_by' => $this->admin->id,
        ]);

        InvoiceLineItem::create([
            'invoice_id' => $this->adminInvoice->id,
            'product_id' => $product->id,
            'account_id' => $account->id,
            'description' => 'Executive Office Chair',
            'hsn_code' => '94018000',
            'quantity' => 2,
            'unit_price' => 12000.00,
            'tax_rate' => 18.00,
            'tax_amount' => 4320.00,
            'line_total' => 28320.00,
        ]);

        // 2. Invoice created by Accountant
        $this->accountantInvoice = Invoice::create([
            'invoice_number' => 'INV-2026-0002',
            'type' => 'receivable',
            'status' => 'approved',
            'party_type' => 'customer',
            'party_id' => $this->customer->id,
            'invoice_date' => '2026-09-02',
            'due_date' => '2026-10-02',
            'subtotal' => 12000.00,
            'tax_amount' => 2160.00,
            'cgst_amount' => 1080.00,
            'sgst_amount' => 1080.00,
            'igst_amount' => 0.00,
            'total_amount' => 14160.00,
            'amount_paid' => 0.00,
            'balance_due' => 14160.00,
            'created_by' => $this->accountant->id,
        ]);

        // 3. Invoice created by Standard User
        $this->userInvoice = Invoice::create([
            'invoice_number' => 'INV-2026-0003',
            'type' => 'receivable',
            'status' => 'draft',
            'party_type' => 'customer',
            'party_id' => $this->customer->id,
            'invoice_date' => '2026-09-03',
            'due_date' => '2026-10-03',
            'subtotal' => 6000.00,
            'tax_amount' => 1080.00,
            'total_amount' => 7080.00,
            'amount_paid' => 0.00,
            'balance_due' => 7080.00,
            'created_by' => $this->standardUser->id,
        ]);
    }

    public function test_standard_user_has_invoices_view_any_permission(): void
    {
        $permissions = $this->standardUser->getPermissions();
        $this->assertContains(Rbac::PERMISSION_INVOICES_VIEW_ANY, $permissions);
    }

    public function test_standard_user_can_list_all_invoices(): void
    {
        $response = $this->actingAs($this->standardUser)->getJson('/api/invoices');

        $response->assertStatus(200);
        $invoiceNumbers = collect($response->json('data'))->pluck('invoice_number')->all();

        // Standard user sees all invoices, just like admin and accountant
        $this->assertContains('INV-2026-0001', $invoiceNumbers);
        $this->assertContains('INV-2026-0002', $invoiceNumbers);
        $this->assertContains('INV-2026-0003', $invoiceNumbers);
    }

    public function test_standard_user_can_view_invoice_created_by_admin(): void
    {
        $response = $this->actingAs($this->standardUser)->getJson("/api/invoices/{$this->adminInvoice->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.invoice_number', 'INV-2026-0001')
            ->assertJsonPath('data.party.name', 'Azure Interiors');

        // Verify items are loaded (needed for PDF printing and downloading)
        $this->assertNotEmpty($response->json('data.items'));
    }

    public function test_standard_user_can_view_invoice_created_by_accountant(): void
    {
        $response = $this->actingAs($this->standardUser)->getJson("/api/invoices/{$this->accountantInvoice->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.invoice_number', 'INV-2026-0002');
    }

    public function test_accountant_can_list_and_view_all_invoices(): void
    {
        $listResponse = $this->actingAs($this->accountant)->getJson('/api/invoices');
        $listResponse->assertStatus(200);

        $invoiceNumbers = collect($listResponse->json('data'))->pluck('invoice_number')->all();
        $this->assertContains('INV-2026-0001', $invoiceNumbers);
        $this->assertContains('INV-2026-0002', $invoiceNumbers);
        $this->assertContains('INV-2026-0003', $invoiceNumbers);

        $showResponse = $this->actingAs($this->accountant)->getJson("/api/invoices/{$this->userInvoice->id}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('data.invoice_number', 'INV-2026-0003');
    }

    public function test_admin_can_list_and_view_all_invoices(): void
    {
        $listResponse = $this->actingAs($this->admin)->getJson('/api/invoices');
        $listResponse->assertStatus(200);

        $showResponse = $this->actingAs($this->admin)->getJson("/api/invoices/{$this->adminInvoice->id}");
        $showResponse->assertStatus(200);
    }

    public function test_customer_user_is_scoped_to_own_records(): void
    {
        // Customer has not created any invoices, so list should be empty
        $response = $this->actingAs($this->customerUser)->getJson('/api/invoices');
        $response->assertStatus(200);

        $invoiceNumbers = collect($response->json('data'))->pluck('invoice_number')->all();
        $this->assertNotContains('INV-2026-0001', $invoiceNumbers);
        $this->assertNotContains('INV-2026-0002', $invoiceNumbers);
    }
}
