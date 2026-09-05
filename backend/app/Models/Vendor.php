<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    use HasFactory;

    protected $fillable = [
        "name",
        "code",
        "contact_person",
        "email",
        "phone",
        "address",
        "city",
        "state",
        "country",
        "gstin",
        "pan",
        "payment_terms_days",
        "payable_account_id",
        "currency",
        "is_active",
        "notes",
        "created_by",
    ];

    protected $casts = [
        "is_active" => "boolean",
        "payment_terms_days" => "integer",
    ];

    public function payableAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, "payable_account_id");
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, "created_by");
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, "party_id")->where("party_type", "vendor");
    }
}
