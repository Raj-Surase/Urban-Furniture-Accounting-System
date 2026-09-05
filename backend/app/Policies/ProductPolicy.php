<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use App\Security\Rbac;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PRODUCTS_VIEW_ANY);
    }

    public function view(User $user, Product $product): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PRODUCTS_VIEW_ANY);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PRODUCTS_CREATE);
    }

    public function update(User $user, Product $product): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PRODUCTS_UPDATE);
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PRODUCTS_DELETE);
    }

    public function adjust(User $user, Product $product): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_INVENTORY_ADJUST);
    }
}
