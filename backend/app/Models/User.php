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

#[Fillable(['name', 'email', 'login_id', 'password', 'role'])]
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
        return $this->role === self::ROLE_USER;
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
        return \App\Security\Rbac::hasPermission($this->role, $permission);
    }

    /**
     * Get all assigned permissions for the user.
     *
     * @return list<string>
     */
    public function getPermissions(): array
    {
        return \App\Security\Rbac::getPermissionsForRole($this->role);
    }

    /**
     * User items relationship (sample CRUD boilerplate)
     */
    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }
}
