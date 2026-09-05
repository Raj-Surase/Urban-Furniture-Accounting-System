<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PaymentTransaction extends Model
{
    use HasFactory;

    public const STATUS_INITIATED = 'initiated';
    public const STATUS_ORDER_CREATED = 'order_created';
    public const STATUS_AUTHORIZED = 'authorized';
    public const STATUS_CAPTURED = 'captured';
    public const STATUS_FAILED = 'failed';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_PARTIALLY_REFUNDED = 'partially_refunded';

    public const DIRECTION_INBOUND = 'inbound';
    public const DIRECTION_OUTBOUND = 'outbound';

    public const FLOW_INVOICE_SETTLEMENT = 'invoice_settlement';
    public const FLOW_SALES_ORDER_ADVANCE = 'sales_order_advance';
    public const FLOW_VENDOR_PAYOUT = 'vendor_payout';
    public const FLOW_REFUND = 'refund';

    protected $fillable = [
        'transaction_number',
        'direction',
        'flow_type',
        'status',
        'party_type',
        'party_id',
        'source_type',
        'source_id',
        'amount',
        'currency',
        'gateway',
        'razorpay_order_id',
        'razorpay_payment_id',
        'razorpay_signature',
        'razorpay_refund_id',
        'gateway_fee',
        'gateway_tax',
        'method_details',
        'error_code',
        'error_description',
        'payment_id',
        'idempotency_key',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_fee' => 'decimal:2',
        'gateway_tax' => 'decimal:2',
        'method_details' => 'array',
        'metadata' => 'array',
    ];

    protected $appends = [
        'party_name',
        'source_label',
    ];

    public function source(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'source_type', 'source_id');
    }

    public function party(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'party_type', 'party_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getPartyNameAttribute(): string
    {
        if ($this->relationLoaded('party') && $this->getRelation('party')) {
            return $this->getRelation('party')->name ?? 'Party #' . $this->party_id;
        }

        if ($this->party_type === 'customer') {
            return Customer::find($this->party_id)?->name ?? 'Customer #' . $this->party_id;
        }

        if ($this->party_type === 'vendor') {
            return Vendor::find($this->party_id)?->name ?? 'Vendor #' . $this->party_id;
        }

        return 'Party #' . $this->party_id;
    }

    public function getSourceLabelAttribute(): ?string
    {
        if (!$this->source_type || !$this->source_id) {
            return null;
        }

        if ($this->relationLoaded('source') && $this->getRelation('source')) {
            $src = $this->getRelation('source');
            return match ($this->source_type) {
                Invoice::class, 'invoice' => $src->invoice_number ?? "INV #{$src->id}",
                SalesOrder::class, 'sales_order' => $src->so_number ?? "SO #{$src->id}",
                default => class_basename($this->source_type) . " #{$src->id}",
            };
        }

        return class_basename($this->source_type) . " #{$this->source_id}";
    }

    public function isCaptured(): bool
    {
        return $this->status === self::STATUS_CAPTURED;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function isPending(): bool
    {
        return in_array($this->status, [self::STATUS_INITIATED, self::STATUS_ORDER_CREATED, self::STATUS_AUTHORIZED], true);
    }

    public function isRefunded(): bool
    {
        return in_array($this->status, [self::STATUS_REFUNDED, self::STATUS_PARTIALLY_REFUNDED], true);
    }
}

