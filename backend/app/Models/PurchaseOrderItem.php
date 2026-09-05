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
        "description",
        "quantity_ordered",
        "quantity_received",
        "unit_price",
        "tax_rate",
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

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
