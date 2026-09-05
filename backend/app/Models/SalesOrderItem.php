<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        "sales_order_id",
        "product_id",
        "description",
        "quantity_ordered",
        "quantity_delivered",
        "unit_price",
        "discount_percent",
        "tax_rate",
        "tax_amount",
        "line_total",
    ];

    protected $casts = [
        "quantity_ordered" => "decimal:2",
        "quantity_delivered" => "decimal:2",
        "unit_price" => "decimal:2",
        "discount_percent" => "decimal:2",
        "tax_rate" => "decimal:2",
        "tax_amount" => "decimal:2",
        "line_total" => "decimal:2",
    ];

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
