<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vendor;
use App\Security\Rbac;

class VendorPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_VIEW_ANY) ||
               $user->isVendor() ||
               $user->isStandardUser();
    }

    public function view(User $user, Vendor $vendor): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_VIEW_ANY) ||
               $user->isVendor() ||
               $user->isStandardUser() ||
               $vendor->created_by === $user->id ||
               $vendor->email === $user->email;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_CREATE) ||
               $user->isVendor() ||
               $user->isStandardUser();
    }

    public function update(User $user, Vendor $vendor): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_VENDORS_UPDATE)) {
            return true;
        }

        if ($user->isVendor() || $user->isStandardUser()) {
            return true;
        }

        return $vendor->created_by === $user->id || $vendor->email === $user->email;
    }

    public function delete(User $user, Vendor $vendor): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_DELETE);
    }
}
