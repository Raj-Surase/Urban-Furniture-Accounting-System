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

/**
 * DemoUserSeeder
 *
 * Seeds 200+ rows per module explicitly attributed to each demo user account.
 * This ensures that even user-role accounts (which are RBAC-scoped to created_by)
 * see a full 200+ row dataset on every module page during the demo.
 *
 * Demo accounts targeted:
 *  - admin@example.com    [admin]   — sees all data (global scope), already 265+ rows system-wide
 *  - manager@example.com  [manager] — sees all data (global scope), already 265+ rows system-wide
 *  - manager2@example.com [manager] — sees all data (global scope)
 *  - user@example.com     [user]    — scoped to created_by → needs 200+ personal rows
 *  - clerk@example.com    [user]    — scoped to created_by → needs 200+ personal rows
 */
class DemoUserSeeder extends Seeder
{
    private const TARGET = 200;

    private array $indianCities = [
        ['city' => 'Mumbai',     'state' => 'Maharashtra',   'state_code' => '27', 'pincode' => '400001'],
        ['city' => 'Pune',       'state' => 'Maharashtra',   'state_code' => '27', 'pincode' => '411001'],
        ['city' => 'Bengaluru',  'state' => 'Karnataka',     'state_code' => '29', 'pincode' => '560001'],
        ['city' => 'Hyderabad',  'state' => 'Telangana',     'state_code' => '36', 'pincode' => '500001'],
        ['city' => 'Ahmedabad',  'state' => 'Gujarat',       'state_code' => '24', 'pincode' => '380001'],
        ['city' => 'New Delhi',  'state' => 'Delhi',         'state_code' => '07', 'pincode' => '110001'],
        ['city' => 'Chennai',    'state' => 'Tamil Nadu',    'state_code' => '33', 'pincode' => '600001'],
        ['city' => 'Kolkata',    'state' => 'West Bengal',   'state_code' => '19', 'pincode' => '700001'],
        ['city' => 'Jaipur',     'state' => 'Rajasthan',     'state_code' => '08', 'pincode' => '302001'],
        ['city' => 'Indore',     'state' => 'Madhya Pradesh','state_code' => '23', 'pincode' => '452001'],
        ['city' => 'Surat',      'state' => 'Gujarat',       'state_code' => '24', 'pincode' => '395001'],
        ['city' => 'Kochi',      'state' => 'Kerala',        'state_code' => '32', 'pincode' => '682001'],
        ['city' => 'Nagpur',     'state' => 'Maharashtra',   'state_code' => '27', 'pincode' => '440001'],
        ['city' => 'Coimbatore', 'state' => 'Tamil Nadu',    'state_code' => '33', 'pincode' => '641001'],
        ['city' => 'Chandigarh', 'state' => 'Chandigarh',   'state_code' => '04', 'pincode' => '160001'],
    ];

    private array $companyPrefixes = [
        'Apex', 'Nexus', 'Vertex', 'Starlight', 'Greenfield', 'Bluestone', 'Zenith',
        'Titan', 'Prestige', 'Sobha', 'DLF', 'Godrej', 'Lodha', 'Brigade', 'L&T',
        'Oberoi', 'Hiranandani', 'Emaar', 'Phoenix', 'Mahindra', 'Tata', 'Adani',
    ];

    private array $companySuffixes = [
        'Tech Parks Ltd', 'Commercial Interiors', 'Hospitality & Resorts',
        'Workspaces Pvt Ltd', 'Infrastructure Corp', 'Studios & Architecture',
        'Realty & Living', 'Corporate Solutions', 'Smart Cities SPV',
        'Healthcare Networks', 'Educational Foundation', 'Design Labs',
    ];

    private array $vendorNiches = [
        ['prefix' => 'Malabar',      'suffix' => 'Teak & Hardwoods Mill',           'category' => 'Timber'],
        ['prefix' => 'Precision CNC','suffix' => 'Metal & Tubular Joinery',          'category' => 'Hardware'],
        ['prefix' => 'Coimbatore',   'suffix' => 'Commercial Upholstery & Fabrics',  'category' => 'Upholstery'],
        ['prefix' => 'Kutch',        'suffix' => 'Foam & Ergonomic Cushioning',       'category' => 'Cushioning'],
        ['prefix' => 'Gujarat',      'suffix' => 'Tempered Glass & Ceramic Tops',    'category' => 'Glass & Tops'],
        ['prefix' => 'Bhiwandi',     'suffix' => 'Heavy Duty Packaging & Corrugated','category' => 'Packaging'],
        ['prefix' => 'Pune',         'suffix' => 'Powder Coating & Surface Finishes','category' => 'Finishing'],
        ['prefix' => 'Bengaluru',    'suffix' => 'Smart Sensors & Integrated Wiring','category' => 'Electronics'],
        ['prefix' => 'Jaipur',       'suffix' => 'Artisan Brass Inlays & Hardware',  'category' => 'Fittings'],
        ['prefix' => 'Surat',        'suffix' => 'Plywood & Sustainable MDF Boards', 'category' => 'Boards'],
    ];

    private array $itemTemplates = [
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
        'Reconcile accounts payable aging report with purchase ledger entries',
        'Update product catalogue with new ergonomic chair GST HSN classifications',
        'Prepare site installation schedule for 40-unit tech park workstations',
        'Follow up on pending e-waybill generation for outstation deliveries',
        'Validate quality inspection checklist for newly arrived timber lot',
    ];

