<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomPurchaseOrderTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Vendor $vendor;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin_custom_po@example.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
        ]);

        $this->vendor = Vendor::create([
            'code' => 'VEN-TEST-01',
            'name' => 'Azure Furniture Crafts',
            'email' => 'azure_po@example.com',
            'phone' => '9876543210',
            'state' => 'Maharashtra (27)',
            'gstin' => '27ABCDE1234F1Z5',
            'status' => 'active',
        ]);

        $this->product = Product::create([
            'sku' => 'UF-TEAK-LOG',
            'name' => 'Burmese Teak Hardwood Timber',
            'type' => 'goods',
            'unit_price' => 24000.00,
            'cost_price' => 18000.00,
            'gst_rate' => 18.00,
            'current_stock' => 50,
            'created_by' => $this->admin->id,
        ]);
    }

    public function test_can_create_custom_purchase_order_from_3d_workshop(): void
    {
        $customDetails = [
            'is_custom' => true,
            'model' => 'Executive Teak Desk',
            'category' => 'Tables & Desks',
            'wood' => 'Burmese Teak',
            'wood_species' => 'Tectona grandis',
            'wood_color' => '#9c6634',
            'upholstery' => 'Full-Grain Cognac Leather',
            'upholstery_material' => 'Top-tier Napa Leather',
            'dimensions' => [
                'width' => 180,
                'depth' => 85,
                'height' => 76,
                'unit' => 'cm',
            ],
            'raw_cost' => 24000,
            'estimated_price' => 42000,
            'tags' => ['3D Studio', 'Executive Teak Desk', 'Burmese Teak', 'Cognac Leather', '180x85x76cm'],
        ];

        $payload = [
            'vendor_id' => $this->vendor->id,
            'order_date' => now()->toDateString(),
            'expected_delivery_date' => now()->addDays(14)->toDateString(),
            'notes' => '[3D Workshop Custom Order] Model: Executive Teak Desk | Wood: Burmese Teak | Upholstery: Full-Grain Cognac Leather | Dimensions: 180x85x76cm',
            'is_custom' => true,
            'customization_details' => $customDetails,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 1,
                    'unit_price' => 24000.00,
                    'tax_rate' => 18.00,
                    'description' => 'Burmese Teak Timber for Executive Teak Desk (180x85x76cm)',
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/purchase-orders', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('data.is_custom', true);
        $response->assertJsonPath('data.customization_details.model', 'Executive Teak Desk');
        $response->assertJsonPath('data.customization_details.wood', 'Burmese Teak');

        $this->assertDatabaseHas('purchase_orders', [
            'vendor_id' => $this->vendor->id,
            'is_custom' => 1,
        ]);

        $created = PurchaseOrder::where('vendor_id', $this->vendor->id)->first();
        $this->assertNotNull($created);
        $this->assertTrue($created->is_custom);
        $this->assertEquals('Burmese Teak', $created->customization_details['wood']);
        $this->assertContains('Burmese Teak', $created->custom_tags);
    }

    public function test_can_filter_purchase_orders_by_is_custom_and_wood(): void
    {
        // Create 1 standard order
        $this->actingAs($this->admin)->postJson('/api/purchase-orders', [
            'vendor_id' => $this->vendor->id,
            'order_date' => now()->toDateString(),
            'is_custom' => false,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                    'unit_price' => 1000.00,
                    'tax_rate' => 18.00,
                ],
            ],
        ])->assertStatus(201);

        // Create 1 custom order
        $this->actingAs($this->admin)->postJson('/api/purchase-orders', [
            'vendor_id' => $this->vendor->id,
            'order_date' => now()->toDateString(),
            'is_custom' => true,
            'customization_details' => [
                'model' => 'Executive Teak Desk',
                'wood' => 'Burmese Teak',
            ],
            'notes' => '[3D Workshop Custom Order] Wood: Burmese Teak',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 1,
                    'unit_price' => 24000.00,
                    'tax_rate' => 18.00,
                ],
            ],
        ])->assertStatus(201);

        // Query only custom orders
        $resCustom = $this->actingAs($this->admin)->getJson('/api/purchase-orders?is_custom=true');
        $resCustom->assertStatus(200);
        $customOrders = $resCustom->json('data');
        $this->assertCount(1, $customOrders);
        $this->assertTrue($customOrders[0]['is_custom']);

        // Query by custom wood filter
        $resWood = $this->actingAs($this->admin)->getJson('/api/purchase-orders?custom_wood=Teak');
        $resWood->assertStatus(200);
        $woodOrders = $resWood->json('data');
        $this->assertCount(1, $woodOrders);
    }
}
