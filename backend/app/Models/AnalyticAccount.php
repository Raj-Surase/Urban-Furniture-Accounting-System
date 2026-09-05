<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnalyticAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type', // 'income', 'expense'
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function budgetLines(): HasMany
    {
        return $this->hasMany(BudgetLine::class);
    }

    public function invoiceLines(): HasMany
    {
        return $this->hasMany(InvoiceLineItem::class, 'analytic_account_id');
    }

    public function purchaseOrderLines(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class, 'analytic_account_id');
    }

    public function salesOrderLines(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class, 'analytic_account_id');
    }
}
