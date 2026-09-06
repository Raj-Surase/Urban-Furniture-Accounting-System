<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        "po_number",
        "vendor_id",
        "status",
        "place_of_supply",
        "is_interstate",
        "gstin",
        "order_date",
        "expected_delivery_date",
        "delivery_date",
        "subtotal",
        "tax_amount",
        "cgst_amount",
        "sgst_amount",
        "igst_amount",
        "discount_amount",
        "total_amount",
        "is_custom",
        "customization_details",
        "notes",
        "terms_conditions",
        "approved_by",
        "approved_at",
        "rejected_reason",
        "created_by",
    ];

    protected $casts = [
        "order_date" => "date",
        "expected_delivery_date" => "date",
        "delivery_date" => "date",
        "approved_at" => "datetime",
        "is_interstate" => "boolean",
        "is_custom" => "boolean",
        "customization_details" => "array",
        "subtotal" => "decimal:2",
        "tax_amount" => "decimal:2",
        "cgst_amount" => "decimal:2",
        "sgst_amount" => "decimal:2",
        "igst_amount" => "decimal:2",
        "discount_amount" => "decimal:2",
        "total_amount" => "decimal:2",
    ];

    protected $appends = [
        "custom_tags",
    ];

    public function getCustomTagsAttribute(): array
    {
        if (!empty($this->customization_details['tags']) && is_array($this->customization_details['tags'])) {
            return $this->customization_details['tags'];
        }

        $tags = [];
        if ($this->is_custom) {
            $tags[] = '3D Custom';
        }

        if (!empty($this->customization_details)) {
            $details = $this->customization_details;
            if (!empty($details['wood'])) {
                $tags[] = $details['wood'];
            }
            if (!empty($details['model'])) {
                $tags[] = $details['model'];
            }
            if (!empty($details['dimensions'])) {
                $dims = $details['dimensions'];
                if (is_array($dims) && isset($dims['width'], $dims['depth'], $dims['height'])) {
                    $tags[] = "{$dims['width']}x{$dims['depth']}x{$dims['height']}cm";
                } elseif (is_string($dims)) {
                    $tags[] = $dims;
                }
            }
            if (!empty($details['upholstery'])) {
                $tags[] = $details['upholstery'];
            }
        } elseif ($this->notes && str_contains($this->notes, '[3D Workshop Custom Order]')) {
            $tags[] = '3D Custom';
        }

        return array_values(array_unique($tags));
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
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
            ->where("reference_type", PurchaseOrder::class);
    }
}
