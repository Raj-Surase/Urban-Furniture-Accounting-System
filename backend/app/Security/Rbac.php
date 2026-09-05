<?php

namespace App\Security;

class Rbac
{
    // Roles
    public const ROLE_ADMIN = 'admin';
    public const ROLE_MANAGER = 'manager';
    public const ROLE_USER = 'user';

    // Permissions: Items
    public const PERMISSION_ITEMS_VIEW_ANY = 'items:view_any';
    public const PERMISSION_ITEMS_VIEW = 'items:view';
    public const PERMISSION_ITEMS_CREATE = 'items:create';
    public const PERMISSION_ITEMS_UPDATE_OWN = 'items:update_own';
    public const PERMISSION_ITEMS_UPDATE_ANY = 'items:update_any';
    public const PERMISSION_ITEMS_DELETE_ANY = 'items:delete_any';

    // Permissions: Users & Access Control
    public const PERMISSION_USERS_VIEW_ANY = 'users:view_any';
    public const PERMISSION_USERS_MANAGE_ROLES = 'users:manage_roles';

    // Permissions: System & Telemetry
    public const PERMISSION_SYSTEM_TELEMETRY = 'system:telemetry';
    public const PERMISSION_SYSTEM_BROADCAST = 'system:broadcast';

    /**
     * All recognized system roles.
     *
     * @return array<string, array{name: string, tier: string, description: string, color: string}>
     */
    public static function getRoles(): array
    {
        return [
            self::ROLE_ADMIN => [
                'name' => 'Administrator',
                'tier' => 'Tier 3 Superuser',
                'description' => 'Full administrative access across all endpoints, database operations, user governance, and telemetry.',
                'color' => 'primary',
            ],
            self::ROLE_MANAGER => [
                'name' => 'Operations Manager',
                'tier' => 'Tier 2 Management',
                'description' => 'Departmental operations access. Can create and edit any item, broadcast updates, and view user directory.',
                'color' => 'warning',
            ],
            self::ROLE_USER => [
                'name' => 'Standard User',
                'tier' => 'Tier 1 Standard',
                'description' => 'Standard authenticated access. Can create items and edit their own items, join channels, and view items.',
                'color' => 'default',
            ],
        ];
    }

    /**
     * All registered system permissions with human metadata.
     *
     * @return array<string, array{label: string, category: string, description: string}>
     */
    public static function getAllPermissions(): array
    {
        return [
            self::PERMISSION_ITEMS_VIEW_ANY => [
                'label' => 'View Items List',
                'category' => 'Items Management',
                'description' => 'List and search all shared system items.',
            ],
            self::PERMISSION_ITEMS_VIEW => [
                'label' => 'View Item Details',
                'category' => 'Items Management',
                'description' => 'Inspect full record details of any individual item.',
            ],
            self::PERMISSION_ITEMS_CREATE => [
                'label' => 'Create New Items',
                'category' => 'Items Management',
                'description' => 'Create new items in the database.',
            ],
            self::PERMISSION_ITEMS_UPDATE_OWN => [
                'label' => 'Update Own Items',
                'category' => 'Items Management',
                'description' => 'Modify items created by the authenticated user.',
            ],
            self::PERMISSION_ITEMS_UPDATE_ANY => [
                'label' => 'Update Any Item',
                'category' => 'Items Management',
                'description' => 'Modify items created by any user in the organization.',
            ],
            self::PERMISSION_ITEMS_DELETE_ANY => [
                'label' => 'Delete Any Item',
                'category' => 'Items Management',
                'description' => 'Permanently delete items from the database.',
            ],
            self::PERMISSION_USERS_VIEW_ANY => [
                'label' => 'View User Directory',
                'category' => 'User Governance',
                'description' => 'Browse registered user accounts and their clearance roles.',
            ],
            self::PERMISSION_USERS_MANAGE_ROLES => [
                'label' => 'Manage User Roles',
                'category' => 'User Governance',
                'description' => 'Promote or demote user roles across the organization.',
            ],
            self::PERMISSION_SYSTEM_TELEMETRY => [
                'label' => 'Access System Telemetry',
                'category' => 'System Operations',
                'description' => 'View server diagnostics, PostgreSQL metrics, and health telemetry.',
            ],
            self::PERMISSION_SYSTEM_BROADCAST => [
                'label' => 'Emit Socket Broadcasts',
                'category' => 'System Operations',
                'description' => 'Broadcast real-time operational events to connected clients.',
            ],
        ];
    }

    /**
     * Map of roles to assigned permissions.
     *
     * @return array<string, list<string>>
     */
    public static function getRolePermissionsMap(): array
    {
        return [
            self::ROLE_ADMIN => [
                self::PERMISSION_ITEMS_VIEW_ANY,
                self::PERMISSION_ITEMS_VIEW,
                self::PERMISSION_ITEMS_CREATE,
                self::PERMISSION_ITEMS_UPDATE_OWN,
                self::PERMISSION_ITEMS_UPDATE_ANY,
                self::PERMISSION_ITEMS_DELETE_ANY,
                self::PERMISSION_USERS_VIEW_ANY,
                self::PERMISSION_USERS_MANAGE_ROLES,
                self::PERMISSION_SYSTEM_TELEMETRY,
                self::PERMISSION_SYSTEM_BROADCAST,
            ],
            self::ROLE_MANAGER => [
                self::PERMISSION_ITEMS_VIEW_ANY,
                self::PERMISSION_ITEMS_VIEW,
                self::PERMISSION_ITEMS_CREATE,
                self::PERMISSION_ITEMS_UPDATE_OWN,
                self::PERMISSION_ITEMS_UPDATE_ANY,
                // Note: Managers CANNOT delete items (strict policy)
                self::PERMISSION_USERS_VIEW_ANY,
                self::PERMISSION_SYSTEM_BROADCAST,
            ],
            self::ROLE_USER => [
                self::PERMISSION_ITEMS_VIEW_ANY,
                self::PERMISSION_ITEMS_VIEW,
                self::PERMISSION_ITEMS_CREATE,
                self::PERMISSION_ITEMS_UPDATE_OWN,
                // Note: Standard users CANNOT update other users' items and CANNOT delete
            ],
        ];
    }

    /**
     * Get list of permissions for a specific role.
     *
     * @param string|null $role
     * @return list<string>
     */
    public static function getPermissionsForRole(?string $role): array
    {
        if (! $role) {
            return [];
        }

        $map = self::getRolePermissionsMap();

        return $map[$role] ?? [];
    }

    /**
     * Check if a given role possesses a specific permission.
     *
     * @param string|null $role
     * @param string $permission
     * @return bool
     */
    public static function hasPermission(?string $role, string $permission): bool
    {
        if (! $role) {
            return false;
        }

        $permissions = self::getPermissionsForRole($role);

        return in_array($permission, $permissions, true);
    }

    /**
     * Export complete matrix for frontend inspection & documentation.
     *
     * @return array<string, mixed>
     */
    public static function getMatrix(): array
    {
        $roles = self::getRoles();
        $permissions = self::getAllPermissions();
        $map = self::getRolePermissionsMap();

        $matrix = [];
        foreach ($roles as $roleKey => $roleInfo) {
            $rolePerms = $map[$roleKey] ?? [];
            $matrix[$roleKey] = array_merge($roleInfo, [
                'key' => $roleKey,
                'permissions' => $rolePerms,
                'permission_count' => count($rolePerms),
            ]);
        }

        return [
            'roles' => $matrix,
            'permissions' => $permissions,
        ];
    }
}

