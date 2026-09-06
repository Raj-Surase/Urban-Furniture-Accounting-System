<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin_contacts@example.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
        ]);
    }

    public function test_can_create_customer_contact_from_contacts_page_form(): void
    {
        $payload = [
            'name' => 'Brigade Educational Foundation (Indore #107)',
            'email' => 'contact@cust-0107.rigade.com',
            'phone' => '+91 99221 30049',
            'contact_type' => 'customer',
            'street' => 'Tower D, Level 18, Indore Commercial Zone',
            'city' => 'Indore',
            'state' => 'Madhya Pradesh',
            'country' => 'India',
            'pincode' => '452001',
            'gstin' => '23AAACU1107D1Z9',
            'pan' => '',
            'image' => '',
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/contacts', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Contact saved successfully',
            ]);

        $this->assertDatabaseHas('customers', [
            'name' => 'Brigade Educational Foundation (Indore #107)',
            'email' => 'contact@cust-0107.rigade.com',
            'phone' => '+91 99221 30049',
            'billing_address' => 'Tower D, Level 18, Indore Commercial Zone',
            'city' => 'Indore',
            'state' => 'Madhya Pradesh',
            'country' => 'India',
            'pincode' => '452001',
            'gstin' => '23AAACU1107D1Z9',
        ]);

        $customer = Customer::where('email', 'contact@cust-0107.rigade.com')->first();
        $this->assertNotNull($customer);
        $this->assertNotEmpty($customer->code);
        $this->assertStringStartsWith('CUST-', $customer->code);
    }

    public function test_can_create_vendor_contact_from_contacts_page_form(): void
    {
        $payload = [
            'name' => 'Apex Timber Suppliers',
            'email' => 'sales@apextimber.com',
            'phone' => '+91 98220 11223',
            'contact_type' => 'vendor',
            'street' => 'Industrial Area Phase II',
            'city' => 'Nagpur',
            'state' => 'Maharashtra',
            'country' => 'India',
            'pincode' => '440001',
            'gstin' => '27AAACA1234A1Z5',
            'pan' => '',
            'image' => '',
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/contacts', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Contact saved successfully',
            ]);

        $this->assertDatabaseHas('vendors', [
            'name' => 'Apex Timber Suppliers',
            'email' => 'sales@apextimber.com',
            'phone' => '+91 98220 11223',
            'address' => 'Industrial Area Phase II',
            'city' => 'Nagpur',
            'state' => 'Maharashtra',
            'country' => 'India',
            'pincode' => '440001',
            'gstin' => '27AAACA1234A1Z5',
            'pan' => 'AAACA1234A',
        ]);

        $vendor = Vendor::where('email', 'sales@apextimber.com')->first();
        $this->assertNotNull($vendor);
        $this->assertNotEmpty($vendor->code);
        $this->assertStringStartsWith('VEN-', $vendor->code);
    }

    public function test_can_update_existing_contact(): void
    {
        $customer = Customer::create([
            'name' => 'Original Customer Name',
            'email' => 'orig@example.com',
            'phone' => '+91 90000 00000',
            'city' => 'Mumbai',
            'state' => 'Maharashtra',
        ]);

        $originalCode = $customer->code;

        $updatePayload = [
            'id' => $customer->id,
            'name' => 'Updated Customer Name',
            'email' => 'orig@example.com',
            'phone' => '+91 91111 11111',
            'contact_type' => 'customer',
            'street' => 'New Street 123',
            'city' => 'Pune',
            'state' => 'Maharashtra',
            'country' => 'India',
            'pincode' => '411001',
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/contacts', $updatePayload);

        $response->assertStatus(201);

        $customer->refresh();
        $this->assertEquals('Updated Customer Name', $customer->name);
        $this->assertEquals('+91 91111 11111', $customer->phone);
        $this->assertEquals('Pune', $customer->city);
        $this->assertEquals('411001', $customer->pincode);
        $this->assertEquals('New Street 123', $customer->billing_address);
        // Code should remain unchanged on update
        $this->assertEquals($originalCode, $customer->code);
    }

    public function test_customer_and_vendor_auto_generate_code_when_unspecified(): void
    {
        $customer = Customer::create([
            'name' => 'Standalone Customer',
            'email' => 'cust_standalone@example.com',
        ]);

        $this->assertNotEmpty($customer->code);
        $this->assertStringStartsWith('CUST-', $customer->code);

        $vendor = Vendor::create([
            'name' => 'Standalone Vendor',
            'email' => 'vend_standalone@example.com',
        ]);

        $this->assertNotEmpty($vendor->code);
        $this->assertStringStartsWith('VEN-', $vendor->code);
    }

    public function test_contacts_index_returns_unified_records(): void
    {
        Customer::create([
            'name' => 'Acme Corporation',
            'email' => 'acme@example.com',
            'city' => 'Bengaluru',
            'state' => 'Karnataka',
            'pincode' => '560001',
        ]);

        Vendor::create([
            'name' => 'Zenith Supplies',
            'email' => 'zenith@example.com',
            'city' => 'Hyderabad',
            'state' => 'Telangana',
            'pincode' => '500001',
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/contacts');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertCount(2, $data);

        $names = array_column($data, 'name');
        $this->assertContains('Acme Corporation', $names);
        $this->assertContains('Zenith Supplies', $names);

        $acme = collect($data)->firstWhere('name', 'Acme Corporation');
        $this->assertEquals('customer', $acme['contact_type']);
        $this->assertEquals('560001', $acme['pincode']);
        $this->assertNotEmpty($acme['code']);
    }
}

