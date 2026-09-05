<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        "so_number",
        "customer_id",
        "status",
        "place_of_supply",
        "is_interstate",
        "gstin",
        "order_date",
        "expected_delivery_date",
        "delivery_date",
        "subtotal",
        "discount_amount",
        "tax_amount",
        "cgst_amount",
        "sgst_amount",
        "igst_amount",
        "total_amount",
        "shipping_address",
        "notes",
        "terms_conditions",
        "approved_by",
        "approved_at",
        "created_by",
    ];

    protected $casts = [
        "order_date" => "date",
        "expected_delivery_date" => "date",
        "delivery_date" => "date",
        "approved_at" => "datetime",
        "is_interstate" => "boolean",
        "subtotal" => "decimal:2",
        "discount_amount" => "decimal:2",
        "tax_amount" => "decimal:2",
        "cgst_amount" => "decimal:2",
        "sgst_amount" => "decimal:2",
        "igst_amount" => "decimal:2",
        "total_amount" => "decimal:2",
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, "created_by");
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, "approved_by");
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, "reference_id")
            ->where("reference_type", SalesOrder::class);
    }
}
