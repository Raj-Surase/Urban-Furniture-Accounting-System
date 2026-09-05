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
        "gstin",
        "credit_limit",
        "payment_terms_days",
        "receivable_account_id",
        "currency",
        "is_active",
        "notes",
        "created_by",
    ];

    protected $casts = [
        "is_active" => "boolean",
        "credit_limit" => "decimal:2",
        "payment_terms_days" => "integer",
    ];

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
