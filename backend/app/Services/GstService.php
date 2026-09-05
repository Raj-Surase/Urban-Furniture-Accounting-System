<?php

namespace App\Services;

class GstService
{
    public const COMPANY_STATE = 'Maharashtra';
    public const COMPANY_STATE_CODE = '27';
    public const COMPANY_GSTIN = '27AAACU9988E1Z4';

    /**
     * Determine whether a transaction is interstate or intrastate.
     */
    public static function isInterstate(?string $state, ?string $gstin = null): bool
    {
        if ($gstin && strlen($gstin) >= 2) {
            $gstinStateCode = substr($gstin, 0, 2);
            if ($gstinStateCode !== self::COMPANY_STATE_CODE) {
                return true;
            }
        }

        if ($state) {
            $cleanState = strtolower(trim($state));
            if (!str_contains($cleanState, 'maharashtra') && !str_contains($cleanState, '27')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate CGST, SGST, IGST breakdown based on taxable amount and tax rate.
     *
     * @return array{taxable: float, tax_rate: float, is_interstate: bool, cgst_rate: float, cgst_amount: float, sgst_rate: float, sgst_amount: float, igst_rate: float, igst_amount: float, tax_amount: float, total_amount: float}
     */
    public static function calculate(float $taxable, float $taxRate = 18.00, bool $isInterstate = false): array
    {
        $taxable = max(0, round($taxable, 2));
        $taxRate = max(0, $taxRate);

        if ($isInterstate) {
            $cgstRate = 0.00;
            $cgstAmount = 0.00;
            $sgstRate = 0.00;
            $sgstAmount = 0.00;
            $igstRate = $taxRate;
            $igstAmount = round($taxable * ($igstRate / 100), 2);
            $totalTax = $igstAmount;
        } else {
            $cgstRate = round($taxRate / 2, 2);
            $cgstAmount = round($taxable * ($cgstRate / 100), 2);
            $sgstRate = round($taxRate / 2, 2);
            $sgstAmount = round($taxable * ($sgstRate / 100), 2);
            $igstRate = 0.00;
            $igstAmount = 0.00;
            $totalTax = $cgstAmount + $sgstAmount;
        }

        return [
            'taxable' => $taxable,
            'tax_rate' => $taxRate,
            'is_interstate' => $isInterstate,
            'cgst_rate' => $cgstRate,
            'cgst_amount' => $cgstAmount,
            'sgst_rate' => $sgstRate,
            'sgst_amount' => $sgstAmount,
            'igst_rate' => $igstRate,
            'igst_amount' => $igstAmount,
            'tax_amount' => $totalTax,
            'total_amount' => round($taxable + $totalTax, 2),
        ];
    }
}
