<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\AnalyticAccount;
use App\Models\Budget;
use App\Models\BudgetLine;
use App\Models\Customer;
use App\Models\InventoryMovement;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\Item;
use App\Models\Journal;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\User;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ComprehensiveOperationsSeeder extends Seeder
{
    /**
     * Common reference datasets
     */
    private array $indianCities = [
        ['city' => 'Mumbai', 'state' => 'Maharashtra', 'state_code' => '27', 'pincode' => '400001'],
        ['city' => 'Pune', 'state' => 'Maharashtra', 'state_code' => '27', 'pincode' => '411001'],
        ['city' => 'Nagpur', 'state' => 'Maharashtra', 'state_code' => '27', 'pincode' => '440001'],
        ['city' => 'Nashik', 'state' => 'Maharashtra', 'state_code' => '27', 'pincode' => '422001'],
        ['city' => 'Bengaluru', 'state' => 'Karnataka', 'state_code' => '29', 'pincode' => '560001'],
        ['city' => 'Mysuru', 'state' => 'Karnataka', 'state_code' => '29', 'pincode' => '570001'],
        ['city' => 'Hyderabad', 'state' => 'Telangana', 'state_code' => '36', 'pincode' => '500001'],
        ['city' => 'Warangal', 'state' => 'Telangana', 'state_code' => '36', 'pincode' => '506001'],
        ['city' => 'Ahmedabad', 'state' => 'Gujarat', 'state_code' => '24', 'pincode' => '380001'],
        ['city' => 'Surat', 'state' => 'Gujarat', 'state_code' => '24', 'pincode' => '395001'],
        ['city' => 'Vadodara', 'state' => 'Gujarat', 'state_code' => '24', 'pincode' => '390001'],
        ['city' => 'New Delhi', 'state' => 'Delhi', 'state_code' => '07', 'pincode' => '110001'],
        ['city' => 'Noida', 'state' => 'Uttar Pradesh', 'state_code' => '09', 'pincode' => '201301'],
        ['city' => 'Gurugram', 'state' => 'Haryana', 'state_code' => '06', 'pincode' => '122001'],
        ['city' => 'Chennai', 'state' => 'Tamil Nadu', 'state_code' => '33', 'pincode' => '600001'],
        ['city' => 'Coimbatore', 'state' => 'Tamil Nadu', 'state_code' => '33', 'pincode' => '641001'],
        ['city' => 'Kolkata', 'state' => 'West Bengal', 'state_code' => '19', 'pincode' => '700001'],
        ['city' => 'Jaipur', 'state' => 'Rajasthan', 'state_code' => '08', 'pincode' => '302001'],
        ['city' => 'Udaipur', 'state' => 'Rajasthan', 'state_code' => '08', 'pincode' => '313001'],
        ['city' => 'Indore', 'state' => 'Madhya Pradesh', 'state_code' => '23', 'pincode' => '452001'],
        ['city' => 'Kochi', 'state' => 'Kerala', 'state_code' => '32', 'pincode' => '682001'],
        ['city' => 'Chandigarh', 'state' => 'Chandigarh', 'state_code' => '04', 'pincode' => '160001'],
    ];

    private array $firstNames = [
        'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Muhammad', 'Sai', 'Ayan', 'Krishna',
        'Ishaan', 'Shaurya', 'Atharva', 'Dhruv', 'Kabir', 'Rudra', 'Ananya', 'Diya', 'Gauri', 'Aanya',
        'Pari', 'Saanvi', 'Myra', 'Aditi', 'Navya', 'Rhea', 'Kiara', 'Ira', 'Avani', 'Prisha',
        'Vikram', 'Rohan', 'Karan', 'Siddharth', 'Manish', 'Rajesh', 'Suresh', 'Deepak', 'Naveen', 'Sameer',
        'Pooja', 'Priya', 'Neha', 'Sneha', 'Shweta', 'Meera', 'Ritu', 'Tanvi', 'Kavita', 'Sunita',
        'Harish', 'Amit', 'Sunil', 'Vijay', 'Rahul', 'Nitin', 'Alok', 'Gaurav', 'Tarun', 'Pankaj'
    ];

    private array $lastNames = [
        'Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhatia', 'Mehta', 'Shah', 'Patel', 'Deshmukh', 'Kulkarni',
        'Joshi', 'Patil', 'Pawar', 'Shinde', 'Rao', 'Reddy', 'Nair', 'Menon', 'Pillai', 'Iyer',
        'Choudhury', 'Sen', 'Banerjee', 'Chatterjee', 'Das', 'Mukherjee', 'Kapoor', 'Khanna', 'Singhania', 'Agarwal',
        'Bansal', 'Mittal', 'Goel', 'Jindal', 'Trivedi', 'Pandey', 'Mishra', 'Dubey', 'Tiwari', 'Shukla'
    ];

    public function run(): void
    {
        $this->command->info('🚀 Starting Comprehensive Operations Seeding (260+ records per module)...');

        $users = $this->seedUsers(265);
        $accounts = $this->seedAccounts(270, $users[0]);
        $journals = $this->seedJournals(265, $accounts);
        $analytics = $this->seedAnalyticAccounts(265);
        $customers = $this->seedCustomers(265, $accounts, $users);
        $vendors = $this->seedVendors(265, $accounts, $users);
        $products = $this->seedProducts(265, $accounts, $users);

        $pos = $this->seedPurchaseOrders(265, $vendors, $products, $analytics, $users);
        $sos = $this->seedSalesOrders(265, $customers, $products, $analytics, $users);

        $invoices = $this->seedInvoicesAndBills(270, $sos, $pos, $customers, $vendors, $products, $accounts, $analytics, $users);
        $payments = $this->seedPayments(530, $invoices, $accounts, $users);
        $this->seedPaymentTransactions(265, $invoices, $sos, $customers, $vendors, $payments, $users);

        $this->seedJournalEntries(270, $journals, $accounts, $invoices, $users);
        $this->seedInventoryMovements(265, $products, $pos, $sos, $users);
        $this->seedBudgets(265, $analytics, $customers, $vendors, $users);
        $this->seedItems(265, $users);

        $this->syncDocumentSequences();
        $this->recalculateGLBalances($accounts);

        $this->command->info('✅ Comprehensive Operations Seeder completed successfully!');
    }

    /**
     * 1. Users Module (265+ records)
     */
    private function seedUsers(int $targetCount): array
    {
        $this->command->info("Seeding Users (Target: {$targetCount})...");
        $roles = [User::ROLE_USER, User::ROLE_MANAGER, User::ROLE_ACCOUNTANT, User::ROLE_ADMIN];
        $departments = ['Procurement', 'Accounts', 'Sales', 'Warehouse', 'Design', 'Operations', 'Executive'];

        $existing = User::all();
        $currentCount = $existing->count();
        $needed = max(0, $targetCount - $currentCount);

        $users = $existing->all();
        $passwordHash = Hash::make('password');

        $now = now();

        for ($i = 1; $i <= $needed; $i++) {
            $fn = $this->firstNames[($currentCount + $i) % count($this->firstNames)];
            $ln = $this->lastNames[(int)(($currentCount + $i) / 3) % count($this->lastNames)];
            $name = "{$fn} {$ln}";
            $dept = $departments[$i % count($departments)];
            $role = match ($dept) {
                'Executive' => User::ROLE_ADMIN,
                'Accounts' => ($i % 3 === 0) ? User::ROLE_ACCOUNTANT : User::ROLE_MANAGER,
                'Procurement', 'Sales' => ($i % 4 === 0) ? User::ROLE_MANAGER : User::ROLE_USER,
                default => User::ROLE_USER,
            };

            $loginId = strtolower("{$fn}_{$ln}_{$i}");
            $loginId = preg_replace('/[^a-z0-9_]/', '', substr($loginId, 0, 28));
            $email = strtolower("{$fn}.{$ln}.{$i}@urbanfurniture.com");

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'login_id' => $loginId,
                    'password' => $passwordHash,
                    'role' => $role,
                    'created_at' => $now->copy()->subDays(rand(10, 500)),
                    'updated_at' => $now,
                ]
            );
            $users[] = $user;
        }

        return $users;
    }

    /**
     * 2. Chart of Accounts (270+ records)
     */
    private function seedAccounts(int $targetCount, User $admin): array
    {
        $this->command->info("Seeding Chart of Accounts (Target: {$targetCount})...");
        $existing = Account::all();
        $currentCount = $existing->count();
        $accountMap = [];
        foreach ($existing as $acc) {
            $accountMap[$acc->code] = $acc;
        }

        $needed = max(0, $targetCount - $currentCount);
        if ($needed > 0) {
            $accountTemplates = [
                // Assets: 1000 - 1999
                ['prefix' => '13', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal' => 'debit', 'category' => 'Regional Bank Accounts & Petty Cash'],
                ['prefix' => '14', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal' => 'debit', 'category' => 'Customer Segment Receivables'],
                ['prefix' => '15', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal' => 'debit', 'category' => 'Raw Material & Component Inventory'],
                ['prefix' => '16', 'type' => 'asset', 'sub_type' => 'fixed_asset', 'normal' => 'debit', 'category' => 'Fabrication Plant & Showroom Assets'],
                ['prefix' => '17', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal' => 'debit', 'category' => 'Prepaid Advances & Security Deposits'],

                // Liabilities: 2000 - 2999
                ['prefix' => '22', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal' => 'credit', 'category' => 'Vendor Segment Accounts Payable'],
                ['prefix' => '23', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal' => 'credit', 'category' => 'Duties, Taxes & Statutory Withholdings'],
                ['prefix' => '24', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal' => 'credit', 'category' => 'Customer Advance Deposits & Guarantees'],
                ['prefix' => '25', 'type' => 'liability', 'sub_type' => 'long_term_liability', 'normal' => 'credit', 'category' => 'Equipment Leases & Working Capital Term Loans'],

                // Equity: 3000 - 3999
                ['prefix' => '32', 'type' => 'equity', 'sub_type' => 'equity', 'normal' => 'credit', 'category' => 'Retained Earnings & Reserves'],

                // Revenue: 4000 - 4999
                ['prefix' => '41', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'normal' => 'credit', 'category' => 'Commercial Furniture Sales by Region'],
                ['prefix' => '42', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'normal' => 'credit', 'category' => 'Turnkey Installation & Assembly Services'],
                ['prefix' => '43', 'type' => 'revenue', 'sub_type' => 'non_operating_revenue', 'normal' => 'credit', 'category' => 'Scrap Timber Sales & Sundry Income'],

                // Cost of Goods Sold & Expenses: 5000 - 6999
                ['prefix' => '51', 'type' => 'expense', 'sub_type' => 'direct_expense', 'normal' => 'debit', 'category' => 'Direct Timber & Joinery Cost of Goods'],
                ['prefix' => '52', 'type' => 'expense', 'sub_type' => 'direct_expense', 'normal' => 'debit', 'category' => 'Hardware, Foam & Upholstery Purchases'],
                ['prefix' => '61', 'type' => 'expense', 'sub_type' => 'operating_expense', 'normal' => 'debit', 'category' => 'Showroom Lease & Factory Utilities'],
                ['prefix' => '62', 'type' => 'expense', 'sub_type' => 'operating_expense', 'normal' => 'debit', 'category' => 'Logistics, Transporter Freight & Packaging'],
                ['prefix' => '63', 'type' => 'expense', 'sub_type' => 'operating_expense', 'normal' => 'debit', 'category' => 'Machinery Depreciation & Tool Maintenance'],
                ['prefix' => '64', 'type' => 'expense', 'sub_type' => 'operating_expense', 'normal' => 'debit', 'category' => 'Sales Marketing, Digital Ads & Field Travel'],
            ];

            $counter = 10;
            while (count($accountMap) < $targetCount) {
                $tmpl = $accountTemplates[$counter % count($accountTemplates)];
                $code = sprintf("%s%02d", $tmpl['prefix'], (int)($counter / count($accountTemplates)) + 1);
                $name = "{$tmpl['category']} - Subledger #{$code}";

                if (!isset($accountMap[$code])) {
                    $acc = Account::firstOrCreate(
                        ['code' => $code],
                        [
                            'name' => $name,
                            'type' => $tmpl['type'],
                            'sub_type' => $tmpl['sub_type'],
                            'normal_balance' => $tmpl['normal'],
                            'opening_balance' => 0.00,
                            'current_balance' => 0,
                            'description' => "Operational accounting subledger for {$name}",
                            'is_active' => true,
                            'created_by' => $admin->id,
                        ]
                    );
                    $accountMap[$code] = $acc;
                }
                $counter++;
            }
        }

        return array_values($accountMap);
    }

    /**
     * 3. Journals Master (265+ records)
     */
    private function seedJournals(int $targetCount, array $accounts): array
    {
        $this->command->info("Seeding Journals (Target: {$targetCount})...");
        $existing = Journal::all();
        $journalMap = [];
        foreach ($existing as $j) {
            $journalMap[$j->name] = $j;
        }

        $bankAcc = Account::where('code', '1110')->orWhere('type', 'asset')->first();
        $salesAcc = Account::where('code', '4001')->orWhere('type', 'revenue')->first();
        $purchAcc = Account::where('code', '5001')->orWhere('type', 'expense')->first();
        $cashAcc = Account::where('code', '1112')->orWhere('type', 'asset')->first();

        $journalTypes = [
            ['suffix' => 'Sales Journal', 'type' => 'sales', 'acc' => $salesAcc],
            ['suffix' => 'Procurement & Bills Journal', 'type' => 'purchase', 'acc' => $purchAcc],
            ['suffix' => 'Bank Operations Journal', 'type' => 'bank', 'acc' => $bankAcc],
            ['suffix' => 'Petty Cash & Imprest Journal', 'type' => 'cash', 'acc' => $cashAcc],
        ];

        $counter = 1;
        while (count($journalMap) < $targetCount) {
            $cityInfo = $this->indianCities[$counter % count($this->indianCities)];
            $jConfig = $journalTypes[((int)($counter / count($this->indianCities))) % count($journalTypes)];
            $unitSuffix = $counter > (count($this->indianCities) * 4) ? " Unit " . (int)($counter / 20) : "";
            $name = "{$cityInfo['city']} Hub{$unitSuffix} {$jConfig['suffix']}";

            if (!isset($journalMap[$name])) {
                $journal = Journal::firstOrCreate(
                    ['name' => $name],
                    [
                        'type' => $jConfig['type'],
                        'default_account_id' => $jConfig['acc']?->id,
                        'description' => "Financial journal for {$name} operations in {$cityInfo['state']}",
                        'is_active' => true,
                    ]
                );
                $journalMap[$name] = $journal;
            }
            $counter++;
        }

        return array_values($journalMap);
    }

    /**
     * 4. Analytic Accounts (Cost Centers / Business Dimensions) (265+ records)
     */
    private function seedAnalyticAccounts(int $targetCount): array
    {
        $this->command->info("Seeding Analytic Accounts (Target: {$targetCount})...");
        $existing = AnalyticAccount::all();
        $anaMap = [];
        foreach ($existing as $ana) {
            $anaMap[$ana->name] = $ana;
        }

        $projectTypes = [
            ['name' => 'Metro Station Amenities', 'code' => 'METRO', 'type' => 'expense'],
            ['name' => 'Smart City Parklet Seating', 'code' => 'PARK', 'type' => 'income'],
            ['name' => 'Tech Park Ergonomic Fit-out', 'code' => 'TECH', 'type' => 'income'],
            ['name' => 'Civic Infrastructure Transit Hub', 'code' => 'CIVIC', 'type' => 'expense'],
            ['name' => 'Commercial Boardroom Suites', 'code' => 'CORP', 'type' => 'income'],
            ['name' => 'Hospitality Resort Lounge Seating', 'code' => 'HOSP', 'type' => 'income'],
            ['name' => 'Sustainable Teak R&D Initiative', 'code' => 'ECO', 'type' => 'expense'],
            ['name' => 'University Campus Library Seating', 'code' => 'UNIV', 'type' => 'income'],
            ['name' => 'Airport Terminal Executive Lounges', 'code' => 'AIR', 'type' => 'income'],
            ['name' => 'CNC Woodworking Fabrication Line', 'code' => 'PLANT', 'type' => 'expense'],
        ];

        $counter = 1;
        while (count($anaMap) < $targetCount) {
            $cityInfo = $this->indianCities[$counter % count($this->indianCities)];
            $pConfig = $projectTypes[$counter % count($projectTypes)];
            $seq = sprintf("%03d", $counter);
            $name = "{$pConfig['name']} - {$cityInfo['city']} Phase {$seq}";
            $code = "ANA-{$pConfig['code']}-{$seq}";

            if (!isset($anaMap[$name])) {
                $created = AnalyticAccount::firstOrCreate(
                    ['name' => $name],
                    [
                        'code' => $code,
                        'type' => $pConfig['type'],
                        'description' => "Dimensional cost/revenue center for {$name} in {$cityInfo['state']}",
                        'is_active' => true,
                    ]
                );
                $anaMap[$name] = $created;
            }
            $counter++;
        }

        return array_values($anaMap);
    }

    /**
     * 5. Customers Module (265+ records)
     */
    private function seedCustomers(int $targetCount, array $accounts, array $users): array
    {
        $this->command->info("Seeding Customers (Target: {$targetCount})...");
        $existing = Customer::all();
        $customerMap = [];
        foreach ($existing as $c) {
            $customerMap[$c->code] = $c;
        }

        $receivableAcc = Account::where('code', '1120')->first() ?? $accounts[0];

        $companyPrefixes = [
            'Apex', 'Nexus', 'Vertex', 'Starlight', 'Greenfield', 'Bluestone', 'Zenith', 'Titan',
            'Infotech', 'CyberCity', 'CloudMatrix', 'UrbanScape', 'MetroTransit', 'GrandHeritage',
            'Prestige', 'Sobha', 'DLF', 'Godrej', 'Lodha', 'Brigade', 'L&T', 'Oberoi'
        ];

        $companySuffixes = [
            'Tech Parks Ltd', 'Commercial Interiors', 'Hospitality & Resorts', 'Workspaces Pvt Ltd',
            'Infrastructure Corp', 'Studios & Architecture', 'Realty & Living', 'Corporate Solutions',
            'Smart Cities SPV', 'Healthcare Networks', 'Educational Foundation', 'Design Labs'
        ];

        $counter = 1;
        while (count($customerMap) < $targetCount) {
            $code = sprintf("CUST-%04d", $counter);
            if (!isset($customerMap[$code])) {
                $cityInfo = $this->indianCities[$counter % count($this->indianCities)];
                $fn = $this->firstNames[$counter % count($this->firstNames)];
                $ln = $this->lastNames[($counter * 3) % count($this->lastNames)];
                $prefix = $companyPrefixes[$counter % count($companyPrefixes)];
                $suffix = $companySuffixes[($counter * 2) % count($companySuffixes)];
                $company = "{$prefix} {$suffix}";
                $gstin = sprintf("%sAAACU%04d%s1Z%d", $cityInfo['state_code'], 1000 + ($counter % 8000), chr(65 + ($counter % 26)), ($counter % 9) + 1);
                $creator = $users[$counter % count($users)];

                $customer = Customer::firstOrCreate(
                    ['code' => $code],
                    [
                        'name' => "{$company} ({$cityInfo['city']} #{$counter})",
                        'contact_person' => "{$fn} {$ln}",
                        'email' => strtolower("contact@{$code}." . preg_replace('/[^a-z]/', '', $prefix) . ".com"),
                        'phone' => '+91 ' . rand(98000, 99999) . ' ' . rand(10000, 99999),
                        'billing_address' => "Tower " . chr(65 + ($counter % 8)) . ", Level " . (($counter % 18) + 1) . ", {$cityInfo['city']} Commercial Zone",
                        'shipping_address' => "Warehouse & Logistics Hub, Sector " . (($counter % 40) + 1) . ", {$cityInfo['city']}",
                        'city' => $cityInfo['city'],
                        'state' => $cityInfo['state'],
                        'country' => 'India',
                        'gstin' => $gstin,
                        'credit_limit' => rand(5, 50) * 100000.00,
                        'payment_terms_days' => [15, 30, 45, 60][$counter % 4],
                        'receivable_account_id' => $receivableAcc->id,
                        'currency' => 'INR',
                        'is_active' => true,
                        'notes' => "Corporate furniture client contract. Primary delivery site: {$cityInfo['city']}.",
                        'created_by' => $creator->id,
                    ]
                );
                $customerMap[$code] = $customer;
            }
            $counter++;
        }

        return array_values($customerMap);
    }

    /**
     * 6. Vendors Module (265+ records)
     */
    private function seedVendors(int $targetCount, array $accounts, array $users): array
    {
        $this->command->info("Seeding Vendors (Target: {$targetCount})...");
        $existing = Vendor::all();
        $vendorMap = [];
        foreach ($existing as $v) {
            $vendorMap[$v->code] = $v;
        }

        $payableAcc = Account::where('code', '2110')->first() ?? $accounts[0];

        $vendorNiches = [
            ['prefix' => 'Malabar', 'suffix' => 'Teak & Hardwoods Mill', 'category' => 'Timber'],
            ['prefix' => 'Precision CNC', 'suffix' => 'Metal & Tubular Joinery', 'category' => 'Hardware'],
            ['prefix' => 'Coimbatore', 'suffix' => 'Commercial Upholstery & Fabrics', 'category' => 'Upholstery'],
            ['prefix' => 'Kutch', 'suffix' => 'Foam & Ergonomic Cushioning', 'category' => 'Cushioning'],
            ['prefix' => 'Gujarat', 'suffix' => 'Tempered Glass & Ceramic Tops', 'category' => 'Glass & Tops'],
            ['prefix' => 'Bhiwandi', 'suffix' => 'Heavy Duty Packaging & Corrugated', 'category' => 'Packaging'],
            ['prefix' => 'Pune', 'suffix' => 'Powder Coating & Surface Finishes', 'category' => 'Finishing'],
            ['prefix' => 'Bengaluru', 'suffix' => 'Smart Sensors & Integrated Wiring', 'category' => 'Electronics'],
            ['prefix' => 'Jaipur', 'suffix' => 'Artisan Brass Inlays & Hardware', 'category' => 'Fittings'],
            ['prefix' => 'Surat', 'suffix' => 'Plywood & Sustainable MDF Boards', 'category' => 'Boards'],
        ];

        $counter = 1;
        while (count($vendorMap) < $targetCount) {
            $code = sprintf("VEN-%04d", $counter);
            if (!isset($vendorMap[$code])) {
                $cityInfo = $this->indianCities[$counter % count($this->indianCities)];
                $niche = $vendorNiches[$counter % count($vendorNiches)];
                $fn = $this->firstNames[($counter * 2) % count($this->firstNames)];
                $ln = $this->lastNames[($counter * 5) % count($this->lastNames)];
                $company = "{$niche['prefix']} {$niche['suffix']} (#{$counter})";
                $pan = sprintf("AABFV%04d%s", 2000 + ($counter % 7000), chr(65 + ($counter % 26)));
                $gstin = sprintf("%s%s1Z%d", $cityInfo['state_code'], $pan, ($counter % 9) + 1);
                $creator = $users[$counter % count($users)];

                $vendor = Vendor::firstOrCreate(
                    ['code' => $code],
                    [
                        'name' => $company,
                        'contact_person' => "{$fn} {$ln}",
                        'email' => strtolower("orders@{$code}." . preg_replace('/[^a-z]/', '', $niche['prefix']) . ".com"),
                        'phone' => '+91 ' . rand(97000, 98999) . ' ' . rand(10000, 99999),
                        'address' => "Plot " . (($counter % 80) + 1) . ", GIDC Industrial Estate, {$cityInfo['city']}",
                        'city' => $cityInfo['city'],
                        'state' => $cityInfo['state'],
                        'country' => 'India',
                        'gstin' => $gstin,
                        'pan' => $pan,
                        'payment_terms_days' => [15, 30, 45, 60][$counter % 4],
                        'payable_account_id' => $payableAcc->id,
                        'currency' => 'INR',
                        'is_active' => true,
                        'notes' => "Approved vendor for {$niche['category']} supplies. GST validated.",
                        'created_by' => $creator->id,
                    ]
                );
                $vendorMap[$code] = $vendor;
            }
            $counter++;
        }

        return array_values($vendorMap);
    }

    /**
     * 7. Products Catalog (265+ records)
     */
    private function seedProducts(int $targetCount, array $accounts, array $users): array
    {
        $this->command->info("Seeding Products (Target: {$targetCount})...");
        $existing = Product::all();
        $productMap = [];
        foreach ($existing as $p) {
            $productMap[$p->sku] = $p;
        }

        $invAcc = Account::where('code', '1130')->first() ?? $accounts[0];
        $cogsAcc = Account::where('code', '5001')->first() ?? $accounts[0];
        $revAcc = Account::where('code', '4001')->first() ?? $accounts[0];

        $productArchetypes = [
            // Chairs
            ['cat' => 'Chairs', 'type' => 'goods', 'hsn' => '94018000', 'uom' => 'unit', 'cost' => 3200, 'price' => 5400, 'prefix' => 'UF-CHR', 'name' => 'Ergonomic Task Swivel Chair'],
            ['cat' => 'Chairs', 'type' => 'goods', 'hsn' => '94018000', 'uom' => 'unit', 'cost' => 8500, 'price' => 14500, 'prefix' => 'UF-ECHR', 'name' => 'Executive Leather High-Back Chair'],
            ['cat' => 'Chairs', 'type' => 'goods', 'hsn' => '94018000', 'uom' => 'unit', 'cost' => 2100, 'price' => 3600, 'prefix' => 'UF-STCHR', 'name' => 'Stackable Cantilever Visitor Chair'],
            ['cat' => 'Chairs', 'type' => 'goods', 'hsn' => '94018000', 'uom' => 'unit', 'cost' => 4200, 'price' => 7200, 'prefix' => 'UF-BSTL', 'name' => 'Adjustable Swivel Cafe Barstool'],

            // Desks & Workstations
            ['cat' => 'Desks', 'type' => 'goods', 'hsn' => '94036000', 'uom' => 'unit', 'cost' => 12500, 'price' => 21000, 'prefix' => 'UF-MOTDSK', 'name' => 'Dual-Motor Electric Standing Desk'],
            ['cat' => 'Desks', 'type' => 'goods', 'hsn' => '94036000', 'uom' => 'set', 'cost' => 28000, 'price' => 46000, 'prefix' => 'UF-POD4', 'name' => 'Linear 4-Person Modular Workstation Pod'],
            ['cat' => 'Desks', 'type' => 'goods', 'hsn' => '94036000', 'uom' => 'unit', 'cost' => 18000, 'price' => 31000, 'prefix' => 'UF-EXDSK', 'name' => 'Executive Teak Managerial Desk with Modesty Panel'],

            // Tables
            ['cat' => 'Tables', 'type' => 'goods', 'hsn' => '94036000', 'uom' => 'unit', 'cost' => 24000, 'price' => 42000, 'prefix' => 'UF-CNFTBL', 'name' => '12-Seater Boardroom Conference Table'],
            ['cat' => 'Tables', 'type' => 'goods', 'hsn' => '94036000', 'uom' => 'unit', 'cost' => 6500, 'price' => 11500, 'prefix' => 'UF-CAFTBL', 'name' => 'Bistro Cafe Round Table with Cast Iron Base'],
            ['cat' => 'Tables', 'type' => 'goods', 'hsn' => '94036000', 'uom' => 'set', 'cost' => 4500, 'price' => 8200, 'prefix' => 'UF-NESTBL', 'name' => 'Nesting Geometric Coffee Table Set (3 Pcs)'],

            // Storage
            ['cat' => 'Storage', 'type' => 'goods', 'hsn' => '94031000', 'uom' => 'unit', 'cost' => 5500, 'price' => 9200, 'prefix' => 'UF-PEDSTR', 'name' => 'Mobile Steel 3-Drawer Under-Desk Pedestal'],
            ['cat' => 'Storage', 'type' => 'goods', 'hsn' => '94031000', 'uom' => 'unit', 'cost' => 14000, 'price' => 23500, 'prefix' => 'UF-CRDNZ', 'name' => 'Sliding Door Teak Veneer Credenza'],
            ['cat' => 'Storage', 'type' => 'goods', 'hsn' => '94031000', 'uom' => 'unit', 'cost' => 11000, 'price' => 18900, 'prefix' => 'UF-LOCKR', 'name' => '6-Door Digital Lock Employee Locker Unit'],

            // Outdoor & Civic Amenities
            ['cat' => 'Outdoor', 'type' => 'goods', 'hsn' => '94032090', 'uom' => 'unit', 'cost' => 9500, 'price' => 16500, 'prefix' => 'UF-BNCH', 'name' => 'Weatherproof Heavy Cast Iron & Teak Park Bench'],
            ['cat' => 'Outdoor', 'type' => 'goods', 'hsn' => '94032090', 'uom' => 'unit', 'cost' => 32000, 'price' => 54000, 'prefix' => 'UF-SOLBEN', 'name' => 'Solar-Powered Smart Park Bench with Wireless USB Hub'],
            ['cat' => 'Outdoor', 'type' => 'goods', 'hsn' => '94032090', 'uom' => 'unit', 'cost' => 7800, 'price' => 13200, 'prefix' => 'UF-BIN', 'name' => 'Dual-Stream Segregated Street Waste Litter Receptacle'],

            // Lounge
            ['cat' => 'Lounge', 'type' => 'goods', 'hsn' => '94018000', 'uom' => 'unit', 'cost' => 19000, 'price' => 32500, 'prefix' => 'UF-SOF3', 'name' => 'Nordic 3-Seater Upholstered Reception Sofa'],
            ['cat' => 'Lounge', 'type' => 'goods', 'hsn' => '94018000', 'uom' => 'unit', 'cost' => 45000, 'price' => 78000, 'prefix' => 'UF-ACBOOTH', 'name' => 'Acoustic High-Back Privacy Focus Work Booth'],
            ['cat' => 'Lounge', 'type' => 'goods', 'hsn' => '94018000', 'uom' => 'unit', 'cost' => 7500, 'price' => 12900, 'prefix' => 'UF-OTTMN', 'name' => 'Curved Modular Breakout Area Ottoman Bench'],

            // Turnkey Services
            ['cat' => 'Services', 'type' => 'service', 'hsn' => '995469', 'uom' => 'hours', 'cost' => 600, 'price' => 1400, 'prefix' => 'UF-SRVINS', 'name' => 'On-Site Commercial Furniture Installation & Rigging'],
            ['cat' => 'Services', 'type' => 'service', 'hsn' => '995469', 'uom' => 'unit', 'cost' => 8000, 'price' => 22000, 'prefix' => 'UF-SRVAUD', 'name' => 'Workplace Ergonomic Compliance Audit & Heatmap'],
        ];

        $counter = 1;
        while (count($productMap) < $targetCount) {
            $arch = $productArchetypes[$counter % count($productArchetypes)];
            $codeNum = sprintf("%04d", $counter);
            $sku = "{$arch['prefix']}-{$codeNum}";

            if (!isset($productMap[$sku])) {
                $series = 'Series ' . chr(65 + ($counter % 12)) . ' v' . (($counter % 4) + 1);
                $name = "{$arch['name']} ({$series})";
                $cost = (float) $arch['cost'] + (($counter % 15) * 150);
                $price = (float) $arch['price'] + (($counter % 15) * 300);
                $stock = $arch['type'] === 'service' ? 0.00 : (float) rand(8, 120);
                $creator = $users[$counter % count($users)];

                $product = Product::firstOrCreate(
                    ['sku' => $sku],
                    [
                        'name' => $name,
                        'hsn_code' => $arch['hsn'],
                        'description' => "High-durability commercial furniture designed for corporate and urban spaces. {$series}.",
                        'category' => $arch['cat'],
                        'type' => $arch['type'],
                        'unit_price' => $price,
                        'cost_price' => $cost,
                        'gst_rate' => 18.00,
                        'unit_of_measure' => $arch['uom'],
                        'current_stock' => $stock,
                        'minimum_stock' => 10.00,
                        'reorder_point' => 15.00,
                        'inventory_account_id' => $invAcc->id,
                        'cogs_account_id' => $cogsAcc->id,
                        'revenue_account_id' => $revAcc->id,
                        'is_active' => true,
                        'created_by' => $creator->id,
                    ]
                );
                $productMap[$sku] = $product;
            }
            $counter++;
        }

        return array_values($productMap);
    }

    /**
     * 8. Purchase Orders (265+ records)
     */
    private function seedPurchaseOrders(int $targetCount, array $vendors, array $products, array $analytics, array $users): array
    {
        $this->command->info("Seeding Purchase Orders (Target: {$targetCount})...");
        $existing = PurchaseOrder::all();
        $poMap = [];
        foreach ($existing as $p) {
            $poMap[$p->po_number] = $p;
        }

        $statuses = ['draft', 'submitted', 'approved', 'partially_received', 'received', 'rejected', 'cancelled'];
        $counter = 1;

        while (count($poMap) < $targetCount) {
            $year = ($counter % 3 === 0) ? 2025 : 2026;
            $num = sprintf("PO-%d-%04d", $year, $counter);

            if (!isset($poMap[$num])) {
                if ($existingPO = PurchaseOrder::where('po_number', $num)->first()) {
                    $poMap[$num] = $existingPO;
                    $counter++;
                    continue;
                }
                $vendor = $vendors[$counter % count($vendors)];
                $status = $statuses[$counter % count($statuses)];
                $creator = $users[$counter % count($users)];
                $approver = in_array($status, ['approved', 'received', 'partially_received']) ? $users[0] : null;

                $orderDate = Carbon::create($year, ($counter % 12) + 1, rand(1, 28))->format('Y-m-d');
                $isInterstate = ($vendor->state !== 'Maharashtra');

                // Items
                $lineItemCount = ($counter % 3) + 1;
                $subtotal = 0;
                $taxAmount = 0;
                $cgstTotal = 0;
                $sgstTotal = 0;
                $igstTotal = 0;
                $lineItemsData = [];

                for ($li = 0; $li < $lineItemCount; $li++) {
                    $prod = $products[($counter * 2 + $li) % count($products)];
                    $qty = rand(2, 25);
                    $unitPrice = $prod->cost_price;
                    $lineSubtotal = round($qty * $unitPrice, 2);
                    $analytic = $analytics[($counter + $li) % count($analytics)];

                    if ($isInterstate) {
                        $cgst = 0;
                        $sgst = 0;
                        $igst = round($lineSubtotal * 0.18, 2);
                        $lineTax = $igst;
                    } else {
                        $cgst = round($lineSubtotal * 0.09, 2);
                        $sgst = round($lineSubtotal * 0.09, 2);
                        $igst = 0;
                        $lineTax = $cgst + $sgst;
                    }

                    $subtotal += $lineSubtotal;
                    $taxAmount += $lineTax;
                    $cgstTotal += $cgst;
                    $sgstTotal += $sgst;
                    $igstTotal += $igst;

                    $lineItemsData[] = [
                        'product_id' => $prod->id,
                        'analytic_account_id' => $analytic->id,
                        'hsn_code' => $prod->hsn_code,
                        'description' => "Procurement of {$prod->name} for assembly line",
                        'quantity_ordered' => $qty,
                        'quantity_received' => in_array($status, ['received', 'partially_received']) ? $qty : 0,
                        'unit_price' => $unitPrice,
                        'tax_rate' => 18.00,
                        'cgst_rate' => $isInterstate ? 0.00 : 9.00,
                        'cgst_amount' => $cgst,
                        'sgst_rate' => $isInterstate ? 0.00 : 9.00,
                        'sgst_amount' => $sgst,
                        'igst_rate' => $isInterstate ? 18.00 : 0.00,
                        'igst_amount' => $igst,
                        'tax_amount' => $lineTax,
                        'line_total' => $lineSubtotal + $lineTax,
                    ];
                }

                $totalAmount = $subtotal + $taxAmount;

                $po = PurchaseOrder::create([
                    'po_number' => $num,
                    'vendor_id' => $vendor->id,
                    'status' => $status,
                    'order_date' => $orderDate,
                    'expected_delivery_date' => Carbon::parse($orderDate)->addDays(14)->format('Y-m-d'),
                    'delivery_date' => in_array($status, ['received']) ? Carbon::parse($orderDate)->addDays(12)->format('Y-m-d') : null,
                    'place_of_supply' => "{$vendor->state} (" . ($vendor->gstin ? substr($vendor->gstin, 0, 2) : '27') . ")",
                    'is_interstate' => $isInterstate,
                    'gstin' => $vendor->gstin,
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'cgst_amount' => $cgstTotal,
                    'sgst_amount' => $sgstTotal,
                    'igst_amount' => $igstTotal,
                    'discount_amount' => 0.00,
                    'total_amount' => $totalAmount,
                    'notes' => "Standard purchase order for furniture components. Terms: {$vendor->payment_terms_days} days.",
                    'terms_conditions' => 'Goods subject to QC inspection at Pune central fabrication plant upon unloading.',
                    'approved_by' => $approver?->id,
                    'approved_at' => $approver ? Carbon::parse($orderDate)->addHours(6) : null,
                    'created_by' => $creator->id,
                ]);

                foreach ($lineItemsData as $liData) {
                    $po->items()->create($liData);
                }

                $poMap[$num] = $po;
            }
            $counter++;
        }

        return array_values($poMap);
    }

    /**
     * 9. Sales Orders (265+ records)
     */
    private function seedSalesOrders(int $targetCount, array $customers, array $products, array $analytics, array $users): array
    {
        $this->command->info("Seeding Sales Orders (Target: {$targetCount})...");
        $existing = SalesOrder::all();
        $soMap = [];
        foreach ($existing as $s) {
            $soMap[$s->so_number] = $s;
        }

        $statuses = ['draft', 'confirmed', 'approved', 'invoiced', 'delivered', 'cancelled'];
        $counter = 1;

        while (count($soMap) < $targetCount) {
            $year = ($counter % 3 === 0) ? 2025 : 2026;
            $num = sprintf("SO-%d-%04d", $year, $counter);

            if (!isset($soMap[$num])) {
                if ($existingSO = SalesOrder::where('so_number', $num)->first()) {
                    $soMap[$num] = $existingSO;
                    $counter++;
                    continue;
                }
                $customer = $customers[$counter % count($customers)];
                $status = $statuses[$counter % count($statuses)];
                $creator = $users[$counter % count($users)];
                $approver = in_array($status, ['approved', 'invoiced', 'delivered']) ? $users[0] : null;

                $orderDate = Carbon::create($year, ($counter % 12) + 1, rand(1, 28))->format('Y-m-d');
                $isInterstate = ($customer->state !== 'Maharashtra');

                // Items
                $lineItemCount = ($counter % 3) + 1;
                $subtotal = 0;
                $taxAmount = 0;
                $cgstTotal = 0;
                $sgstTotal = 0;
                $igstTotal = 0;
                $lineItemsData = [];

                for ($li = 0; $li < $lineItemCount; $li++) {
                    $prod = $products[($counter * 3 + $li) % count($products)];
                    $qty = rand(1, 15);
                    $unitPrice = $prod->unit_price;
                    $lineSubtotal = round($qty * $unitPrice, 2);
                    $analytic = $analytics[($counter + $li) % count($analytics)];

                    if ($isInterstate) {
                        $cgst = 0;
                        $sgst = 0;
                        $igst = round($lineSubtotal * 0.18, 2);
                        $lineTax = $igst;
                    } else {
                        $cgst = round($lineSubtotal * 0.09, 2);
                        $sgst = round($lineSubtotal * 0.09, 2);
                        $igst = 0;
                        $lineTax = $cgst + $sgst;
                    }

                    $subtotal += $lineSubtotal;
                    $taxAmount += $lineTax;
                    $cgstTotal += $cgst;
                    $sgstTotal += $sgst;
                    $igstTotal += $igst;

                    $lineItemsData[] = [
                        'product_id' => $prod->id,
                        'analytic_account_id' => $analytic->id,
                        'hsn_code' => $prod->hsn_code,
                        'description' => "Commercial supply and commissioning of {$prod->name}",
                        'quantity_ordered' => $qty,
                        'quantity_delivered' => in_array($status, ['delivered']) ? $qty : 0,
                        'unit_price' => $unitPrice,
                        'discount_percent' => 0.00,
                        'tax_rate' => 18.00,
                        'cgst_rate' => $isInterstate ? 0.00 : 9.00,
                        'cgst_amount' => $cgst,
                        'sgst_rate' => $isInterstate ? 0.00 : 9.00,
                        'sgst_amount' => $sgst,
                        'igst_rate' => $isInterstate ? 18.00 : 0.00,
                        'igst_amount' => $igst,
                        'tax_amount' => $lineTax,
                        'line_total' => $lineSubtotal + $lineTax,
                    ];
                }

                $totalAmount = $subtotal + $taxAmount;

                $so = SalesOrder::create([
                    'so_number' => $num,
                    'customer_id' => $customer->id,
                    'status' => $status,
                    'order_date' => $orderDate,
                    'expected_delivery_date' => Carbon::parse($orderDate)->addDays(20)->format('Y-m-d'),
                    'delivery_date' => in_array($status, ['delivered']) ? Carbon::parse($orderDate)->addDays(18)->format('Y-m-d') : null,
                    'place_of_supply' => "{$customer->state} (" . ($customer->gstin ? substr($customer->gstin, 0, 2) : '27') . ")",
                    'is_interstate' => $isInterstate,
                    'gstin' => $customer->gstin,
                    'subtotal' => $subtotal,
                    'discount_amount' => 0.00,
                    'tax_amount' => $taxAmount,
                    'cgst_amount' => $cgstTotal,
                    'sgst_amount' => $sgstTotal,
                    'igst_amount' => $igstTotal,
                    'total_amount' => $totalAmount,
                    'shipping_address' => $customer->shipping_address ?? $customer->billing_address,
                    'notes' => "Commercial sales contract for {$customer->name}. Lead reference #{$counter}.",
                    'terms_conditions' => 'Warranty: 3 years on structural steel & timber joinery; 1 year on gas lifts & mechanisms.',
                    'approved_by' => $approver?->id,
                    'approved_at' => $approver ? Carbon::parse($orderDate)->addHours(4) : null,
                    'created_by' => $creator->id,
                ]);

                foreach ($lineItemsData as $liData) {
                    $so->items()->create($liData);
                }

                $soMap[$num] = $so;
            }
            $counter++;
        }

        return array_values($soMap);
    }

    /**
     * 10. Invoices (270+ Customer AR Invoices & 270+ Vendor AP Bills = 540+ total)
     */
    private function seedInvoicesAndBills(int $targetPerType, array $sos, array $pos, array $customers, array $vendors, array $products, array $accounts, array $analytics, array $users): array
    {
        $this->command->info("Seeding Invoices & Bills (Target: {$targetPerType} AR + {$targetPerType} AP)...");
        $existingInvoices = Invoice::all();
        $arCount = $existingInvoices->where('type', 'receivable')->count();
        $apCount = $existingInvoices->where('type', 'payable')->count();

        $revAcc = Account::where('code', '4001')->first() ?? $accounts[0];
        $expAcc = Account::where('code', '5001')->first() ?? $accounts[0];

        $statuses = ['draft', 'approved', 'partially_paid', 'paid', 'overdue', 'void'];

        $createdInvoices = [];

        // 1. Seed Customer Invoices (Receivable)
        $counter = 1;
        while (Invoice::where('type', 'receivable')->count() < $targetPerType) {
            $year = ($counter % 3 === 0) ? 2025 : 2026;
            $num = sprintf("INV-%d-%04d", $year, $counter);
            if (Invoice::where('invoice_number', $num)->exists()) {
                $counter++;
                continue;
            }
            $idx = $counter;

            $customer = $customers[$idx % count($customers)];
            $status = $statuses[$idx % count($statuses)];
            $so = $sos[$idx % count($sos)];
            $creator = $users[$idx % count($users)];

            $invDate = Carbon::create($year, ($idx % 12) + 1, rand(1, 28));
            $dueDate = $status === 'overdue'
                ? $invDate->copy()->subDays(rand(10, 120))->format('Y-m-d')
                : $invDate->copy()->addDays($customer->payment_terms_days)->format('Y-m-d');
            $invoiceDate = $invDate->format('Y-m-d');

            $isInterstate = ($customer->state !== 'Maharashtra');

            $lineCount = ($idx % 3) + 1;
            $subtotal = 0;
            $taxAmount = 0;
            $cgstTotal = 0;
            $sgstTotal = 0;
            $igstTotal = 0;
            $lines = [];

            for ($li = 0; $li < $lineCount; $li++) {
                $prod = $products[($idx + $li) % count($products)];
                $qty = rand(2, 10);
                $unitPrice = $prod->unit_price;
                $lineSub = round($qty * $unitPrice, 2);
                $analytic = $analytics[($idx + $li) % count($analytics)];

                if ($isInterstate) {
                    $cgst = 0;
                    $sgst = 0;
                    $igst = round($lineSub * 0.18, 2);
                    $lineTax = $igst;
                } else {
                    $cgst = round($lineSub * 0.09, 2);
                    $sgst = round($lineSub * 0.09, 2);
                    $igst = 0;
                    $lineTax = $cgst + $sgst;
                }

                $subtotal += $lineSub;
                $taxAmount += $lineTax;
                $cgstTotal += $cgst;
                $sgstTotal += $sgst;
                $igstTotal += $igst;

                $lines[] = [
                    'product_id' => $prod->id,
                    'account_id' => $revAcc->id,
                    'analytic_account_id' => $analytic->id,
                    'hsn_code' => $prod->hsn_code,
                    'description' => "Commercial invoice line for {$prod->name}",
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'tax_rate' => 18.00,
                    'cgst_rate' => $isInterstate ? 0.00 : 9.00,
                    'cgst_amount' => $cgst,
                    'sgst_rate' => $isInterstate ? 0.00 : 9.00,
                    'sgst_amount' => $sgst,
                    'igst_rate' => $isInterstate ? 18.00 : 0.00,
                    'igst_amount' => $igst,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineSub + $lineTax,
                ];
            }

            $totalAmount = $subtotal + $taxAmount;
            $paidAmount = match ($status) {
                'paid' => $totalAmount,
                'partially_paid' => round($totalAmount * 0.45, 2),
                default => 0.00,
            };
            $balanceDue = round($totalAmount - $paidAmount, 2);

            $inv = Invoice::create([
                'invoice_number' => $num,
                'type' => 'receivable',
                'status' => $status,
                'reference_type' => SalesOrder::class,
                'reference_id' => $so->id,
                'party_type' => 'customer',
                'party_id' => $customer->id,
                'place_of_supply' => "{$customer->state} (" . ($customer->gstin ? substr($customer->gstin, 0, 2) : '27') . ")",
                'is_interstate' => $isInterstate,
                'gstin' => $customer->gstin,
                'invoice_date' => $invoiceDate,
                'due_date' => $dueDate,
                'payment_date' => $status === 'paid' ? Carbon::parse($dueDate)->subDays(rand(1, 10))->format('Y-m-d') : null,
                'subtotal' => $subtotal,
                'discount_amount' => 0.00,
                'tax_amount' => $taxAmount,
                'cgst_amount' => $cgstTotal,
                'sgst_amount' => $sgstTotal,
                'igst_amount' => $igstTotal,
                'total_amount' => $totalAmount,
                'amount_paid' => $paidAmount,
                'balance_due' => $balanceDue,
                'payment_terms_days' => $customer->payment_terms_days,
                'currency' => 'INR',
                'notes' => "Tax invoice issued for commercial project delivery against SO #{$so->so_number}.",
                'approved_by' => in_array($status, ['approved', 'partially_paid', 'paid']) ? $users[0]->id : null,
                'approved_at' => in_array($status, ['approved', 'partially_paid', 'paid']) ? Carbon::parse($invoiceDate)->addHours(5) : null,
                'created_by' => $creator->id,
            ]);

            foreach ($lines as $line) {
                $inv->items()->create($line);
            }
            $createdInvoices[] = $inv;
        }

        // 2. Seed Vendor Bills (Payable)
        $counter = 1;
        while (Invoice::where('type', 'payable')->count() < $targetPerType) {
            $year = ($counter % 3 === 0) ? 2025 : 2026;
            $num = sprintf("BILL-%d-%04d", $year, $counter);
            if (Invoice::where('invoice_number', $num)->exists()) {
                $counter++;
                continue;
            }
            $idx = $counter;

            $vendor = $vendors[$idx % count($vendors)];
            $status = $statuses[$idx % count($statuses)];
            $po = $pos[$idx % count($pos)];
            $creator = $users[$idx % count($users)];

            $billDate = Carbon::create($year, ($idx % 12) + 1, rand(1, 28));
            $dueDate = $status === 'overdue'
                ? $billDate->copy()->subDays(rand(10, 120))->format('Y-m-d')
                : $billDate->copy()->addDays($vendor->payment_terms_days)->format('Y-m-d');
            $invoiceDate = $billDate->format('Y-m-d');

            $isInterstate = ($vendor->state !== 'Maharashtra');

            $lineCount = ($idx % 3) + 1;
            $subtotal = 0;
            $taxAmount = 0;
            $cgstTotal = 0;
            $sgstTotal = 0;
            $igstTotal = 0;
            $lines = [];

            for ($li = 0; $li < $lineCount; $li++) {
                $prod = $products[($idx + $li * 2) % count($products)];
                $qty = rand(5, 30);
                $unitPrice = $prod->cost_price;
                $lineSub = round($qty * $unitPrice, 2);
                $analytic = $analytics[($idx + $li) % count($analytics)];

                if ($isInterstate) {
                    $cgst = 0;
                    $sgst = 0;
                    $igst = round($lineSub * 0.18, 2);
                    $lineTax = $igst;
                } else {
                    $cgst = round($lineSub * 0.09, 2);
                    $sgst = round($lineSub * 0.09, 2);
                    $igst = 0;
                    $lineTax = $cgst + $sgst;
                }

                $subtotal += $lineSub;
                $taxAmount += $lineTax;
                $cgstTotal += $cgst;
                $sgstTotal += $sgst;
                $igstTotal += $igst;

                $lines[] = [
                    'product_id' => $prod->id,
                    'account_id' => $expAcc->id,
                    'analytic_account_id' => $analytic->id,
                    'hsn_code' => $prod->hsn_code,
                    'description' => "Vendor raw materials delivery for {$prod->name}",
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'tax_rate' => 18.00,
                    'cgst_rate' => $isInterstate ? 0.00 : 9.00,
                    'cgst_amount' => $cgst,
                    'sgst_rate' => $isInterstate ? 0.00 : 9.00,
                    'sgst_amount' => $sgst,
                    'igst_rate' => $isInterstate ? 18.00 : 0.00,
                    'igst_amount' => $igst,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineSub + $lineTax,
                ];
            }

            $totalAmount = $subtotal + $taxAmount;
            $paidAmount = match ($status) {
                'paid' => $totalAmount,
                'partially_paid' => round($totalAmount * 0.5, 2),
                default => 0.00,
            };
            $balanceDue = round($totalAmount - $paidAmount, 2);

            $bill = Invoice::create([
                'invoice_number' => $num,
                'type' => 'payable',
                'status' => $status,
                'reference_type' => PurchaseOrder::class,
                'reference_id' => $po->id,
                'party_type' => 'vendor',
                'party_id' => $vendor->id,
                'place_of_supply' => "{$vendor->state} (" . ($vendor->gstin ? substr($vendor->gstin, 0, 2) : '27') . ")",
                'is_interstate' => $isInterstate,
                'gstin' => $vendor->gstin,
                'invoice_date' => $invoiceDate,
                'due_date' => $dueDate,
                'payment_date' => $status === 'paid' ? Carbon::parse($dueDate)->subDays(rand(1, 5))->format('Y-m-d') : null,
                'subtotal' => $subtotal,
                'discount_amount' => 0.00,
                'tax_amount' => $taxAmount,
                'cgst_amount' => $cgstTotal,
                'sgst_amount' => $sgstTotal,
                'igst_amount' => $igstTotal,
                'total_amount' => $totalAmount,
                'amount_paid' => $paidAmount,
                'balance_due' => $balanceDue,
                'payment_terms_days' => $vendor->payment_terms_days,
                'currency' => 'INR',
                'notes' => "Inward vendor bill received against PO #{$po->po_number}. Input Tax Credit claimable.",
                'approved_by' => in_array($status, ['approved', 'partially_paid', 'paid']) ? $users[0]->id : null,
                'approved_at' => in_array($status, ['approved', 'partially_paid', 'paid']) ? Carbon::parse($invoiceDate)->addHours(4) : null,
                'created_by' => $creator->id,
            ]);

            foreach ($lines as $line) {
                $bill->items()->create($line);
            }
            $createdInvoices[] = $bill;
        }

        return Invoice::all()->all();
    }

    /**
     * 11. Payments Module (530+ payments: 265+ received & 265+ made)
     */
    private function seedPayments(int $targetTotal, array $invoices, array $accounts, array $users): array
    {
        $this->command->info("Seeding Payments (Target: {$targetTotal} total)...");
        $existing = Payment::all();
        $currentCount = $existing->count();
        $needed = max(0, $targetTotal - $currentCount);

        $bankAcc = Account::where('code', '1110')->first() ?? $accounts[0];
        $methods = ['bank_transfer', 'upi', 'cheque', 'cash', 'razorpay'];
        $statuses = ['cleared', 'cleared', 'pending', 'failed', 'reversed'];

        $payments = $existing->all();
        $counter = 1;

        while (count($payments) < $targetTotal) {
            $year = ($counter % 3 === 0) ? 2025 : 2026;
            $num = sprintf("PAY-%d-%04d", $year, $counter);
            if ($existingPay = Payment::where('payment_number', $num)->first()) {
                $payments[] = $existingPay;
                $counter++;
                continue;
            }
            $idx = $counter;

            $type = ($idx % 2 === 0) ? 'received' : 'made';
            $matchingInvoices = array_values(array_filter($invoices, fn($inv) => $inv->type === ($type === 'received' ? 'receivable' : 'payable')));
            $inv = $matchingInvoices[$idx % count($matchingInvoices)] ?? null;

            $partyType = $type === 'received' ? 'customer' : 'vendor';
            $partyId = $inv ? $inv->party_id : rand(1, 50);

            $amount = $inv ? (float)($inv->amount_paid > 0 ? $inv->amount_paid : $inv->total_amount) : rand(10, 500) * 1000.00;
            $method = $methods[$idx % count($methods)];
            $status = $statuses[$idx % count($statuses)];
            $creator = $users[$idx % count($users)];

            $refNumber = match ($method) {
                'bank_transfer' => 'NEFT-HDFC-' . rand(100000, 999999),
                'upi' => 'UPI/' . rand(10000000, 99999999) . '@okaxis',
                'cheque' => 'CHQ-' . rand(100000, 999999),
                'razorpay' => 'pay_Rzp' . rand(1000000, 9999999),
                default => 'CASH-REC-' . rand(1000, 9999),
            };

            $payDate = $inv ? $inv->invoice_date : Carbon::create($year, ($idx % 12) + 1, rand(1, 28))->format('Y-m-d');

            $payment = Payment::firstOrCreate(
                ['payment_number' => $num],
                [
                    'type' => $type,
                    'invoice_id' => $inv?->id,
                    'party_type' => $partyType,
                    'party_id' => $partyId,
                    'amount' => $amount,
                    'payment_date' => $payDate,
                    'payment_method' => $method,
                    'reference_number' => $refNumber,
                    'bank_account_id' => $bankAcc->id,
                    'status' => $status,
                    'notes' => "Operational payment for {$partyType} #{$partyId} via {$method}.",
                    'reconciled_by' => in_array($status, ['cleared']) ? $users[0]->id : null,
                    'reconciled_at' => in_array($status, ['cleared']) ? Carbon::parse($payDate)->addHours(8) : null,
                    'created_by' => $creator->id,
                ]
            );
            $payments[] = $payment;
            $counter++;
        }

        return $payments;
    }

    /**
     * 12. Payment Transactions (Razorpay Online Gateway Logs) (265+ records)
     */
    private function seedPaymentTransactions(int $targetCount, array $invoices, array $sos, array $customers, array $vendors, array $payments, array $users): void
    {
        $this->command->info("Seeding Payment Transactions (Target: {$targetCount})...");
        $existing = PaymentTransaction::all();
        $currentCount = $existing->count();
        $needed = max(0, $targetCount - $currentCount);

        $statuses = ['captured', 'authorized', 'order_created', 'refunded', 'failed'];
        $methods = [
            ['method' => 'upi', 'vpa' => 'customer@okhdfcbank'],
            ['method' => 'card', 'bank' => 'HDFC Bank', 'network' => 'Visa', 'last4' => '4242'],
            ['method' => 'netbanking', 'bank' => 'ICICI Bank'],
            ['method' => 'wallet', 'wallet' => 'paytm'],
        ];

        $counter = 1;
        while (PaymentTransaction::count() < $targetCount) {
            $txnNum = sprintf("TXN-RZP-%06d", $counter);
            if (PaymentTransaction::where('transaction_number', $txnNum)->exists()) {
                $counter++;
                continue;
            }
            $idx = $counter;
            $status = $statuses[$idx % count($statuses)];
            $mConfig = $methods[$idx % count($methods)];
            $creator = $users[$idx % count($users)];

            $isCustomer = ($idx % 3 !== 0);
            $partyType = $isCustomer ? 'customer' : 'vendor';
            $party = $isCustomer ? $customers[$idx % count($customers)] : $vendors[$idx % count($vendors)];

            $inv = $invoices[$idx % count($invoices)];
            $amount = (float) rand(2500, 150000);
            $fee = round($amount * 0.02, 2);
            $tax = round($fee * 0.18, 2);

            $linkedPayment = ($status === 'captured') ? ($payments[$idx % count($payments)] ?? null) : null;

            PaymentTransaction::create([
                'transaction_number' => $txnNum,
                'direction' => $isCustomer ? 'inbound' : 'outbound',
                'flow_type' => $isCustomer ? 'invoice_settlement' : 'vendor_payout',
                'status' => $status,
                'party_type' => $partyType,
                'party_id' => $party->id,
                'source_type' => Invoice::class,
                'source_id' => $inv->id,
                'amount' => $amount,
                'currency' => 'INR',
                'gateway' => 'razorpay',
                'razorpay_order_id' => 'order_' . substr(md5("order_{$idx}"), 0, 14),
                'razorpay_payment_id' => in_array($status, ['captured', 'authorized', 'refunded']) ? 'pay_' . substr(md5("pay_{$idx}"), 0, 14) : null,
                'razorpay_signature' => in_array($status, ['captured', 'authorized']) ? hash('sha256', "order_{$idx}|pay_{$idx}") : null,
                'razorpay_refund_id' => $status === 'refunded' ? 'rfnd_' . substr(md5("rfnd_{$idx}"), 0, 14) : null,
                'gateway_fee' => $fee,
                'gateway_tax' => $tax,
                'method_details' => $mConfig,
                'error_code' => $status === 'failed' ? 'BAD_REQUEST_ERROR' : null,
                'error_description' => $status === 'failed' ? 'Transaction declined by bank authorization server.' : null,
                'payment_id' => $linkedPayment?->id,
                'idempotency_key' => 'idem_' . md5("txn_{$idx}"),
                'metadata' => [
                    'source' => 'urban_furniture_checkout',
                    'client_ip' => '103.' . rand(1, 250) . '.' . rand(1, 250) . '.' . rand(1, 250),
                    'device' => ($idx % 2 === 0) ? 'desktop_web' : 'mobile_browser',
                ],
                'created_by' => $creator->id,
            ]);
            $counter++;
        }
    }

    /**
     * 13. General Ledger Journal Entries (270+ records with balanced lines)
     */
    private function seedJournalEntries(int $targetCount, array $journals, array $accounts, array $invoices, array $users): array
    {
        $this->command->info("Seeding Journal Entries (Target: {$targetCount})...");
        $existing = JournalEntry::all();
        $currentCount = $existing->count();
        $needed = max(0, $targetCount - $currentCount);

        $bankAcc = Account::where('code', '1110')->first() ?? $accounts[0];
        $receivableAcc = Account::where('code', '1120')->first() ?? $accounts[1];
        $payableAcc = Account::where('code', '2110')->first() ?? $accounts[2];
        $salesIncomeAcc = Account::where('code', '4001')->first() ?? $accounts[3];
        $purchExpenseAcc = Account::where('code', '5001')->first() ?? $accounts[4];
        $cgstOutputAcc = Account::where('code', '2131')->first() ?? $accounts[5];
        $sgstOutputAcc = Account::where('code', '2132')->first() ?? $accounts[6];

        $entries = [];
        foreach ($existing as $e) {
            $entries[$e->id] = $e;
        }
        $counter = 1;

        while (count($entries) < $targetCount) {
            $year = ($counter % 3 === 0) ? 2025 : 2026;
            $num = sprintf("JE-%d-%04d", $year, $counter);

            if ($existingJE = JournalEntry::where('entry_number', $num)->first()) {
                $entries[$existingJE->id] = $existingJE;
                $counter++;
                continue;
            }

            $idx = $counter;
            $journal = $journals[$idx % count($journals)];
            $creator = $users[$idx % count($users)];
            $status = ($idx % 10 === 0) ? 'draft' : (($idx % 25 === 0) ? 'reversed' : 'posted');

            $month = ($idx % 12) + 1;
            $day = rand(1, 28);
            $postingDate = Carbon::create($year, $month, $day)->format('Y-m-d');

            $amount = rand(5, 250) * 1000.00;
            $halfTax = round($amount * 0.09, 2);
            $totalGross = $amount + ($halfTax * 2);

            $entryType = match ($journal->type) {
                'sales' => 'auto',
                'purchase' => 'auto',
                'bank' => 'manual',
                default => 'adjustment',
            };

            $je = JournalEntry::create([
                'entry_number' => $num,
                'journal_id' => $journal->id,
                'type' => $entryType,
                'description' => "General ledger entry for {$journal->name} operation #{$idx}",
                'posting_date' => $postingDate,
                'fiscal_year' => $year,
                'period' => $month,
                'status' => $status,
                'reference_type' => 'ManualAdjustment',
                'reference_id' => $idx,
                'posted_by' => $status === 'posted' ? $users[0]->id : null,
                'posted_at' => $status === 'posted' ? Carbon::parse($postingDate)->addHours(4) : null,
                'created_by' => $creator->id,
            ]);

            // Balanced Double-Entry Lines: sum(debit) == sum(credit)
            if ($journal->type === 'sales') {
                // Debit AR, Credit Revenue, Credit CGST/SGST
                JournalEntryLine::create([
                    'journal_entry_id' => $je->id,
                    'account_id' => $receivableAcc->id,
                    'account_code' => $receivableAcc->code,
                    'account_name' => $receivableAcc->name,
                    'debit' => $totalGross,
                    'credit' => 0.00,
                    'description' => 'Accounts receivable billing',
                    'reference' => $num,
                ]);
                JournalEntryLine::create([
                    'journal_entry_id' => $je->id,
                    'account_id' => $salesIncomeAcc->id,
                    'account_code' => $salesIncomeAcc->code,
                    'account_name' => $salesIncomeAcc->name,
                    'debit' => 0.00,
                    'credit' => $amount,
                    'description' => 'Commercial sales recognized',
                    'reference' => $num,
                ]);
                JournalEntryLine::create([
                    'journal_entry_id' => $je->id,
                    'account_id' => $cgstOutputAcc->id,
                    'account_code' => $cgstOutputAcc->code,
                    'account_name' => $cgstOutputAcc->name,
                    'debit' => 0.00,
                    'credit' => $halfTax,
                    'description' => 'Central GST output liability',
                    'reference' => $num,
                ]);
                JournalEntryLine::create([
                    'journal_entry_id' => $je->id,
                    'account_id' => $sgstOutputAcc->id,
                    'account_code' => $sgstOutputAcc->code,
                    'account_name' => $sgstOutputAcc->name,
                    'debit' => 0.00,
                    'credit' => $halfTax,
                    'description' => 'State GST output liability',
                    'reference' => $num,
                ]);
            } elseif ($journal->type === 'purchase') {
                // Debit Expense, Debit Input Tax, Credit AP
                JournalEntryLine::create([
                    'journal_entry_id' => $je->id,
                    'account_id' => $purchExpenseAcc->id,
                    'account_code' => $purchExpenseAcc->code,
                    'account_name' => $purchExpenseAcc->name,
                    'debit' => $amount,
                    'credit' => 0.00,
                    'description' => 'Procurement materials intake',
                    'reference' => $num,
                ]);
                JournalEntryLine::create([
                    'journal_entry_id' => $je->id,
                    'account_id' => $cgstOutputAcc->id,
                    'account_code' => $cgstOutputAcc->code,
                    'account_name' => $cgstOutputAcc->name,
                    'debit' => $halfTax,
                    'credit' => 0.00,
                    'description' => 'Central GST input tax credit',
                    'reference' => $num,
                ]);
                JournalEntryLine::create([
                    'journal_entry_id' => $je->id,
                    'account_id' => $sgstOutputAcc->id,
                    'account_code' => $sgstOutputAcc->code,
                    'account_name' => $sgstOutputAcc->name,
                    'debit' => $halfTax,
                    'credit' => 0.00,
                    'description' => 'State GST input tax credit',
                    'reference' => $num,
                ]);
                JournalEntryLine::create([
                    'journal_entry_id' => $je->id,
                    'account_id' => $payableAcc->id,
                    'account_code' => $payableAcc->code,
                    'account_name' => $payableAcc->name,
                    'debit' => 0.00,
                    'credit' => $totalGross,
                    'description' => 'Accounts payable liability',
                    'reference' => $num,
                ]);
            } else {
                // Bank / Adjustment transfer: Debit Bank, Credit AR or vice versa
                JournalEntryLine::create([
                    'journal_entry_id' => $je->id,
                    'account_id' => $bankAcc->id,
                    'account_code' => $bankAcc->code,
                    'account_name' => $bankAcc->name,
                    'debit' => $amount,
                    'credit' => 0.00,
                    'description' => 'Bank treasury clearance',
                    'reference' => $num,
                ]);
                JournalEntryLine::create([
                    'journal_entry_id' => $je->id,
                    'account_id' => $receivableAcc->id,
                    'account_code' => $receivableAcc->code,
                    'account_name' => $receivableAcc->name,
                    'debit' => 0.00,
                    'credit' => $amount,
                    'description' => 'Receivable settlement offset',
                    'reference' => $num,
                ]);
            }

            $entries[$je->id] = $je;
            $counter++;
        }

        return array_values($entries);
    }

    /**
     * 14. Inventory Movements (265+ records)
     */
    private function seedInventoryMovements(int $targetCount, array $products, array $pos, array $sos, array $users): void
    {
        $this->command->info("Seeding Inventory Movements (Target: {$targetCount})...");
        $existing = InventoryMovement::count();
        $needed = max(0, $targetCount - $existing);

        $types = ['purchase', 'sale', 'adjustment', 'return'];

        for ($i = 1; $i <= $needed; $i++) {
            $idx = $existing + $i;
            $type = $types[$idx % count($types)];
            $prod = $products[$idx % count($products)];
            $qty = match ($type) {
                'purchase' => (float) rand(10, 50),
                'sale' => (float) -rand(2, 20),
                'adjustment' => (float) rand(-5, 15),
                'return' => (float) rand(1, 5),
            };

            $unitCost = $prod->cost_price;
            $totalVal = round($qty * $unitCost, 2);

            $refType = match ($type) {
                'purchase' => PurchaseOrder::class,
                'sale' => SalesOrder::class,
                default => 'WarehouseAudit',
            };
            $refId = match ($type) {
                'purchase' => $pos[$idx % count($pos)]->id,
                'sale' => $sos[$idx % count($sos)]->id,
                default => $idx,
            };

            $performedBy = $users[$idx % count($users)];

            InventoryMovement::create([
                'product_id' => $prod->id,
                'type' => $type,
                'quantity' => $qty,
                'unit_cost' => $unitCost,
                'total_value' => $totalVal,
                'reference_type' => $refType,
                'reference_id' => $refId,
                'notes' => "Stock movement log ({$type}) for {$prod->sku}. Recorded by warehouse operator.",
                'performed_by' => $performedBy->id,
            ]);
        }
    }

    /**
     * 15. Budgets & Budget Lines (265+ budgets)
     */
    private function seedBudgets(int $targetCount, array $analytics, array $customers, array $vendors, array $users): void
    {
        $this->command->info("Seeding Budgets (Target: {$targetCount})...");
        $existing = Budget::all();
        $bMap = [];
        foreach ($existing as $b) {
            $bMap[$b->name] = $b;
        }

        $statuses = ['draft', 'confirm', 'revised', 'cancelled'];
        $quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        $years = [2025, 2026, 2027];

        $counter = 1;
        while (count($bMap) < $targetCount) {
            $year = $years[$counter % count($years)];
            $q = $quarters[$counter % count($quarters)];
            $status = $statuses[$counter % count($statuses)];
            $cityInfo = $this->indianCities[$counter % count($this->indianCities)];

            $name = "FY{$year} {$q} {$cityInfo['city']} Operations Budget (#{$counter})";

            if (!isset($bMap[$name])) {
                $startMonth = match ($q) {
                    'Q1' => '01-01',
                    'Q2' => '04-01',
                    'Q3' => '07-01',
                    'Q4' => '10-01',
                };
                $endMonth = match ($q) {
                    'Q1' => '03-31',
                    'Q2' => '06-30',
                    'Q3' => '09-30',
                    'Q4' => '12-31',
                };

                $customer = $customers[$counter % count($customers)];

                $budget = Budget::create([
                    'name' => $name,
                    'start_date' => "{$year}-{$startMonth}",
                    'end_date' => "{$year}-{$endMonth}",
                    'responsible_id' => $customer->id,
                    'responsible_type' => 'customer',
                    'status' => $status,
                ]);

                // Create 2-3 budget lines
                $lineCount = ($counter % 3) + 2;
                for ($bl = 0; $bl < $lineCount; $bl++) {
                    $analytic = $analytics[($counter * 2 + $bl) % count($analytics)];
                    BudgetLine::create([
                        'budget_id' => $budget->id,
                        'analytic_account_id' => $analytic->id,
                        'type' => $analytic->type,
                        'committed_amount' => rand(50, 800) * 10000.00,
                    ]);
                }

                $bMap[$name] = $budget;
            }
            $counter++;
        }
    }

    /**
     * 16. Workshop Action Items (265+ records)
     */
    private function seedItems(int $targetCount, array $users): void
    {
        $this->command->info("Seeding Workshop Items (Target: {$targetCount})...");
        $existing = Item::count();
        $needed = max(0, $targetCount - $existing);

        $priorities = ['low', 'medium', 'high'];
        $statuses = ['pending', 'in_progress', 'completed'];

        $actionTemplates = [
            'Precision calibration of 5-axis CNC router in fabrication bay',
            'Verify fire-retardant foam certificates for civic airport tender',
            'Cross-check transporter consignment notes with warehouse stock inward',
            'Inspect moisture content in Malabar teak lot before kiln seasoning',
            'Review commercial park delivery challans and client seal signoffs',
            'Follow up with accounts team on 45-day overdue receivable aging',
            'Prepare quarterly workshop safety inspection log and equipment certs',
            'Finalize CAD architectural models for 12-person modular workstation pod',
            'Conduct spot physical count for high-back leather executive chairs',
            'Submit revised GST input credit setoff schedule for state tax portal',
            'Coordinate overnight logistics dispatch for smart parklet solar benches',
            'Audit electrostatic powder coating thickness on steel cantilevers',
            'Review vendor credit terms for imported acoustic felt partition panels',
        ];

        for ($i = 1; $i <= $needed; $i++) {
            $idx = $existing + $i;
            $tmpl = $actionTemplates[$idx % count($actionTemplates)];
            $user = $users[$idx % count($users)];
            $priority = $priorities[$idx % count($priorities)];
            $status = $statuses[$idx % count($statuses)];

            Item::create([
                'user_id' => $user->id,
                'title' => "{$tmpl} - Task #{$idx}",
                'description' => "Operational workflow task assigned to {$user->name} ({$user->role}) in department operations.",
                'status' => $status,
                'priority' => $priority,
            ]);
        }
    }

    /**
     * 17. Sequence and Balance Synchronization
     */
    private function syncDocumentSequences(): void
    {
        $this->command->info('Synchronizing document sequences for next user numbers...');

        $sequences = [
            'PO_2025' => PurchaseOrder::where('po_number', 'like', 'PO-2025-%')->count() + 10,
            'PO_2026' => PurchaseOrder::where('po_number', 'like', 'PO-2026-%')->count() + 10,
            'SO_2025' => SalesOrder::where('so_number', 'like', 'SO-2025-%')->count() + 10,
            'SO_2026' => SalesOrder::where('so_number', 'like', 'SO-2026-%')->count() + 10,
            'INV_2025' => Invoice::where('type', 'receivable')->where('invoice_number', 'like', 'INV-2025-%')->count() + 10,
            'INV_2026' => Invoice::where('type', 'receivable')->where('invoice_number', 'like', 'INV-2026-%')->count() + 10,
            'BILL_2025' => Invoice::where('type', 'payable')->where('invoice_number', 'like', 'BILL-2025-%')->count() + 10,
            'BILL_2026' => Invoice::where('type', 'payable')->where('invoice_number', 'like', 'BILL-2026-%')->count() + 10,
            'PAY_2025' => Payment::where('payment_number', 'like', 'PAY-2025-%')->count() + 10,
            'PAY_2026' => Payment::where('payment_number', 'like', 'PAY-2026-%')->count() + 10,
            'JE_2025' => JournalEntry::where('entry_number', 'like', 'JE-2025-%')->count() + 10,
            'JE_2026' => JournalEntry::where('entry_number', 'like', 'JE-2026-%')->count() + 10,
            'CUST' => Customer::count() + 10,
            'VEN' => Vendor::count() + 10,
        ];

        foreach ($sequences as $name => $currentNum) {
            DB::table('document_sequences')->updateOrInsert(
                ['name' => $name],
                [
                    'current_number' => $currentNum,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    private function recalculateGLBalances(array $accounts): void
    {
        $this->command->info('Recalculating General Ledger balances across all chart of accounts...');
        foreach ($accounts as $acc) {
            $acc->recalculateBalance();
        }
    }
}
