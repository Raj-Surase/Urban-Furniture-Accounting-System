<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\AnalyticAccount;
use App\Models\Budget;
use App\Models\BudgetLine;
use App\Models\Customer;
use App\Models\Journal;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ExcalidrawAccountingSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure pre-configured accounts from Excalidraw exist
        $admin = User::first();

        $accounts = [
            ['code' => '4001', 'name' => 'Sales Income A/c', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'normal_balance' => 'credit', 'opening_balance' => 0],
            ['code' => '5001', 'name' => 'Purchase Expense A/c', 'type' => 'expense', 'sub_type' => 'direct_expense', 'normal_balance' => 'debit', 'opening_balance' => 0],
            ['code' => '5002', 'name' => 'Other Expense A/c', 'type' => 'expense', 'sub_type' => 'operating_expense', 'normal_balance' => 'debit', 'opening_balance' => 0],
            ['code' => '1111', 'name' => 'Bank A/c', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit', 'opening_balance' => 500000],
            ['code' => '1112', 'name' => 'Cash A/c', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit', 'opening_balance' => 50000],
            ['code' => '1121', 'name' => 'Debtors A/c', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit', 'opening_balance' => 0],
            ['code' => '2111', 'name' => 'Creditors A/c', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal_balance' => 'credit', 'opening_balance' => 0],
            ['code' => '3101', 'name' => 'Capital A/c', 'type' => 'equity', 'sub_type' => 'equity', 'normal_balance' => 'credit', 'opening_balance' => 550000],
        ];

        $accMap = [];
        foreach ($accounts as $acc) {
            $created = Account::firstOrCreate(
                ['code' => $acc['code']],
                array_merge($acc, [
                    'current_balance' => $acc['opening_balance'],
                    'is_active' => true,
                    'created_by' => $admin?->id,
                ])
            );
            $accMap[$acc['name']] = $created;
        }

        // 2. Pre-configure Journals
        $journals = [
            ['name' => 'Sales', 'type' => 'sales', 'default_account_id' => $accMap['Sales Income A/c']->id ?? Account::where('type', 'revenue')->first()?->id],
            ['name' => 'Purchase', 'type' => 'purchase', 'default_account_id' => $accMap['Purchase Expense A/c']->id ?? Account::where('type', 'expense')->first()?->id],
            ['name' => 'Bank', 'type' => 'bank', 'default_account_id' => $accMap['Bank A/c']->id ?? Account::where('code', '1110')->first()?->id],
            ['name' => 'Cash', 'type' => 'cash', 'default_account_id' => $accMap['Cash A/c']->id ?? Account::where('code', '1112')->first()?->id],
            ['name' => 'General Operations', 'type' => 'cash', 'default_account_id' => $accMap['Capital A/c']->id ?? Account::first()?->id],
        ];

        $journalMap = [];
        foreach ($journals as $j) {
            $journalObj = Journal::firstOrCreate(
                ['name' => $j['name']],
                [
                    'type' => $j['type'],
                    'default_account_id' => $j['default_account_id'],
                    'description' => "Default {$j['name']} Journal for financial transaction logging",
                    'is_active' => true,
                ]
            );
            $journalMap[$j['name']] = $journalObj;
        }

        // 3. Analytic Accounts (Dimensional Cost Centers & Revenue Dimensions)
        $analytics = [
            ['name' => 'Furniture', 'code' => 'ANA-FURN', 'type' => 'expense', 'description' => 'Urban furniture fabrication, workshop joinery & standard operations'],
            ['name' => 'Project 1', 'code' => 'ANA-P01', 'type' => 'expense', 'description' => 'Civic Infrastructure Expansion Project 1 — Smart Street Amenities'],
            ['name' => 'Project A', 'code' => 'ANA-PA', 'type' => 'income', 'description' => 'Commercial Smart Seating Contract Phase A'],
            ['name' => 'Metro Stations Amenities', 'code' => 'ANA-METRO', 'type' => 'expense', 'description' => 'Metro Line transit shelter seating and platform benches'],
            ['name' => 'Smart Park Initiative', 'code' => 'ANA-PARK', 'type' => 'income', 'description' => 'Municipal solar-powered park benches and smart waste bins'],
            ['name' => 'Raw Teak Wood Sourcing', 'code' => 'ANA-WOOD', 'type' => 'expense', 'description' => 'Sustainable forest teak, rosewood and acacia procurement'],
            ['name' => 'Corporate Campus Furnishing', 'code' => 'ANA-CORP', 'type' => 'income', 'description' => 'Enterprise exterior landscaped parklets and ergonomic benches'],
        ];

        $anaMap = [];
        foreach ($analytics as $ana) {
            $created = AnalyticAccount::firstOrCreate(
                ['name' => $ana['name']],
                $ana
            );
            $anaMap[$ana['name']] = $created;
        }

        // 4. Sample Budgets & Revisions matching Excalidraw lifecycle
        $customer1 = Customer::first();
        $customer2 = Customer::skip(1)->first() ?? $customer1;
        $customer3 = Customer::skip(2)->first() ?? $customer1;

        // Budget 1: January 2026 (Revised State)
        $b1 = Budget::updateOrCreate(
            ['name' => 'January 2026'],
            [
                'start_date' => '2026-01-01',
                'end_date' => '2026-02-28',
                'status' => 'revised',
                'responsible_id' => $customer1?->id,
                'responsible_type' => 'customer',
            ]
        );

        if ($b1->lines()->count() === 0) {
            BudgetLine::create([
                'budget_id' => $b1->id,
                'analytic_account_id' => $anaMap['Furniture']->id,
                'type' => 'expense',
                'committed_amount' => 200000.00,
            ]);
            BudgetLine::create([
                'budget_id' => $b1->id,
                'analytic_account_id' => $anaMap['Project 1']->id,
                'type' => 'expense',
                'committed_amount' => 100000.00,
            ]);
        }

        // Budget 2: January 2026 Revised (Draft State, revision of Budget 1)
        $b2 = Budget::updateOrCreate(
            ['name' => 'January 2026 Revised'],
            [
                'start_date' => '2026-01-01',
                'end_date' => '2026-02-28',
                'status' => 'draft',
                'responsible_id' => $customer1?->id,
                'responsible_type' => 'customer',
                'original_budget_id' => $b1->id,
            ]
        );

        // Bi-directional link between original and revised
        $b1->update(['revised_budget_id' => $b2->id]);

        if ($b2->lines()->count() === 0) {
            BudgetLine::create([
                'budget_id' => $b2->id,
                'analytic_account_id' => $anaMap['Furniture']->id,
                'type' => 'expense',
                'committed_amount' => 250000.00,
            ]);
            BudgetLine::create([
                'budget_id' => $b2->id,
                'analytic_account_id' => $anaMap['Project 1']->id,
                'type' => 'expense',
                'committed_amount' => 150000.00,
            ]);
            BudgetLine::create([
                'budget_id' => $b2->id,
                'analytic_account_id' => $anaMap['Project A']->id,
                'type' => 'income',
                'committed_amount' => 300000.00,
            ]);
        }

        // Budget 3: Q1 2026 Civic Infrastructure (Confirmed State)
        $b3 = Budget::firstOrCreate(
            ['name' => 'Q1 2026 Civic Infrastructure'],
            [
                'start_date' => '2026-01-01',
                'end_date' => '2026-03-31',
                'status' => 'confirm',
                'responsible_id' => $customer2?->id,
                'responsible_type' => 'customer',
            ]
        );

        if ($b3->lines()->count() === 0) {
            BudgetLine::create([
                'budget_id' => $b3->id,
                'analytic_account_id' => $anaMap['Project 1']->id,
                'type' => 'expense',
                'committed_amount' => 350000.00,
            ]);
            BudgetLine::create([
                'budget_id' => $b3->id,
                'analytic_account_id' => $anaMap['Metro Stations Amenities']->id,
                'type' => 'expense',
                'committed_amount' => 250000.00,
            ]);
            BudgetLine::create([
                'budget_id' => $b3->id,
                'analytic_account_id' => $anaMap['Smart Park Initiative']->id,
                'type' => 'income',
                'committed_amount' => 500000.00,
            ]);
        }

        // Budget 4: Commercial Smart Seating FY26 (Confirmed State)
        $b4 = Budget::firstOrCreate(
            ['name' => 'Commercial Smart Seating FY26'],
            [
                'start_date' => '2026-01-01',
                'end_date' => '2026-06-30',
                'status' => 'confirm',
                'responsible_id' => $customer3?->id,
                'responsible_type' => 'customer',
            ]
        );

        if ($b4->lines()->count() === 0) {
            BudgetLine::create([
                'budget_id' => $b4->id,
                'analytic_account_id' => $anaMap['Project A']->id,
                'type' => 'income',
                'committed_amount' => 450000.00,
            ]);
            BudgetLine::create([
                'budget_id' => $b4->id,
                'analytic_account_id' => $anaMap['Furniture']->id,
                'type' => 'expense',
                'committed_amount' => 180000.00,
            ]);
            BudgetLine::create([
                'budget_id' => $b4->id,
                'analytic_account_id' => $anaMap['Corporate Campus Furnishing']->id,
                'type' => 'income',
                'committed_amount' => 600000.00,
            ]);
        }

        // Budget 5: FY27 Capital Projections (Draft State)
        $b5 = Budget::firstOrCreate(
            ['name' => 'FY27 Capital Projections'],
            [
                'start_date' => '2026-04-01',
                'end_date' => '2027-03-31',
                'status' => 'draft',
                'responsible_id' => $customer1?->id,
                'responsible_type' => 'customer',
            ]
        );

        if ($b5->lines()->count() === 0) {
            BudgetLine::create([
                'budget_id' => $b5->id,
                'analytic_account_id' => $anaMap['Raw Teak Wood Sourcing']->id,
                'type' => 'expense',
                'committed_amount' => 600000.00,
            ]);
            BudgetLine::create([
                'budget_id' => $b5->id,
                'analytic_account_id' => $anaMap['Corporate Campus Furnishing']->id,
                'type' => 'income',
                'committed_amount' => 1200000.00,
            ]);
        }

        // 5. Map Transactions to Seeded Analytic Accounts (Calculate Realistic Achieved Amounts)
        // Customer Invoices -> Map lines to Income Analytics (Project A, Smart Park, Corporate)
        $incomeAccounts = [
            $anaMap['Project A']->id,
            $anaMap['Smart Park Initiative']->id,
            $anaMap['Corporate Campus Furnishing']->id,
        ];
        $salesInvoices = \App\Models\Invoice::where('type', 'receivable')->get();

        foreach ($salesInvoices as $idx => $inv) {
            $targetAnalyticId = $incomeAccounts[$idx % count($incomeAccounts)];
            foreach ($inv->items as $item) {
                $item->update(['analytic_account_id' => $targetAnalyticId]);
            }
        }

        // Vendor Bills -> Map lines to Expense Analytics (Furniture, Project 1, Metro, Wood)
        $expenseAccounts = [
            $anaMap['Furniture']->id,
            $anaMap['Project 1']->id,
            $anaMap['Metro Stations Amenities']->id,
            $anaMap['Raw Teak Wood Sourcing']->id,
        ];
        $vendorBills = \App\Models\Invoice::where('type', 'payable')->get();

        foreach ($vendorBills as $idx => $bill) {
            $targetAnalyticId = $expenseAccounts[$idx % count($expenseAccounts)];
            foreach ($bill->items as $item) {
                $item->update(['analytic_account_id' => $targetAnalyticId]);
            }
        }

        // Map Purchase Orders line items
        foreach (\App\Models\PurchaseOrderItem::all() as $idx => $poItem) {
            $poItem->update([
                'analytic_account_id' => $expenseAccounts[$idx % count($expenseAccounts)],
            ]);
        }

        // Map Sales Orders line items
        foreach (\App\Models\SalesOrderItem::all() as $idx => $soItem) {
            $soItem->update([
                'analytic_account_id' => $incomeAccounts[$idx % count($incomeAccounts)],
            ]);
        }

        // 6. Map Journals to Journal Entries
        $salesJournal = $journalMap['Sales'] ?? null;
        $purchaseJournal = $journalMap['Purchase'] ?? null;
        $bankJournal = $journalMap['Bank'] ?? null;

        foreach (\App\Models\JournalEntry::all() as $entry) {
            $num = $entry->entry_number;
            if (str_contains($num, 'INV')) {
                $entry->update(['journal_id' => $salesJournal?->id]);
            } elseif (str_contains($num, 'BILL') || str_contains($num, 'PO')) {
                $entry->update(['journal_id' => $purchaseJournal?->id]);
            } else {
                $entry->update(['journal_id' => $bankJournal?->id]);
            }
        }

        // 7. Update users with login_id and ensure roles
        User::where('email', 'admin@example.com')->update(['login_id' => 'admin_01']);
        User::where('email', 'manager@example.com')->update(['login_id' => 'manager_01', 'role' => 'manager']);
        User::where('email', 'manager2@example.com')->update(['login_id' => 'manager_02', 'role' => 'manager']);
        User::where('email', 'user@example.com')->update(['login_id' => 'user_01']);
        User::where('email', 'clerk@example.com')->update(['login_id' => 'clerk_01']);
    }
}
