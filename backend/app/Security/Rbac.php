<?php

namespace App\Security;

class Rbac
{
    // Roles
    public const ROLE_ADMIN = 'admin';
    public const ROLE_MANAGER = 'manager';
    public const ROLE_ACCOUNTANT = 'accountant';
    public const ROLE_USER = 'user';
    public const ROLE_CUSTOMER = 'customer';
    public const ROLE_VENDOR = 'vendor';

    // Permissions: Items
    public const PERMISSION_ITEMS_VIEW_ANY = 'items:view_any';
    public const PERMISSION_ITEMS_VIEW_OWN = 'items:view_own';
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

    // Permissions: Accounts & Financial Reports
    public const PERMISSION_ACCOUNTS_VIEW_ANY = 'accounts:view_any';
    public const PERMISSION_ACCOUNTS_CREATE = 'accounts:create';
    public const PERMISSION_ACCOUNTS_UPDATE = 'accounts:update';
    public const PERMISSION_ACCOUNTS_DELETE = 'accounts:delete';
    public const PERMISSION_REPORTS_VIEW_FINANCIAL = 'reports:view_financial';

    // Permissions: Customers
    public const PERMISSION_CUSTOMERS_VIEW_ANY = 'customers:view_any';
    public const PERMISSION_CUSTOMERS_VIEW_OWN = 'customers:view_own';
    public const PERMISSION_CUSTOMERS_CREATE = 'customers:create';
    public const PERMISSION_CUSTOMERS_UPDATE = 'customers:update';
    public const PERMISSION_CUSTOMERS_DELETE = 'customers:delete';

    // Permissions: Vendors
    public const PERMISSION_VENDORS_VIEW_ANY = 'vendors:view_any';
    public const PERMISSION_VENDORS_VIEW_OWN = 'vendors:view_own';
    public const PERMISSION_VENDORS_CREATE = 'vendors:create';
    public const PERMISSION_VENDORS_UPDATE = 'vendors:update';
    public const PERMISSION_VENDORS_DELETE = 'vendors:delete';

    // Permissions: Products & Inventory
    public const PERMISSION_PRODUCTS_VIEW_ANY = 'products:view_any';
    public const PERMISSION_PRODUCTS_CREATE = 'products:create';
    public const PERMISSION_PRODUCTS_UPDATE = 'products:update';
    public const PERMISSION_PRODUCTS_DELETE = 'products:delete';
    public const PERMISSION_INVENTORY_ADJUST = 'inventory:adjust';

    // Permissions: Purchase Orders
    public const PERMISSION_PURCHASE_ORDERS_VIEW_ANY = 'purchase_orders:view_any';
    public const PERMISSION_PURCHASE_ORDERS_VIEW_OWN = 'purchase_orders:view_own';
    public const PERMISSION_PURCHASE_ORDERS_CREATE = 'purchase_orders:create';
    public const PERMISSION_PURCHASE_ORDERS_APPROVE = 'purchase_orders:approve';
    public const PERMISSION_PURCHASE_ORDERS_REJECT = 'purchase_orders:reject';
    public const PERMISSION_PURCHASE_ORDERS_UPDATE_OWN = 'purchase_orders:update_own';
    public const PERMISSION_PURCHASE_ORDERS_RECEIVE = 'purchase_orders:receive';
    public const PERMISSION_PURCHASE_ORDERS_DELETE = 'purchase_orders:delete';

    // Permissions: Sales Orders
    public const PERMISSION_SALES_ORDERS_VIEW_ANY = 'sales_orders:view_any';
    public const PERMISSION_SALES_ORDERS_VIEW_OWN = 'sales_orders:view_own';
    public const PERMISSION_SALES_ORDERS_CREATE = 'sales_orders:create';
    public const PERMISSION_SALES_ORDERS_APPROVE = 'sales_orders:approve';
    public const PERMISSION_SALES_ORDERS_UPDATE_OWN = 'sales_orders:update_own';
    public const PERMISSION_SALES_ORDERS_INVOICE = 'sales_orders:invoice';
    public const PERMISSION_SALES_ORDERS_DELIVER = 'sales_orders:deliver';
    public const PERMISSION_SALES_ORDERS_DELETE = 'sales_orders:delete';

