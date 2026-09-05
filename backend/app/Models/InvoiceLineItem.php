<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceLineItem extends Model
{
    use HasFactory;

    protected $fillable = [
        "invoice_id",
        "product_id",
        "account_id",
        "description",
        "quantity",
        "unit_price",
        "discount_percent",
        "tax_rate",
        "tax_amount",
        "line_total",
    ];

    protected $casts = [
        "quantity" => "decimal:2",
        "unit_price" => "decimal:2",
        "discount_percent" => "decimal:2",
        "tax_rate" => "decimal:2",
        "tax_amount" => "decimal:2",
        "line_total" => "decimal:2",
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
