<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        "name",
        "code",
        "contact_person",
        "email",
        "phone",
        "billing_address",
        "shipping_address",
        "city",
        "state",
        "country",
        "pincode",
        "gstin",
        "credit_limit",
        "payment_terms_days",
        "receivable_account_id",
        "currency",
        "is_active",
        "notes",
        "created_by",
    ];

    protected static function booted(): void
    {
        static::creating(function (Customer $customer) {
            if (empty($customer->code)) {
                $customer->code = \App\Services\SequenceService::generate('CUST', null, 3);
            }
        });
    }

    protected $casts = [
        "is_active" => "boolean",
        "credit_limit" => "decimal:2",
        "payment_terms_days" => "integer",
    ];

    protected $appends = [
        "outstanding_balance",
    ];

    /**
     * Outstanding accounts receivable balance (sum of balance_due on active approved, partially_paid, or overdue invoices).
     */
    public function getOutstandingBalanceAttribute(): float
    {
        if (array_key_exists('outstanding_balance', $this->attributes) && $this->attributes['outstanding_balance'] !== null) {
            return (float) $this->attributes['outstanding_balance'];
        }

        return (float) ($this->invoices()
            ->whereIn('status', ['approved', 'partially_paid', 'overdue'])
            ->sum('balance_due') ?? 0.00);
    }

    public function receivableAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, "receivable_account_id");
    }

    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, "created_by");
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, "party_id")->where("party_type", "customer");
    }
}
