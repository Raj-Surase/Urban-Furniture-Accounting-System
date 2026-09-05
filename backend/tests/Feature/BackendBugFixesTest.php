<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Customer;
use App\Models\InventoryMovement;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\User;
use App\Models\Vendor;
use App\Services\SequenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BackendBugFixesTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected array $accounts = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@urbanfurniture.test',
            'password' => bcrypt('secret123'),
            'role' => User::ROLE_ADMIN,
        ]);

        // Seed essential accounts for testing double-entry balancing
        $accDefs = [
            ['code' => '1110', 'name' => 'Cash & Bank', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit'],
            ['code' => '1120', 'name' => 'Accounts Receivable', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit'],
            ['code' => '1130', 'name' => 'Inventory', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit'],
            ['code' => '1140', 'name' => 'GRNI Clearing', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'credit'],
            ['code' => '2110', 'name' => 'Accounts Payable', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal_balance' => 'credit'],
            ['code' => '2121', 'name' => 'CGST Output', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal_balance' => 'credit'],
            ['code' => '2122', 'name' => 'SGST Output', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal_balance' => 'credit'],
            ['code' => '2123', 'name' => 'IGST Output', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal_balance' => 'credit'],
            ['code' => '2131', 'name' => 'CGST Input', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit'],
            ['code' => '2132', 'name' => 'SGST Input', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit'],
            ['code' => '2133', 'name' => 'IGST Input', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit'],
            ['code' => '4100', 'name' => 'Sales Revenue', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'normal_balance' => 'credit'],
            ['code' => '4300', 'name' => 'Discount Allowed', 'type' => 'revenue', 'sub_type' => 'contra_revenue', 'normal_balance' => 'debit'],
            ['code' => '5100', 'name' => 'COGS', 'type' => 'expense', 'sub_type' => 'direct_expense', 'normal_balance' => 'debit'],
            ['code' => '5300', 'name' => 'Inventory Adjustment', 'type' => 'expense', 'sub_type' => 'operating_expense', 'normal_balance' => 'debit'],
        ];

        foreach ($accDefs as $acc) {
            $this->accounts[$acc['code']] = Account::create([
                'code' => $acc['code'],
                'name' => $acc['name'],
                'type' => $acc['type'],
                'sub_type' => $acc['sub_type'],
                'normal_balance' => $acc['normal_balance'],
                'opening_balance' => 10000.00,
                'current_balance' => 10000.00,
                'is_active' => true,
                'created_by' => $this->admin->id,
            ]);
        }
    }

    public function test_sequence_service_generates_sequential_numbers_for_all_types(): void
    {
        $year = 2026;

        $je1 = SequenceService::generate('JE', $year, 4);
        $je2 = SequenceService::generate('JE', $year, 4);
        $this->assertSame('JE-2026-0001', $je1);
        $this->assertSame('JE-2026-0002', $je2);

        $inv1 = SequenceService::generate('INV', $year, 4);
        $this->assertSame('INV-2026-0001', $inv1);

        $bill1 = SequenceService::generate('BILL', $year, 4);
        $this->assertSame('BILL-2026-0001', $bill1);

        $po1 = SequenceService::generate('PO', $year, 4);
        $this->assertSame('PO-2026-0001', $po1);

        $so1 = SequenceService::generate('SO', $year, 4);
        $this->assertSame('SO-2026-0001', $so1);

        $pay1 = SequenceService::generate('PAY', $year, 4);
        $this->assertSame('PAY-2026-0001', $pay1);

        $cust1 = SequenceService::generate('CUST', null, 3);
        $this->assertSame('CUST-001', $cust1);

        $ven1 = SequenceService::generate('VEN', null, 3);
        $this->assertSame('VEN-001', $ven1);
    }

    public function test_dashboard_summary_is_cached_and_does_not_recalculate_account_balance(): void
    {
        Sanctum::actingAs($this->admin);
        Cache::flush();

        $response1 = $this->getJson('/api/dashboard/summary?time_range=month');
        $response1->assertOk();
        $this->assertArrayHasKey('kpis', $response1->json());

        // Verify cache key exists
        $cacheKey = "dashboard_summary_{$this->admin->id}_{$this->admin->role}_month";
        $this->assertTrue(Cache::has($cacheKey));

        // Subsequent response should return cached payload
        $response2 = $this->getJson('/api/dashboard/summary?time_range=month');
        $response2->assertOk();
        $this->assertSame($response1->json(), $response2->json());
    }

    public function test_dashboard_recent_transactions_supports_pagination(): void
    {
        Sanctum::actingAs($this->admin);

        $customer = Customer::create([
            'code' => 'CUST-099',
            'name' => 'Metro Park Infra',
            'created_by' => $this->admin->id,
        ]);

        for ($i = 1; $i <= 5; $i++) {
            Invoice::create([
                'invoice_number' => "INV-2026-00{$i}9",
                'type' => 'receivable',
                'status' => 'approved',
                'party_type' => 'customer',
                'party_id' => $customer->id,
                'invoice_date' => '2026-09-05',
                'due_date' => '2026-10-05',
                'subtotal' => 1000.00 * $i,
                'discount_amount' => 0.00,
                'tax_amount' => 180.00 * $i,
                'total_amount' => 1180.00 * $i,
                'balance_due' => 1180.00 * $i,
                'created_by' => $this->admin->id,
            ]);
        }

        $res = $this->getJson('/api/dashboard/transactions?page=1&per_page=2');
        $res->assertOk();
        $json = $res->json();

        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('total', $json);
        $this->assertArrayHasKey('current_page', $json);
        $this->assertArrayHasKey('per_page', $json);
        $this->assertSame(1, $json['current_page']);
        $this->assertSame(2, $json['per_page']);
        $this->assertCount(2, $json['data']);
        $this->assertGreaterThanOrEqual(5, $json['total']);
    }

    public function test_customer_invoice_approval_creates_strictly_balanced_journal_entry(): void
    {
        Sanctum::actingAs($this->admin);

        $customer = Customer::create([
            'code' => 'CUST-010',
            'name' => 'City Bench Corporation',
            'created_by' => $this->admin->id,
        ]);

        $postData = [
            'type' => 'receivable',
            'party_type' => 'customer',
            'party_id' => $customer->id,
            'invoice_date' => '2026-09-05',
            'due_date' => '2026-10-05',
            'items' => [
                [
                    'description' => 'Urban Street Bench',
                    'quantity' => 2,
                    'unit_price' => 5000.00,
                    'discount_percent' => 10.0, // 1,000 discount
                    'tax_rate' => 18.0,         // CGST 405 + SGST 405 = 810 on 9,000
                ],
            ],
        ];

        $createRes = $this->postJson('/api/invoices', $postData);
        $createRes->assertCreated();
        $invoiceId = $createRes->json('data.id');

        $approveRes = $this->postJson("/api/invoices/{$invoiceId}/approve");
        $approveRes->assertOk();

        $jeData = $approveRes->json('journal_entry');
        $this->assertNotNull($jeData);
        $this->assertStringStartsWith('JE-', $jeData['entry_number']);

        $je = \App\Models\JournalEntry::find($jeData['id']);
        $this->assertTrue($je->isBalanced(), "Journal Entry {$je->entry_number} is unbalanced: Dr {$je->total_debit} != Cr {$je->total_credit}");
        $this->assertEqualsWithDelta($je->total_debit, $je->total_credit, 0.01);
    }

    public function test_vendor_bill_approval_with_discount_creates_strictly_balanced_journal_entry(): void
    {
        Sanctum::actingAs($this->admin);

        $vendor = Vendor::create([
            'code' => 'VEN-010',
            'name' => 'Timber Woods Suppliers',
            'created_by' => $this->admin->id,
        ]);

        $postData = [
            'type' => 'payable',
            'party_type' => 'vendor',
            'party_id' => $vendor->id,
            'invoice_date' => '2026-09-05',
            'due_date' => '2026-10-05',
            'items' => [
                [
                    'description' => 'Oak Timber Planks',
                    'quantity' => 10,
                    'unit_price' => 1000.00,
                    'discount_percent' => 10.0, // Subtotal: 10,000, Disc: 1,000, Taxable: 9,000
                    'tax_rate' => 18.0,         // Tax: 1,620 -> Total: 10,620
                ],
            ],
        ];

        $createRes = $this->postJson('/api/invoices', $postData);
        $createRes->assertCreated();
        $invoiceId = $createRes->json('data.id');

        $approveRes = $this->postJson("/api/invoices/{$invoiceId}/approve");
        $approveRes->assertOk();

        $jeData = $approveRes->json('journal_entry');
        $this->assertNotNull($jeData);

        $je = \App\Models\JournalEntry::find($jeData['id']);
        $this->assertTrue($je->isBalanced(), "Vendor bill JE {$je->entry_number} is unbalanced: Dr {$je->total_debit} != Cr {$je->total_credit}");
        $this->assertEqualsWithDelta($je->total_debit, $je->total_credit, 0.01);
    }

    public function test_purchase_order_receive_creates_inventory_movement_and_updates_stock(): void
    {
        Sanctum::actingAs($this->admin);

        $vendor = Vendor::create([
            'code' => 'VEN-020',
            'name' => 'Steel Works Ltd',
            'created_by' => $this->admin->id,
        ]);

        $product = Product::create([
            'sku' => 'UF-BENCH-TEST',
            'name' => 'Steel Bench',
            'hsn_code' => '94018000',
            'unit_price' => 4500.00,
            'cost_price' => 3000.00,
            'current_stock' => 10.00,
            'created_by' => $this->admin->id,
        ]);

        $po = PurchaseOrder::create([
            'po_number' => 'PO-2026-9999',
            'vendor_id' => $vendor->id,
            'status' => 'approved',
            'order_date' => '2026-09-05',
            'subtotal' => 15000.00,
            'total_amount' => 17700.00,
            'created_by' => $this->admin->id,
        ]);

        $poItem = PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'product_id' => $product->id,
            'description' => 'Steel Bench Parts',
            'quantity_ordered' => 5,
            'quantity_received' => 0,
            'unit_price' => 3000.00,
            'tax_rate' => 18.00,
            'tax_amount' => 2700.00,
            'line_total' => 17700.00,
        ]);

        // Verify model quantity accessor
        $this->assertEquals(5.0, $poItem->quantity);

        // Receive with omitted items array (auto-receives all pending)
        $receiveRes = $this->postJson("/api/purchase-orders/{$po->id}/receive", [
            'delivery_date' => '2026-09-05',
        ]);
        $receiveRes->assertOk();

        // Product stock should have increased from 10 to 15
        $product->refresh();
        $this->assertEquals(15.00, (float) $product->current_stock);

        // InventoryMovement record must exist
        $movement = InventoryMovement::where('product_id', $product->id)
            ->where('reference_type', PurchaseOrder::class)
            ->where('reference_id', $po->id)
            ->first();

        $this->assertNotNull($movement, "InventoryMovement record was not created on PO receive");
        $this->assertSame('purchase', $movement->type);
        $this->assertEquals(5.00, (float) $movement->quantity);
        $this->assertEquals(3000.00, (float) $movement->unit_cost);
        $this->assertEquals(15000.00, (float) $movement->total_value);
    }

    public function test_sales_order_deliver_creates_inventory_movement_and_updates_stock(): void
    {
        Sanctum::actingAs($this->admin);

        $customer = Customer::create([
            'code' => 'CUST-020',
            'name' => 'Garden Municipal Agency',
            'created_by' => $this->admin->id,
        ]);

        $product = Product::create([
            'sku' => 'UF-CHAIR-TEST',
            'name' => 'Park Chair',
            'hsn_code' => '94018000',
            'unit_price' => 2500.00,
            'cost_price' => 1500.00,
            'current_stock' => 20.00,
            'created_by' => $this->admin->id,
        ]);

        $so = SalesOrder::create([
            'so_number' => 'SO-2026-9999',
            'customer_id' => $customer->id,
            'status' => 'approved',
            'order_date' => '2026-09-05',
            'subtotal' => 10000.00,
            'total_amount' => 11800.00,
            'created_by' => $this->admin->id,
        ]);

        $soItem = SalesOrderItem::create([
            'sales_order_id' => $so->id,
            'product_id' => $product->id,
            'description' => 'Park Chair Units',
            'quantity_ordered' => 4,
            'quantity_delivered' => 0,
            'unit_price' => 2500.00,
            'tax_rate' => 18.00,
            'tax_amount' => 1800.00,
            'line_total' => 11800.00,
        ]);

        // Verify model quantity accessor
        $this->assertEquals(4.0, $soItem->quantity);

        // Deliver with omitted items array (auto-delivers all pending)
        $deliverRes = $this->postJson("/api/sales-orders/{$so->id}/deliver", [
            'delivery_date' => '2026-09-05',
        ]);
        $deliverRes->assertOk();

        // Product stock should decrease from 20 to 16
        $product->refresh();
        $this->assertEquals(16.00, (float) $product->current_stock);

        // InventoryMovement record must exist with negative quantity
        $movement = InventoryMovement::where('product_id', $product->id)
            ->where('reference_type', SalesOrder::class)
            ->where('reference_id', $so->id)
            ->first();

        $this->assertNotNull($movement, "InventoryMovement record was not created on SO deliver");
        $this->assertSame('sale', $movement->type);
        $this->assertEquals(-4.00, (float) $movement->quantity);
        $this->assertEquals(1500.00, (float) $movement->unit_cost);
        $this->assertEquals(-6000.00, (float) $movement->total_value);
    }
}
