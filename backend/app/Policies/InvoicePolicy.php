<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;
use App\Security\Rbac;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_INVOICES_VIEW_ANY) ||
               $user->hasPermission(Rbac::PERMISSION_INVOICES_VIEW_OWN);
    }

    public function view(User $user, Invoice $invoice): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_INVOICES_VIEW_ANY)) {
            return true;
        }

        return $invoice->created_by === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_INVOICES_CREATE);
    }

    public function update(User $user, Invoice $invoice): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_INVOICES_APPROVE)) {
            return in_array($invoice->status, ['draft', 'submitted'], true);
        }

        if ($user->hasPermission(Rbac::PERMISSION_INVOICES_UPDATE_OWN)) {
            return $invoice->created_by === $user->id && $invoice->status === 'draft';
        }

        return false;
    }

    public function approve(User $user, Invoice $invoice): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_INVOICES_APPROVE) &&
               in_array($invoice->status, ['draft', 'submitted'], true);
    }

    public function void(User $user, Invoice $invoice): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_INVOICES_VOID) &&
               in_array($invoice->status, ['approved', 'partially_paid'], true);
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        if (!$user->hasPermission(Rbac::PERMISSION_INVOICES_DELETE)) {
            return false;
        }

        return in_array($invoice->status, ['draft', 'cancelled'], true);
    }
}
