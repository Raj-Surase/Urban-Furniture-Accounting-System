<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'responsible_id',
        'status', // 'draft', 'confirm', 'revised', 'cancelled'
        'original_budget_id',
        'revised_budget_id',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(BudgetLine::class);
    }

    public function responsible(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'responsible_id');
    }

    public function originalBudget(): BelongsTo
    {
        return $this->belongsTo(Budget::class, 'original_budget_id');
    }

    public function revisedBudget(): BelongsTo
    {
        return $this->belongsTo(Budget::class, 'revised_budget_id');
    }

    /**
     * Compute Achieved statistics for all lines in this budget.
     */
    public function getComputedLinesAttribute(): array
    {
        $startDate = $this->start_date?->format('Y-m-d') ?? $this->start_date;
        $endDate = $this->end_date?->format('Y-m-d') ?? $this->end_date;

        $computed = [];
        foreach ($this->lines()->with('analyticAccount')->get() as $line) {
            $analyticId = $line->analytic_account_id;
            $type = $line->type; // 'income' or 'expense'
            $committed = (float) $line->committed_amount;

            // Achieved Amount lookup:
            // Income -> Invoices where invoice_type != 'vendor' (or customer invoices)
            // Expense -> Vendor Bills (invoice_type = 'vendor')
            $query = DB::table('invoice_line_items')
                ->join('invoices', 'invoices.id', '=', 'invoice_line_items.invoice_id')
                ->where('invoice_line_items.analytic_account_id', $analyticId)
                ->where('invoices.status', '!=', 'draft')
                ->where('invoices.status', '!=', 'void');

            if ($startDate && $endDate) {
                $query->whereBetween('invoices.issue_date', [$startDate, $endDate]);
            }

            if ($type === 'income') {
                $query->where(function ($q) {
                    $q->where('invoices.invoice_type', '!=', 'vendor')
                      ->orWhereNull('invoices.invoice_type');
                });
            } else {
                $query->where('invoices.invoice_type', '=', 'vendor');
            }

            $achieved = (float) $query->sum('invoice_line_items.line_total');

            $achievedPercent = $committed > 0 ? round(($achieved / $committed) * 100, 2) : 0;
            $amountToAchieve = max(0, $committed - $achieved);

            $computed[] = [
                'id' => $line->id,
                'analytic_account_id' => $analyticId,
                'analytic_account_name' => $line->analyticAccount?->name ?? 'N/A',
                'type' => $type,
                'committed_amount' => $committed,
                'achieved_amount' => $achieved,
                'achieved_percent' => $achievedPercent,
                'amount_to_achieve' => $amountToAchieve,
            ];
        }

        return $computed;
    }
}
