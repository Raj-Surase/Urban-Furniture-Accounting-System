<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SequenceService
{
    /**
     * Generate the next atomic, sequential document identifier without race conditions.
     *
     * @param string $prefix Document prefix (e.g., 'JE', 'INV', 'BILL', 'PO', 'SO', 'PAY', 'CUST', 'VEN')
     * @param int|null $year Optional fiscal/calendar year for dated prefixes
     * @param int $padding Number of digits to pad (default 4)
     * @return string
     */
    public static function generate(string $prefix, ?int $year = null, int $padding = 4): string
    {
        return DB::transaction(function () use ($prefix, $year, $padding) {
            $key = $year ? "{$prefix}_{$year}" : $prefix;

            if (!Schema::hasTable('document_sequences')) {
                // Fallback if migration has not run
                return self::formatNumber($prefix, $year, rand(1000, 9999), $padding);
            }

            $seq = DB::table('document_sequences')
                ->where('name', $key)
                ->lockForUpdate()
                ->first();

            if (!$seq) {
                $maxExisting = self::findMaxExistingNumber($prefix, $year);
                DB::table('document_sequences')->insert([
                    'name' => $key,
                    'current_number' => $maxExisting,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $nextNumber = $maxExisting + 1;
            } else {
                $nextNumber = (int) $seq->current_number + 1;
            }

            // Ensure no collision with manually inserted numbers
            do {
                $formatted = self::formatNumber($prefix, $year, $nextNumber, $padding);
                $exists = self::checkNumberExists($prefix, $formatted);
                if ($exists) {
                    $nextNumber++;
                }
            } while ($exists);

            DB::table('document_sequences')
                ->where('name', $key)
                ->update([
                    'current_number' => $nextNumber,
                    'updated_at' => now(),
                ]);

            return $formatted;
        });
    }

    private static function formatNumber(string $prefix, ?int $year, int $number, int $padding): string
    {
        if ($year !== null) {
            return sprintf("%s-%s-%0{$padding}d", $prefix, $year, $number);
        }
        return sprintf("%s-%0{$padding}d", $prefix, $number);
    }

    private static function findMaxExistingNumber(string $prefix, ?int $year): int
    {
        $max = 0;
        $pattern = $year ? "{$prefix}-{$year}-" : "{$prefix}-";

        $strings = match ($prefix) {
            'JE' => JournalEntry::where('entry_number', 'like', "{$pattern}%")->pluck('entry_number'),
            'INV' => Invoice::where('type', 'receivable')->where('invoice_number', 'like', "{$pattern}%")->pluck('invoice_number'),
            'BILL' => Invoice::where('type', 'payable')->where('invoice_number', 'like', "{$pattern}%")->pluck('invoice_number'),
            'PO' => PurchaseOrder::where('po_number', 'like', "{$pattern}%")->pluck('po_number'),
            'SO' => SalesOrder::where('so_number', 'like', "{$pattern}%")->pluck('so_number'),
            'PAY' => Payment::where('payment_number', 'like', "{$pattern}%")->pluck('payment_number'),
            'CUST' => Customer::where('code', 'like', "{$pattern}%")->pluck('code'),
            'VEN' => Vendor::where('code', 'like', "{$pattern}%")->pluck('code'),
            default => collect(),
        };

        foreach ($strings as $str) {
            // Extract the trailing digits
            if (preg_match('/(\d+)$/', $str, $matches)) {
                $val = (int) $matches[1];
                if ($val > $max) {
                    $max = $val;
                }
            }
        }

        return $max;
    }

    private static function checkNumberExists(string $prefix, string $formatted): bool
    {
        return match ($prefix) {
            'JE' => JournalEntry::where('entry_number', $formatted)->exists(),
            'INV' => Invoice::where('invoice_number', $formatted)->exists(),
            'BILL' => Invoice::where('invoice_number', $formatted)->exists(),
            'PO' => PurchaseOrder::where('po_number', $formatted)->exists(),
            'SO' => SalesOrder::where('so_number', $formatted)->exists(),
            'PAY' => Payment::where('payment_number', $formatted)->exists(),
            'CUST' => Customer::where('code', $formatted)->exists(),
            'VEN' => Vendor::where('code', $formatted)->exists(),
            default => false,
        };
    }
}
