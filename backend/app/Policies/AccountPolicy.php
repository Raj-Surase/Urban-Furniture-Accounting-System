<?php

namespace App\Policies;

use App\Models\Account;
use App\Models\User;
use App\Security\Rbac;

class AccountPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_ACCOUNTS_VIEW_ANY);
    }

    public function view(User $user, Account $account): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_ACCOUNTS_VIEW_ANY);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_ACCOUNTS_CREATE);
    }

    public function update(User $user, Account $account): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_ACCOUNTS_UPDATE);
    }

    public function delete(User $user, Account $account): bool
    {
        if (!$user->hasPermission(Rbac::PERMISSION_ACCOUNTS_DELETE)) {
            return false;
        }

        // Prevent deletion if account has posted journal entry lines
        return $account->journalLines()->count() === 0;
    }

    public function viewFinancial(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_REPORTS_VIEW_FINANCIAL);
    }
}
