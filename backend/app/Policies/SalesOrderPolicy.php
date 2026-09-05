<?php

namespace App\Policies;

use App\Models\SalesOrder;
use App\Models\User;
use App\Security\Rbac;

class SalesOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_SALES_ORDERS_VIEW_ANY) ||
               $user->hasPermission(Rbac::PERMISSION_SALES_ORDERS_VIEW_OWN);
    }

    public function view(User $user, SalesOrder $salesOrder): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_SALES_ORDERS_VIEW_ANY)) {
            return true;
        }

        return $salesOrder->created_by === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_SALES_ORDERS_CREATE);
    }

    public function update(User $user, SalesOrder $salesOrder): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_SALES_ORDERS_APPROVE)) {
            return in_array($salesOrder->status, ['draft', 'confirmed'], true);
        }

        if ($user->hasPermission(Rbac::PERMISSION_SALES_ORDERS_UPDATE_OWN)) {
            return $salesOrder->created_by === $user->id && $salesOrder->status === 'draft';
        }

        return false;
    }

    public function confirm(User $user, SalesOrder $salesOrder): bool
    {
        if ($salesOrder->status !== 'draft') {
            return false;
        }

        return $user->isAdmin() || $user->isManager() || $salesOrder->created_by === $user->id;
    }

    public function approve(User $user, SalesOrder $salesOrder): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_SALES_ORDERS_APPROVE) &&
               in_array($salesOrder->status, ['confirmed', 'draft'], true);
    }

    public function invoice(User $user, SalesOrder $salesOrder): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_SALES_ORDERS_INVOICE) &&
               in_array($salesOrder->status, ['approved', 'delivered'], true);
    }

    public function deliver(User $user, SalesOrder $salesOrder): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_SALES_ORDERS_DELIVER) &&
               in_array($salesOrder->status, ['approved', 'invoiced'], true);
    }

    public function delete(User $user, SalesOrder $salesOrder): bool
    {
        if (!$user->hasPermission(Rbac::PERMISSION_SALES_ORDERS_DELETE)) {
            return false;
        }

        return in_array($salesOrder->status, ['draft', 'cancelled'], true);
    }
}
