<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        "payment_number",
        "type",
        "invoice_id",
        "party_type",
        "party_id",
        "amount",
        "payment_date",
        "payment_method",
        "reference_number",
        "bank_account_id",
        "status",
        "notes",
        "reconciled_by",
        "reconciled_at",
        "created_by",
    ];

    protected $casts = [
        "amount" => "decimal:2",
        "payment_date" => "date",
        "reconciled_at" => "datetime",
    ];

    protected $appends = [
        "payment_type",
        "customer",
        "vendor",
    ];

    public function party(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, "party_type", "party_id");
    }

    public function getPaymentTypeAttribute(): string
    {
        return $this->type === "received" ? "customer_receipt" : "vendor_payment";
    }

    public function getCustomerAttribute(): ?Customer
    {
        if ($this->party_type === "customer") {
            return $this->relationLoaded("party") ? $this->getRelation("party") : Customer::find($this->party_id);
        }
        return null;
    }

    public function getVendorAttribute(): ?Vendor
    {
        if ($this->party_type === "vendor") {
            return $this->relationLoaded("party") ? $this->getRelation("party") : Vendor::find($this->party_id);
        }
        return null;
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, "bank_account_id");
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, "created_by");
    }

    public function reconciler(): BelongsTo
    {
        return $this->belongsTo(User::class, "reconciled_by");
    }
}