    public function run(): void
    {
        $this->command->info('🎯 Starting DemoUserSeeder — ensuring 200+ rows per module per demo user...');

        // Load all shared reference data (already seeded by ComprehensiveOperationsSeeder)
        $products   = Product::all()->all();
        $accounts   = Account::all()->all();
        $analytics  = AnalyticAccount::all()->all();
        $journals   = Journal::all()->all();
        $allUsers   = User::all()->all();

        if (empty($products) || empty($accounts) || empty($analytics) || empty($journals)) {
            $this->command->error('❌ Shared data (products/accounts/analytics/journals) is missing. Run ComprehensiveOperationsSeeder first.');
            return;
        }

        // Key accounts
        $bankAcc       = Account::where('code', '1110')->first() ?? $accounts[0];
        $receivableAcc = Account::where('code', '1120')->first() ?? $accounts[1];
        $payableAcc    = Account::where('code', '2110')->first() ?? $accounts[2];
        $revAcc        = Account::where('code', '4001')->first() ?? $accounts[3];
        $expAcc        = Account::where('code', '5001')->first() ?? $accounts[4];
        $cgstAcc       = Account::where('code', '2131')->first() ?? $bankAcc;
        $sgstAcc       = Account::where('code', '2132')->first() ?? $bankAcc;
        $revAccounts   = Account::where('type', 'revenue')->get();
        $expAccounts   = Account::where('type', 'expense')->get();

        $adminUser = User::where('email', 'admin@example.com')->first();

        // Demo user-role accounts that need personal data (RBAC-scoped)
        $scopedDemoUsers = User::whereIn('email', [
            'user@example.com',
            'clerk@example.com',
        ])->get()->all();

        // Elevated demo accounts (admin/manager) — they see everything globally, but we still
        // attribute 200+ records to them directly so personal dashboards look rich too.
        $elevatedDemoUsers = User::whereIn('email', [
            'admin@example.com',
            'manager@example.com',
            'manager2@example.com',
        ])->get()->all();

        $allDemoUsers = array_merge($scopedDemoUsers, $elevatedDemoUsers);

        foreach ($allDemoUsers as $demoUser) {
            $this->command->info("  → Seeding for: {$demoUser->email} [{$demoUser->role}]");

            // 1. Customers
            $userCustomers = $this->seedUserCustomers($demoUser, $receivableAcc, $adminUser);

            // 2. Vendors
            $userVendors = $this->seedUserVendors($demoUser, $payableAcc, $adminUser);

            // 3. Purchase Orders (+ items)
            $userPOs = $this->seedUserPurchaseOrders($demoUser, $userVendors, $products, $analytics, $adminUser);

            // 4. Sales Orders (+ items)
            $userSOs = $this->seedUserSalesOrders($demoUser, $userCustomers, $products, $analytics, $adminUser);

            // 5. Invoices — AR (linked to SOs)
            $userARInvoices = $this->seedUserARInvoices($demoUser, $userSOs, $userCustomers, $products, $accounts, $analytics, $revAccounts, $adminUser);

            // 6. Vendor Bills — AP (linked to POs)
            $userAPInvoices = $this->seedUserAPBills($demoUser, $userPOs, $userVendors, $products, $accounts, $analytics, $expAccounts, $adminUser);

            // 7. Payments (received + made)
            $this->seedUserPayments($demoUser, $userARInvoices, $userAPInvoices, $bankAcc, $adminUser);

            // 8. Journal Entries (balanced double-entry)
            $this->seedUserJournalEntries($demoUser, $journals, $bankAcc, $receivableAcc, $payableAcc, $revAcc, $expAcc, $cgstAcc, $sgstAcc, $revAccounts, $expAccounts, $adminUser);

            // 9. Inventory Movements
            $this->seedUserInventoryMovements($demoUser, $products, $userPOs, $userSOs);

            // 10. Budgets (+ budget lines)
            $this->seedUserBudgets($demoUser, $analytics);

            // 11. Items (Workshop tasks)
            $this->seedUserItems($demoUser);
        }

        // Sync document sequences after mass insert
        $this->syncSequences();

        $this->command->info('✅ DemoUserSeeder completed — 200+ rows per module per demo user!');
    }

