<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use App\Models\Vendor;
use App\Security\Rbac;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerVendorAccessControlTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $standardUser;
    protected User $customerUser;
    protected User $vendorUser;
    protected User $dualUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin_test@example.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
        ]);

        $this->standardUser = User::create([
            'name' => 'Standard User',
            'email' => 'standard_test@example.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_USER,
            'is_customer' => false,
            'is_vendor' => false,
        ]);

        $this->customerUser = User::create([
            'name' => 'Customer User',
            'email' => 'customer_test@example.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_CUSTOMER,
            'is_customer' => true,
            'is_vendor' => false,
        ]);

        $this->vendorUser = User::create([
            'name' => 'Vendor User',
            'email' => 'vendor_test@example.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_VENDOR,
            'is_customer' => false,
            'is_vendor' => true,
        ]);

        $this->dualUser = User::create([
            'name' => 'Dual Partner User',
            'email' => 'dual_test@example.com',
            'password' => bcrypt('password'),
            'role' => User::ROLE_USER,
            'is_customer' => true,
            'is_vendor' => true,
        ]);
    }

    public function test_standard_user_can_list_and_create_customers(): void
    {
        // 1. List customers (the exact operation that produced 403 previously)
        $listResponse = $this->actingAs($this->standardUser)->getJson('/api/customers');
        $listResponse->assertStatus(200);

        // 2. Create a customer
        $createResponse = $this->actingAs($this->standardUser)->postJson('/api/customers', [
            'name' => 'Acme Corporation',
            'code' => 'CUST-ACME-01',
            'contact_person' => 'Jane Doe',
            'email' => 'jane@acme.test',
            'phone' => '+91 98000 00001',
            'city' => 'Mumbai',
            'state' => 'Maharashtra',
        ]);
        $createResponse->assertStatus(201)
            ->assertJsonPath('data.name', 'Acme Corporation');

        $customerId = $createResponse->json('data.id');

        // 3. Show customer
        $showResponse = $this->actingAs($this->standardUser)->getJson("/api/customers/{$customerId}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Acme Corporation');

        // 4. Update customer
        $updateResponse = $this->actingAs($this->standardUser)->putJson("/api/customers/{$customerId}", [
            'name' => 'Acme Corporation Global',
        ]);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Acme Corporation Global');

        // 5. Delete customer (should be restricted to admin only)
        $deleteResponse = $this->actingAs($this->standardUser)->deleteJson("/api/customers/{$customerId}");
        $deleteResponse->assertStatus(403);
    }

    public function test_standard_user_can_list_and_create_vendors(): void
    {
        // 1. List vendors
        $listResponse = $this->actingAs($this->standardUser)->getJson('/api/vendors');
        $listResponse->assertStatus(200);

        // 2. Create a vendor
        $createResponse = $this->actingAs($this->standardUser)->postJson('/api/vendors', [
            'name' => 'Timber Logistics Ltd',
            'code' => 'VEND-TIMBER-01',
            'contact_person' => 'John Wood',
            'email' => 'john@timber.test',
            'phone' => '+91 98000 00002',
            'city' => 'Pune',
            'state' => 'Maharashtra',
        ]);
        $createResponse->assertStatus(201)
            ->assertJsonPath('data.name', 'Timber Logistics Ltd');

        $vendorId = $createResponse->json('data.id');

        // 3. Show vendor
        $showResponse = $this->actingAs($this->standardUser)->getJson("/api/vendors/{$vendorId}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Timber Logistics Ltd');

        // 4. Update vendor
        $updateResponse = $this->actingAs($this->standardUser)->putJson("/api/vendors/{$vendorId}", [
            'name' => 'Timber Logistics Global Ltd',
        ]);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Timber Logistics Global Ltd');

        // 5. Delete vendor (should be restricted to admin only)
        $deleteResponse = $this->actingAs($this->standardUser)->deleteJson("/api/vendors/{$vendorId}");
        $deleteResponse->assertStatus(403);
    }

    public function test_dual_partner_user_can_perform_both_customer_and_vendor_operations(): void
    {
        // Customer operations as dual user
        $custResponse = $this->actingAs($this->dualUser)->getJson('/api/customers');
        $custResponse->assertStatus(200);

        // Vendor operations as dual user
        $vendResponse = $this->actingAs($this->dualUser)->getJson('/api/vendors');
        $vendResponse->assertStatus(200);

        // Verify dual partner permissions in /api/me
        $meResponse = $this->actingAs($this->dualUser)->getJson('/api/me');
        $meResponse->assertStatus(200)
            ->assertJsonPath('user.is_customer', true)
            ->assertJsonPath('user.is_vendor', true);

        $permissions = $meResponse->json('user.permissions');
        $this->assertContains(Rbac::PERMISSION_CUSTOMERS_VIEW_ANY, $permissions);
        $this->assertContains(Rbac::PERMISSION_VENDORS_VIEW_ANY, $permissions);
    }

    public function test_customer_role_user_has_customer_permissions(): void
    {
        $custResponse = $this->actingAs($this->customerUser)->getJson('/api/customers');
        $custResponse->assertStatus(200);

        $meResponse = $this->actingAs($this->customerUser)->getJson('/api/me');
        $meResponse->assertStatus(200)
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonPath('user.is_customer', true);

        $permissions = $meResponse->json('user.permissions');
        $this->assertContains(Rbac::PERMISSION_CUSTOMERS_VIEW_ANY, $permissions);
        $this->assertContains(Rbac::PERMISSION_CUSTOMERS_CREATE, $permissions);
    }

    public function test_vendor_role_user_has_vendor_permissions(): void
    {
        $vendResponse = $this->actingAs($this->vendorUser)->getJson('/api/vendors');
        $vendResponse->assertStatus(200);

        $meResponse = $this->actingAs($this->vendorUser)->getJson('/api/me');
        $meResponse->assertStatus(200)
            ->assertJsonPath('user.role', 'vendor')
            ->assertJsonPath('user.is_vendor', true);

        $permissions = $meResponse->json('user.permissions');
        $this->assertContains(Rbac::PERMISSION_VENDORS_VIEW_ANY, $permissions);
        $this->assertContains(Rbac::PERMISSION_VENDORS_CREATE, $permissions);
    }
}