    // Permissions: Invoices & Bills
    public const PERMISSION_INVOICES_VIEW_ANY = 'invoices:view_any';
    public const PERMISSION_INVOICES_VIEW_OWN = 'invoices:view_own';
    public const PERMISSION_INVOICES_CREATE = 'invoices:create';
    public const PERMISSION_INVOICES_APPROVE = 'invoices:approve';
    public const PERMISSION_INVOICES_VOID = 'invoices:void';
    public const PERMISSION_INVOICES_UPDATE_OWN = 'invoices:update_own';
    public const PERMISSION_INVOICES_DELETE = 'invoices:delete';

    // Permissions: Payments & Treasury
    public const PERMISSION_PAYMENTS_VIEW_ANY = 'payments:view_any';
    public const PERMISSION_PAYMENTS_VIEW_OWN = 'payments:view_own';
    public const PERMISSION_PAYMENTS_CREATE = 'payments:create';
    public const PERMISSION_PAYMENTS_RECONCILE = 'payments:reconcile';
    public const PERMISSION_PAYMENTS_DELETE = 'payments:delete';

    // Permissions: General Ledger Journal & Analytics
    public const PERMISSION_JOURNAL_VIEW_ANY = 'journal:view_any';
    public const PERMISSION_JOURNAL_POST = 'journal:post';
    public const PERMISSION_JOURNAL_REVERSE = 'journal:reverse';
    public const PERMISSION_JOURNALS_MANAGE = 'journals:manage';
    public const PERMISSION_ANALYTICS_MANAGE = 'analytics:manage';
    public const PERMISSION_BUDGETS_MANAGE = 'budgets:manage';

