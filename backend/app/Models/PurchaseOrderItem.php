<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        "purchase_order_id",
        "product_id",
        "hsn_code",
        "description",
        "quantity_ordered",
        "quantity_received",
        "unit_price",
        "tax_rate",
        "cgst_rate",
        "cgst_amount",
        "sgst_rate",
        "sgst_amount",
        "igst_rate",
        "igst_amount",
        "tax_amount",
        "line_total",
    ];

    protected $casts = [
        "quantity_ordered" => "decimal:2",
        "quantity_received" => "decimal:2",
        "unit_price" => "decimal:2",
        "tax_rate" => "decimal:2",
        "tax_amount" => "decimal:2",
        "line_total" => "decimal:2",
    ];

    protected $appends = [
        "quantity",
        "gst_rate",
        "total_amount",
    ];

    public function getQuantityAttribute(): float
    {
        return (float) $this->quantity_ordered;
    }

    public function getGstRateAttribute(): float
    {
        return (float) ($this->tax_rate ?? 18);
    }

    public function getTotalAmountAttribute(): float
    {
        return (float) ($this->line_total ?? 0);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
