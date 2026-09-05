<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;
use App\Security\Rbac;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        // Admins/managers/accountants: full directory access
        // Customer/vendor/user roles: allowed to call index but receive scoped results (own records only)
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_VIEW_ANY) ||
               $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_VIEW_OWN);
    }

    public function view(User $user, Customer $customer): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_VIEW_ANY) ||
               $customer->created_by === $user->id ||
               $customer->email === $user->email;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_CREATE);
    }

    public function update(User $user, Customer $customer): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_CUSTOMERS_UPDATE)) {
            return true;
        }

        // Only allow update of own customer record
        return $customer->created_by === $user->id || $customer->email === $user->email;
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_CUSTOMERS_DELETE);
    }
}