    // =========================================================================
    // 1. Customers
    // =========================================================================
    private function seedUserCustomers(User $demoUser, Account $receivableAcc, ?User $adminUser): array
    {
        $existing = Customer::where('created_by', $demoUser->id)->count();
        $needed   = max(0, self::TARGET - $existing);
        $this->command->info("    Customers: {$existing} existing, creating {$needed}...");

        // Use DEMO-CUST prefix to avoid collisions with existing CUST- records
        $baseOffset = (int) DB::table('customers')
            ->where('code', 'like', 'DEMO-CUST-%')
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(code, '-', -1) AS UNSIGNED)) as max_num")
            ->value('max_num');

        for ($i = 1; $i <= $needed; $i++) {
            $n        = $baseOffset + $i;
            $code     = sprintf('DEMO-CUST-%04d', $n);
            $city     = $this->indianCities[$n % count($this->indianCities)];
            $prefix   = $this->companyPrefixes[$n % count($this->companyPrefixes)];
            $suffix   = $this->companySuffixes[($n * 2) % count($this->companySuffixes)];
            $company  = "{$prefix} {$suffix}";
            $gstin    = sprintf('%sAAACU%04d%s1Z%d',
                $city['state_code'], 1000 + ($n % 8000), chr(65 + ($n % 26)), ($n % 9) + 1
            );

            Customer::firstOrCreate(['code' => $code], [
                'name'                 => "{$company} ({$city['city']} D#{$n})",
                'contact_person'       => 'Demo Contact ' . $n,
                'email'                => strtolower("demo.cust{$n}@{$prefix}.urbanfurniture.demo"),
                'phone'                => '+91 ' . rand(98000, 99999) . ' ' . rand(10000, 99999),
                'billing_address'      => "Tower " . chr(65 + ($n % 8)) . ", Level " . (($n % 18) + 1) . ", {$city['city']} Commercial Zone",
                'shipping_address'     => "Warehouse & Logistics Hub, Sector " . (($n % 40) + 1) . ", {$city['city']}",
                'city'                 => $city['city'],
                'state'                => $city['state'],
                'country'              => 'India',
                'pincode'              => $city['pincode'],
                'gstin'                => $gstin,
                'credit_limit'         => rand(5, 50) * 100000.00,
                'payment_terms_days'   => [15, 30, 45, 60][$n % 4],
                'receivable_account_id'=> $receivableAcc->id,
                'currency'             => 'INR',
                'is_active'            => true,
                'notes'                => "Demo customer record for {$demoUser->email}.",
                'created_by'           => $demoUser->id,
            ]);
        }

        return Customer::where('created_by', $demoUser->id)->get()->all();
    }

    // =========================================================================
    // 2. Vendors
    // =========================================================================
    private function seedUserVendors(User $demoUser, Account $payableAcc, ?User $adminUser): array
    {
        $existing = Vendor::where('created_by', $demoUser->id)->count();
        $needed   = max(0, self::TARGET - $existing);
        $this->command->info("    Vendors: {$existing} existing, creating {$needed}...");

        // Use DEMO-VEN prefix to avoid collisions with existing VEN- records
        $baseOffset = (int) DB::table('vendors')
            ->where('code', 'like', 'DEMO-VEN-%')
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(code, '-', -1) AS UNSIGNED)) as max_num")
            ->value('max_num');

        for ($i = 1; $i <= $needed; $i++) {
            $n     = $baseOffset + $i;
            $code  = sprintf('DEMO-VEN-%04d', $n);
            $city  = $this->indianCities[$n % count($this->indianCities)];
            $niche = $this->vendorNiches[$n % count($this->vendorNiches)];
            $pan   = sprintf('AABFV%04d%s', 2000 + ($n % 7000), chr(65 + ($n % 26)));
            $gstin = sprintf('%s%s1Z%d', $city['state_code'], $pan, ($n % 9) + 1);

            Vendor::firstOrCreate(['code' => $code], [
                'name'               => "{$niche['prefix']} {$niche['suffix']} (#{$n})",
                'contact_person'     => 'Demo Vendor Contact ' . $n,
                'email'              => strtolower("orders@demo.ven{$n}.urbanfurniture.demo"),
                'phone'              => '+91 ' . rand(97000, 98999) . ' ' . rand(10000, 99999),
                'address'            => "Plot " . (($n % 80) + 1) . ", GIDC Industrial Estate, {$city['city']}",
                'city'               => $city['city'],
                'state'              => $city['state'],
                'country'            => 'India',
                'pincode'            => $city['pincode'],
                'gstin'              => $gstin,
                'pan'                => $pan,
                'payment_terms_days' => [15, 30, 45, 60][$n % 4],
                'payable_account_id' => $payableAcc->id,
                'currency'           => 'INR',
                'is_active'          => true,
                'notes'              => "Demo vendor for {$niche['category']} supplies. Linked to {$demoUser->email}.",
                'created_by'         => $demoUser->id,
            ]);
        }

        return Vendor::where('created_by', $demoUser->id)->get()->all();
    }

    // =========================================================================
    // 3. Purchase Orders
    // =========================================================================
    private function seedUserPurchaseOrders(User $demoUser, array $vendors, array $products, array $analytics, ?User $adminUser): array
    {
        $existing = PurchaseOrder::where('created_by', $demoUser->id)->count();
        $needed   = max(0, self::TARGET - $existing);
        $this->command->info("    Purchase Orders: {$existing} existing, creating {$needed}...");

        $statuses = ['draft', 'submitted', 'approved', 'partially_received', 'received', 'rejected', 'cancelled'];

        // Use global counter across ALL demo POs to avoid duplicate po_number collisions
        $maxExistingNum = (int) DB::table('purchase_orders')
            ->where('po_number', 'like', 'DEMO-PO-%')
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(po_number, '-', -1) AS UNSIGNED)) as max_num")
            ->value('max_num');
        $counter = $maxExistingNum + 1;

        for ($i = 1; $i <= $needed; $i++) {
            $year    = ($counter % 3 === 0) ? 2025 : 2026;
            $num     = sprintf('DEMO-PO-%d-%05d', $year, $counter);
            $vendor  = $vendors[$counter % count($vendors)];
            $status  = $statuses[$counter % count($statuses)];
            $approver = in_array($status, ['approved', 'received', 'partially_received']) ? $adminUser : null;

            $orderDate   = Carbon::create($year, ($counter % 12) + 1, rand(1, 28));
            $isInterstate = ($vendor->state !== 'Maharashtra');

            $lineCount  = ($counter % 3) + 1;
            $subtotal   = 0;
            $taxAmount  = 0;
            $cgstTotal  = 0;
            $sgstTotal  = 0;
            $igstTotal  = 0;
            $lineItems  = [];

            for ($li = 0; $li < $lineCount; $li++) {
                $prod       = $products[($counter * 2 + $li) % count($products)];
                $qty        = rand(2, 25);
                $unitPrice  = $prod->cost_price;
                $lineSub    = round($qty * $unitPrice, 2);
                $analytic   = $analytics[($counter + $li) % count($analytics)];

                [$cgst, $sgst, $igst, $lineTax] = $this->calcGst($lineSub, $isInterstate);

                $subtotal  += $lineSub;
                $taxAmount += $lineTax;
                $cgstTotal += $cgst;
                $sgstTotal += $sgst;
                $igstTotal += $igst;

                $lineItems[] = [
                    'product_id'           => $prod->id,
                    'analytic_account_id'  => $analytic->id,
                    'hsn_code'             => $prod->hsn_code,
                    'description'          => "Procurement of {$prod->name}",
                    'quantity_ordered'     => $qty,
                    'quantity_received'    => in_array($status, ['received', 'partially_received']) ? $qty : 0,
                    'unit_price'           => $unitPrice,
                    'tax_rate'             => 18.00,
                    'cgst_rate'            => $isInterstate ? 0.00 : 9.00,
                    'cgst_amount'          => $cgst,
                    'sgst_rate'            => $isInterstate ? 0.00 : 9.00,
                    'sgst_amount'          => $sgst,
                    'igst_rate'            => $isInterstate ? 18.00 : 0.00,
                    'igst_amount'          => $igst,
                    'tax_amount'           => $lineTax,
                    'line_total'           => $lineSub + $lineTax,
                ];
            }

            $totalAmount = $subtotal + $taxAmount;

            $po = PurchaseOrder::create([
                'po_number'              => $num,
                'vendor_id'              => $vendor->id,
                'status'                 => $status,
                'order_date'             => $orderDate->format('Y-m-d'),
                'expected_delivery_date' => $orderDate->copy()->addDays(14)->format('Y-m-d'),
                'delivery_date'          => $status === 'received' ? $orderDate->copy()->addDays(12)->format('Y-m-d') : null,
                'place_of_supply'        => "{$vendor->state} (" . ($vendor->gstin ? substr($vendor->gstin, 0, 2) : '27') . ")",
                'is_interstate'          => $isInterstate,
                'gstin'                  => $vendor->gstin,
                'subtotal'               => $subtotal,
                'tax_amount'             => $taxAmount,
                'cgst_amount'            => $cgstTotal,
                'sgst_amount'            => $sgstTotal,
                'igst_amount'            => $igstTotal,
                'discount_amount'        => 0.00,
                'total_amount'           => $totalAmount,
                'notes'                  => "Demo purchase order #{$counter} for {$demoUser->email}.",
                'terms_conditions'       => 'Goods subject to QC inspection upon unloading.',
                'approved_by'            => $approver?->id,
                'approved_at'            => $approver ? $orderDate->copy()->addHours(6) : null,
                'created_by'             => $demoUser->id,
            ]);

            foreach ($lineItems as $li) {
                $po->items()->create($li);
            }

            $counter++;
        }

        return PurchaseOrder::where('created_by', $demoUser->id)->get()->all();
    }

    // =========================================================================
    // 4. Sales Orders
    // =========================================================================
    private function seedUserSalesOrders(User $demoUser, array $customers, array $products, array $analytics, ?User $adminUser): array
    {
        $existing = SalesOrder::where('created_by', $demoUser->id)->count();
        $needed   = max(0, self::TARGET - $existing);
        $this->command->info("    Sales Orders: {$existing} existing, creating {$needed}...");

        $statuses = ['draft', 'confirmed', 'approved', 'invoiced', 'delivered', 'cancelled'];

        // Use global counter across ALL demo SOs to avoid duplicate so_number collisions
        $maxExistingNum = (int) DB::table('sales_orders')
            ->where('so_number', 'like', 'DEMO-SO-%')
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(so_number, '-', -1) AS UNSIGNED)) as max_num")
            ->value('max_num');
        $counter = $maxExistingNum + 1;

        for ($i = 1; $i <= $needed; $i++) {
            $year     = ($counter % 3 === 0) ? 2025 : 2026;
            $num      = sprintf('DEMO-SO-%d-%05d', $year, $counter);
            $customer = $customers[$counter % count($customers)];
            $status   = $statuses[$counter % count($statuses)];
            $approver = in_array($status, ['approved', 'invoiced', 'delivered']) ? $adminUser : null;

            $orderDate    = Carbon::create($year, ($counter % 12) + 1, rand(1, 28));
            $isInterstate = ($customer->state !== 'Maharashtra');

            $lineCount = ($counter % 3) + 1;
            $subtotal  = 0;
            $taxAmount = 0;
            $cgstTotal = 0;
            $sgstTotal = 0;
            $igstTotal = 0;
            $lineItems = [];

            for ($li = 0; $li < $lineCount; $li++) {
                $prod      = $products[($counter * 3 + $li) % count($products)];
                $qty       = rand(1, 15);
                $unitPrice = $prod->unit_price;
                $lineSub   = round($qty * $unitPrice, 2);
                $analytic  = $analytics[($counter + $li) % count($analytics)];

                [$cgst, $sgst, $igst, $lineTax] = $this->calcGst($lineSub, $isInterstate);

                $subtotal  += $lineSub;
                $taxAmount += $lineTax;
                $cgstTotal += $cgst;
                $sgstTotal += $sgst;
                $igstTotal += $igst;

                $lineItems[] = [
                    'product_id'            => $prod->id,
                    'analytic_account_id'   => $analytic->id,
                    'hsn_code'              => $prod->hsn_code,
                    'description'           => "Commercial supply of {$prod->name}",
                    'quantity_ordered'      => $qty,
                    'quantity_delivered'    => $status === 'delivered' ? $qty : 0,
                    'unit_price'            => $unitPrice,
                    'discount_percent'      => 0.00,
                    'tax_rate'              => 18.00,
                    'cgst_rate'             => $isInterstate ? 0.00 : 9.00,
                    'cgst_amount'           => $cgst,
                    'sgst_rate'             => $isInterstate ? 0.00 : 9.00,
                    'sgst_amount'           => $sgst,
                    'igst_rate'             => $isInterstate ? 18.00 : 0.00,
                    'igst_amount'           => $igst,
                    'tax_amount'            => $lineTax,
                    'line_total'            => $lineSub + $lineTax,
                ];
            }

            $totalAmount = $subtotal + $taxAmount;

            $so = SalesOrder::create([
                'so_number'              => $num,
                'customer_id'            => $customer->id,
                'status'                 => $status,
                'order_date'             => $orderDate->format('Y-m-d'),
                'expected_delivery_date' => $orderDate->copy()->addDays(20)->format('Y-m-d'),
                'delivery_date'          => $status === 'delivered' ? $orderDate->copy()->addDays(18)->format('Y-m-d') : null,
                'place_of_supply'        => "{$customer->state} (" . ($customer->gstin ? substr($customer->gstin, 0, 2) : '27') . ")",
                'is_interstate'          => $isInterstate,
                'gstin'                  => $customer->gstin,
                'subtotal'               => $subtotal,
                'discount_amount'        => 0.00,
                'tax_amount'             => $taxAmount,
                'cgst_amount'            => $cgstTotal,
                'sgst_amount'            => $sgstTotal,
                'igst_amount'            => $igstTotal,
                'total_amount'           => $totalAmount,
                'shipping_address'       => $customer->shipping_address ?? $customer->billing_address,
                'notes'                  => "Demo sales contract #{$counter} for {$demoUser->email}.",
                'terms_conditions'       => 'Warranty: 3 years structural; 1 year mechanisms.',
                'approved_by'            => $approver?->id,
                'approved_at'            => $approver ? $orderDate->copy()->addHours(4) : null,
                'created_by'             => $demoUser->id,
            ]);

            foreach ($lineItems as $li) {
                $so->items()->create($li);
            }

            $counter++;
        }

        return SalesOrder::where('created_by', $demoUser->id)->get()->all();
    }

    // =========================================================================
    // 5. AR Invoices (Customer Invoices)
    // =========================================================================
    private function seedUserARInvoices(
        User $demoUser, array $sos, array $customers, array $products, array $accounts,
        array $analytics, $revAccounts, ?User $adminUser
    ): array {
        $existing = Invoice::where('created_by', $demoUser->id)->where('type', 'receivable')->count();
        $needed   = max(0, self::TARGET - $existing);
        $this->command->info("    AR Invoices: {$existing} existing, creating {$needed}...");

        $statuses = ['draft', 'approved', 'partially_paid', 'paid', 'overdue', 'void'];

        // Use global counter across ALL demo AR invoices
        $maxNum = (int) DB::table('invoices')
            ->where('invoice_number', 'like', 'DEMO-INV-%')
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(invoice_number, '-', -1) AS UNSIGNED)) as max_num")
            ->value('max_num');
        $counter = $maxNum + 1;

        $newInvoices = [];

        for ($i = 1; $i <= $needed; $i++) {
            $year     = ($counter % 3 === 0) ? 2025 : 2026;
            $num      = sprintf('DEMO-INV-%d-%05d', $year, $counter);
            $customer = $customers[$counter % count($customers)];
            $status   = $statuses[$counter % count($statuses)];
            $so       = $sos[$counter % count($sos)];

            $invDate  = Carbon::create($year, ($counter % 12) + 1, rand(1, 28));
            $dueDate  = $status === 'overdue'
                ? $invDate->copy()->subDays(rand(10, 90))->format('Y-m-d')
                : $invDate->copy()->addDays($customer->payment_terms_days ?? 30)->format('Y-m-d');

            $isInterstate = ($customer->state !== 'Maharashtra');
            $lineCount    = ($counter % 3) + 1;
            $subtotal     = 0;
            $taxAmount    = 0;
            $cgstTotal    = 0;
            $sgstTotal    = 0;
            $igstTotal    = 0;
            $lines        = [];

            for ($li = 0; $li < $lineCount; $li++) {
                $prod      = $products[($counter + $li) % count($products)];
                $qty       = rand(2, 10);
                $unitPrice = $prod->unit_price;
                $lineSub   = round($qty * $unitPrice, 2);
                $analytic  = $analytics[($counter + $li) % count($analytics)];
                $revAcct   = $revAccounts->isNotEmpty() ? $revAccounts[($counter + $li) % $revAccounts->count()] : ($accounts[3] ?? $accounts[0]);

                [$cgst, $sgst, $igst, $lineTax] = $this->calcGst($lineSub, $isInterstate);

                $subtotal  += $lineSub;
                $taxAmount += $lineTax;
                $cgstTotal += $cgst;
                $sgstTotal += $sgst;
                $igstTotal += $igst;

                $lines[] = [
                    'product_id'          => $prod->id,
                    'account_id'          => $revAcct->id,
                    'analytic_account_id' => $analytic->id,
                    'hsn_code'            => $prod->hsn_code,
                    'description'         => "Invoice line — {$prod->name}",
                    'quantity'            => $qty,
                    'unit_price'          => $unitPrice,
                    'tax_rate'            => 18.00,
                    'cgst_rate'           => $isInterstate ? 0.00 : 9.00,
                    'cgst_amount'         => $cgst,
                    'sgst_rate'           => $isInterstate ? 0.00 : 9.00,
                    'sgst_amount'         => $sgst,
                    'igst_rate'           => $isInterstate ? 18.00 : 0.00,
                    'igst_amount'         => $igst,
                    'tax_amount'          => $lineTax,
                    'line_total'          => $lineSub + $lineTax,
                ];
            }

            $totalAmount = $subtotal + $taxAmount;
            $paidAmount  = match ($status) {
                'paid'          => $totalAmount,
                'partially_paid'=> round($totalAmount * 0.45, 2),
                default         => 0.00,
            };
            $balanceDue = round($totalAmount - $paidAmount, 2);

            $inv = Invoice::create([
                'invoice_number'   => $num,
                'type'             => 'receivable',
                'status'           => $status,
                'reference_type'   => SalesOrder::class,
                'reference_id'     => $so->id,
                'party_type'       => 'customer',
                'party_id'         => $customer->id,
                'place_of_supply'  => "{$customer->state} (" . ($customer->gstin ? substr($customer->gstin, 0, 2) : '27') . ")",
                'is_interstate'    => $isInterstate,
                'gstin'            => $customer->gstin,
                'invoice_date'     => $invDate->format('Y-m-d'),
                'due_date'         => $dueDate,
                'payment_date'     => $status === 'paid' ? Carbon::parse($dueDate)->subDays(rand(1, 10))->format('Y-m-d') : null,
                'subtotal'         => $subtotal,
                'discount_amount'  => 0.00,
                'tax_amount'       => $taxAmount,
                'cgst_amount'      => $cgstTotal,
                'sgst_amount'      => $sgstTotal,
                'igst_amount'      => $igstTotal,
                'total_amount'     => $totalAmount,
                'amount_paid'      => $paidAmount,
                'balance_due'      => $balanceDue,
                'payment_terms_days'=> $customer->payment_terms_days ?? 30,
                'currency'         => 'INR',
                'notes'            => "Demo AR invoice #{$counter} for {$demoUser->email}.",
                'approved_by'      => in_array($status, ['approved', 'partially_paid', 'paid']) ? $adminUser?->id : null,
                'approved_at'      => in_array($status, ['approved', 'partially_paid', 'paid']) ? $invDate->copy()->addHours(5) : null,
                'created_by'       => $demoUser->id,
            ]);

            foreach ($lines as $line) {
                $inv->items()->create($line);
            }

            $newInvoices[] = $inv;
            $counter++;
        }

        return Invoice::where('created_by', $demoUser->id)->where('type', 'receivable')->get()->all();
    }

    // =========================================================================
    // 6. AP Bills (Vendor Bills)
    // =========================================================================
    private function seedUserAPBills(
        User $demoUser, array $pos, array $vendors, array $products, array $accounts,
        array $analytics, $expAccounts, ?User $adminUser
    ): array {
        $existing = Invoice::where('created_by', $demoUser->id)->where('type', 'payable')->count();
        $needed   = max(0, self::TARGET - $existing);
        $this->command->info("    AP Bills: {$existing} existing, creating {$needed}...");

        $statuses = ['draft', 'approved', 'partially_paid', 'paid', 'overdue', 'void'];

        // Use global counter across ALL demo AP bills
        $maxNum = (int) DB::table('invoices')
            ->where('invoice_number', 'like', 'DEMO-BILL-%')
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(invoice_number, '-', -1) AS UNSIGNED)) as max_num")
            ->value('max_num');
        $counter = $maxNum + 1;

        for ($i = 1; $i <= $needed; $i++) {
            $year   = ($counter % 3 === 0) ? 2025 : 2026;
            $num    = sprintf('DEMO-BILL-%d-%05d', $year, $counter);
            $vendor = $vendors[$counter % count($vendors)];
            $status = $statuses[$counter % count($statuses)];
            $po     = $pos[$counter % count($pos)];

            $billDate  = Carbon::create($year, ($counter % 12) + 1, rand(1, 28));
            $dueDate   = $status === 'overdue'
                ? $billDate->copy()->subDays(rand(10, 90))->format('Y-m-d')
                : $billDate->copy()->addDays($vendor->payment_terms_days ?? 30)->format('Y-m-d');

            $isInterstate = ($vendor->state !== 'Maharashtra');
            $lineCount    = ($counter % 3) + 1;
            $subtotal     = 0;
            $taxAmount    = 0;
            $cgstTotal    = 0;
            $sgstTotal    = 0;
            $igstTotal    = 0;
            $lines        = [];

            for ($li = 0; $li < $lineCount; $li++) {
                $prod     = $products[($counter + $li * 2) % count($products)];
                $qty      = rand(5, 30);
                $unitPrice= $prod->cost_price;
                $lineSub  = round($qty * $unitPrice, 2);
                $analytic = $analytics[($counter + $li) % count($analytics)];
                $expAcct  = $expAccounts->isNotEmpty() ? $expAccounts[($counter + $li) % $expAccounts->count()] : ($accounts[4] ?? $accounts[0]);

                [$cgst, $sgst, $igst, $lineTax] = $this->calcGst($lineSub, $isInterstate);

                $subtotal  += $lineSub;
                $taxAmount += $lineTax;
                $cgstTotal += $cgst;
                $sgstTotal += $sgst;
                $igstTotal += $igst;

                $lines[] = [
                    'product_id'          => $prod->id,
                    'account_id'          => $expAcct->id,
                    'analytic_account_id' => $analytic->id,
                    'hsn_code'            => $prod->hsn_code,
                    'description'         => "Vendor bill line — {$prod->name}",
                    'quantity'            => $qty,
                    'unit_price'          => $unitPrice,
                    'tax_rate'            => 18.00,
                    'cgst_rate'           => $isInterstate ? 0.00 : 9.00,
                    'cgst_amount'         => $cgst,
                    'sgst_rate'           => $isInterstate ? 0.00 : 9.00,
                    'sgst_amount'         => $sgst,
                    'igst_rate'           => $isInterstate ? 18.00 : 0.00,
                    'igst_amount'         => $igst,
                    'tax_amount'          => $lineTax,
                    'line_total'          => $lineSub + $lineTax,
                ];
            }

            $totalAmount = $subtotal + $taxAmount;
            $paidAmount  = match ($status) {
                'paid'          => $totalAmount,
                'partially_paid'=> round($totalAmount * 0.50, 2),
                default         => 0.00,
            };

            $bill = Invoice::create([
                'invoice_number'   => $num,
                'type'             => 'payable',
                'status'           => $status,
                'reference_type'   => PurchaseOrder::class,
                'reference_id'     => $po->id,
                'party_type'       => 'vendor',
                'party_id'         => $vendor->id,
                'place_of_supply'  => "{$vendor->state} (" . ($vendor->gstin ? substr($vendor->gstin, 0, 2) : '27') . ")",
                'is_interstate'    => $isInterstate,
                'gstin'            => $vendor->gstin,
                'invoice_date'     => $billDate->format('Y-m-d'),
                'due_date'         => $dueDate,
                'payment_date'     => $status === 'paid' ? Carbon::parse($dueDate)->subDays(rand(1, 5))->format('Y-m-d') : null,
                'subtotal'         => $subtotal,
                'discount_amount'  => 0.00,
                'tax_amount'       => $taxAmount,
                'cgst_amount'      => $cgstTotal,
                'sgst_amount'      => $sgstTotal,
                'igst_amount'      => $igstTotal,
                'total_amount'     => $totalAmount,
                'amount_paid'      => $paidAmount,
                'balance_due'      => round($totalAmount - $paidAmount, 2),
                'payment_terms_days'=> $vendor->payment_terms_days ?? 30,
                'currency'         => 'INR',
                'notes'            => "Demo AP bill #{$counter} for {$demoUser->email}.",
                'approved_by'      => in_array($status, ['approved', 'partially_paid', 'paid']) ? $adminUser?->id : null,
                'approved_at'      => in_array($status, ['approved', 'partially_paid', 'paid']) ? $billDate->copy()->addHours(4) : null,
                'created_by'       => $demoUser->id,
            ]);

            foreach ($lines as $line) {
                $bill->items()->create($line);
            }

            $counter++;
        }

        return Invoice::where('created_by', $demoUser->id)->where('type', 'payable')->get()->all();
    }

    // =========================================================================
    // 7. Payments
    // =========================================================================
    private function seedUserPayments(User $demoUser, array $arInvoices, array $apInvoices, Account $bankAcc, ?User $adminUser): void
    {
        $existing = Payment::where('created_by', $demoUser->id)->count();
        $needed   = max(0, self::TARGET - $existing);
        $this->command->info("    Payments: {$existing} existing, creating {$needed}...");

        $methods  = ['bank_transfer', 'upi', 'cheque', 'cash', 'razorpay'];
        $statuses = ['cleared', 'cleared', 'pending', 'failed', 'reversed'];

        // Use global counter across ALL demo payments
        $maxNum = (int) DB::table('payments')
            ->where('payment_number', 'like', 'DEMO-PAY-%')
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(payment_number, '-', -1) AS UNSIGNED)) as max_num")
            ->value('max_num');
        $counter = $maxNum + 1;

        // Mix of received (AR) and made (AP) payments
        $allInvoices = array_merge($arInvoices, $apInvoices);

        for ($i = 1; $i <= $needed; $i++) {
            $year    = ($counter % 3 === 0) ? 2025 : 2026;
            $num     = sprintf('DEMO-PAY-%d-%05d', $year, $counter);
            $type    = ($counter % 2 === 0) ? 'received' : 'made';
            $method  = $methods[$counter % count($methods)];
            $status  = $statuses[$counter % count($statuses)];

            // Pick matching invoice
            $matchingInv = ($type === 'received') ? $arInvoices : $apInvoices;
            $inv = !empty($matchingInv) ? $matchingInv[$counter % count($matchingInv)] : null;

            $partyType = $type === 'received' ? 'customer' : 'vendor';
            $partyId   = $inv ? $inv->party_id : 1;
            $amount    = $inv ? (float)($inv->amount_paid > 0 ? $inv->amount_paid : $inv->total_amount) : rand(10, 500) * 1000.0;

            $refNumber = match ($method) {
                'bank_transfer' => 'NEFT-HDFC-' . rand(100000, 999999),
                'upi'           => 'UPI/' . rand(10000000, 99999999) . '@okaxis',
                'cheque'        => 'CHQ-' . rand(100000, 999999),
                'razorpay'      => 'pay_Rzp' . rand(1000000, 9999999),
                default         => 'CASH-REC-' . rand(1000, 9999),
            };

            $payDate = $inv ? $inv->invoice_date : Carbon::create($year, ($counter % 12) + 1, rand(1, 28))->format('Y-m-d');

            Payment::firstOrCreate(['payment_number' => $num], [
                'type'            => $type,
                'invoice_id'      => $inv?->id,
                'party_type'      => $partyType,
                'party_id'        => $partyId,
                'amount'          => $amount,
                'payment_date'    => $payDate,
                'payment_method'  => $method,
                'reference_number'=> $refNumber,
                'bank_account_id' => $bankAcc->id,
                'status'          => $status,
                'notes'           => "Demo payment #{$counter} for {$demoUser->email} via {$method}.",
                'reconciled_by'   => $status === 'cleared' ? $adminUser?->id : null,
                'reconciled_at'   => $status === 'cleared' ? Carbon::parse($payDate)->addHours(8) : null,
                'created_by'      => $demoUser->id,
            ]);

            $counter++;
        }
    }

    // =========================================================================
    // 8. Journal Entries (balanced double-entry)
    // =========================================================================
    private function seedUserJournalEntries(
        User $demoUser, array $journals, Account $bankAcc, Account $receivableAcc, Account $payableAcc,
        Account $revAcc, Account $expAcc, Account $cgstAcc, Account $sgstAcc, $revAccounts, $expAccounts, ?User $adminUser
    ): void {
        $existing = JournalEntry::where('created_by', $demoUser->id)->count();
        $needed   = max(0, self::TARGET - $existing);
        $this->command->info("    Journal Entries: {$existing} existing, creating {$needed}...");

        // Use global counter across ALL demo JEs
        $maxNum = (int) DB::table('journal_entries')
            ->where('entry_number', 'like', 'DEMO-JE-%')
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(entry_number, '-', -1) AS UNSIGNED)) as max_num")
            ->value('max_num');
        $counter = $maxNum + 1;

        for ($i = 1; $i <= $needed; $i++) {
            $year       = ($counter % 3 === 0) ? 2025 : 2026;
            $num        = sprintf('DEMO-JE-%d-%05d', $year, $counter);
            $journal    = $journals[$counter % count($journals)];
            $status     = ($counter % 10 === 0) ? 'draft' : 'posted';
            $month      = ($counter % 12) + 1;
            $postDate   = Carbon::create($year, $month, rand(1, 28))->format('Y-m-d');
            $amount     = rand(5, 250) * 1000.0;
            $halfTax    = round($amount * 0.09, 2);
            $totalGross = $amount + ($halfTax * 2);

            $je = JournalEntry::create([
                'entry_number'   => $num,
                'journal_id'     => $journal->id,
                'type'           => match ($journal->type) {
                    'sales'    => 'auto',
                    'purchase' => 'auto',
                    default    => 'manual',
                },
                'description'    => "Demo GL entry #{$counter} for {$demoUser->email}",
                'posting_date'   => $postDate,
                'fiscal_year'    => $year,
                'period'         => $month,
                'status'         => $status,
                'reference_type' => 'DemoEntry',
                'reference_id'   => $counter,
                'posted_by'      => $status === 'posted' ? $adminUser?->id : null,
                'posted_at'      => $status === 'posted' ? Carbon::parse($postDate)->addHours(4) : null,
                'created_by'     => $demoUser->id,
            ]);

            // Balanced double-entry lines based on journal type
            if ($journal->type === 'sales') {
                $activeRevAcc = $revAccounts->isNotEmpty() ? $revAccounts[$counter % $revAccounts->count()] : $revAcc;
                // DR Receivable / CR Revenue / CR CGST / CR SGST
                JournalEntryLine::insert([
                    ['journal_entry_id' => $je->id, 'account_id' => $receivableAcc->id, 'account_code' => $receivableAcc->code, 'account_name' => $receivableAcc->name, 'debit' => $totalGross, 'credit' => 0.00, 'description' => 'Accounts receivable billing', 'reference' => $num],
                    ['journal_entry_id' => $je->id, 'account_id' => $activeRevAcc->id,  'account_code' => $activeRevAcc->code,  'account_name' => $activeRevAcc->name,  'debit' => 0.00, 'credit' => $amount,   'description' => 'Sales revenue recognized', 'reference' => $num],
                    ['journal_entry_id' => $je->id, 'account_id' => $cgstAcc->id,       'account_code' => $cgstAcc->code,       'account_name' => $cgstAcc->name,       'debit' => 0.00, 'credit' => $halfTax, 'description' => 'CGST output liability',   'reference' => $num],
                    ['journal_entry_id' => $je->id, 'account_id' => $sgstAcc->id,       'account_code' => $sgstAcc->code,       'account_name' => $sgstAcc->name,       'debit' => 0.00, 'credit' => $halfTax, 'description' => 'SGST output liability',   'reference' => $num],
                ]);
            } elseif ($journal->type === 'purchase') {
                $activeExpAcc = $expAccounts->isNotEmpty() ? $expAccounts[$counter % $expAccounts->count()] : $expAcc;
                // DR Expense / DR CGST / DR SGST / CR Payable
                JournalEntryLine::insert([
                    ['journal_entry_id' => $je->id, 'account_id' => $activeExpAcc->id, 'account_code' => $activeExpAcc->code, 'account_name' => $activeExpAcc->name, 'debit' => $amount,   'credit' => 0.00,        'description' => 'Purchase expense recognised', 'reference' => $num],
                    ['journal_entry_id' => $je->id, 'account_id' => $cgstAcc->id,      'account_code' => $cgstAcc->code,      'account_name' => $cgstAcc->name,      'debit' => $halfTax, 'credit' => 0.00,        'description' => 'CGST input credit claimed',   'reference' => $num],
                    ['journal_entry_id' => $je->id, 'account_id' => $sgstAcc->id,      'account_code' => $sgstAcc->code,      'account_name' => $sgstAcc->name,      'debit' => $halfTax, 'credit' => 0.00,        'description' => 'SGST input credit claimed',   'reference' => $num],
                    ['journal_entry_id' => $je->id, 'account_id' => $payableAcc->id,   'account_code' => $payableAcc->code,   'account_name' => $payableAcc->name,   'debit' => 0.00,     'credit' => $totalGross, 'description' => 'Accounts payable liability',  'reference' => $num],
                ]);
            } else {
                // Bank / Cash / other — simple DR Bank / CR Receivable
                JournalEntryLine::insert([
                    ['journal_entry_id' => $je->id, 'account_id' => $bankAcc->id,       'account_code' => $bankAcc->code,       'account_name' => $bankAcc->name,       'debit' => $amount, 'credit' => 0.00,   'description' => 'Bank receipt collection',     'reference' => $num],
                    ['journal_entry_id' => $je->id, 'account_id' => $receivableAcc->id, 'account_code' => $receivableAcc->code, 'account_name' => $receivableAcc->name, 'debit' => 0.00,   'credit' => $amount, 'description' => 'Receivable settlement offset', 'reference' => $num],
                ]);
            }

            $counter++;
        }
    }

    // =========================================================================
    // 9. Inventory Movements
    // =========================================================================
    private function seedUserInventoryMovements(User $demoUser, array $products, array $pos, array $sos): void
    {
        $existing = InventoryMovement::where('performed_by', $demoUser->id)->count();
        $needed   = max(0, self::TARGET - $existing);
        $this->command->info("    Inventory Movements: {$existing} existing, creating {$needed}...");

        $types = ['purchase', 'sale', 'adjustment', 'return'];

        for ($i = 1; $i <= $needed; $i++) {
            $type = $types[$i % count($types)];
            $prod = $products[$i % count($products)];
            $qty  = match ($type) {
                'purchase'   => (float) rand(10, 50),
                'sale'       => (float) -rand(2, 20),
                'adjustment' => (float) rand(-5, 15),
                'return'     => (float) rand(1, 5),
            };

            $unitCost = $prod->cost_price;
            $totalVal = round($qty * $unitCost, 2);

            [$refType, $refId] = match ($type) {
                'purchase' => [PurchaseOrder::class, $pos[$i % count($pos)]->id],
                'sale'     => [SalesOrder::class,    $sos[$i % count($sos)]->id],
                default    => ['WarehouseAudit',      $i],
            };

            InventoryMovement::create([
                'product_id'     => $prod->id,
                'type'           => $type,
                'quantity'       => $qty,
                'unit_cost'      => $unitCost,
                'total_value'    => $totalVal,
                'reference_type' => $refType,
                'reference_id'   => $refId,
                'notes'          => "Demo stock movement ({$type}) for {$prod->sku}. Operator: {$demoUser->email}.",
                'performed_by'   => $demoUser->id,
            ]);
        }
    }

    // =========================================================================
    // 10. Budgets (+ Budget Lines)
    // =========================================================================
    private function seedUserBudgets(User $demoUser, array $analytics): void
    {
        $existing = Budget::where('responsible_id', $demoUser->id)
            ->where('responsible_type', 'user')
            ->count();
        $needed = max(0, self::TARGET - $existing);
        $this->command->info("    Budgets: {$existing} existing, creating {$needed}...");

        $statuses  = ['draft', 'confirm', 'revised', 'cancelled'];
        $quarters  = ['Q1', 'Q2', 'Q3', 'Q4'];
        $years     = [2025, 2026, 2027];
        $cityNames = array_column($this->indianCities, 'city');

        for ($i = 1; $i <= $needed; $i++) {
            $year   = $years[$i % count($years)];
            $q      = $quarters[$i % count($quarters)];
            $status = $statuses[$i % count($statuses)];
            $city   = $cityNames[$i % count($cityNames)];
            $name   = "DEMO FY{$year} {$q} {$city} Budget ({$demoUser->name} #{$i})";

            $startMonth = match ($q) { 'Q1' => '01-01', 'Q2' => '04-01', 'Q3' => '07-01', 'Q4' => '10-01' };
            $endMonth   = match ($q) { 'Q1' => '03-31', 'Q2' => '06-30', 'Q3' => '09-30', 'Q4' => '12-31' };

            $budget = Budget::create([
                'name'             => $name,
                'start_date'       => "{$year}-{$startMonth}",
                'end_date'         => "{$year}-{$endMonth}",
                'responsible_id'   => $demoUser->id,
                'responsible_type' => 'user',
                'status'           => $status,
            ]);

            // 2–3 budget lines
            $lineCount = ($i % 3) + 2;
            for ($bl = 0; $bl < $lineCount; $bl++) {
                $analytic = $analytics[($i * 2 + $bl) % count($analytics)];
                BudgetLine::create([
                    'budget_id'           => $budget->id,
                    'analytic_account_id' => $analytic->id,
                    'type'                => $analytic->type,
                    'committed_amount'    => rand(50, 800) * 10000.0,
                ]);
            }
        }
    }

    // =========================================================================
    // 11. Items (Workshop Tasks)
    // =========================================================================
    private function seedUserItems(User $demoUser): void
    {
        $existing = Item::where('user_id', $demoUser->id)->count();
        $needed   = max(0, self::TARGET - $existing);
        $this->command->info("    Items (Tasks): {$existing} existing, creating {$needed}...");

        $priorities = ['low', 'medium', 'high'];
        $statuses   = ['pending', 'in_progress', 'completed'];

        for ($i = 1; $i <= $needed; $i++) {
            $tmpl     = $this->itemTemplates[$i % count($this->itemTemplates)];
            $priority = $priorities[$i % count($priorities)];
            $status   = $statuses[$i % count($statuses)];

            Item::create([
                'user_id'     => $demoUser->id,
                'title'       => "{$tmpl} — Task #{$i} ({$demoUser->name})",
                'description' => "Operational workflow task for demo user {$demoUser->email}. Priority: {$priority}.",
                'status'      => $status,
                'priority'    => $priority,
            ]);
        }
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /**
     * Calculate GST breakdown for a line amount.
     * Returns [$cgst, $sgst, $igst, $totalTax]
     */
    private function calcGst(float $lineSubtotal, bool $isInterstate): array
    {
        if ($isInterstate) {
            $igst     = round($lineSubtotal * 0.18, 2);
            return [0.00, 0.00, $igst, $igst];
        }
        $cgst = round($lineSubtotal * 0.09, 2);
        $sgst = round($lineSubtotal * 0.09, 2);
        return [$cgst, $sgst, 0.00, $cgst + $sgst];
    }

    /**
     * Sync document_sequences table so the next user-created document number
     * doesn't collide with the demo-seeded ones.
     */
    private function syncSequences(): void
    {
        $this->command->info('  Syncing document sequences...');
        $sequences = [
            'CUST'      => Customer::count() + 10,
            'VEN'       => Vendor::count() + 10,
            'PO_2025'   => PurchaseOrder::where('po_number', 'like', '%-2025-%')->count() + 10,
            'PO_2026'   => PurchaseOrder::where('po_number', 'like', '%-2026-%')->count() + 10,
            'SO_2025'   => SalesOrder::where('so_number', 'like', '%-2025-%')->count() + 10,
            'SO_2026'   => SalesOrder::where('so_number', 'like', '%-2026-%')->count() + 10,
            'INV_2025'  => Invoice::where('type', 'receivable')->where('invoice_number', 'like', '%-2025-%')->count() + 10,
            'INV_2026'  => Invoice::where('type', 'receivable')->where('invoice_number', 'like', '%-2026-%')->count() + 10,
            'BILL_2025' => Invoice::where('type', 'payable')->where('invoice_number', 'like', '%-2025-%')->count() + 10,
            'BILL_2026' => Invoice::where('type', 'payable')->where('invoice_number', 'like', '%-2026-%')->count() + 10,
            'PAY_2025'  => Payment::where('payment_number', 'like', '%-2025-%')->count() + 10,
            'PAY_2026'  => Payment::where('payment_number', 'like', '%-2026-%')->count() + 10,
            'JE_2025'   => JournalEntry::where('entry_number', 'like', '%-2025-%')->count() + 10,
            'JE_2026'   => JournalEntry::where('entry_number', 'like', '%-2026-%')->count() + 10,
        ];

        foreach ($sequences as $name => $currentNum) {
            DB::table('document_sequences')->updateOrInsert(
                ['name' => $name],
                ['current_number' => $currentNum, 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }
}
