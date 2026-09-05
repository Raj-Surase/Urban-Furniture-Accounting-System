<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;
use App\Security\Rbac;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_VIEW_ANY);
    }

    public function view(User $user, Customer $customer): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_VIEW_ANY);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_CREATE);
    }

    public function update(User $user, Customer $customer): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_UPDATE);
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_DELETE);
    }
}
