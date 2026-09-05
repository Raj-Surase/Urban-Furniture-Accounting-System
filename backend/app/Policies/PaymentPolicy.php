<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;
use App\Security\Rbac;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PAYMENTS_VIEW_ANY) ||
               $user->hasPermission(Rbac::PERMISSION_PAYMENTS_VIEW_OWN);
    }

    public function view(User $user, Payment $payment): bool
    {
        if ($user->hasPermission(Rbac::PERMISSION_PAYMENTS_VIEW_ANY)) {
            return true;
        }

        if ($user->hasPermission(Rbac::PERMISSION_PAYMENTS_VIEW_OWN)) {
            return $payment->created_by === $user->id ||
                   ($payment->invoice && $payment->invoice->created_by === $user->id);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PAYMENTS_CREATE);
    }

    public function reconcile(User $user, Payment $payment): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PAYMENTS_RECONCILE) &&
               $payment->status !== 'cleared';
    }

    public function delete(User $user, Payment $payment): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_PAYMENTS_DELETE) &&
               $payment->status !== 'cleared';
    }
}
