<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        "code",
        "name",
        "type",
        "sub_type",
        "parent_id",
        "normal_balance",
        "opening_balance",
        "current_balance",
        "description",
        "is_active",
        "created_by",
    ];

    protected $casts = [
        "is_active" => "boolean",
        "opening_balance" => "decimal:2",
        "current_balance" => "decimal:2",
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Account::class, "parent_id");
    }

    public function children(): HasMany
    {
        return $this->hasMany(Account::class, "parent_id");
    }

    public function journalLines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, "created_by");
    }

    public function recalculateBalance(): void
    {
        $debits = $this->journalLines()->sum("debit");
        $credits = $this->journalLines()->sum("credit");

        if ($this->normal_balance === "debit") {
            $this->current_balance = $this->opening_balance + ($debits - $credits);
        } else {
            $this->current_balance = $this->opening_balance + ($credits - $debits);
        }

        $this->save();
    }
}
