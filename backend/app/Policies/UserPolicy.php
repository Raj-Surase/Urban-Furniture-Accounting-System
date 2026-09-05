<?php

namespace App\Policies;

use App\Models\User;
use App\Security\Rbac;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view user list/directory.
     * Accessible by Admins and Managers.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_USERS_VIEW_ANY);
    }

    /**
     * Determine whether the user can change user roles.
     * Strict access policy: Only Admins can manage roles.
     */
    public function updateRole(User $user, ?User $targetUser = null): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_USERS_MANAGE_ROLES);
    }

    /**
     * Determine whether the user can create users.
     * Strict access policy: Only Admins can provision new users.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete another user.
     */
    public function delete(User $user, User $targetUser): bool
    {
        if (! $user->isAdmin()) {
            return false;
        }

        // Cannot delete oneself
        return $user->id !== $targetUser->id;
    }

    /**
     * Determine whether the user can access system telemetry & stats.
     */
    public function viewTelemetry(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_SYSTEM_TELEMETRY);
    }
}

