<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;
use App\Security\Rbac;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_VIEW_ANY) ||
               $user->isCustomer() ||
               $user->isStandardUser();
    }

    public function view(User $user, Customer $customer): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_VIEW_ANY) ||
               $user->isCustomer() ||
               $user->isStandardUser() ||
               $customer->created_by === $user->id ||
               $customer->email === $user->email;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_CREATE) ||
               $user->isCustomer() ||
               $user->isStandardUser();
    }

    public function update(User $user, Customer $customer): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_CUSTOMERS_UPDATE)) {
            return true;
        }

        if ($user->isCustomer() || $user->isStandardUser()) {
            return true;
        }

        return $customer->created_by === $user->id || $customer->email === $user->email;
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_DELETE);
    }
}
