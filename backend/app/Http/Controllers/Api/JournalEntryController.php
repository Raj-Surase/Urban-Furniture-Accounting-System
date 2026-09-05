<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Services\RealtimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class JournalEntryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', JournalEntry::class);

        $query = JournalEntry::with(['lines.account', 'creator', 'poster'])->latest('posting_date');

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($from = $request->query('from_date')) {
            $query->where('posting_date', '>=', $from);
        }

        if ($to = $request->query('to_date')) {
            $query->where('posting_date', '<=', $to);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('entry_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $entries = $query->paginate($request->query('per_page', 20));

        return response()->json($entries);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', JournalEntry::class);

        $validated = $request->validate([
            'description' => ['required', 'string', 'max:500'],
            'posting_date' => ['required', 'date'],
            'lines' => ['required', 'array', 'min:2'],
            'lines.*.account_id' => ['required', 'exists:accounts,id'],
            'lines.*.debit' => ['required', 'numeric', 'min:0'],
            'lines.*.credit' => ['required', 'numeric', 'min:0'],
            'lines.*.description' => ['nullable', 'string', 'max:255'],
            'lines.*.reference' => ['nullable', 'string', 'max:100'],
        ]);

        $totalDebit = 0.00;
        $totalCredit = 0.00;

        foreach ($validated['lines'] as $line) {
            $dr = (float) $line['debit'];
            $cr = (float) $line['credit'];
            if ($dr > 0 && $cr > 0) {
                return response()->json(['message' => 'A single journal line cannot have both debit and credit.'], 422);
            }
            $totalDebit += $dr;
            $totalCredit += $cr;
        }

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return response()->json([
                'message' => "Journal Entry is not balanced! Total Debit: {$totalDebit}, Total Credit: {$totalCredit}.",
            ], 422);
        }

        $year = now()->format('Y');
        $count = JournalEntry::whereYear('created_at', $year)->count() + 1;
        $entryNumber = sprintf("JE-%s-%04d", $year, $count);

        return DB::transaction(function () use ($validated, $entryNumber, $request) {
            $je = JournalEntry::create([
                'entry_number' => $entryNumber,
                'type' => 'manual',
                'description' => $validated['description'],
                'posting_date' => $validated['posting_date'],
                'fiscal_year' => (int) now()->format('Y'),
                'period' => (int) now()->format('n'),
                'status' => 'posted',
                'posted_by' => $request->user()->id,
                'posted_at' => now(),
                'created_by' => $request->user()->id,
            ]);

            $accountsToRecalc = [];
            foreach ($validated['lines'] as $lineData) {
                $account = Account::findOrFail($lineData['account_id']);
                JournalEntryLine::create([
                    'journal_entry_id' => $je->id,
                    'account_id' => $account->id,
                    'account_code' => $account->code,
                    'account_name' => $account->name,
                    'debit' => (float) $lineData['debit'],
                    'credit' => (float) $lineData['credit'],
                    'description' => $lineData['description'] ?? null,
                    'reference' => $lineData['reference'] ?? null,
                ]);
                $accountsToRecalc[$account->id] = $account;
            }

            foreach ($accountsToRecalc as $acc) {
                $acc->recalculateBalance();
            }

            $je->load(['lines.account', 'creator']);

            RealtimeService::broadcast('journal:posted', $je->toArray(), 'ledger');

            return response()->json([
                'message' => "Manual journal entry {$je->entry_number} committed successfully.",
                'data' => $je,
            ], 201);
        });
    }

    public function show(JournalEntry $journalEntry): JsonResponse
    {
        Gate::authorize('view', $journalEntry);

        $journalEntry->load(['lines.account', 'creator', 'poster', 'reversedEntry']);

        return response()->json([
            'data' => $journalEntry,
            'is_balanced' => $journalEntry->isBalanced(),
            'total_debit' => $journalEntry->total_debit,
            'total_credit' => $journalEntry->total_credit,
        ]);
    }

    public function reverse(Request $request, JournalEntry $journalEntry): JsonResponse
    {
        Gate::authorize('reverse', $journalEntry);

        if ($journalEntry->status !== 'posted') {
            return response()->json(['message' => 'Only posted entries can be reversed.'], 422);
        }

        return DB::transaction(function () use ($journalEntry, $request) {
            $year = now()->format('Y');
            $count = JournalEntry::whereYear('created_at', $year)->count() + 1;
            $reversalNumber = sprintf("JE-%s-%04d", $year, $count);

            $reversal = JournalEntry::create([
                'entry_number' => $reversalNumber,
                'type' => 'reversal',
                'description' => "Contra Reversal for {$journalEntry->entry_number}: {$journalEntry->description}",
                'posting_date' => now()->toDateString(),
                'fiscal_year' => (int) $year,
                'period' => (int) now()->format('n'),
                'status' => 'posted',
                'reversed_entry_id' => $journalEntry->id,
                'posted_by' => $request->user()->id,
                'posted_at' => now(),
                'created_by' => $request->user()->id,
            ]);

            $journalEntry->load('lines.account');
            foreach ($journalEntry->lines as $line) {
                JournalEntryLine::create([
                    'journal_entry_id' => $reversal->id,
                    'account_id' => $line->account_id,
                    'account_code' => $line->account_code,
                    'account_name' => $line->account_name,
                    'debit' => $line->credit,
                    'credit' => $line->debit,
                    'description' => "Reversal: " . $line->description,
                    'reference' => "REV-" . $journalEntry->entry_number,
                ]);

                $line->account?->recalculateBalance();
            }

            $journalEntry->status = 'reversed';
            $journalEntry->save();

            RealtimeService::broadcast('journal:reversed', [
                'original_entry' => $journalEntry->entry_number,
                'reversal_entry' => $reversal->entry_number,
            ], 'ledger');

            return response()->json([
                'message' => "Journal entry {$journalEntry->entry_number} reversed with contra entry {$reversal->entry_number}.",
                'data' => $reversal->fresh(['lines.account']),
            ]);
        });
    }
}
