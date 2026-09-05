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
            ['name' => 'Sales', 'type' => 'sales', 'default_account_id' => $accMap['Sales Income A/c']->id],
            ['name' => 'Purchase', 'type' => 'purchase', 'default_account_id' => $accMap['Purchase Expense A/c']->id],
            ['name' => 'Bank', 'type' => 'bank', 'default_account_id' => $accMap['Bank A/c']->id],
            ['name' => 'Cash', 'type' => 'cash', 'default_account_id' => $accMap['Cash A/c']->id],
        ];

        foreach ($journals as $j) {
            Journal::firstOrCreate(
                ['name' => $j['name']],
                [
                    'type' => $j['type'],
                    'default_account_id' => $j['default_account_id'],
                    'description' => "Default {$j['name']} Journal",
                    'is_active' => true,
                ]
            );
        }

        // 3. Analytic Accounts
        $analytics = [
            ['name' => 'Furniture', 'code' => 'ANA-FURN', 'type' => 'expense', 'description' => 'Urban furniture fabrication & project operations'],
            ['name' => 'Project 1', 'code' => 'ANA-P01', 'type' => 'expense', 'description' => 'Civic Infrastructure Expansion Project 1'],
            ['name' => 'Project A', 'code' => 'ANA-PA', 'type' => 'income', 'description' => 'Commercial Smart Seating Project A'],
        ];

        $anaMap = [];
        foreach ($analytics as $ana) {
            $created = AnalyticAccount::firstOrCreate(
                ['name' => $ana['name']],
                $ana
            );
            $anaMap[$ana['name']] = $created;
        }

        // 4. Sample Confirmed Budget matching Excalidraw wireframe
        $customer = Customer::first();
        $budget = Budget::firstOrCreate(
            ['name' => 'January 2026'],
            [
                'start_date' => '2026-01-01',
                'end_date' => '2026-01-31',
                'status' => 'confirm',
                'responsible_id' => $customer?->id,
            ]
        );

        if ($budget->lines()->count() === 0 && isset($anaMap['Furniture'])) {
            BudgetLine::create([
                'budget_id' => $budget->id,
                'analytic_account_id' => $anaMap['Furniture']->id,
                'type' => 'expense',
                'committed_amount' => 200000.00,
            ]);
        }

        // 5. Update sample users with login_id if missing
        User::where('email', 'admin@example.com')->update(['login_id' => 'admin_01']);
        User::where('email', 'manager@example.com')->update(['login_id' => 'manager_01', 'role' => 'accountant']);
        User::where('email', 'user@example.com')->update(['login_id' => 'user_01']);
    }
}
