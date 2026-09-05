<?php

namespace App\Policies;

use App\Models\PurchaseOrder;
use App\Models\User;
use App\Security\Rbac;

class PurchaseOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PURCHASE_ORDERS_VIEW_ANY) ||
               $user->hasPermission(Rbac::PERMISSION_PURCHASE_ORDERS_VIEW_OWN);
    }

    public function view(User $user, PurchaseOrder $purchaseOrder): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_PURCHASE_ORDERS_VIEW_ANY)) {
            return true;
        }

        return $purchaseOrder->created_by === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PURCHASE_ORDERS_CREATE);
    }

    public function update(User $user, PurchaseOrder $purchaseOrder): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_PURCHASE_ORDERS_APPROVE)) {
            return in_array($purchaseOrder->status, ['draft', 'submitted'], true);
        }

        if ($user->hasPermission(Rbac::PERMISSION_PURCHASE_ORDERS_UPDATE_OWN)) {
            return $purchaseOrder->created_by === $user->id && $purchaseOrder->status === 'draft';
        }

        return false;
    }

    public function submit(User $user, PurchaseOrder $purchaseOrder): bool
    {
        if ($purchaseOrder->status !== 'draft') {
            return false;
        }

        return $user->isAdmin() || $user->isManager() || $purchaseOrder->created_by === $user->id;
    }

    public function approve(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PURCHASE_ORDERS_APPROVE) &&
               in_array($purchaseOrder->status, ['submitted', 'draft'], true);
    }

    public function reject(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PURCHASE_ORDERS_REJECT) &&
               in_array($purchaseOrder->status, ['submitted', 'draft'], true);
    }

    public function receive(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PURCHASE_ORDERS_RECEIVE) &&
               in_array($purchaseOrder->status, ['approved', 'partially_received'], true);
    }

    public function delete(User $user, PurchaseOrder $purchaseOrder): bool
    {
        if (!$user->hasPermission(Rbac::PERMISSION_PURCHASE_ORDERS_DELETE)) {
            return false;
        }

        return in_array($purchaseOrder->status, ['draft', 'cancelled', 'rejected'], true);
    }
}
