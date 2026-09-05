<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name',
    'email',
    'login_id',
    'password',
    'role',
    'is_customer',
    'is_vendor',
    'company_name',
    'contact_person',
    'phone',
    'billing_address',
    'shipping_address',
    'city',
    'state',
    'country',
    'pincode',
    'gstin',
    'pan',
    'credit_limit',
    'payment_terms_days',
    'currency',
    'default_portal_view',
    'notes',
    'receivable_account_id',
    'payable_account_id',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Role constants
     */
    public const ROLE_ADMIN = 'admin';
    public const ROLE_MANAGER = 'manager';
    public const ROLE_ACCOUNTANT = 'accountant';
    public const ROLE_USER = 'user';
    public const ROLE_CUSTOMER = 'customer';
    public const ROLE_VENDOR = 'vendor';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_customer' => 'boolean',
            'is_vendor' => 'boolean',
            'credit_limit' => 'decimal:2',
            'payment_terms_days' => 'integer',
        ];
    }

    /**
     * Check if user has an admin role.
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Check if user has a manager role.
     */
    public function isManager(): bool
    {
        return $this->role === self::ROLE_MANAGER;
    }

    /**
     * Check if user has an accountant role.
     */
    public function isAccountant(): bool
    {
        return $this->role === self::ROLE_ACCOUNTANT || $this->role === self::ROLE_MANAGER;
    }

    /**
     * Check if user has a standard user role.
     */
    public function isStandardUser(): bool
    {
        return in_array($this->role, [self::ROLE_USER, self::ROLE_CUSTOMER, self::ROLE_VENDOR], true);
    }

    /**
     * Check if user is a customer or has customer clearance.
     */
    public function isCustomer(): bool
    {
        return $this->role === self::ROLE_CUSTOMER || (bool) $this->is_customer;
    }

    /**
     * Check if user is a vendor or has vendor clearance.
     */
    public function isVendor(): bool
    {
        return $this->role === self::ROLE_VENDOR || (bool) $this->is_vendor;
    }

    /**
     * Check if user has a specific role or one of given roles.
     *
     * @param string|array $roles
     */
    public function hasRole(string|array $roles): bool
    {
        if (is_array($roles)) {
            return in_array($this->role, $roles, true);
        }

        return $this->role === $roles;
    }

    /**
     * Check if user possesses a granular permission.
     */
    public function hasPermission(string $permission): bool
    {
        // Check primary role permission
        if (\App\Security\Rbac::hasPermission($this->role, $permission)) {
            return true;
        }

        // If user is designated as customer, evaluate customer permission map
        if ($this->isCustomer() && \App\Security\Rbac::hasPermission(self::ROLE_CUSTOMER, $permission)) {
            return true;
        }

        // If user is designated as vendor, evaluate vendor permission map
        if ($this->isVendor() && \App\Security\Rbac::hasPermission(self::ROLE_VENDOR, $permission)) {
            return true;
        }

        return false;
    }

    /**
     * Get all assigned permissions for the user.
     *
     * @return list<string>
     */
    public function getPermissions(): array
    {
        $perms = \App\Security\Rbac::getPermissionsForRole($this->role);

        if ($this->isCustomer()) {
            $perms = array_merge($perms, \App\Security\Rbac::getPermissionsForRole(self::ROLE_CUSTOMER));
        }

        if ($this->isVendor()) {
            $perms = array_merge($perms, \App\Security\Rbac::getPermissionsForRole(self::ROLE_VENDOR));
        }

        return array_values(array_unique($perms));
    }

    /**
     * User items relationship (sample CRUD boilerplate)
     */
    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }
}
