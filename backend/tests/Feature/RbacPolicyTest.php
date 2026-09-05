<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RbacPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $manager;
    protected User $standardUser;
    protected Item $adminItem;
    protected Item $userItem;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::firstOrCreate(
            ['email' => 'admin_test@example.com'],
            ['name' => 'Admin Test', 'password' => bcrypt('password'), 'role' => User::ROLE_ADMIN]
        );
        $this->admin->role = User::ROLE_ADMIN;
        $this->admin->save();

        $this->manager = User::firstOrCreate(
            ['email' => 'manager_test@example.com'],
            ['name' => 'Manager Test', 'password' => bcrypt('password'), 'role' => User::ROLE_MANAGER]
        );
        $this->manager->role = User::ROLE_MANAGER;
        $this->manager->save();

        $this->standardUser = User::firstOrCreate(
            ['email' => 'user_test@example.com'],
            ['name' => 'User Test', 'password' => bcrypt('password'), 'role' => User::ROLE_USER]
        );
        $this->standardUser->role = User::ROLE_USER;
        $this->standardUser->save();

        $this->adminItem = Item::create([
            'user_id' => $this->admin->id,
            'title' => 'Admin Owned Item',
            'description' => 'Test admin item',
            'status' => 'pending',
            'priority' => 'high',
        ]);

        $this->userItem = Item::create([
            'user_id' => $this->standardUser->id,
            'title' => 'User Owned Item',
            'description' => 'Test user item',
            'status' => 'in_progress',
            'priority' => 'medium',
        ]);
    }

    public function test_auth_me_returns_role_and_permissions(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonStructure([
                'user' => [
                    'id', 'name', 'email', 'role', 'is_admin', 'permissions', 'created_at'
                ]
            ]);

        $this->assertContains('items:delete_any', $response->json('user.permissions'));
    }

    public function test_rbac_matrix_endpoint_is_accessible(): void
    {
        $response = $this->getJson('/api/rbac/matrix');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'roles' => ['admin', 'manager', 'user'],
                'permissions',
            ]);
    }

    public function test_admin_can_update_and_delete_any_item(): void
    {
        // Admin updates user item
        $updateResponse = $this->actingAs($this->admin)->putJson("/api/items/{$this->userItem->id}", [
            'title' => 'Updated by Admin',
            'status' => 'completed',
        ]);
        $updateResponse->assertStatus(200);

        // Admin deletes item
        $deleteResponse = $this->actingAs($this->admin)->deleteJson("/api/items/{$this->userItem->id}");
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('items', ['id' => $this->userItem->id]);
    }

    public function test_manager_can_update_any_item_but_cannot_delete(): void
    {
        // Manager updates admin item
        $updateResponse = $this->actingAs($this->manager)->putJson("/api/items/{$this->adminItem->id}", [
            'title' => 'Updated by Manager',
        ]);
        $updateResponse->assertStatus(200);

        // Manager CANNOT delete items (strict policy)
        $deleteResponse = $this->actingAs($this->manager)->deleteJson("/api/items/{$this->adminItem->id}");
        $deleteResponse->assertStatus(403);
        $this->assertDatabaseHas('items', ['id' => $this->adminItem->id]);
    }

    public function test_standard_user_can_update_own_item_but_not_others(): void
    {
        // User updates own item
        $ownUpdate = $this->actingAs($this->standardUser)->putJson("/api/items/{$this->userItem->id}", [
            'title' => 'Updated by Owner',
        ]);
        $ownUpdate->assertStatus(200);

        // User attempts to update admin's item -> Forbidden
        $otherUpdate = $this->actingAs($this->standardUser)->putJson("/api/items/{$this->adminItem->id}", [
            'title' => 'Illicit update attempt',
        ]);
        $otherUpdate->assertStatus(403);
    }

    public function test_standard_user_cannot_delete_items(): void
    {
        // User cannot delete own item
        $deleteOwn = $this->actingAs($this->standardUser)->deleteJson("/api/items/{$this->userItem->id}");
        $deleteOwn->assertStatus(403);

        // User cannot delete others' items
        $deleteOther = $this->actingAs($this->standardUser)->deleteJson("/api/items/{$this->adminItem->id}");
        $deleteOther->assertStatus(403);
    }

    public function test_user_management_access_control(): void
    {
        // Admin can view users list
        $adminView = $this->actingAs($this->admin)->getJson('/api/users');
        $adminView->assertStatus(200);

        // Manager can view users list
        $managerView = $this->actingAs($this->manager)->getJson('/api/users');
        $managerView->assertStatus(200);

        // Standard user CANNOT view users list
        $userView = $this->actingAs($this->standardUser)->getJson('/api/users');
        $userView->assertStatus(403);

        // Admin can update user role
        $roleChange = $this->actingAs($this->admin)->patchJson("/api/users/{$this->standardUser->id}/role", [
            'role' => 'manager',
        ]);
        $roleChange->assertStatus(200)
            ->assertJsonPath('user.role', 'manager');

        // Manager CANNOT change user roles
        $managerChange = $this->actingAs($this->manager)->patchJson("/api/users/{$this->standardUser->id}/role", [
            'role' => 'admin',
        ]);
        $managerChange->assertStatus(403);
    }

    public function test_item_resource_includes_authorization_flags(): void
    {
        $response = $this->actingAs($this->standardUser)->getJson("/api/items/{$this->userItem->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.can_edit', true)
            ->assertJsonPath('data.can_delete', false);

        $adminItemResponse = $this->actingAs($this->standardUser)->getJson("/api/items/{$this->adminItem->id}");
        $adminItemResponse->assertStatus(200)
            ->assertJsonPath('data.can_edit', false)
            ->assertJsonPath('data.can_delete', false);
    }

    public function test_admin_stats_access_control(): void
    {
        // Unauthenticated -> 401
        $guestResponse = $this->getJson('/api/admin/stats');
        $guestResponse->assertStatus(401);

        // Standard user -> 403 Forbidden
        $userResponse = $this->actingAs($this->standardUser)->getJson('/api/admin/stats');
        $userResponse->assertStatus(403);

        // Manager -> 403 Forbidden
        $managerResponse = $this->actingAs($this->manager)->getJson('/api/admin/stats');
        $managerResponse->assertStatus(403);

        // Admin -> 200 OK with telemetry payload
        $adminResponse = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $adminResponse->assertStatus(200)
            ->assertJsonStructure([
                'total_users',
                'admin_count',
                'manager_count',
                'user_count',
                'total_items',
                'total_products',
                'total_invoices',
                'total_sales_orders',
                'total_purchase_orders',
                'system_time',
                'database' => ['connection', 'host', 'port', 'database', 'status'],
                'framework',
                'environment',
            ]);
    }
}
