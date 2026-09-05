<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Customer;
use App\Models\InventoryMovement;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\Item;
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
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Core Role Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role' => User::ROLE_ADMIN,
            ]
        );
        $admin->role = User::ROLE_ADMIN;
        $admin->save();

        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Operations Manager',
                'password' => Hash::make('password'),
                'role' => User::ROLE_MANAGER,
            ]
        );
        $manager->role = User::ROLE_MANAGER;
        $manager->save();

        $user = User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Standard User',
                'password' => Hash::make('password'),
                'role' => User::ROLE_USER,
            ]
        );
        $user->role = User::ROLE_USER;
        $user->save();

        // 2. Seed Full GST-enabled Chart of Accounts
        $accountsData = [
            // Assets (1000)
            ['code' => '1110', 'name' => 'Cash & Bank Accounts', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit', 'opening_balance' => 1500000.00, 'description' => 'Primary operational treasury and checking account'],
            ['code' => '1120', 'name' => 'Accounts Receivable', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit', 'opening_balance' => 0.00, 'description' => 'Amounts due from urban municipal and commercial customers'],
            ['code' => '1130', 'name' => 'Inventory (Finished Furniture)', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit', 'opening_balance' => 650000.00, 'description' => 'Asset value of street furniture held for sale'],
            ['code' => '1140', 'name' => 'Goods Received Not Invoiced (GRNI)', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'credit', 'opening_balance' => 0.00, 'description' => 'Clearing account for received goods awaiting supplier invoice'],
            ['code' => '1210', 'name' => 'Showroom & Fabrication Equipment', 'type' => 'asset', 'sub_type' => 'fixed_asset', 'normal_balance' => 'debit', 'opening_balance' => 850000.00, 'description' => 'Machinery, molds, and display setups for urban furniture'],
            ['code' => '1220', 'name' => 'Accumulated Depreciation', 'type' => 'asset', 'sub_type' => 'fixed_asset', 'normal_balance' => 'credit', 'opening_balance' => 150000.00, 'description' => 'Cumulative depreciation of fabrication tools and equipment'],

            // GST Input Tax Credits (Receivables / Assets)
            ['code' => '2131', 'name' => 'CGST Input Tax Credit (9%)', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit', 'opening_balance' => 0.00, 'description' => 'Central GST paid on local raw materials eligible for setoff'],
            ['code' => '2132', 'name' => 'SGST Input Tax Credit (9%)', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit', 'opening_balance' => 0.00, 'description' => 'State GST paid on local raw materials eligible for setoff'],
            ['code' => '2133', 'name' => 'IGST Input Tax Credit (18%)', 'type' => 'asset', 'sub_type' => 'current_asset', 'normal_balance' => 'debit', 'opening_balance' => 0.00, 'description' => 'Integrated GST paid on interstate procurement'],

            // Liabilities (2000)
            ['code' => '2110', 'name' => 'Accounts Payable', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal_balance' => 'credit', 'opening_balance' => 0.00, 'description' => 'Liabilities owed to steel, timber, and component suppliers'],
            ['code' => '2121', 'name' => 'CGST Output Tax Payable (9%)', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal_balance' => 'credit', 'opening_balance' => 0.00, 'description' => 'Central GST collected on intrastate sales'],
            ['code' => '2122', 'name' => 'SGST Output Tax Payable (9%)', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal_balance' => 'credit', 'opening_balance' => 0.00, 'description' => 'State GST collected on intrastate sales'],
            ['code' => '2123', 'name' => 'IGST Output Tax Payable (18%)', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal_balance' => 'credit', 'opening_balance' => 0.00, 'description' => 'Integrated GST collected on interstate sales'],
            ['code' => '2140', 'name' => 'Accrued Operational Liabilities', 'type' => 'liability', 'sub_type' => 'current_liability', 'normal_balance' => 'credit', 'opening_balance' => 0.00, 'description' => 'Accrued logistics and contractor dues'],

            // Equity (3000)
            ['code' => '3100', 'name' => "Owner's / Paid-in Capital", 'type' => 'equity', 'sub_type' => 'equity', 'normal_balance' => 'credit', 'opening_balance' => 2850000.00, 'description' => 'Founding equity invested in urban furniture production enterprise'],
            ['code' => '3200', 'name' => 'Retained Earnings', 'type' => 'equity', 'sub_type' => 'equity', 'normal_balance' => 'credit', 'opening_balance' => 0.00, 'description' => 'Accumulated retained operational profits'],

            // Revenue (4000)
            ['code' => '4100', 'name' => 'Sales Revenue - Urban Furniture', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'normal_balance' => 'credit', 'opening_balance' => 0.00, 'description' => 'Gross revenue from street benches, poles, bins, and planters'],
            ['code' => '4200', 'name' => 'Installation & Site Services', 'type' => 'revenue', 'sub_type' => 'operating_revenue', 'normal_balance' => 'credit', 'opening_balance' => 0.00, 'description' => 'Turnkey civil installation and site preparation fees'],
            ['code' => '4300', 'name' => 'Discounts Allowed', 'type' => 'revenue', 'sub_type' => 'contra_revenue', 'normal_balance' => 'debit', 'opening_balance' => 0.00, 'description' => 'Commercial discount allowances provided to volume purchasers'],

            // Expenses (5000)
            ['code' => '5100', 'name' => 'Cost of Goods Sold (COGS)', 'type' => 'expense', 'sub_type' => 'direct_expense', 'normal_balance' => 'debit', 'opening_balance' => 0.00, 'description' => 'Direct manufacturing cost of delivered furniture items'],
            ['code' => '5200', 'name' => 'Freight & Logistics Expense', 'type' => 'expense', 'sub_type' => 'operating_expense', 'normal_balance' => 'debit', 'opening_balance' => 0.00, 'description' => 'Heavy transit and municipal installation freight costs'],
            ['code' => '5300', 'name' => 'Inventory Shrinkage & Adjustments', 'type' => 'expense', 'sub_type' => 'operating_expense', 'normal_balance' => 'debit', 'opening_balance' => 0.00, 'description' => 'Damaged stock write-offs and physical count adjustments'],
            ['code' => '5400', 'name' => 'Administrative & Facility Costs', 'type' => 'expense', 'sub_type' => 'operating_expense', 'normal_balance' => 'debit', 'opening_balance' => 0.00, 'description' => 'Office overheads, utilities, and showroom operations'],
        ];

        $accountMap = [];
        foreach ($accountsData as $acc) {
            $account = Account::updateOrCreate(
                ['code' => $acc['code']],
                array_merge($acc, [
                    'current_balance' => $acc['opening_balance'],
                    'is_active' => true,
                    'created_by' => $admin->id,
                ])
            );
            $accountMap[$acc['code']] = $account;
        }

        // 3. Seed Opening Balance Journal Entry (Double-Entry Balanced)
        $openingJE = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0001'],
            [
                'type' => 'opening',
                'description' => 'Opening balance migration for Urban Furniture Enterprise fiscal year 2026',
                'posting_date' => '2026-01-01',
                'fiscal_year' => 2026,
                'period' => 1,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => now(),
                'created_by' => $admin->id,
            ]
        );

        $openingLines = [
            ['account_id' => $accountMap['1110']->id, 'code' => '1110', 'name' => 'Cash & Bank Accounts', 'debit' => 1500000.00, 'credit' => 0.00, 'desc' => 'Opening bank balance'],
            ['account_id' => $accountMap['1130']->id, 'code' => '1130', 'name' => 'Inventory (Finished Furniture)', 'debit' => 650000.00, 'credit' => 0.00, 'desc' => 'Opening furniture stock valuation'],
            ['account_id' => $accountMap['1210']->id, 'code' => '1210', 'name' => 'Showroom & Fabrication Equipment', 'debit' => 850000.00, 'credit' => 0.00, 'desc' => 'Fabrication plant and molds'],
            ['account_id' => $accountMap['1220']->id, 'code' => '1220', 'name' => 'Accumulated Depreciation', 'debit' => 0.00, 'credit' => 150000.00, 'desc' => 'Depreciation reserve'],
            ['account_id' => $accountMap['3100']->id, 'code' => '3100', 'name' => "Owner's / Paid-in Capital", 'debit' => 0.00, 'credit' => 2850000.00, 'desc' => 'Owner invested equity balance'],
        ];

        JournalEntryLine::where('journal_entry_id', $openingJE->id)->delete();
        foreach ($openingLines as $line) {
            JournalEntryLine::create([
                'journal_entry_id' => $openingJE->id,
                'account_id' => $line['account_id'],
                'account_code' => $line['code'],
                'account_name' => $line['name'],
                'debit' => $line['debit'],
                'credit' => $line['credit'],
                'description' => $line['desc'],
                'reference' => 'OPENING-2026',
            ]);
        }

        // 4. Seed Vendors with GSTIN and State
        $vendorsData = [
            [
                'name' => 'Azure Furniture',
                'code' => 'VEN-001',
                'contact_person' => 'Rahul Sharma',
                'email' => 'azure.furniture@example.com',
                'phone' => '+91 98201 12345',
                'address' => 'Plot 42, Furniture Industrial Estate, Phase II',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'gstin' => '27AAACS1234H1Z5', // Intrastate (27)
                'payment_terms_days' => 30,
                'payable_account_id' => $accountMap['2110']->id,
                'notes' => 'Primary vendor for wooden tables, raw timber, and commercial furniture fittings',
            ],
            [
                'name' => 'Open Wood Furnishings',
                'code' => 'VEN-002',
                'contact_person' => 'Rahul Sharma',
                'email' => 'openwood21@example.com',
                'phone' => '+91 90900 90909',
                'address' => 'Timber Estate, Forest Reserve Road',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'gstin' => '29AABCG5678M1ZP', // Interstate (29)
                'payment_terms_days' => 45,
                'payable_account_id' => $accountMap['2110']->id,
                'notes' => 'FSC Certified seasoned teakwood and treated oak for tables and chairs',
            ],
            [
                'name' => 'Rahul Sharma Timber Crafts',
                'code' => 'VEN-003',
                'contact_person' => 'Rahul Sharma',
                'email' => 'rahul.sharma@example.com',
                'phone' => '+91 98110 99887',
                'address' => 'Artisan Park, Sector 18',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'gstin' => '27AAACL9876P1ZX', // Intrastate (27)
                'payment_terms_days' => 30,
                'payable_account_id' => $accountMap['2110']->id,
                'notes' => 'High-grade hardwood cutting, finishing, and sofa upholstery partner',
            ],
        ];

        $vendorMap = [];
        foreach ($vendorsData as $v) {
            $vendor = Vendor::updateOrCreate(
                ['code' => $v['code']],
                array_merge($v, ['created_by' => $manager->id])
            );
            $vendorMap[$v['code']] = $vendor;
        }

        // 5. Seed Customers with GSTIN and State
        $customersData = [
            [
                'name' => 'Nimesh Pathak',
                'code' => 'CUST-001',
                'contact_person' => 'Nimesh Pathak',
                'email' => 'nimesh.pathak@example.com',
                'phone' => '+91 98200 12345',
                'billing_address' => '402, High Street Towers, Nariman Point',
                'shipping_address' => 'Level 8, Prime Corporate Center, BKC',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'gstin' => '27AAAGM0011C1D3', // Intrastate (27)
                'credit_limit' => 2500000.00,
                'payment_terms_days' => 30,
                'receivable_account_id' => $accountMap['1120']->id,
                'notes' => 'Executive client - Procures office chairs and conference dining tables',
            ],
            [
                'name' => 'Azure Corporate Interiors',
                'code' => 'CUST-002',
                'contact_person' => 'Harish Iyer',
                'email' => 'infra@azureinteriors.org',
                'phone' => '+91 22 2880 7711',
                'billing_address' => 'Azure Tech Park, Western Express Highway',
                'shipping_address' => 'Tower B, Office Floors 4-7',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'gstin' => '27AABTM4422K1Z8', // Intrastate (27)
                'credit_limit' => 4000000.00,
                'payment_terms_days' => 45,
                'receivable_account_id' => $accountMap['1120']->id,
                'notes' => 'Turnkey corporate seating, wooden tables, and executive sofas',
            ],
            [
                'name' => 'Greenfield Tech Commercial Parks',
                'code' => 'CUST-003',
                'contact_person' => 'Meera Joshi',
                'email' => 'procure@greenfieldparks.com',
                'phone' => '+91 80 4455 6677',
                'billing_address' => 'Greenfield SEZ, Outer Ring Road',
                'shipping_address' => 'Central Campus Executive Suite',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'gstin' => '29AABCG3311J1ZU', // Interstate (29)
                'credit_limit' => 1500000.00,
                'payment_terms_days' => 30,
                'receivable_account_id' => $accountMap['1120']->id,
                'notes' => 'Corporate workstations, ergonomic chairs, and executive reception sofas',
            ],
        ];

        $customerMap = [];
        foreach ($customersData as $c) {
            $customer = Customer::updateOrCreate(
                ['code' => $c['code']],
                array_merge($c, ['created_by' => $manager->id])
            );
            $customerMap[$c['code']] = $customer;
        }

        // 6. Seed Real Urban Furniture Master Products as specified in docs
        $productsData = [
            [
                'sku' => 'UF-CHAIR-001',
                'name' => 'Office Chair',
                'hsn_code' => '94018000',
                'description' => 'Ergonomic high-back swivel office chair with lumbar adjustment and breathable mesh.',
                'category' => 'Chairs',
                'type' => 'goods',
                'unit_price' => 4500.00,
                'cost_price' => 2800.00,
                'gst_rate' => 18.00,
                'unit_of_measure' => 'unit',
                'current_stock' => 65.00,
                'minimum_stock' => 10.00,
                'reorder_point' => 15.00,
                'inventory_account_id' => $accountMap['1130']->id,
                'cogs_account_id' => $accountMap['5100']->id,
                'revenue_account_id' => $accountMap['4100']->id,
            ],
            [
                'sku' => 'UF-TBL-002',
                'name' => 'Wooden Table',
                'hsn_code' => '94036000',
                'description' => 'Solid seasoned teakwood executive work table with scratch-resistant matte lacquer.',
                'category' => 'Tables',
                'type' => 'goods',
                'unit_price' => 12000.00,
                'cost_price' => 7500.00,
                'gst_rate' => 18.00,
                'unit_of_measure' => 'unit',
                'current_stock' => 30.00,
                'minimum_stock' => 8.00,
                'reorder_point' => 12.00,
                'inventory_account_id' => $accountMap['1130']->id,
                'cogs_account_id' => $accountMap['5100']->id,
                'revenue_account_id' => $accountMap['4100']->id,
            ],
            [
                'sku' => 'UF-SOFA-003',
                'name' => 'Sofa',
                'hsn_code' => '94014000',
                'description' => '3-seater contemporary lounge sofa with high-density foam and stain-resistant fabric.',
                'category' => 'Sofas',
                'type' => 'goods',
                'unit_price' => 25000.00,
                'cost_price' => 16000.00,
                'gst_rate' => 18.00,
                'unit_of_measure' => 'unit',
                'current_stock' => 14.00,
                'minimum_stock' => 4.00,
                'reorder_point' => 6.00,
                'inventory_account_id' => $accountMap['1130']->id,
                'cogs_account_id' => $accountMap['5100']->id,
                'revenue_account_id' => $accountMap['4100']->id,
            ],
            [
                'sku' => 'UF-DTBL-004',
                'name' => 'Dining Table',
                'hsn_code' => '94036000',
                'description' => '6-seater modern wooden dining table crafted from treated hard oak with beveled edges.',
                'category' => 'Tables',
                'type' => 'goods',
                'unit_price' => 18500.00,
                'cost_price' => 11000.00,
                'gst_rate' => 18.00,
                'unit_of_measure' => 'unit',
                'current_stock' => 22.00,
                'minimum_stock' => 5.00,
                'reorder_point' => 10.00,
                'inventory_account_id' => $accountMap['1130']->id,
                'cogs_account_id' => $accountMap['5100']->id,
                'revenue_account_id' => $accountMap['4100']->id,
            ],
            [
                'sku' => 'UF-WCHAIR-005',
                'name' => 'Wooden Chair',
                'hsn_code' => '94016100',
                'description' => 'Solid handcrafted teakwood chair with upholstered cushioned seating.',
                'category' => 'Chairs',
                'type' => 'goods',
                'unit_price' => 3200.00,
                'cost_price' => 1900.00,
                'gst_rate' => 18.00,
                'unit_of_measure' => 'unit',
                'current_stock' => 48.00,
                'minimum_stock' => 12.00,
                'reorder_point' => 20.00,
                'inventory_account_id' => $accountMap['1130']->id,
                'cogs_account_id' => $accountMap['5100']->id,
                'revenue_account_id' => $accountMap['4100']->id,
            ],
            [
                'sku' => 'UF-SRV-006',
                'name' => 'Furniture Assembly & Installation',
                'hsn_code' => '998713',
                'description' => 'Turnkey on-site assembly, precision leveling, and setup by certified installers.',
                'category' => 'Services',
                'type' => 'service',
                'unit_price' => 1500.00,
                'cost_price' => 500.00,
                'gst_rate' => 18.00,
                'unit_of_measure' => 'unit',
                'current_stock' => 999.00,
                'minimum_stock' => 0.00,
                'reorder_point' => 0.00,
                'inventory_account_id' => $accountMap['1130']->id,
                'cogs_account_id' => $accountMap['5100']->id,
                'revenue_account_id' => $accountMap['4100']->id,
            ],
            [
                'sku' => 'UF-CMB-007',
                'name' => 'Executive Office Suite Combo',
                'hsn_code' => '94036000',
                'description' => 'Complete workstation package: 1 Ergonomic Office Chair + 1 Solid Wooden Table.',
                'category' => 'Combos',
                'type' => 'combo',
                'unit_price' => 15000.00,
                'cost_price' => 9500.00,
                'gst_rate' => 18.00,
                'unit_of_measure' => 'set',
                'current_stock' => 12.00,
                'minimum_stock' => 4.00,
                'reorder_point' => 6.00,
                'inventory_account_id' => $accountMap['1130']->id,
                'cogs_account_id' => $accountMap['5100']->id,
                'revenue_account_id' => $accountMap['4100']->id,
            ],
        ];

        $productMap = [];
        foreach ($productsData as $p) {
            $product = Product::updateOrCreate(
                ['sku' => $p['sku']],
                array_merge($p, ['created_by' => $manager->id])
            );
            $productMap[$p['sku']] = $product;
        }

        // 7. Seed Sample Purchase Order (Intrastate: Azure Furniture -> Wooden Tables)
        // 10 Wooden Tables @ 7,500 cost = 75,000 + 18% GST (CGST 9% 6,750 + SGST 9% 6,750) = 88,500
        $subtotalPO = 75000.00;
        $cgstPO = $subtotalPO * 0.09; // 6,750
        $sgstPO = $subtotalPO * 0.09; // 6,750
        $taxPO = $cgstPO + $sgstPO;   // 13,500
        $totalPO = $subtotalPO + $taxPO; // 88,500

        $po1 = PurchaseOrder::updateOrCreate(
            ['po_number' => 'PO-2026-0001'],
            [
                'vendor_id' => $vendorMap['VEN-001']->id,
                'status' => 'received',
                'order_date' => '2026-02-01',
                'expected_delivery_date' => '2026-02-15',
                'delivery_date' => '2026-02-14',
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $vendorMap['VEN-001']->gstin,
                'subtotal' => $subtotalPO,
                'tax_amount' => $taxPO,
                'cgst_amount' => $cgstPO,
                'sgst_amount' => $sgstPO,
                'igst_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => $totalPO,
                'notes' => 'Procurement of 10 units solid Wooden Tables from Azure Furniture',
                'approved_by' => $manager->id,
                'approved_at' => '2026-02-02 10:30:00',
                'created_by' => $user->id,
            ]
        );

        PurchaseOrderItem::where('purchase_order_id', $po1->id)->delete();
        PurchaseOrderItem::create([
            'purchase_order_id' => $po1->id,
            'product_id' => $productMap['UF-TBL-002']->id,
            'hsn_code' => '94036000',
            'description' => 'Solid Teakwood Wooden Table (10 units)',
            'quantity_ordered' => 10.00,
            'quantity_received' => 10.00,
            'unit_price' => 7500.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cgstPO,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstPO,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxPO,
            'line_total' => $totalPO,
        ]);

        // 8. Seed Sample Vendor Bill (AP Invoice with CGST + SGST Input Tax Credits)
        $bill1 = Invoice::updateOrCreate(
            ['invoice_number' => 'BILL-2026-0001'],
            [
                'type' => 'payable',
                'status' => 'paid',
                'reference_type' => PurchaseOrder::class,
                'reference_id' => $po1->id,
                'party_type' => 'vendor',
                'party_id' => $vendorMap['VEN-001']->id,
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $vendorMap['VEN-001']->gstin,
                'invoice_date' => '2026-02-14',
                'due_date' => '2026-03-16',
                'payment_date' => '2026-02-20',
                'subtotal' => $subtotalPO,
                'tax_amount' => $taxPO,
                'cgst_amount' => $cgstPO,
                'sgst_amount' => $sgstPO,
                'igst_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => $totalPO,
                'amount_paid' => $totalPO,
                'balance_due' => 0.00,
                'payment_terms_days' => 30,
                'notes' => 'Vendor bill from Azure Furniture for 10x Wooden Tables (Intrastate GST)',
                'approved_by' => $admin->id,
                'approved_at' => '2026-02-15 14:00:00',
                'created_by' => $manager->id,
            ]
        );

        InvoiceLineItem::where('invoice_id', $bill1->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $bill1->id,
            'product_id' => $productMap['UF-TBL-002']->id,
            'account_id' => $accountMap['1130']->id,
            'hsn_code' => '94036000',
            'description' => 'Solid Teakwood Wooden Table received into stock (10 units)',
            'quantity' => 10.00,
            'unit_price' => 7500.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cgstPO,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstPO,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxPO,
            'line_total' => $totalPO,
        ]);

        // 9. Seed Payment Made to Vendor via Bank (HDFC)
        Payment::updateOrCreate(
            ['payment_number' => 'PAY-2026-0001'],
            [
                'type' => 'made',
                'invoice_id' => $bill1->id,
                'party_type' => 'vendor',
                'party_id' => $vendorMap['VEN-001']->id,
                'amount' => $totalPO,
                'payment_date' => '2026-02-20',
                'payment_method' => 'bank_transfer',
                'reference_number' => 'NEFT-HDFC-994821',
                'bank_account_id' => $accountMap['1110']->id,
                'status' => 'cleared',
                'notes' => 'Full bank payment to Azure Furniture for BILL-2026-0001 (Wooden Tables)',
                'reconciled_by' => $admin->id,
                'reconciled_at' => '2026-02-20 18:00:00',
                'created_by' => $admin->id,
            ]
        );

        // 10. Seed Sample Sales Order (Matching Doc 7.3: Nimesh Pathak for 5 Office Chairs)
        // 5 Office Chairs @ 4,500 = 22,500. GST 18%: CGST 9% 1,012.50 + SGST 9% 1,012.50 = 2,025. Total = 24,525
        $subtotalSO = 22500.00;
        $discountSO = 0.00;
        $taxableSO = $subtotalSO - $discountSO;
        $cgstSO = $taxableSO * 0.09; // 1,012.50
        $sgstSO = $taxableSO * 0.09; // 1,012.50
        $taxSO = $cgstSO + $sgstSO;  // 2,025.00
        $totalSO = $taxableSO + $taxSO; // 24,525.00

        $so1 = SalesOrder::updateOrCreate(
            ['so_number' => 'SO-2026-0001'],
            [
                'customer_id' => $customerMap['CUST-001']->id,
                'status' => 'invoiced',
                'order_date' => '2026-02-10',
                'expected_delivery_date' => '2026-02-20',
                'delivery_date' => '2026-02-18',
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $customerMap['CUST-001']->gstin,
                'subtotal' => $subtotalSO,
                'discount_amount' => $discountSO,
                'tax_amount' => $taxSO,
                'cgst_amount' => $cgstSO,
                'sgst_amount' => $sgstSO,
                'igst_amount' => 0.00,
                'total_amount' => $totalSO,
                'shipping_address' => 'Level 8, Prime Corporate Center, BKC, Mumbai',
                'notes' => 'Sales Order for Nimesh Pathak: 5 Office Chairs (Ergonomic Executive Mesh)',
                'approved_by' => $manager->id,
                'approved_at' => '2026-02-11 11:00:00',
                'created_by' => $user->id,
            ]
        );

        SalesOrderItem::where('sales_order_id', $so1->id)->delete();
        SalesOrderItem::create([
            'sales_order_id' => $so1->id,
            'product_id' => $productMap['UF-CHAIR-001']->id,
            'hsn_code' => '94018000',
            'description' => 'Office Chair (5 units)',
            'quantity_ordered' => 5.00,
            'quantity_delivered' => 5.00,
            'unit_price' => 4500.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cgstSO,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstSO,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxSO,
            'line_total' => $totalSO,
        ]);

        // 11. Seed Customer AR Invoice (INV-2026-0001 for Nimesh Pathak)
        $inv1 = Invoice::updateOrCreate(
            ['invoice_number' => 'INV-2026-0001'],
            [
                'type' => 'receivable',
                'status' => 'paid',
                'reference_type' => SalesOrder::class,
                'reference_id' => $so1->id,
                'party_type' => 'customer',
                'party_id' => $customerMap['CUST-001']->id,
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $customerMap['CUST-001']->gstin,
                'invoice_date' => '2026-02-18',
                'due_date' => '2026-03-20',
                'payment_date' => '2026-02-22',
                'subtotal' => $subtotalSO,
                'discount_amount' => $discountSO,
                'tax_amount' => $taxSO,
                'cgst_amount' => $cgstSO,
                'sgst_amount' => $sgstSO,
                'igst_amount' => 0.00,
                'total_amount' => $totalSO,
                'amount_paid' => $totalSO,
                'balance_due' => 0.00,
                'payment_terms_days' => 30,
                'notes' => 'Customer Tax Invoice for Nimesh Pathak for 5 Office Chairs',
                'approved_by' => $admin->id,
                'approved_at' => '2026-02-18 16:00:00',
                'created_by' => $manager->id,
            ]
        );

        InvoiceLineItem::where('invoice_id', $inv1->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $inv1->id,
            'product_id' => $productMap['UF-CHAIR-001']->id,
            'account_id' => $accountMap['4100']->id,
            'hsn_code' => '94018000',
            'description' => 'Sales Revenue: 5x Office Chairs',
            'quantity' => 5.00,
            'unit_price' => 4500.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cgstSO,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstSO,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxSO,
            'line_total' => $totalSO,
        ]);

        // 12. Seed Customer Payment Received via Bank
        Payment::updateOrCreate(
            ['payment_number' => 'PAY-2026-0002'],
            [
                'type' => 'received',
                'invoice_id' => $inv1->id,
                'party_type' => 'customer',
                'party_id' => $customerMap['CUST-001']->id,
                'amount' => $totalSO,
                'payment_date' => '2026-02-22',
                'payment_method' => 'bank_transfer',
                'reference_number' => 'RTGS-HDFC-881920',
                'bank_account_id' => $accountMap['1110']->id,
                'status' => 'cleared',
                'notes' => 'Full payment received from Nimesh Pathak for INV-2026-0001 (5 Office Chairs)',
                'reconciled_by' => $admin->id,
                'reconciled_at' => '2026-02-22 17:30:00',
                'created_by' => $manager->id,
            ]
        );

        // 13. Auto-Posted Sales Journal Entry for INV-2026-0001 (CGST 1,012.50 + SGST 1,012.50)
        // Dr. 1120 Accounts Receivable: 24,525
        // Cr. 4100 Sales Revenue: 22,500
        // Cr. 2121 CGST Output Tax: 1,012.50
        // Cr. 2122 SGST Output Tax: 1,012.50
        $saleJE = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0002'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $inv1->id,
                'description' => 'Auto-Posted Sales Tax Invoice: INV-2026-0001 Nimesh Pathak (5x Office Chairs)',
                'posting_date' => '2026-02-18',
                'fiscal_year' => 2026,
                'period' => 2,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-02-18 16:00:00',
                'created_by' => $admin->id,
            ]
        );

        JournalEntryLine::where('journal_entry_id', $saleJE->id)->delete();
        JournalEntryLine::create([
            'journal_entry_id' => $saleJE->id,
            'account_id' => $accountMap['1120']->id,
            'account_code' => '1120',
            'account_name' => 'Accounts Receivable',
            'debit' => $totalSO,
            'credit' => 0.00,
            'description' => 'AR Invoice INV-2026-0001 (Nimesh Pathak)',
            'reference' => 'INV-2026-0001',
        ]);
        JournalEntryLine::create([
            'journal_entry_id' => $saleJE->id,
            'account_id' => $accountMap['4100']->id,
            'account_code' => '4100',
            'account_name' => 'Sales Revenue - Urban Furniture',
            'debit' => 0.00,
            'credit' => $subtotalSO,
            'description' => 'Net sales income recognition (5x Office Chairs)',
            'reference' => 'INV-2026-0001',
        ]);
        JournalEntryLine::create([
            'journal_entry_id' => $saleJE->id,
            'account_id' => $accountMap['2121']->id,
            'account_code' => '2121',
            'account_name' => 'CGST Output Tax Payable (9%)',
            'debit' => 0.00,
            'credit' => $cgstSO,
            'description' => '9% Central GST Output',
            'reference' => 'INV-2026-0001',
        ]);
        JournalEntryLine::create([
            'journal_entry_id' => $saleJE->id,
            'account_id' => $accountMap['2122']->id,
            'account_code' => '2122',
            'account_name' => 'SGST Output Tax Payable (9%)',
            'debit' => 0.00,
            'credit' => $sgstSO,
            'description' => '9% State GST Output',
            'reference' => 'INV-2026-0001',
        ]);

        // 14. Seed COGS Journal Entry (5 Office Chairs @ 2,800 cost = 14,000)
        // Dr. 5100 COGS: 14,000
        // Cr. 1130 Inventory: 14,000
        $cogsJE = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0003'],
            [
                'type' => 'auto',
                'reference_type' => SalesOrder::class,
                'reference_id' => $so1->id,
                'description' => 'COGS & Inventory relief for delivered SO-2026-0001 (5 Office Chairs)',
                'posting_date' => '2026-02-18',
                'fiscal_year' => 2026,
                'period' => 2,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-02-18 16:30:00',
                'created_by' => $admin->id,
            ]
        );

        $totalCogs = 5 * 2800.00; // 14,000
        JournalEntryLine::where('journal_entry_id', $cogsJE->id)->delete();
        JournalEntryLine::create([
            'journal_entry_id' => $cogsJE->id,
            'account_id' => $accountMap['5100']->id,
            'account_code' => '5100',
            'account_name' => 'Cost of Goods Sold (COGS)',
            'debit' => $totalCogs,
            'credit' => 0.00,
            'description' => 'COGS on 5 delivered Office Chairs',
            'reference' => 'SO-2026-0001',
        ]);
        JournalEntryLine::create([
            'journal_entry_id' => $cogsJE->id,
            'account_id' => $accountMap['1130']->id,
            'account_code' => '1130',
            'account_name' => 'Inventory (Finished Furniture)',
            'debit' => 0.00,
            'credit' => $totalCogs,
            'description' => 'Inventory reduction at standard cost',
            'reference' => 'SO-2026-0001',
        ]);

        // 15. Seed Inventory Movements
        InventoryMovement::create([
            'product_id' => $productMap['UF-TBL-002']->id,
            'type' => 'purchase',
            'quantity' => 10.00,
            'unit_cost' => 7500.00,
            'total_value' => 75000.00,
            'reference_type' => PurchaseOrder::class,
            'reference_id' => $po1->id,
            'notes' => 'Wooden Tables received against PO-2026-0001 from Azure Furniture',
            'performed_by' => $manager->id,
        ]);

        InventoryMovement::create([
            'product_id' => $productMap['UF-CHAIR-001']->id,
            'type' => 'sale',
            'quantity' => -5.00,
            'unit_cost' => 2800.00,
            'total_value' => -14000.00,
            'reference_type' => SalesOrder::class,
            'reference_id' => $so1->id,
            'notes' => 'Delivery fulfillment for SO-2026-0001 to Nimesh Pathak (5x Office Chairs)',
            'performed_by' => $manager->id,
        ]);

        // Recalculate account balances
        foreach ($accountMap as $acc) {
            $acc->recalculateBalance();
        }
    }
}
