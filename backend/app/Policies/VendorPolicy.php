<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vendor;
use App\Security\Rbac;

class VendorPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_VIEW_ANY);
    }

    public function view(User $user, Vendor $vendor): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_VIEW_ANY);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_CREATE);
    }

    public function update(User $user, Vendor $vendor): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_UPDATE);
    }

    public function delete(User $user, Vendor $vendor): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_VENDORS_DELETE);
    }
}
