<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        "product_id",
        "type",
        "quantity",
        "unit_cost",
        "total_value",
        "reference_type",
        "reference_id",
        "notes",
        "performed_by",
    ];

    protected $casts = [
        "quantity" => "decimal:2",
        "unit_cost" => "decimal:2",
        "total_value" => "decimal:2",
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, "performed_by");
    }
}
