<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vendor;
use App\Security\Rbac;

class VendorPolicy
{
    public function viewAny(User $user): bool
    {
        // Admins/managers/accountants: full directory access
        // Vendor/user roles: allowed to call index but receive scoped results (own records only)
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_VIEW_ANY) ||
               $user->hasPermission(Rbac::PERMISSION_VENDORS_VIEW_OWN);
    }

    public function view(User $user, Vendor $vendor): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_VIEW_ANY) ||
               $vendor->created_by === $user->id ||
               $vendor->email === $user->email;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_CREATE);
    }

    public function update(User $user, Vendor $vendor): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_VENDORS_UPDATE)) {
            return true;
        }

        // Only allow update of own vendor record
        return $vendor->created_by === $user->id || $vendor->email === $user->email;
    }

    public function delete(User $user, Vendor $vendor): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_DELETE);
    }
}
