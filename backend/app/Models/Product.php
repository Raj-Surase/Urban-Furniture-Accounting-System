<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Product Model
 *
 * Represents a furniture product in the catalog. Tracks stock levels,
 * GST rate (HSN-based), and links to three GL accounts: inventory, COGS,
 * and revenue. Used across purchase orders, sales orders, and invoices.
 *
 * @property int         $id
 * @property string      $sku
 * @property string      $name
 * @property string      $hsn_code         HSN code for GST classification
 * @property string|null $description
 * @property string|null $category
 * @property string      $type             goods|service
 * @property float       $unit_price
 * @property float       $cost_price
 * @property float       $gst_rate         GST percentage (e.g., 18.00)
 * @property string      $unit_of_measure  pcs|sqft|kg|mtr
 * @property float       $current_stock
 * @property float       $minimum_stock
 * @property float       $reorder_point
 * @property bool        $is_active
 */
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

    protected $appends = [
        'price',
    ];

    public function getPriceAttribute(): ?string
    {
        return isset($this->attributes['unit_price']) ? (string) $this->attributes['unit_price'] : null;
    }

    public function setPriceAttribute($value): void
    {
        $this->attributes['unit_price'] = $value;
    }

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
