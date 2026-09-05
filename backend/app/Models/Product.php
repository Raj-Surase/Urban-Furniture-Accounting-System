<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        "sku",
        "name",
        "hsn_code",
        "description",
        "category",
        "type",
        "unit_price",
        "cost_price",
        "gst_rate",
        "unit_of_measure",
        "current_stock",
        "minimum_stock",
        "reorder_point",
        "inventory_account_id",
        "cogs_account_id",
        "revenue_account_id",
        "is_active",
        "created_by",
    ];

    protected $casts = [
        "unit_price" => "decimal:2",
        "cost_price" => "decimal:2",
        "gst_rate" => "decimal:2",
        "current_stock" => "decimal:2",
        "minimum_stock" => "decimal:2",
        "reorder_point" => "decimal:2",
        "is_active" => "boolean",
    ];

    public function inventoryAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, "inventory_account_id");
    }

    public function cogsAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, "cogs_account_id");
    }

    public function revenueAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, "revenue_account_id");
    }

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, "created_by");
    }

    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->reorder_point;
    }
}
