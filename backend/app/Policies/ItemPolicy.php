<?php

namespace App\Policies;

use App\Models\Item;
use App\Models\User;
use App\Security\Rbac;
use Illuminate\Auth\Access\HandlesAuthorization;

class ItemPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any items.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_ITEMS_VIEW_ANY) ||
               $user->hasPermission(Rbac::PERMISSION_ITEMS_VIEW_OWN);
    }

    /**
     * Determine whether the user can view the specific item.
     */
    public function view(User $user, Item $item): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_ITEMS_VIEW);
    }

    /**
     * Determine whether the user can create items.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_ITEMS_CREATE);
    }

    /**
     * Determine whether the user can update the item.
     * - Admins and Managers can update ANY item.
     * - Standard users can only update THEIR OWN item.
     */
    public function update(User $user, Item $item): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_ITEMS_UPDATE_ANY)) {
            return true;
        }

        if ($user->hasPermission(Rbac::PERMISSION_ITEMS_UPDATE_OWN)) {
            return $item->user_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the item.
     * Strict access policy: Only Admins can delete items.
     */
    public function delete(User $user, Item $item): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_ITEMS_DELETE_ANY);
    }
}