    // Permissions: Contacts Master
    public const PERMISSION_CONTACTS_VIEW_ANY = 'contacts:view_any';
    public const PERMISSION_CONTACTS_MANAGE = 'contacts:manage';

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
            self::ROLE_ACCOUNTANT => [
                'name' => 'Accountant',
                'tier' => 'Tier 2 Accounting',
                'description' => 'Full accounting and financial operations access. Manages journals, ledgers, reconciliations, and financial reporting.',
                'color' => 'secondary',
            ],
            self::ROLE_USER => [
                'name' => 'Standard User',
                'tier' => 'Tier 1 Standard',
                'description' => 'Standard authenticated access. Can operate as customer or vendor for sales/purchase orders, invoices, and payments.',
                'color' => 'default',
            ],
            self::ROLE_CUSTOMER => [
                'name' => 'Customer',
                'tier' => 'Tier 1 Partner',
                'description' => 'Customer partner access. Can view customer records, issue sales orders, inspect invoices, and execute dues payment.',
                'color' => 'success',
            ],
            self::ROLE_VENDOR => [
                'name' => 'Vendor',
                'tier' => 'Tier 1 Partner',
                'description' => 'Vendor partner access. Can view vendor records, issue purchase orders, review bills, and record payments.',
                'color' => 'warning',
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
            // Accounts & Reports
            self::PERMISSION_ACCOUNTS_VIEW_ANY => [
                'label' => 'View Chart of Accounts',
                'category' => 'Accounting & General Ledger',
                'description' => 'Inspect chart of accounts and general ledger balances.',
            ],
            self::PERMISSION_ACCOUNTS_CREATE => [
                'label' => 'Create Accounts',
                'category' => 'Accounting & General Ledger',
                'description' => 'Provision new chart of accounts codes and classifications.',
            ],
            self::PERMISSION_ACCOUNTS_UPDATE => [
                'label' => 'Update Accounts',
                'category' => 'Accounting & General Ledger',
                'description' => 'Modify account details and classifications.',
            ],
            self::PERMISSION_ACCOUNTS_DELETE => [
                'label' => 'Delete Accounts',
                'category' => 'Accounting & General Ledger',
                'description' => 'Archive or remove inactive accounts with zero transactions.',
            ],
            self::PERMISSION_REPORTS_VIEW_FINANCIAL => [
                'label' => 'View Financial Statements',
                'category' => 'Accounting & General Ledger',
                'description' => 'Generate and review Trial Balance, P&L, Balance Sheet, Aging & GST reports.',
            ],
            // Invoices & Billing
            self::PERMISSION_INVOICES_VIEW_ANY => [
                'label' => 'View All Invoices & Bills',
                'category' => 'Invoices & Billing',
                'description' => 'Inspect all customer tax invoices and vendor bills.',
            ],
            self::PERMISSION_INVOICES_VIEW_OWN => [
                'label' => 'View Own Invoices & Bills',
                'category' => 'Invoices & Billing',
                'description' => 'Inspect invoices and bills authored or addressed to the authenticated user.',
            ],
            self::PERMISSION_INVOICES_CREATE => [
                'label' => 'Create Invoices & Bills',
                'category' => 'Invoices & Billing',
                'description' => 'Draft customer invoices and vendor bills with GST line item calculations.',
            ],
            self::PERMISSION_INVOICES_APPROVE => [
                'label' => 'Approve & Post Invoices',
                'category' => 'Invoices & Billing',
                'description' => 'Authorize invoices and trigger auto-posting to the General Ledger.',
            ],
            self::PERMISSION_INVOICES_VOID => [
                'label' => 'Void Invoices',
                'category' => 'Invoices & Billing',
                'description' => 'Void approved invoices and post contra reversing journal entries.',
            ],
            // Products & Inventory
            self::PERMISSION_PRODUCTS_VIEW_ANY => [
                'label' => 'View Products Catalog',
                'category' => 'Products & Inventory',
                'description' => 'Browse products, SKUs, inventory counts and valuations.',
            ],
            self::PERMISSION_PRODUCTS_CREATE => [
                'label' => 'Create Product SKU',
                'category' => 'Products & Inventory',
                'description' => 'Add new furniture products, pricing, and HSN codes.',
            ],
            self::PERMISSION_PRODUCTS_UPDATE => [
                'label' => 'Update Product SKU',
                'category' => 'Products & Inventory',
                'description' => 'Modify product pricing, details, and classifications.',
            ],
            self::PERMISSION_INVENTORY_ADJUST => [
                'label' => 'Adjust Inventory Stock',
                'category' => 'Products & Inventory',
                'description' => 'Perform manual inventory reconciliations with audit reason tracking.',
            ],
            // Sales & Purchase Orders
            self::PERMISSION_SALES_ORDERS_VIEW_ANY => [
                'label' => 'View All Sales Orders',
                'category' => 'Sales Orders',
                'description' => 'Inspect all customer sales orders and fulfillment stages.',
            ],
            self::PERMISSION_SALES_ORDERS_CREATE => [
                'label' => 'Create Sales Order',
                'category' => 'Sales Orders',
                'description' => 'Issue new sales orders for furniture delivery.',
            ],
            self::PERMISSION_SALES_ORDERS_APPROVE => [
                'label' => 'Approve Sales Order',
                'category' => 'Sales Orders',
                'description' => 'Approve confirmed sales orders for warehouse dispatch.',
            ],
            self::PERMISSION_SALES_ORDERS_DELIVER => [
                'label' => 'Deliver Sales Order',
                'category' => 'Sales Orders',
                'description' => 'Mark line items as fulfilled and delivered.',
            ],
            self::PERMISSION_PURCHASE_ORDERS_VIEW_ANY => [
                'label' => 'View All Purchase Orders',
                'category' => 'Procurement',
                'description' => 'Inspect procurement orders and supplier fulfillment.',
            ],
            self::PERMISSION_PURCHASE_ORDERS_CREATE => [
                'label' => 'Create Purchase Order',
                'category' => 'Procurement',
                'description' => 'Create purchase orders for raw materials and furniture supplies.',
            ],
            self::PERMISSION_PURCHASE_ORDERS_APPROVE => [
                'label' => 'Approve Purchase Order',
                'category' => 'Procurement',
                'description' => 'Authorize submitted purchase orders for procurement.',
            ],
            self::PERMISSION_PURCHASE_ORDERS_RECEIVE => [
                'label' => 'Receive Goods from PO',
                'category' => 'Procurement',
                'description' => 'Accept warehouse stock from supplier shipments.',
            ],
            // Payments & Journal
            self::PERMISSION_PAYMENTS_VIEW_ANY => [
                'label' => 'View Treasury Payments',
                'category' => 'Treasury & Payments',
                'description' => 'Inspect customer receipts and vendor payments.',
            ],
            self::PERMISSION_PAYMENTS_CREATE => [
                'label' => 'Record Payment',
                'category' => 'Treasury & Payments',
                'description' => 'Register cash or bank payment against invoice or account.',
            ],
            self::PERMISSION_PAYMENTS_RECONCILE => [
                'label' => 'Reconcile Payments',
                'category' => 'Treasury & Payments',
                'description' => 'Reconcile settlement and auto-post double-entry journal records.',
            ],
            self::PERMISSION_PAYMENTS_VIEW_OWN => [
                'label' => 'View Own Payments',
                'category' => 'Treasury & Payments',
                'description' => 'Inspect payment records associated with own orders and invoices.',
            ],
            self::PERMISSION_JOURNAL_VIEW_ANY => [
                'label' => 'View General Ledger Journal',
                'category' => 'Accounting & General Ledger',
                'description' => 'Inspect balanced double-entry journal entries.',
            ],
            self::PERMISSION_JOURNAL_POST => [
                'label' => 'Post Manual Journal Entry',
                'category' => 'Accounting & General Ledger',
                'description' => 'Post manual debits and credits to the General Ledger.',
            ],
            self::PERMISSION_JOURNAL_REVERSE => [
                'label' => 'Reverse Journal Entry',
                'category' => 'Accounting & General Ledger',
                'description' => 'Issue contra reversal entries to offset posted transactions.',
            ],
            self::PERMISSION_JOURNALS_MANAGE => [
                'label' => 'Manage Accounting Journals',
                'category' => 'Accounting & General Ledger',
                'description' => 'Create, modify, and configure journal registers.',
            ],
            self::PERMISSION_ANALYTICS_MANAGE => [
                'label' => 'Manage Analytic Accounts',
                'category' => 'Accounting & General Ledger',
                'description' => 'Manage cost centers, project analytic accounts, and tracking tags.',
            ],
            self::PERMISSION_BUDGETS_MANAGE => [
                'label' => 'Manage Budgets',
                'category' => 'Accounting & General Ledger',
                'description' => 'Create, revise, confirm, and audit financial budgets.',
            ],
            self::PERMISSION_CONTACTS_VIEW_ANY => [
                'label' => 'View Contacts Directory',
                'category' => 'Contacts Master',
                'description' => 'Inspect company-wide customer and vendor directory.',
            ],
            self::PERMISSION_CONTACTS_MANAGE => [
                'label' => 'Manage Contacts',
                'category' => 'Contacts Master',
                'description' => 'Create, update, and manage CRM contact records.',
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
        $domainPermissions = [
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
            // Domain Accounting & Operations
            self::PERMISSION_ACCOUNTS_VIEW_ANY,
            self::PERMISSION_ACCOUNTS_CREATE,
            self::PERMISSION_ACCOUNTS_UPDATE,
            self::PERMISSION_ACCOUNTS_DELETE,
            self::PERMISSION_REPORTS_VIEW_FINANCIAL,
            self::PERMISSION_CUSTOMERS_VIEW_ANY,
            self::PERMISSION_CUSTOMERS_CREATE,
            self::PERMISSION_CUSTOMERS_UPDATE,
            self::PERMISSION_CUSTOMERS_DELETE,
            self::PERMISSION_VENDORS_VIEW_ANY,
            self::PERMISSION_VENDORS_CREATE,
            self::PERMISSION_VENDORS_UPDATE,
            self::PERMISSION_VENDORS_DELETE,
            self::PERMISSION_PRODUCTS_VIEW_ANY,
            self::PERMISSION_PRODUCTS_CREATE,
            self::PERMISSION_PRODUCTS_UPDATE,
            self::PERMISSION_PRODUCTS_DELETE,
            self::PERMISSION_INVENTORY_ADJUST,
            self::PERMISSION_PURCHASE_ORDERS_VIEW_ANY,
            self::PERMISSION_PURCHASE_ORDERS_VIEW_OWN,
            self::PERMISSION_PURCHASE_ORDERS_CREATE,
            self::PERMISSION_PURCHASE_ORDERS_APPROVE,
            self::PERMISSION_PURCHASE_ORDERS_REJECT,
            self::PERMISSION_PURCHASE_ORDERS_UPDATE_OWN,
            self::PERMISSION_PURCHASE_ORDERS_RECEIVE,
            self::PERMISSION_PURCHASE_ORDERS_DELETE,
            self::PERMISSION_SALES_ORDERS_VIEW_ANY,
            self::PERMISSION_SALES_ORDERS_VIEW_OWN,
            self::PERMISSION_SALES_ORDERS_CREATE,
            self::PERMISSION_SALES_ORDERS_APPROVE,
            self::PERMISSION_SALES_ORDERS_UPDATE_OWN,
            self::PERMISSION_SALES_ORDERS_INVOICE,
            self::PERMISSION_SALES_ORDERS_DELIVER,
            self::PERMISSION_SALES_ORDERS_DELETE,
            self::PERMISSION_INVOICES_VIEW_ANY,
            self::PERMISSION_INVOICES_VIEW_OWN,
            self::PERMISSION_INVOICES_CREATE,
            self::PERMISSION_INVOICES_APPROVE,
            self::PERMISSION_INVOICES_VOID,
            self::PERMISSION_INVOICES_UPDATE_OWN,
            self::PERMISSION_INVOICES_DELETE,
            self::PERMISSION_PAYMENTS_VIEW_ANY,
            self::PERMISSION_PAYMENTS_CREATE,
            self::PERMISSION_PAYMENTS_RECONCILE,
            self::PERMISSION_PAYMENTS_DELETE,
            self::PERMISSION_JOURNAL_VIEW_ANY,
            self::PERMISSION_JOURNAL_POST,
            self::PERMISSION_JOURNAL_REVERSE,
            self::PERMISSION_JOURNALS_MANAGE,
            self::PERMISSION_ANALYTICS_MANAGE,
            self::PERMISSION_BUDGETS_MANAGE,
            self::PERMISSION_CONTACTS_VIEW_ANY,
            self::PERMISSION_CONTACTS_MANAGE,
            self::PERMISSION_PAYMENTS_VIEW_OWN,
        ];

        $managerFinancialPermissions = [
            self::PERMISSION_ITEMS_VIEW_ANY,
            self::PERMISSION_ITEMS_VIEW,
            self::PERMISSION_ITEMS_CREATE,
            self::PERMISSION_ITEMS_UPDATE_OWN,
            self::PERMISSION_ITEMS_UPDATE_ANY,
            self::PERMISSION_USERS_VIEW_ANY,
            self::PERMISSION_SYSTEM_BROADCAST,
            // Manager / Accountant business operations
            self::PERMISSION_ACCOUNTS_VIEW_ANY,
            self::PERMISSION_ACCOUNTS_CREATE,
            self::PERMISSION_ACCOUNTS_UPDATE,
            self::PERMISSION_REPORTS_VIEW_FINANCIAL,
            self::PERMISSION_CUSTOMERS_VIEW_ANY,
            self::PERMISSION_CUSTOMERS_CREATE,
            self::PERMISSION_CUSTOMERS_UPDATE,
            self::PERMISSION_VENDORS_VIEW_ANY,
            self::PERMISSION_VENDORS_CREATE,
            self::PERMISSION_VENDORS_UPDATE,
            self::PERMISSION_CONTACTS_VIEW_ANY,
            self::PERMISSION_CONTACTS_MANAGE,
            self::PERMISSION_PRODUCTS_VIEW_ANY,
            self::PERMISSION_PRODUCTS_CREATE,
            self::PERMISSION_PRODUCTS_UPDATE,
            self::PERMISSION_INVENTORY_ADJUST,
            self::PERMISSION_PURCHASE_ORDERS_VIEW_ANY,
            self::PERMISSION_PURCHASE_ORDERS_CREATE,
            self::PERMISSION_PURCHASE_ORDERS_APPROVE,
            self::PERMISSION_PURCHASE_ORDERS_REJECT,
            self::PERMISSION_PURCHASE_ORDERS_RECEIVE,
            self::PERMISSION_SALES_ORDERS_VIEW_ANY,
            self::PERMISSION_SALES_ORDERS_CREATE,
            self::PERMISSION_SALES_ORDERS_APPROVE,
            self::PERMISSION_SALES_ORDERS_INVOICE,
            self::PERMISSION_SALES_ORDERS_DELIVER,
            self::PERMISSION_INVOICES_VIEW_ANY,
            self::PERMISSION_INVOICES_CREATE,
            self::PERMISSION_INVOICES_APPROVE,
            self::PERMISSION_INVOICES_VOID,
            self::PERMISSION_PAYMENTS_VIEW_ANY,
            self::PERMISSION_PAYMENTS_VIEW_OWN,
            self::PERMISSION_PAYMENTS_CREATE,
            self::PERMISSION_PAYMENTS_RECONCILE,
            self::PERMISSION_JOURNAL_VIEW_ANY,
            self::PERMISSION_JOURNAL_POST,
            self::PERMISSION_JOURNAL_REVERSE,
            self::PERMISSION_JOURNALS_MANAGE,
            self::PERMISSION_ANALYTICS_MANAGE,
            self::PERMISSION_BUDGETS_MANAGE,
        ];

        return [
            self::ROLE_ADMIN => $domainPermissions,
            self::ROLE_MANAGER => $managerFinancialPermissions,
            self::ROLE_ACCOUNTANT => $managerFinancialPermissions,
            self::ROLE_USER => [
                self::PERMISSION_ITEMS_VIEW_OWN,
                self::PERMISSION_ITEMS_VIEW,
                self::PERMISSION_ITEMS_CREATE,
                self::PERMISSION_ITEMS_UPDATE_OWN,
                // Products & Catalog
                self::PERMISSION_PRODUCTS_VIEW_ANY,
                // Customers & Vendors — view own records only
                self::PERMISSION_CUSTOMERS_VIEW_OWN,
                self::PERMISSION_VENDORS_VIEW_OWN,
                // Purchase Orders
                self::PERMISSION_PURCHASE_ORDERS_VIEW_OWN,
                self::PERMISSION_PURCHASE_ORDERS_CREATE,
                self::PERMISSION_PURCHASE_ORDERS_UPDATE_OWN,
                // Sales Orders
                self::PERMISSION_SALES_ORDERS_VIEW_OWN,
                self::PERMISSION_SALES_ORDERS_CREATE,
                self::PERMISSION_SALES_ORDERS_UPDATE_OWN,
                // Invoices & Bills
                self::PERMISSION_INVOICES_VIEW_OWN,
                self::PERMISSION_INVOICES_CREATE,
                self::PERMISSION_INVOICES_UPDATE_OWN,
                // Payments
                self::PERMISSION_PAYMENTS_VIEW_OWN,
                self::PERMISSION_PAYMENTS_CREATE,
            ],
            self::ROLE_CUSTOMER => [
                self::PERMISSION_ITEMS_VIEW_OWN,
                self::PERMISSION_ITEMS_VIEW,
                self::PERMISSION_ITEMS_CREATE,
                self::PERMISSION_ITEMS_UPDATE_OWN,
                self::PERMISSION_PRODUCTS_VIEW_ANY,
                self::PERMISSION_CUSTOMERS_VIEW_OWN,
                self::PERMISSION_SALES_ORDERS_VIEW_OWN,
                self::PERMISSION_SALES_ORDERS_CREATE,
                self::PERMISSION_SALES_ORDERS_UPDATE_OWN,
                self::PERMISSION_INVOICES_VIEW_OWN,
                self::PERMISSION_INVOICES_CREATE,
                self::PERMISSION_INVOICES_UPDATE_OWN,
                self::PERMISSION_PAYMENTS_VIEW_OWN,
                self::PERMISSION_PAYMENTS_CREATE,
            ],
            self::ROLE_VENDOR => [
                self::PERMISSION_ITEMS_VIEW_OWN,
                self::PERMISSION_ITEMS_VIEW,
                self::PERMISSION_ITEMS_CREATE,
                self::PERMISSION_ITEMS_UPDATE_OWN,
                self::PERMISSION_PRODUCTS_VIEW_ANY,
                self::PERMISSION_VENDORS_VIEW_OWN,
                self::PERMISSION_PURCHASE_ORDERS_VIEW_OWN,
                self::PERMISSION_PURCHASE_ORDERS_CREATE,
                self::PERMISSION_PURCHASE_ORDERS_UPDATE_OWN,
                self::PERMISSION_INVOICES_VIEW_OWN,
                self::PERMISSION_INVOICES_CREATE,
                self::PERMISSION_INVOICES_UPDATE_OWN,
                self::PERMISSION_PAYMENTS_VIEW_OWN,
                self::PERMISSION_PAYMENTS_CREATE,
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

        if ($role === self::ROLE_ADMIN) {
            return true;
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

