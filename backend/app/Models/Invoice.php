<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Invoice Model
 *
 * Represents both accounts-receivable (sales) and accounts-payable (purchase)
 * invoices. Stores GST breakdown (CGST / SGST / IGST), discount amounts, and
 * payment tracking. Status flows: draft → approved → partially_paid → paid | void.
 *
 * @property int         $id
 * @property string      $invoice_number
 * @property string      $type              receivable|payable
 * @property string      $status            draft|approved|partially_paid|paid|void
 * @property string      $party_type        customer|vendor
 * @property int         $party_id
 * @property string      $place_of_supply
 * @property bool        $is_interstate
 * @property string|null $gstin
 * @property string      $invoice_date
 * @property string      $due_date
 * @property float       $subtotal
 * @property float       $tax_amount
 * @property float       $cgst_amount
 * @property float       $sgst_amount
 * @property float       $igst_amount
 * @property float       $discount_amount
 * @property float       $total_amount
 * @property float       $amount_paid
 * @property float       $balance_due
 * @property string      $currency
 */
class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        "invoice_number",
        "type",
        "status",
        "reference_type",
        "reference_id",
        "party_type",
        "party_id",
        "place_of_supply",
        "is_interstate",
        "gstin",
        "invoice_date",
        "due_date",
        "payment_date",
        "subtotal",
        "tax_amount",
        "cgst_amount",
        "sgst_amount",
        "igst_amount",
        "discount_amount",
        "total_amount",
        "amount_paid",
        "balance_due",
        "payment_terms_days",
        "currency",
        "notes",
        "approved_by",
        "approved_at",
        "created_by",
    ];

    protected $casts = [
        "invoice_date" => "date",
        "due_date" => "date",
        "payment_date" => "date",
        "approved_at" => "datetime",
        "is_interstate" => "boolean",
        "subtotal" => "decimal:2",
        "tax_amount" => "decimal:2",
        "cgst_amount" => "decimal:2",
        "sgst_amount" => "decimal:2",
        "igst_amount" => "decimal:2",
        "discount_amount" => "decimal:2",
        "total_amount" => "decimal:2",
        "amount_paid" => "decimal:2",
        "balance_due" => "decimal:2",
        "payment_terms_days" => "integer",
    ];

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceLineItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, "created_by");
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, "approved_by");
    }

    public function getPartyAttribute()
    {
        if ($this->party_type === "customer") {
            return Customer::find($this->party_id);
        }
        if ($this->party_type === "vendor") {
            return Vendor::find($this->party_id);
        }
        return null;
    }
}
