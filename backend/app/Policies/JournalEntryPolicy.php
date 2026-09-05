<?php

namespace App\Policies;

use App\Models\JournalEntry;
use App\Models\User;
use App\Security\Rbac;

class JournalEntryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_JOURNAL_VIEW_ANY);
    }

    public function view(User $user, JournalEntry $journalEntry): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_JOURNAL_VIEW_ANY);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_JOURNAL_POST);
    }

    public function post(User $user, JournalEntry $journalEntry): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_JOURNAL_POST) &&
               $journalEntry->status === 'draft';
    }

    public function reverse(User $user, JournalEntry $journalEntry): bool
    {
        return $user->hasPermission(Rbac::PERMISSION_JOURNAL_REVERSE) &&
               $journalEntry->status === 'posted';
    }

    public function delete(User $user, JournalEntry $journalEntry): bool
    {
        // Journal entries cannot be deleted once posted - immutability rule!
        return false;
    }
}
