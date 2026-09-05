<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        "entry_number",
        "journal_id",
        "type",
        "reference_type",
        "reference_id",
        "description",
        "posting_date",
        "fiscal_year",
        "period",
        "status",
        "reversed_entry_id",
        "posted_by",
        "posted_at",
        "created_by",
    ];

    protected $casts = [
        "posting_date" => "date",
        "posted_at" => "datetime",
        "fiscal_year" => "integer",
        "period" => "integer",
    ];

    protected $appends = [
        "total_debit",
        "total_credit",
    ];

    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, "created_by");
    }

    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, "posted_by");
    }

    public function reversedEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, "reversed_entry_id");
    }

    public function getTotalDebitAttribute(): float
    {
        return (float) $this->lines()->sum("debit");
    }

    public function getTotalCreditAttribute(): float
    {
        return (float) $this->lines()->sum("credit");
    }

    public function isBalanced(): bool
    {
        return abs($this->total_debit - $this->total_credit) < 0.01;
    }
}
