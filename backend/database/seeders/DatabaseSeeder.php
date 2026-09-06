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
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // =========================================================================
        // 1. Seed Core & Extended Role Users
        // =========================================================================
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

        $manager2 = User::firstOrCreate(
            ['email' => 'manager2@example.com'],
            [
                'name' => 'Kavita Rao (Supply Chain Lead)',
                'password' => Hash::make('password'),
                'role' => User::ROLE_MANAGER,
            ]
        );
        $manager2->role = User::ROLE_MANAGER;
        $manager2->save();

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

        $clerk = User::firstOrCreate(
            ['email' => 'clerk@example.com'],
            [
                'name' => 'Aditya Verma (Inventory & Billing Clerk)',
                'password' => Hash::make('password'),
                'role' => User::ROLE_USER,
            ]
        );
        $clerk->role = User::ROLE_USER;
        $clerk->save();

        // =========================================================================
        // 2. Seed Full GST-enabled Chart of Accounts
        // =========================================================================
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

        // =========================================================================
        // 3. Seed Opening Balance Journal Entry (Double-Entry Balanced)
        // =========================================================================
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

        // =========================================================================
        // 4. Seed Vendors with GSTIN and State (Intrastate & Interstate)
        // =========================================================================
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
                'contact_person' => 'Deepak Hegde',
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

        // =========================================================================
        // 5. Seed Customers with GSTIN and State (Intrastate & Interstate)
        // =========================================================================
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
                'credit_limit' => 3500000.00,
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

        // =========================================================================
        // 6. Seed Real Urban Furniture Master Products
        // =========================================================================
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

        // =========================================================================
        // 7. Seed Purchase Orders (PO-2026-0001, PO-2026-0002, PO-2026-0003)
        // =========================================================================

        // PO-2026-0001: Azure Furniture (Intrastate Pune) - 10 Wooden Tables @ 7,500
        $subtotalPO1 = 75000.00;
        $cgstPO1 = $subtotalPO1 * 0.09; // 6,750
        $sgstPO1 = $subtotalPO1 * 0.09; // 6,750
        $taxPO1 = $cgstPO1 + $sgstPO1;   // 13,500
        $totalPO1 = $subtotalPO1 + $taxPO1; // 88,500

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
                'subtotal' => $subtotalPO1,
                'tax_amount' => $taxPO1,
                'cgst_amount' => $cgstPO1,
                'sgst_amount' => $sgstPO1,
                'igst_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => $totalPO1,
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
            'cgst_amount' => $cgstPO1,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstPO1,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxPO1,
            'line_total' => $totalPO1,
        ]);

        // PO-2026-0002: Open Wood Furnishings (Interstate Bengaluru) - 15 Dining Tables @ 11,000
        $subtotalPO2 = 165000.00;
        $igstPO2 = $subtotalPO2 * 0.18; // 29,700
        $taxPO2 = $igstPO2;
        $totalPO2 = $subtotalPO2 + $taxPO2; // 194,700

        $po2 = PurchaseOrder::updateOrCreate(
            ['po_number' => 'PO-2026-0002'],
            [
                'vendor_id' => $vendorMap['VEN-002']->id,
                'status' => 'received',
                'order_date' => '2026-06-10',
                'expected_delivery_date' => '2026-06-25',
                'delivery_date' => '2026-06-25',
                'place_of_supply' => 'Karnataka (29)',
                'is_interstate' => true,
                'gstin' => $vendorMap['VEN-002']->gstin,
                'subtotal' => $subtotalPO2,
                'tax_amount' => $taxPO2,
                'cgst_amount' => 0.00,
                'sgst_amount' => 0.00,
                'igst_amount' => $igstPO2,
                'discount_amount' => 0.00,
                'total_amount' => $totalPO2,
                'notes' => 'Interstate bulk purchase of 15 Dining Tables from Bengaluru Timber Estate',
                'approved_by' => $manager2->id,
                'approved_at' => '2026-06-11 11:00:00',
                'created_by' => $clerk->id,
            ]
        );

        PurchaseOrderItem::where('purchase_order_id', $po2->id)->delete();
        PurchaseOrderItem::create([
            'purchase_order_id' => $po2->id,
            'product_id' => $productMap['UF-DTBL-004']->id,
            'hsn_code' => '94036000',
            'description' => 'Solid Oak 6-seater Dining Table (15 units)',
            'quantity_ordered' => 15.00,
            'quantity_received' => 15.00,
            'unit_price' => 11000.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 0.00,
            'cgst_amount' => 0.00,
            'sgst_rate' => 0.00,
            'sgst_amount' => 0.00,
            'igst_rate' => 18.00,
            'igst_amount' => $igstPO2,
            'tax_amount' => $taxPO2,
            'line_total' => $totalPO2,
        ]);

        // PO-2026-0003: Rahul Sharma Timber Crafts (Intrastate Mumbai) - 10 Sofas @ 16,000
        $subtotalPO3 = 160000.00;
        $cgstPO3 = $subtotalPO3 * 0.09; // 14,400
        $sgstPO3 = $subtotalPO3 * 0.09; // 14,400
        $taxPO3 = $cgstPO3 + $sgstPO3;   // 28,800
        $totalPO3 = $subtotalPO3 + $taxPO3; // 188,800

        $po3 = PurchaseOrder::updateOrCreate(
            ['po_number' => 'PO-2026-0003'],
            [
                'vendor_id' => $vendorMap['VEN-003']->id,
                'status' => 'received',
                'order_date' => '2026-08-05',
                'expected_delivery_date' => '2026-08-18',
                'delivery_date' => '2026-08-18',
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $vendorMap['VEN-003']->gstin,
                'subtotal' => $subtotalPO3,
                'tax_amount' => $taxPO3,
                'cgst_amount' => $cgstPO3,
                'sgst_amount' => $sgstPO3,
                'igst_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => $totalPO3,
                'notes' => 'Handcrafted hardwood upholstered lounge sofas (10 units)',
                'approved_by' => $manager->id,
                'approved_at' => '2026-08-06 09:30:00',
                'created_by' => $user->id,
            ]
        );

        PurchaseOrderItem::where('purchase_order_id', $po3->id)->delete();
        PurchaseOrderItem::create([
            'purchase_order_id' => $po3->id,
            'product_id' => $productMap['UF-SOFA-003']->id,
            'hsn_code' => '94014000',
            'description' => '3-seater contemporary lounge sofa (10 units)',
            'quantity_ordered' => 10.00,
            'quantity_received' => 10.00,
            'unit_price' => 16000.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cgstPO3,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstPO3,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxPO3,
            'line_total' => $totalPO3,
        ]);

        // =========================================================================
        // 8. Seed Vendor Bills (AP Invoices with Input Tax Credits across Aging Buckets)
        // =========================================================================

        // BILL-2026-0001: Paid in full (Azure Furniture)
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
                'subtotal' => $subtotalPO1,
                'tax_amount' => $taxPO1,
                'cgst_amount' => $cgstPO1,
                'sgst_amount' => $sgstPO1,
                'igst_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => $totalPO1,
                'amount_paid' => $totalPO1,
                'balance_due' => 0.00,
                'payment_terms_days' => 30,
                'notes' => 'Vendor bill from Azure Furniture for 10x Wooden Tables (Intrastate GST)',
                'approved_by' => $admin->id,
                'approved_at' => '2026-02-15 14:00:00',
                'created_by' => $manager->id,
                'created_at' => '2026-02-14 10:00:00',
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
            'cgst_amount' => $cgstPO1,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstPO1,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxPO1,
            'line_total' => $totalPO1,
        ]);

        // BILL-2026-0002: Partially paid (Open Wood Furnishings - Interstate IGST) -> 1-30 days overdue
        $paidBill2 = 100000.00;
        $balBill2 = $totalPO2 - $paidBill2; // 94,700.00
        $bill2 = Invoice::updateOrCreate(
            ['invoice_number' => 'BILL-2026-0002'],
            [
                'type' => 'payable',
                'status' => 'partially_paid',
                'reference_type' => PurchaseOrder::class,
                'reference_id' => $po2->id,
                'party_type' => 'vendor',
                'party_id' => $vendorMap['VEN-002']->id,
                'place_of_supply' => 'Karnataka (29)',
                'is_interstate' => true,
                'gstin' => $vendorMap['VEN-002']->gstin,
                'invoice_date' => '2026-06-25',
                'due_date' => '2026-08-09', // ~27 days overdue relative to Sep 5 -> days_1_30
                'payment_date' => '2026-07-20',
                'subtotal' => $subtotalPO2,
                'tax_amount' => $taxPO2,
                'cgst_amount' => 0.00,
                'sgst_amount' => 0.00,
                'igst_amount' => $igstPO2,
                'discount_amount' => 0.00,
                'total_amount' => $totalPO2,
                'amount_paid' => $paidBill2,
                'balance_due' => $balBill2,
                'payment_terms_days' => 45,
                'notes' => 'Interstate vendor bill for 15 Dining Tables from Open Wood Furnishings (₹1,00,000 partial wire)',
                'approved_by' => $admin->id,
                'approved_at' => '2026-06-26 15:00:00',
                'created_by' => $manager2->id,
                'created_at' => '2026-06-25 11:00:00',
            ]
        );

        InvoiceLineItem::where('invoice_id', $bill2->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $bill2->id,
            'product_id' => $productMap['UF-DTBL-004']->id,
            'account_id' => $accountMap['1130']->id,
            'hsn_code' => '94036000',
            'description' => 'Solid Oak 6-seater Dining Table (15 units)',
            'quantity' => 15.00,
            'unit_price' => 11000.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 0.00,
            'cgst_amount' => 0.00,
            'sgst_rate' => 0.00,
            'sgst_amount' => 0.00,
            'igst_rate' => 18.00,
            'igst_amount' => $igstPO2,
            'tax_amount' => $taxPO2,
            'line_total' => $totalPO2,
        ]);

        // BILL-2026-0003: Approved, Current (due in future: Sep 17) -> current bucket
        $bill3 = Invoice::updateOrCreate(
            ['invoice_number' => 'BILL-2026-0003'],
            [
                'type' => 'payable',
                'status' => 'approved',
                'reference_type' => PurchaseOrder::class,
                'reference_id' => $po3->id,
                'party_type' => 'vendor',
                'party_id' => $vendorMap['VEN-003']->id,
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $vendorMap['VEN-003']->gstin,
                'invoice_date' => '2026-08-18',
                'due_date' => '2026-09-17', // Future -> current bucket
                'payment_date' => null,
                'subtotal' => $subtotalPO3,
                'tax_amount' => $taxPO3,
                'cgst_amount' => $cgstPO3,
                'sgst_amount' => $sgstPO3,
                'igst_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => $totalPO3,
                'amount_paid' => 0.00,
                'balance_due' => $totalPO3,
                'payment_terms_days' => 30,
                'notes' => 'Vendor bill from Rahul Sharma Timber Crafts for 10 upholstered contemporary lounge sofas',
                'approved_by' => $manager->id,
                'approved_at' => '2026-08-19 10:00:00',
                'created_by' => $user->id,
                'created_at' => '2026-08-18 10:00:00',
            ]
        );

        InvoiceLineItem::where('invoice_id', $bill3->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $bill3->id,
            'product_id' => $productMap['UF-SOFA-003']->id,
            'account_id' => $accountMap['1130']->id,
            'hsn_code' => '94014000',
            'description' => '3-seater contemporary lounge sofa (10 units)',
            'quantity' => 10.00,
            'unit_price' => 16000.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cgstPO3,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstPO3,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxPO3,
            'line_total' => $totalPO3,
        ]);

        // BILL-2026-0004: Overdue >90 days (Azure Furniture for seasoned raw timber logistics) -> over_90 bucket
        $subtotalBill4 = 35000.00;
        $cgstBill4 = $subtotalBill4 * 0.09; // 3,150
        $sgstBill4 = $subtotalBill4 * 0.09; // 3,150
        $taxBill4 = $cgstBill4 + $sgstBill4; // 6,300
        $totalBill4 = $subtotalBill4 + $taxBill4; // 41,300

        $bill4 = Invoice::updateOrCreate(
            ['invoice_number' => 'BILL-2026-0004'],
            [
                'type' => 'payable',
                'status' => 'approved',
                'reference_type' => null,
                'reference_id' => null,
                'party_type' => 'vendor',
                'party_id' => $vendorMap['VEN-001']->id,
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $vendorMap['VEN-001']->gstin,
                'invoice_date' => '2026-03-15',
                'due_date' => '2026-04-14', // >140 days overdue -> over_90
                'payment_date' => null,
                'subtotal' => $subtotalBill4,
                'tax_amount' => $taxBill4,
                'cgst_amount' => $cgstBill4,
                'sgst_amount' => $sgstBill4,
                'igst_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => $totalBill4,
                'amount_paid' => 0.00,
                'balance_due' => $totalBill4,
                'payment_terms_days' => 30,
                'notes' => 'Raw teak billet procurement & kiln seasoning service from Azure Furniture',
                'approved_by' => $admin->id,
                'approved_at' => '2026-03-16 11:00:00',
                'created_by' => $manager->id,
                'created_at' => '2026-03-15 09:00:00',
            ]
        );

        InvoiceLineItem::where('invoice_id', $bill4->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $bill4->id,
            'product_id' => null,
            'account_id' => $accountMap['1130']->id,
            'hsn_code' => '44071000',
            'description' => 'Seasoned hardwood billets & timber cutting stock',
            'quantity' => 1.00,
            'unit_price' => 35000.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cgstBill4,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstBill4,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxBill4,
            'line_total' => $totalBill4,
        ]);

        // BILL-2026-0005: 31-60 days overdue (Open Wood Furnishings - Interstate IGST) -> days_31_60 bucket
        $subtotalBill5 = 50000.00;
        $igstBill5 = $subtotalBill5 * 0.18; // 9,000
        $taxBill5 = $igstBill5;
        $totalBill5 = $subtotalBill5 + $taxBill5; // 59,000

        $bill5 = Invoice::updateOrCreate(
            ['invoice_number' => 'BILL-2026-0005'],
            [
                'type' => 'payable',
                'status' => 'approved',
                'reference_type' => null,
                'reference_id' => null,
                'party_type' => 'vendor',
                'party_id' => $vendorMap['VEN-002']->id,
                'place_of_supply' => 'Karnataka (29)',
                'is_interstate' => true,
                'gstin' => $vendorMap['VEN-002']->gstin,
                'invoice_date' => '2026-05-25',
                'due_date' => '2026-06-25', // ~72 days overdue -> days_61_90
                'payment_date' => null,
                'subtotal' => $subtotalBill5,
                'tax_amount' => $taxBill5,
                'cgst_amount' => 0.00,
                'sgst_amount' => 0.00,
                'igst_amount' => $igstBill5,
                'discount_amount' => 0.00,
                'total_amount' => $totalBill5,
                'amount_paid' => 0.00,
                'balance_due' => $totalBill5,
                'payment_terms_days' => 30,
                'notes' => 'Import of kiln-dried Karnataka teak planks for showroom table production',
                'approved_by' => $manager2->id,
                'approved_at' => '2026-05-26 14:00:00',
                'created_by' => $clerk->id,
                'created_at' => '2026-05-25 10:00:00',
            ]
        );

        InvoiceLineItem::where('invoice_id', $bill5->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $bill5->id,
            'product_id' => null,
            'account_id' => $accountMap['1130']->id,
            'hsn_code' => '44071000',
            'description' => 'Kiln-dried hardwood timber planks (Interstate)',
            'quantity' => 1.00,
            'unit_price' => 50000.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 0.00,
            'cgst_amount' => 0.00,
            'sgst_rate' => 0.00,
            'sgst_amount' => 0.00,
            'igst_rate' => 18.00,
            'igst_amount' => $igstBill5,
            'tax_amount' => $taxBill5,
            'line_total' => $totalBill5,
        ]);

        // BILL-2026-0006: 31-60 days overdue (Rahul Sharma Timber Crafts - Intrastate) -> days_31_60 bucket
        $subtotalBill6 = 20000.00;
        $cgstBill6 = $subtotalBill6 * 0.09; // 1,800
        $sgstBill6 = $subtotalBill6 * 0.09; // 1,800
        $taxBill6 = $cgstBill6 + $sgstBill6; // 3,600
        $totalBill6 = $subtotalBill6 + $taxBill6; // 23,600

        $bill6 = Invoice::updateOrCreate(
            ['invoice_number' => 'BILL-2026-0006'],
            [
                'type' => 'payable',
                'status' => 'approved',
                'reference_type' => null,
                'reference_id' => null,
                'party_type' => 'vendor',
                'party_id' => $vendorMap['VEN-003']->id,
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $vendorMap['VEN-003']->gstin,
                'invoice_date' => '2026-07-02',
                'due_date' => '2026-08-01', // ~35 days overdue -> days_31_60
                'payment_date' => null,
                'subtotal' => $subtotalBill6,
                'tax_amount' => $taxBill6,
                'cgst_amount' => $cgstBill6,
                'sgst_amount' => $sgstBill6,
                'igst_amount' => 0.00,
                'discount_amount' => 0.00,
                'total_amount' => $totalBill6,
                'amount_paid' => 0.00,
                'balance_due' => $totalBill6,
                'payment_terms_days' => 30,
                'notes' => 'Custom joinery and precision timber crafting components',
                'approved_by' => $manager->id,
                'approved_at' => '2026-07-03 11:00:00',
                'created_by' => $user->id,
                'created_at' => '2026-07-02 10:00:00',
            ]
        );

        InvoiceLineItem::where('invoice_id', $bill6->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $bill6->id,
            'product_id' => null,
            'account_id' => $accountMap['1130']->id,
            'hsn_code' => '94036000',
            'description' => 'Custom wooden table leg joinery & timber hardware',
            'quantity' => 1.00,
            'unit_price' => 20000.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cgstBill6,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstBill6,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxBill6,
            'line_total' => $totalBill6,
        ]);

        // =========================================================================
        // 9. Seed Payments Made to Vendors via Bank
        // =========================================================================
        Payment::updateOrCreate(
            ['payment_number' => 'PAY-2026-0001'],
            [
                'type' => 'made',
                'invoice_id' => $bill1->id,
                'party_type' => 'vendor',
                'party_id' => $vendorMap['VEN-001']->id,
                'amount' => $totalPO1,
                'payment_date' => '2026-02-20',
                'payment_method' => 'bank_transfer',
                'reference_number' => 'NEFT-HDFC-994821',
                'bank_account_id' => $accountMap['1110']->id,
                'status' => 'cleared',
                'notes' => 'Full bank payment to Azure Furniture for BILL-2026-0001 (Wooden Tables)',
                'reconciled_by' => $admin->id,
                'reconciled_at' => '2026-02-20 18:00:00',
                'created_by' => $admin->id,
                'created_at' => '2026-02-20 18:00:00',
            ]
        );

        Payment::updateOrCreate(
            ['payment_number' => 'PAY-2026-0004'],
            [
                'type' => 'made',
                'invoice_id' => $bill2->id,
                'party_type' => 'vendor',
                'party_id' => $vendorMap['VEN-002']->id,
                'amount' => $paidBill2,
                'payment_date' => '2026-07-20',
                'payment_method' => 'bank_transfer',
                'reference_number' => 'RTGS-HDFC-339912',
                'bank_account_id' => $accountMap['1110']->id,
                'status' => 'cleared',
                'notes' => 'Partial payment to Open Wood Furnishings for BILL-2026-0002 (Dining Tables)',
                'reconciled_by' => $admin->id,
                'reconciled_at' => '2026-07-20 16:00:00',
                'created_by' => $manager->id,
                'created_at' => '2026-07-20 16:00:00',
            ]
        );

        // =========================================================================
        // 10. Seed Sales Orders (SO-2026-0001 through SO-2026-0005)
        // =========================================================================

        // SO-2026-0001: Nimesh Pathak - 5 Office Chairs @ 4,500 = 22,500 + GST
        $subtotalSO1 = 22500.00;
        $cgstSO1 = $subtotalSO1 * 0.09; // 1,012.50
        $sgstSO1 = $subtotalSO1 * 0.09; // 1,012.50
        $taxSO1 = $cgstSO1 + $sgstSO1;  // 2,025.00
        $totalSO1 = $subtotalSO1 + $taxSO1; // 24,525.00

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
                'subtotal' => $subtotalSO1,
                'discount_amount' => 0.00,
                'tax_amount' => $taxSO1,
                'cgst_amount' => $cgstSO1,
                'sgst_amount' => $sgstSO1,
                'igst_amount' => 0.00,
                'total_amount' => $totalSO1,
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
            'cgst_amount' => $cgstSO1,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstSO1,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxSO1,
            'line_total' => $totalSO1,
        ]);

        // SO-2026-0002: Azure Corporate Interiors - 8 Chairs + 4 Tables = 84,000 + GST
        $chairAmt2 = 8 * 4500.00; // 36,000
        $tblAmt2 = 4 * 12000.00;  // 48,000
        $subtotalSO2 = $chairAmt2 + $tblAmt2; // 84,000
        $cgstSO2 = $subtotalSO2 * 0.09; // 7,560
        $sgstSO2 = $subtotalSO2 * 0.09; // 7,560
        $taxSO2 = $cgstSO2 + $sgstSO2;  // 15,120
        $totalSO2 = $subtotalSO2 + $taxSO2; // 99,120

        $so2 = SalesOrder::updateOrCreate(
            ['so_number' => 'SO-2026-0002'],
            [
                'customer_id' => $customerMap['CUST-002']->id,
                'status' => 'invoiced',
                'order_date' => '2026-07-05',
                'expected_delivery_date' => '2026-07-15',
                'delivery_date' => '2026-07-15',
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $customerMap['CUST-002']->gstin,
                'subtotal' => $subtotalSO2,
                'discount_amount' => 0.00,
                'tax_amount' => $taxSO2,
                'cgst_amount' => $cgstSO2,
                'sgst_amount' => $sgstSO2,
                'igst_amount' => 0.00,
                'total_amount' => $totalSO2,
                'shipping_address' => 'Tower B, Office Floors 4-7, Western Express Highway, Mumbai',
                'notes' => 'Corporate floor expansion order: 8 Office Chairs and 4 Executive Wooden Tables',
                'approved_by' => $manager->id,
                'approved_at' => '2026-07-06 14:00:00',
                'created_by' => $user->id,
            ]
        );

        SalesOrderItem::where('sales_order_id', $so2->id)->delete();
        SalesOrderItem::create([
            'sales_order_id' => $so2->id,
            'product_id' => $productMap['UF-CHAIR-001']->id,
            'hsn_code' => '94018000',
            'description' => 'Office Chair (8 units)',
            'quantity_ordered' => 8.00,
            'quantity_delivered' => 8.00,
            'unit_price' => 4500.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $chairAmt2 * 0.09,
            'sgst_rate' => 9.00,
            'sgst_amount' => $chairAmt2 * 0.09,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $chairAmt2 * 0.18,
            'line_total' => $chairAmt2 * 1.18,
        ]);
        SalesOrderItem::create([
            'sales_order_id' => $so2->id,
            'product_id' => $productMap['UF-TBL-002']->id,
            'hsn_code' => '94036000',
            'description' => 'Solid Teakwood Wooden Table (4 units)',
            'quantity_ordered' => 4.00,
            'quantity_delivered' => 4.00,
            'unit_price' => 12000.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $tblAmt2 * 0.09,
            'sgst_rate' => 9.00,
            'sgst_amount' => $tblAmt2 * 0.09,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $tblAmt2 * 0.18,
            'line_total' => $tblAmt2 * 1.18,
        ]);

        // SO-2026-0003: Greenfield Tech Commercial Parks (Interstate Bengaluru) - 12 Dining Tables + Service
        $dtblAmt3 = 12 * 18500.00; // 222,000
        $srvAmt3 = 15000.00;       // 15,000
        $subtotalSO3 = $dtblAmt3 + $srvAmt3; // 237,000
        $igstSO3 = $subtotalSO3 * 0.18; // 42,660
        $taxSO3 = $igstSO3;
        $totalSO3 = $subtotalSO3 + $taxSO3; // 279,660

        $so3 = SalesOrder::updateOrCreate(
            ['so_number' => 'SO-2026-0003'],
            [
                'customer_id' => $customerMap['CUST-003']->id,
                'status' => 'invoiced',
                'order_date' => '2026-07-01',
                'expected_delivery_date' => '2026-07-20',
                'delivery_date' => '2026-07-20',
                'place_of_supply' => 'Karnataka (29)',
                'is_interstate' => true,
                'gstin' => $customerMap['CUST-003']->gstin,
                'subtotal' => $subtotalSO3,
                'discount_amount' => 0.00,
                'tax_amount' => $taxSO3,
                'cgst_amount' => 0.00,
                'sgst_amount' => 0.00,
                'igst_amount' => $igstSO3,
                'total_amount' => $totalSO3,
                'shipping_address' => 'Central Campus Executive Suite, Greenfield SEZ, Outer Ring Road, Bengaluru',
                'notes' => 'Interstate supply & installation for Bengaluru commercial tech park executive cafeteria',
                'approved_by' => $manager2->id,
                'approved_at' => '2026-07-02 10:00:00',
                'created_by' => $clerk->id,
            ]
        );

        SalesOrderItem::where('sales_order_id', $so3->id)->delete();
        SalesOrderItem::create([
            'sales_order_id' => $so3->id,
            'product_id' => $productMap['UF-DTBL-004']->id,
            'hsn_code' => '94036000',
            'description' => 'Solid Oak 6-seater Dining Table (12 units)',
            'quantity_ordered' => 12.00,
            'quantity_delivered' => 12.00,
            'unit_price' => 18500.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 0.00,
            'cgst_amount' => 0.00,
            'sgst_rate' => 0.00,
            'sgst_amount' => 0.00,
            'igst_rate' => 18.00,
            'igst_amount' => $dtblAmt3 * 0.18,
            'tax_amount' => $dtblAmt3 * 0.18,
            'line_total' => $dtblAmt3 * 1.18,
        ]);
        SalesOrderItem::create([
            'sales_order_id' => $so3->id,
            'product_id' => $productMap['UF-SRV-006']->id,
            'hsn_code' => '998713',
            'description' => 'Turnkey site assembly & leveling service',
            'quantity_ordered' => 1.00,
            'quantity_delivered' => 1.00,
            'unit_price' => 15000.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 0.00,
            'cgst_amount' => 0.00,
            'sgst_rate' => 0.00,
            'sgst_amount' => 0.00,
            'igst_rate' => 18.00,
            'igst_amount' => $srvAmt3 * 0.18,
            'tax_amount' => $srvAmt3 * 0.18,
            'line_total' => $srvAmt3 * 1.18,
        ]);

        // SO-2026-0004: Azure Corporate Interiors - 4 Sofas + 2 Combos (Confirmed, in delivery)
        $sofaAmt4 = 4 * 25000.00; // 100,000
        $cmbAmt4 = 2 * 15000.00;  // 30,000
        $subtotalSO4 = $sofaAmt4 + $cmbAmt4; // 130,000
        $cgstSO4 = $subtotalSO4 * 0.09; // 11,700
        $sgstSO4 = $subtotalSO4 * 0.09; // 11,700
        $taxSO4 = $cgstSO4 + $sgstSO4;  // 23,400
        $totalSO4 = $subtotalSO4 + $taxSO4; // 153,400

        $so4 = SalesOrder::updateOrCreate(
            ['so_number' => 'SO-2026-0004'],
            [
                'customer_id' => $customerMap['CUST-002']->id,
                'status' => 'confirmed',
                'order_date' => '2026-08-10',
                'expected_delivery_date' => '2026-08-25',
                'delivery_date' => null,
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $customerMap['CUST-002']->gstin,
                'subtotal' => $subtotalSO4,
                'discount_amount' => 0.00,
                'tax_amount' => $taxSO4,
                'cgst_amount' => $cgstSO4,
                'sgst_amount' => $sgstSO4,
                'igst_amount' => 0.00,
                'total_amount' => $totalSO4,
                'shipping_address' => 'Azure Tech Park, Western Express Highway, Mumbai',
                'notes' => 'Executive lounge makeover: 4 Sofas and 2 Executive Suite Combos',
                'approved_by' => $manager->id,
                'approved_at' => '2026-08-11 12:00:00',
                'created_by' => $user->id,
            ]
        );

        SalesOrderItem::where('sales_order_id', $so4->id)->delete();
        SalesOrderItem::create([
            'sales_order_id' => $so4->id,
            'product_id' => $productMap['UF-SOFA-003']->id,
            'hsn_code' => '94014000',
            'description' => '3-seater contemporary lounge sofa (4 units)',
            'quantity_ordered' => 4.00,
            'quantity_delivered' => 4.00,
            'unit_price' => 25000.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $sofaAmt4 * 0.09,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sofaAmt4 * 0.09,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $sofaAmt4 * 0.18,
            'line_total' => $sofaAmt4 * 1.18,
        ]);
        SalesOrderItem::create([
            'sales_order_id' => $so4->id,
            'product_id' => $productMap['UF-CMB-007']->id,
            'hsn_code' => '94036000',
            'description' => 'Executive Office Suite Combo (2 sets)',
            'quantity_ordered' => 2.00,
            'quantity_delivered' => 2.00,
            'unit_price' => 15000.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cmbAmt4 * 0.09,
            'sgst_rate' => 9.00,
            'sgst_amount' => $cmbAmt4 * 0.09,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $cmbAmt4 * 0.18,
            'line_total' => $cmbAmt4 * 1.18,
        ]);

        // SO-2026-0005: Greenfield Tech Commercial Parks (Interstate) - 25 Wooden Chairs (Confirmed)
        $subtotalSO5 = 25 * 3200.00; // 80,000
        $igstSO5 = $subtotalSO5 * 0.18; // 14,400
        $taxSO5 = $igstSO5;
        $totalSO5 = $subtotalSO5 + $taxSO5; // 94,400

        $so5 = SalesOrder::updateOrCreate(
            ['so_number' => 'SO-2026-0005'],
            [
                'customer_id' => $customerMap['CUST-003']->id,
                'status' => 'confirmed',
                'order_date' => '2026-09-01',
                'expected_delivery_date' => '2026-09-15',
                'delivery_date' => null,
                'place_of_supply' => 'Karnataka (29)',
                'is_interstate' => true,
                'gstin' => $customerMap['CUST-003']->gstin,
                'subtotal' => $subtotalSO5,
                'discount_amount' => 0.00,
                'tax_amount' => $taxSO5,
                'cgst_amount' => 0.00,
                'sgst_amount' => 0.00,
                'igst_amount' => $igstSO5,
                'total_amount' => $totalSO5,
                'shipping_address' => 'Greenfield SEZ, Outer Ring Road, Bengaluru',
                'notes' => 'Bulk supply of 25 handcrafted cushioned wooden chairs for library lounge',
                'approved_by' => $manager2->id,
                'approved_at' => '2026-09-02 09:00:00',
                'created_by' => $clerk->id,
            ]
        );

        SalesOrderItem::where('sales_order_id', $so5->id)->delete();
        SalesOrderItem::create([
            'sales_order_id' => $so5->id,
            'product_id' => $productMap['UF-WCHAIR-005']->id,
            'hsn_code' => '94016100',
            'description' => 'Solid handcrafted teakwood chair with cushion (25 units)',
            'quantity_ordered' => 25.00,
            'quantity_delivered' => 15.00,
            'unit_price' => 3200.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 0.00,
            'cgst_amount' => 0.00,
            'sgst_rate' => 0.00,
            'sgst_amount' => 0.00,
            'igst_rate' => 18.00,
            'igst_amount' => $igstSO5,
            'tax_amount' => $taxSO5,
            'line_total' => $totalSO5,
        ]);

        // =========================================================================
        // 11. Seed Customer AR Invoices (with Aging Buckets: Current, 1-30, 31-60, >90)
        // =========================================================================

        // INV-2026-0001: Paid in full (Nimesh Pathak)
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
                'subtotal' => $subtotalSO1,
                'discount_amount' => 0.00,
                'tax_amount' => $taxSO1,
                'cgst_amount' => $cgstSO1,
                'sgst_amount' => $sgstSO1,
                'igst_amount' => 0.00,
                'total_amount' => $totalSO1,
                'amount_paid' => $totalSO1,
                'balance_due' => 0.00,
                'payment_terms_days' => 30,
                'notes' => 'Customer Tax Invoice for Nimesh Pathak for 5 Office Chairs',
                'approved_by' => $admin->id,
                'approved_at' => '2026-02-18 16:00:00',
                'created_by' => $manager->id,
                'created_at' => '2026-02-18 16:00:00',
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
            'cgst_amount' => $cgstSO1,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstSO1,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxSO1,
            'line_total' => $totalSO1,
        ]);

        // INV-2026-0002: Partially paid (Azure Corporate Interiors) -> 1-30 days overdue
        $paidInv2 = 50000.00;
        $balInv2 = $totalSO2 - $paidInv2; // 49,120.00
        $inv2 = Invoice::updateOrCreate(
            ['invoice_number' => 'INV-2026-0002'],
            [
                'type' => 'receivable',
                'status' => 'partially_paid',
                'reference_type' => SalesOrder::class,
                'reference_id' => $so2->id,
                'party_type' => 'customer',
                'party_id' => $customerMap['CUST-002']->id,
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $customerMap['CUST-002']->gstin,
                'invoice_date' => '2026-07-15',
                'due_date' => '2026-08-29', // 7 days past due -> days_1_30
                'payment_date' => '2026-08-01',
                'subtotal' => $subtotalSO2,
                'discount_amount' => 0.00,
                'tax_amount' => $taxSO2,
                'cgst_amount' => $cgstSO2,
                'sgst_amount' => $sgstSO2,
                'igst_amount' => 0.00,
                'total_amount' => $totalSO2,
                'amount_paid' => $paidInv2,
                'balance_due' => $balInv2,
                'payment_terms_days' => 45,
                'notes' => 'Corporate office floor seating: 8 Chairs + 4 Tables (₹50,000 partial payment received)',
                'approved_by' => $admin->id,
                'approved_at' => '2026-07-16 11:00:00',
                'created_by' => $manager->id,
                'created_at' => '2026-07-15 11:00:00',
            ]
        );

        InvoiceLineItem::where('invoice_id', $inv2->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $inv2->id,
            'product_id' => $productMap['UF-CHAIR-001']->id,
            'account_id' => $accountMap['4100']->id,
            'hsn_code' => '94018000',
            'description' => 'Sales Revenue: 8x Office Chairs',
            'quantity' => 8.00,
            'unit_price' => 4500.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $chairAmt2 * 0.09,
            'sgst_rate' => 9.00,
            'sgst_amount' => $chairAmt2 * 0.09,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $chairAmt2 * 0.18,
            'line_total' => $chairAmt2 * 1.18,
        ]);
        InvoiceLineItem::create([
            'invoice_id' => $inv2->id,
            'product_id' => $productMap['UF-TBL-002']->id,
            'account_id' => $accountMap['4100']->id,
            'hsn_code' => '94036000',
            'description' => 'Sales Revenue: 4x Executive Wooden Tables',
            'quantity' => 4.00,
            'unit_price' => 12000.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $tblAmt2 * 0.09,
            'sgst_rate' => 9.00,
            'sgst_amount' => $tblAmt2 * 0.09,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $tblAmt2 * 0.18,
            'line_total' => $tblAmt2 * 1.18,
        ]);

        // INV-2026-0003: Approved, 31-60 days overdue (Greenfield Tech Commercial Parks - Interstate IGST) -> days_31_60
        $inv3 = Invoice::updateOrCreate(
            ['invoice_number' => 'INV-2026-0003'],
            [
                'type' => 'receivable',
                'status' => 'approved',
                'reference_type' => SalesOrder::class,
                'reference_id' => $so3->id,
                'party_type' => 'customer',
                'party_id' => $customerMap['CUST-003']->id,
                'place_of_supply' => 'Karnataka (29)',
                'is_interstate' => true,
                'gstin' => $customerMap['CUST-003']->gstin,
                'invoice_date' => '2026-05-25',
                'due_date' => '2026-06-25', // ~72 days overdue -> days_61_90
                'payment_date' => null,
                'subtotal' => $subtotalSO3,
                'discount_amount' => 0.00,
                'tax_amount' => $taxSO3,
                'cgst_amount' => 0.00,
                'sgst_amount' => 0.00,
                'igst_amount' => $igstSO3,
                'total_amount' => $totalSO3,
                'amount_paid' => 0.00,
                'balance_due' => $totalSO3,
                'payment_terms_days' => 30,
                'notes' => 'Interstate tax invoice for 12 Dining Tables + On-site assembly at Bengaluru SEZ campus',
                'approved_by' => $admin->id,
                'approved_at' => '2026-05-26 11:30:00',
                'created_by' => $manager2->id,
                'created_at' => '2026-05-25 10:00:00',
            ]
        );

        InvoiceLineItem::where('invoice_id', $inv3->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $inv3->id,
            'product_id' => $productMap['UF-DTBL-004']->id,
            'account_id' => $accountMap['4100']->id,
            'hsn_code' => '94036000',
            'description' => 'Sales Revenue: 12x Solid Oak Dining Tables',
            'quantity' => 12.00,
            'unit_price' => 18500.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 0.00,
            'cgst_amount' => 0.00,
            'sgst_rate' => 0.00,
            'sgst_amount' => 0.00,
            'igst_rate' => 18.00,
            'igst_amount' => $dtblAmt3 * 0.18,
            'tax_amount' => $dtblAmt3 * 0.18,
            'line_total' => $dtblAmt3 * 1.18,
        ]);
        InvoiceLineItem::create([
            'invoice_id' => $inv3->id,
            'product_id' => $productMap['UF-SRV-006']->id,
            'account_id' => $accountMap['4200']->id,
            'hsn_code' => '998713',
            'description' => 'Turnkey site assembly & leveling service',
            'quantity' => 1.00,
            'unit_price' => 15000.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 0.00,
            'cgst_amount' => 0.00,
            'sgst_rate' => 0.00,
            'sgst_amount' => 0.00,
            'igst_rate' => 18.00,
            'igst_amount' => $srvAmt3 * 0.18,
            'tax_amount' => $srvAmt3 * 0.18,
            'line_total' => $srvAmt3 * 1.18,
        ]);

        // INV-2026-0004: Overdue >90 days (Nimesh Pathak Turnkey Consultation) -> over_90 bucket
        $subtotalInv4 = 25000.00;
        $cgstInv4 = $subtotalInv4 * 0.09; // 2,250
        $sgstInv4 = $subtotalInv4 * 0.09; // 2,250
        $taxInv4 = $cgstInv4 + $sgstInv4;  // 4,500
        $totalInv4 = $subtotalInv4 + $taxInv4; // 29,500

        $inv4 = Invoice::updateOrCreate(
            ['invoice_number' => 'INV-2026-0004'],
            [
                'type' => 'receivable',
                'status' => 'approved',
                'reference_type' => null,
                'reference_id' => null,
                'party_type' => 'customer',
                'party_id' => $customerMap['CUST-001']->id,
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $customerMap['CUST-001']->gstin,
                'invoice_date' => '2026-04-10',
                'due_date' => '2026-05-10', // >115 days overdue -> over_90
                'payment_date' => null,
                'subtotal' => $subtotalInv4,
                'discount_amount' => 0.00,
                'tax_amount' => $taxInv4,
                'cgst_amount' => $cgstInv4,
                'sgst_amount' => $sgstInv4,
                'igst_amount' => 0.00,
                'total_amount' => $totalInv4,
                'amount_paid' => 0.00,
                'balance_due' => $totalInv4,
                'payment_terms_days' => 30,
                'notes' => 'Executive turnkey architectural layout & ergonomics site consultation fee',
                'approved_by' => $admin->id,
                'approved_at' => '2026-04-11 12:00:00',
                'created_by' => $manager->id,
                'created_at' => '2026-04-10 10:00:00',
            ]
        );

        InvoiceLineItem::where('invoice_id', $inv4->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $inv4->id,
            'product_id' => $productMap['UF-SRV-006']->id,
            'account_id' => $accountMap['4200']->id,
            'hsn_code' => '998713',
            'description' => 'Site ergonomics & floorplan architecture layout service',
            'quantity' => 1.00,
            'unit_price' => 25000.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cgstInv4,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstInv4,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxInv4,
            'line_total' => $totalInv4,
        ]);

        // INV-2026-0005: Approved, Current (Azure Corporate Interiors, due in future: Sep 27) -> current bucket
        $subtotalInv5 = 60000.00;
        $cgstInv5 = $subtotalInv5 * 0.09; // 5,400
        $sgstInv5 = $subtotalInv5 * 0.09; // 5,400
        $taxInv5 = $cgstInv5 + $sgstInv5;  // 10,800
        $totalInv5 = $subtotalInv5 + $taxInv5; // 70,800

        $inv5 = Invoice::updateOrCreate(
            ['invoice_number' => 'INV-2026-0005'],
            [
                'type' => 'receivable',
                'status' => 'approved',
                'reference_type' => SalesOrder::class,
                'reference_id' => $so4->id,
                'party_type' => 'customer',
                'party_id' => $customerMap['CUST-002']->id,
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $customerMap['CUST-002']->gstin,
                'invoice_date' => '2026-08-28',
                'due_date' => '2026-09-27', // Due in future -> current bucket
                'payment_date' => null,
                'subtotal' => $subtotalInv5,
                'discount_amount' => 0.00,
                'tax_amount' => $taxInv5,
                'cgst_amount' => $cgstInv5,
                'sgst_amount' => $sgstInv5,
                'igst_amount' => 0.00,
                'total_amount' => $totalInv5,
                'amount_paid' => 0.00,
                'balance_due' => $totalInv5,
                'payment_terms_days' => 30,
                'notes' => 'Customer invoice for partial delivery of contemporary lounge sofas',
                'approved_by' => $admin->id,
                'approved_at' => '2026-08-29 11:00:00',
                'created_by' => $manager->id,
                'created_at' => '2026-08-28 15:30:00',
            ]
        );

        InvoiceLineItem::where('invoice_id', $inv5->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $inv5->id,
            'product_id' => $productMap['UF-SOFA-003']->id,
            'account_id' => $accountMap['4100']->id,
            'hsn_code' => '94014000',
            'description' => 'Sales Revenue: 4x Contemporary Lounge Sofas',
            'quantity' => 4.00,
            'unit_price' => 15000.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cgstInv5,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstInv5,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxInv5,
            'line_total' => $totalInv5,
        ]);

        // INV-2026-0006: 31-60 days overdue (Azure Corporate Interiors) -> days_31_60 bucket
        $subtotalInv6 = 30000.00;
        $cgstInv6 = $subtotalInv6 * 0.09; // 2,700
        $sgstInv6 = $subtotalInv6 * 0.09; // 2,700
        $taxInv6 = $cgstInv6 + $sgstInv6;  // 5,400
        $totalInv6 = $subtotalInv6 + $taxInv6; // 35,400

        $inv6 = Invoice::updateOrCreate(
            ['invoice_number' => 'INV-2026-0006'],
            [
                'type' => 'receivable',
                'status' => 'approved',
                'reference_type' => null,
                'reference_id' => null,
                'party_type' => 'customer',
                'party_id' => $customerMap['CUST-002']->id,
                'place_of_supply' => 'Maharashtra (27)',
                'is_interstate' => false,
                'gstin' => $customerMap['CUST-002']->gstin,
                'invoice_date' => '2026-07-02',
                'due_date' => '2026-08-01', // ~35 days overdue -> days_31_60
                'payment_date' => null,
                'subtotal' => $subtotalInv6,
                'discount_amount' => 0.00,
                'tax_amount' => $taxInv6,
                'cgst_amount' => $cgstInv6,
                'sgst_amount' => $sgstInv6,
                'igst_amount' => 0.00,
                'total_amount' => $totalInv6,
                'amount_paid' => 0.00,
                'balance_due' => $totalInv6,
                'payment_terms_days' => 30,
                'notes' => 'Corporate office custom conference accessories & fittings',
                'approved_by' => $admin->id,
                'approved_at' => '2026-07-03 12:00:00',
                'created_by' => $manager->id,
                'created_at' => '2026-07-02 11:00:00',
            ]
        );

        InvoiceLineItem::where('invoice_id', $inv6->id)->delete();
        InvoiceLineItem::create([
            'invoice_id' => $inv6->id,
            'product_id' => null,
            'account_id' => $accountMap['4100']->id,
            'hsn_code' => '94036000',
            'description' => 'Sales Revenue: Custom conference fittings and wooden accessories',
            'quantity' => 1.00,
            'unit_price' => 30000.00,
            'discount_percent' => 0.00,
            'tax_rate' => 18.00,
            'cgst_rate' => 9.00,
            'cgst_amount' => $cgstInv6,
            'sgst_rate' => 9.00,
            'sgst_amount' => $sgstInv6,
            'igst_rate' => 0.00,
            'igst_amount' => 0.00,
            'tax_amount' => $taxInv6,
            'line_total' => $totalInv6,
        ]);

        // =========================================================================
        // 12. Seed Customer Payments Received via Bank
        // =========================================================================
        Payment::updateOrCreate(
            ['payment_number' => 'PAY-2026-0002'],
            [
                'type' => 'received',
                'invoice_id' => $inv1->id,
                'party_type' => 'customer',
                'party_id' => $customerMap['CUST-001']->id,
                'amount' => $totalSO1,
                'payment_date' => '2026-02-22',
                'payment_method' => 'bank_transfer',
                'reference_number' => 'RTGS-HDFC-881920',
                'bank_account_id' => $accountMap['1110']->id,
                'status' => 'cleared',
                'notes' => 'Full payment received from Nimesh Pathak for INV-2026-0001 (5 Office Chairs)',
                'reconciled_by' => $admin->id,
                'reconciled_at' => '2026-02-22 17:30:00',
                'created_by' => $manager->id,
                'created_at' => '2026-02-22 17:30:00',
            ]
        );

        Payment::updateOrCreate(
            ['payment_number' => 'PAY-2026-0003'],
            [
                'type' => 'received',
                'invoice_id' => $inv2->id,
                'party_type' => 'customer',
                'party_id' => $customerMap['CUST-002']->id,
                'amount' => $paidInv2,
                'payment_date' => '2026-08-01',
                'payment_method' => 'bank_transfer',
                'reference_number' => 'NEFT-ICICI-665544',
                'bank_account_id' => $accountMap['1110']->id,
                'status' => 'cleared',
                'notes' => 'Partial settlement received from Azure Corporate Interiors for INV-2026-0002',
                'reconciled_by' => $admin->id,
                'reconciled_at' => '2026-08-01 16:00:00',
                'created_by' => $manager->id,
                'created_at' => '2026-08-01 16:00:00',
            ]
        );

        // =========================================================================
        // 13. Seed Balanced General Ledger Journal Entries (Double-Entry Integrity)
        // =========================================================================

        // JE-2026-0002: Sales Tax Invoice INV-2026-0001 (Nimesh Pathak)
        $saleJE1 = JournalEntry::updateOrCreate(
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
        JournalEntryLine::where('journal_entry_id', $saleJE1->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $saleJE1->id, 'account_id' => $accountMap['1120']->id, 'account_code' => '1120', 'account_name' => 'Accounts Receivable', 'debit' => $totalSO1, 'credit' => 0.00, 'description' => 'AR Invoice INV-2026-0001', 'reference' => 'INV-2026-0001']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE1->id, 'account_id' => $accountMap['4100']->id, 'account_code' => '4100', 'account_name' => 'Sales Revenue - Urban Furniture', 'debit' => 0.00, 'credit' => $subtotalSO1, 'description' => 'Net sales income recognition', 'reference' => 'INV-2026-0001']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE1->id, 'account_id' => $accountMap['2121']->id, 'account_code' => '2121', 'account_name' => 'CGST Output Tax Payable (9%)', 'debit' => 0.00, 'credit' => $cgstSO1, 'description' => '9% Central GST Output', 'reference' => 'INV-2026-0001']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE1->id, 'account_id' => $accountMap['2122']->id, 'account_code' => '2122', 'account_name' => 'SGST Output Tax Payable (9%)', 'debit' => 0.00, 'credit' => $sgstSO1, 'description' => '9% State GST Output', 'reference' => 'INV-2026-0001']);

        // JE-2026-0003: COGS for SO-2026-0001 (5 Chairs @ 2,800 = 14,000)
        $cogsJE1 = JournalEntry::updateOrCreate(
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
        JournalEntryLine::where('journal_entry_id', $cogsJE1->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $cogsJE1->id, 'account_id' => $accountMap['5100']->id, 'account_code' => '5100', 'account_name' => 'Cost of Goods Sold (COGS)', 'debit' => 14000.00, 'credit' => 0.00, 'description' => 'COGS on 5 delivered Office Chairs', 'reference' => 'SO-2026-0001']);
        JournalEntryLine::create(['journal_entry_id' => $cogsJE1->id, 'account_id' => $accountMap['1130']->id, 'account_code' => '1130', 'account_name' => 'Inventory (Finished Furniture)', 'debit' => 0.00, 'credit' => 14000.00, 'description' => 'Inventory reduction at standard cost', 'reference' => 'SO-2026-0001']);

        // JE-2026-0004: Vendor Bill BILL-2026-0001 (Azure Furniture, Intrastate 10 Wooden Tables)
        $billJE1 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0004'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $bill1->id,
                'description' => 'Auto-Posted Vendor Bill: BILL-2026-0001 Azure Furniture (10x Wooden Tables)',
                'posting_date' => '2026-02-14',
                'fiscal_year' => 2026,
                'period' => 2,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-02-14 11:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $billJE1->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $billJE1->id, 'account_id' => $accountMap['1130']->id, 'account_code' => '1130', 'account_name' => 'Inventory (Finished Furniture)', 'debit' => $subtotalPO1, 'credit' => 0.00, 'description' => 'Stock intake 10x Wooden Tables', 'reference' => 'BILL-2026-0001']);
        JournalEntryLine::create(['journal_entry_id' => $billJE1->id, 'account_id' => $accountMap['2131']->id, 'account_code' => '2131', 'account_name' => 'CGST Input Tax Credit (9%)', 'debit' => $cgstPO1, 'credit' => 0.00, 'description' => '9% Central GST Input Credit', 'reference' => 'BILL-2026-0001']);
        JournalEntryLine::create(['journal_entry_id' => $billJE1->id, 'account_id' => $accountMap['2132']->id, 'account_code' => '2132', 'account_name' => 'SGST Input Tax Credit (9%)', 'debit' => $sgstPO1, 'credit' => 0.00, 'description' => '9% State GST Input Credit', 'reference' => 'BILL-2026-0001']);
        JournalEntryLine::create(['journal_entry_id' => $billJE1->id, 'account_id' => $accountMap['2110']->id, 'account_code' => '2110', 'account_name' => 'Accounts Payable', 'debit' => 0.00, 'credit' => $totalPO1, 'description' => 'AP liability for BILL-2026-0001', 'reference' => 'BILL-2026-0001']);

        // JE-2026-0005: Payment PAY-2026-0001 (Made to Azure Furniture for BILL-2026-0001)
        $payJE1 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0005'],
            [
                'type' => 'auto',
                'reference_type' => Payment::class,
                'reference_id' => 1,
                'description' => 'Treasury payment for PAY-2026-0001 to Azure Furniture',
                'posting_date' => '2026-02-20',
                'fiscal_year' => 2026,
                'period' => 2,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-02-20 18:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $payJE1->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $payJE1->id, 'account_id' => $accountMap['2110']->id, 'account_code' => '2110', 'account_name' => 'Accounts Payable', 'debit' => $totalPO1, 'credit' => 0.00, 'description' => 'Settlement of AP liability BILL-2026-0001', 'reference' => 'PAY-2026-0001']);
        JournalEntryLine::create(['journal_entry_id' => $payJE1->id, 'account_id' => $accountMap['1110']->id, 'account_code' => '1110', 'account_name' => 'Cash & Bank Accounts', 'debit' => 0.00, 'credit' => $totalPO1, 'description' => 'HDFC Bank disbursement', 'reference' => 'PAY-2026-0001']);

        // JE-2026-0006: Payment PAY-2026-0002 (Received from Nimesh Pathak for INV-2026-0001)
        $payJE2 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0006'],
            [
                'type' => 'auto',
                'reference_type' => Payment::class,
                'reference_id' => 2,
                'description' => 'Treasury receipt for PAY-2026-0002 from Nimesh Pathak',
                'posting_date' => '2026-02-22',
                'fiscal_year' => 2026,
                'period' => 2,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-02-22 17:30:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $payJE2->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $payJE2->id, 'account_id' => $accountMap['1110']->id, 'account_code' => '1110', 'account_name' => 'Cash & Bank Accounts', 'debit' => $totalSO1, 'credit' => 0.00, 'description' => 'HDFC Bank deposit from customer', 'reference' => 'PAY-2026-0002']);
        JournalEntryLine::create(['journal_entry_id' => $payJE2->id, 'account_id' => $accountMap['1120']->id, 'account_code' => '1120', 'account_name' => 'Accounts Receivable', 'debit' => 0.00, 'credit' => $totalSO1, 'description' => 'Clearance of AR invoice INV-2026-0001', 'reference' => 'PAY-2026-0002']);

        // JE-2026-0007: Vendor Bill BILL-2026-0002 (Open Wood Furnishings, Interstate 18% IGST)
        $billJE2 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0007'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $bill2->id,
                'description' => 'Auto-Posted Vendor Bill: BILL-2026-0002 Open Wood Furnishings (Interstate IGST)',
                'posting_date' => '2026-06-25',
                'fiscal_year' => 2026,
                'period' => 6,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-06-25 12:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $billJE2->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $billJE2->id, 'account_id' => $accountMap['1130']->id, 'account_code' => '1130', 'account_name' => 'Inventory (Finished Furniture)', 'debit' => $subtotalPO2, 'credit' => 0.00, 'description' => 'Stock intake 15x Dining Tables', 'reference' => 'BILL-2026-0002']);
        JournalEntryLine::create(['journal_entry_id' => $billJE2->id, 'account_id' => $accountMap['2133']->id, 'account_code' => '2133', 'account_name' => 'IGST Input Tax Credit (18%)', 'debit' => $igstPO2, 'credit' => 0.00, 'description' => '18% Integrated GST Input Credit', 'reference' => 'BILL-2026-0002']);
        JournalEntryLine::create(['journal_entry_id' => $billJE2->id, 'account_id' => $accountMap['2110']->id, 'account_code' => '2110', 'account_name' => 'Accounts Payable', 'debit' => 0.00, 'credit' => $totalPO2, 'description' => 'AP liability for BILL-2026-0002', 'reference' => 'BILL-2026-0002']);

        // JE-2026-0008: Payment PAY-2026-0004 (Partial payment to Open Wood Furnishings)
        $payJE4 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0008'],
            [
                'type' => 'auto',
                'reference_type' => Payment::class,
                'reference_id' => 4,
                'description' => 'Treasury payment for PAY-2026-0004 to Open Wood Furnishings',
                'posting_date' => '2026-07-20',
                'fiscal_year' => 2026,
                'period' => 7,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-07-20 16:30:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $payJE4->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $payJE4->id, 'account_id' => $accountMap['2110']->id, 'account_code' => '2110', 'account_name' => 'Accounts Payable', 'debit' => $paidBill2, 'credit' => 0.00, 'description' => 'Partial settlement of BILL-2026-0002', 'reference' => 'PAY-2026-0004']);
        JournalEntryLine::create(['journal_entry_id' => $payJE4->id, 'account_id' => $accountMap['1110']->id, 'account_code' => '1110', 'account_name' => 'Cash & Bank Accounts', 'debit' => 0.00, 'credit' => $paidBill2, 'description' => 'Bank RTGS wire transfer', 'reference' => 'PAY-2026-0004']);

        // JE-2026-0009: Sales Tax Invoice INV-2026-0002 (Azure Corporate Interiors)
        $saleJE2 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0009'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $inv2->id,
                'description' => 'Auto-Posted Sales Tax Invoice: INV-2026-0002 Azure Corporate Interiors',
                'posting_date' => '2026-07-15',
                'fiscal_year' => 2026,
                'period' => 7,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-07-15 12:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $saleJE2->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $saleJE2->id, 'account_id' => $accountMap['1120']->id, 'account_code' => '1120', 'account_name' => 'Accounts Receivable', 'debit' => $totalSO2, 'credit' => 0.00, 'description' => 'AR Invoice INV-2026-0002', 'reference' => 'INV-2026-0002']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE2->id, 'account_id' => $accountMap['4100']->id, 'account_code' => '4100', 'account_name' => 'Sales Revenue - Urban Furniture', 'debit' => 0.00, 'credit' => $subtotalSO2, 'description' => 'Net sales income recognition (8 Chairs + 4 Tables)', 'reference' => 'INV-2026-0002']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE2->id, 'account_id' => $accountMap['2121']->id, 'account_code' => '2121', 'account_name' => 'CGST Output Tax Payable (9%)', 'debit' => 0.00, 'credit' => $cgstSO2, 'description' => '9% Central GST Output', 'reference' => 'INV-2026-0002']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE2->id, 'account_id' => $accountMap['2122']->id, 'account_code' => '2122', 'account_name' => 'SGST Output Tax Payable (9%)', 'debit' => 0.00, 'credit' => $sgstSO2, 'description' => '9% State GST Output', 'reference' => 'INV-2026-0002']);

        // JE-2026-0010: COGS for SO-2026-0002 (8 Chairs @ 2,800 = 22,400 + 4 Tables @ 7,500 = 30,000 -> Total: 52,400)
        $cogsAmt2 = 52400.00;
        $cogsJE2 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0010'],
            [
                'type' => 'auto',
                'reference_type' => SalesOrder::class,
                'reference_id' => $so2->id,
                'description' => 'COGS & Inventory relief for delivered SO-2026-0002 (8 Chairs + 4 Tables)',
                'posting_date' => '2026-07-15',
                'fiscal_year' => 2026,
                'period' => 7,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-07-15 15:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $cogsJE2->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $cogsJE2->id, 'account_id' => $accountMap['5100']->id, 'account_code' => '5100', 'account_name' => 'Cost of Goods Sold (COGS)', 'debit' => $cogsAmt2, 'credit' => 0.00, 'description' => 'COGS on delivered SO-2026-0002', 'reference' => 'SO-2026-0002']);
        JournalEntryLine::create(['journal_entry_id' => $cogsJE2->id, 'account_id' => $accountMap['1130']->id, 'account_code' => '1130', 'account_name' => 'Inventory (Finished Furniture)', 'debit' => 0.00, 'credit' => $cogsAmt2, 'description' => 'Stock inventory reduction', 'reference' => 'SO-2026-0002']);

        // JE-2026-0011: Payment PAY-2026-0003 (Received from Azure Corporate Interiors for INV-2026-0002)
        $payJE3 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0011'],
            [
                'type' => 'auto',
                'reference_type' => Payment::class,
                'reference_id' => 3,
                'description' => 'Treasury receipt for PAY-2026-0003 from Azure Corporate Interiors',
                'posting_date' => '2026-08-01',
                'fiscal_year' => 2026,
                'period' => 8,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-08-01 16:30:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $payJE3->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $payJE3->id, 'account_id' => $accountMap['1110']->id, 'account_code' => '1110', 'account_name' => 'Cash & Bank Accounts', 'debit' => $paidInv2, 'credit' => 0.00, 'description' => 'Bank receipt from customer', 'reference' => 'PAY-2026-0003']);
        JournalEntryLine::create(['journal_entry_id' => $payJE3->id, 'account_id' => $accountMap['1120']->id, 'account_code' => '1120', 'account_name' => 'Accounts Receivable', 'debit' => 0.00, 'credit' => $paidInv2, 'description' => 'Partial clearance of AR INV-2026-0002', 'reference' => 'PAY-2026-0003']);

        // JE-2026-0012: Sales Tax Invoice INV-2026-0003 (Greenfield Tech, Interstate 18% IGST)
        $saleJE3 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0012'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $inv3->id,
                'description' => 'Auto-Posted Sales Tax Invoice: INV-2026-0003 Greenfield Tech (Interstate IGST)',
                'posting_date' => '2026-07-01',
                'fiscal_year' => 2026,
                'period' => 7,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-07-01 14:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $saleJE3->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $saleJE3->id, 'account_id' => $accountMap['1120']->id, 'account_code' => '1120', 'account_name' => 'Accounts Receivable', 'debit' => $totalSO3, 'credit' => 0.00, 'description' => 'AR Invoice INV-2026-0003', 'reference' => 'INV-2026-0003']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE3->id, 'account_id' => $accountMap['4100']->id, 'account_code' => '4100', 'account_name' => 'Sales Revenue - Urban Furniture', 'debit' => 0.00, 'credit' => $dtblAmt3, 'description' => 'Product sales revenue (12 Dining Tables)', 'reference' => 'INV-2026-0003']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE3->id, 'account_id' => $accountMap['4200']->id, 'account_code' => '4200', 'account_name' => 'Installation & Site Services', 'debit' => 0.00, 'credit' => $srvAmt3, 'description' => 'Turnkey installation service revenue', 'reference' => 'INV-2026-0003']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE3->id, 'account_id' => $accountMap['2123']->id, 'account_code' => '2123', 'account_name' => 'IGST Output Tax Payable (18%)', 'debit' => 0.00, 'credit' => $igstSO3, 'description' => '18% Integrated GST Output', 'reference' => 'INV-2026-0003']);

        // JE-2026-0013: COGS for SO-2026-0003 (12 Dining Tables @ 11,000 = 132,000)
        $cogsAmt3 = 132000.00;
        $cogsJE3 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0013'],
            [
                'type' => 'auto',
                'reference_type' => SalesOrder::class,
                'reference_id' => $so3->id,
                'description' => 'COGS & Inventory relief for delivered SO-2026-0003 (12 Dining Tables)',
                'posting_date' => '2026-07-20',
                'fiscal_year' => 2026,
                'period' => 7,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-07-20 16:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $cogsJE3->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $cogsJE3->id, 'account_id' => $accountMap['5100']->id, 'account_code' => '5100', 'account_name' => 'Cost of Goods Sold (COGS)', 'debit' => $cogsAmt3, 'credit' => 0.00, 'description' => 'COGS on 12 delivered Dining Tables', 'reference' => 'SO-2026-0003']);
        JournalEntryLine::create(['journal_entry_id' => $cogsJE3->id, 'account_id' => $accountMap['1130']->id, 'account_code' => '1130', 'account_name' => 'Inventory (Finished Furniture)', 'debit' => 0.00, 'credit' => $cogsAmt3, 'description' => 'Stock inventory reduction', 'reference' => 'SO-2026-0003']);

        // JE-2026-0014: Sales Tax Invoice INV-2026-0004 (Nimesh Pathak Turnkey Consultation)
        $saleJE4 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0014'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $inv4->id,
                'description' => 'Auto-Posted Sales Tax Invoice: INV-2026-0004 Nimesh Pathak (Site Consultation)',
                'posting_date' => '2026-04-10',
                'fiscal_year' => 2026,
                'period' => 4,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-04-10 11:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $saleJE4->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $saleJE4->id, 'account_id' => $accountMap['1120']->id, 'account_code' => '1120', 'account_name' => 'Accounts Receivable', 'debit' => $totalInv4, 'credit' => 0.00, 'description' => 'AR Invoice INV-2026-0004', 'reference' => 'INV-2026-0004']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE4->id, 'account_id' => $accountMap['4200']->id, 'account_code' => '4200', 'account_name' => 'Installation & Site Services', 'debit' => 0.00, 'credit' => $subtotalInv4, 'description' => 'Site consultation service revenue', 'reference' => 'INV-2026-0004']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE4->id, 'account_id' => $accountMap['2121']->id, 'account_code' => '2121', 'account_name' => 'CGST Output Tax Payable (9%)', 'debit' => 0.00, 'credit' => $cgstInv4, 'description' => '9% Central GST Output', 'reference' => 'INV-2026-0004']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE4->id, 'account_id' => $accountMap['2122']->id, 'account_code' => '2122', 'account_name' => 'SGST Output Tax Payable (9%)', 'debit' => 0.00, 'credit' => $sgstInv4, 'description' => '9% State GST Output', 'reference' => 'INV-2026-0004']);

        // JE-2026-0015: Sales Tax Invoice INV-2026-0005 (Azure Corporate Interiors, Partial Sofas)
        $saleJE5 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0015'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $inv5->id,
                'description' => 'Auto-Posted Sales Tax Invoice: INV-2026-0005 Azure Corporate Interiors (Sofas)',
                'posting_date' => '2026-08-28',
                'fiscal_year' => 2026,
                'period' => 8,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-08-28 16:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $saleJE5->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $saleJE5->id, 'account_id' => $accountMap['1120']->id, 'account_code' => '1120', 'account_name' => 'Accounts Receivable', 'debit' => $totalInv5, 'credit' => 0.00, 'description' => 'AR Invoice INV-2026-0005', 'reference' => 'INV-2026-0005']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE5->id, 'account_id' => $accountMap['4100']->id, 'account_code' => '4100', 'account_name' => 'Sales Revenue - Urban Furniture', 'debit' => 0.00, 'credit' => $subtotalInv5, 'description' => 'Net sales income recognition (4x Sofas)', 'reference' => 'INV-2026-0005']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE5->id, 'account_id' => $accountMap['2121']->id, 'account_code' => '2121', 'account_name' => 'CGST Output Tax Payable (9%)', 'debit' => 0.00, 'credit' => $cgstInv5, 'description' => '9% Central GST Output', 'reference' => 'INV-2026-0005']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE5->id, 'account_id' => $accountMap['2122']->id, 'account_code' => '2122', 'account_name' => 'SGST Output Tax Payable (9%)', 'debit' => 0.00, 'credit' => $sgstInv5, 'description' => '9% State GST Output', 'reference' => 'INV-2026-0005']);

        // JE-2026-0016: Vendor Bill BILL-2026-0003 (Rahul Sharma Timber Crafts for Sofas)
        $billJE3 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0016'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $bill3->id,
                'description' => 'Auto-Posted Vendor Bill: BILL-2026-0003 Rahul Sharma Timber Crafts (10x Sofas)',
                'posting_date' => '2026-08-18',
                'fiscal_year' => 2026,
                'period' => 8,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-08-18 12:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $billJE3->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $billJE3->id, 'account_id' => $accountMap['1130']->id, 'account_code' => '1130', 'account_name' => 'Inventory (Finished Furniture)', 'debit' => $subtotalPO3, 'credit' => 0.00, 'description' => 'Stock intake 10x Sofas', 'reference' => 'BILL-2026-0003']);
        JournalEntryLine::create(['journal_entry_id' => $billJE3->id, 'account_id' => $accountMap['2131']->id, 'account_code' => '2131', 'account_name' => 'CGST Input Tax Credit (9%)', 'debit' => $cgstPO3, 'credit' => 0.00, 'description' => '9% Central GST Input Credit', 'reference' => 'BILL-2026-0003']);
        JournalEntryLine::create(['journal_entry_id' => $billJE3->id, 'account_id' => $accountMap['2132']->id, 'account_code' => '2132', 'account_name' => 'SGST Input Tax Credit (9%)', 'debit' => $sgstPO3, 'credit' => 0.00, 'description' => '9% State GST Input Credit', 'reference' => 'BILL-2026-0003']);
        JournalEntryLine::create(['journal_entry_id' => $billJE3->id, 'account_id' => $accountMap['2110']->id, 'account_code' => '2110', 'account_name' => 'Accounts Payable', 'debit' => 0.00, 'credit' => $totalPO3, 'description' => 'AP liability for BILL-2026-0003', 'reference' => 'BILL-2026-0003']);

        // JE-2026-0017: Vendor Bill BILL-2026-0004 (Azure Furniture Timber Logistics & Raw Timber)
        $billJE4 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0017'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $bill4->id,
                'description' => 'Auto-Posted Vendor Bill: BILL-2026-0004 Azure Furniture (Kiln Seasoning & Timber)',
                'posting_date' => '2026-03-15',
                'fiscal_year' => 2026,
                'period' => 3,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-03-15 11:30:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $billJE4->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $billJE4->id, 'account_id' => $accountMap['1130']->id, 'account_code' => '1130', 'account_name' => 'Inventory (Finished Furniture)', 'debit' => $subtotalBill4, 'credit' => 0.00, 'description' => 'Hardwood raw material inventory', 'reference' => 'BILL-2026-0004']);
        JournalEntryLine::create(['journal_entry_id' => $billJE4->id, 'account_id' => $accountMap['2131']->id, 'account_code' => '2131', 'account_name' => 'CGST Input Tax Credit (9%)', 'debit' => $cgstBill4, 'credit' => 0.00, 'description' => '9% Central GST Input Credit', 'reference' => 'BILL-2026-0004']);
        JournalEntryLine::create(['journal_entry_id' => $billJE4->id, 'account_id' => $accountMap['2132']->id, 'account_code' => '2132', 'account_name' => 'SGST Input Tax Credit (9%)', 'debit' => $sgstBill4, 'credit' => 0.00, 'description' => '9% State GST Input Credit', 'reference' => 'BILL-2026-0004']);
        JournalEntryLine::create(['journal_entry_id' => $billJE4->id, 'account_id' => $accountMap['2110']->id, 'account_code' => '2110', 'account_name' => 'Accounts Payable', 'debit' => 0.00, 'credit' => $totalBill4, 'description' => 'AP liability for BILL-2026-0004', 'reference' => 'BILL-2026-0004']);

        // JE-2026-0018: Vendor Bill BILL-2026-0005 (Open Wood Furnishings - Interstate IGST Planks)
        $billJE5 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0018'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $bill5->id,
                'description' => 'Auto-Posted Vendor Bill: BILL-2026-0005 Open Wood Furnishings (Interstate Planks)',
                'posting_date' => '2026-06-15',
                'fiscal_year' => 2026,
                'period' => 6,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-06-15 12:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $billJE5->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $billJE5->id, 'account_id' => $accountMap['1130']->id, 'account_code' => '1130', 'account_name' => 'Inventory (Finished Furniture)', 'debit' => $subtotalBill5, 'credit' => 0.00, 'description' => 'Hardwood raw material inventory', 'reference' => 'BILL-2026-0005']);
        JournalEntryLine::create(['journal_entry_id' => $billJE5->id, 'account_id' => $accountMap['2133']->id, 'account_code' => '2133', 'account_name' => 'IGST Input Tax Credit (18%)', 'debit' => $igstBill5, 'credit' => 0.00, 'description' => '18% Integrated GST Input Credit', 'reference' => 'BILL-2026-0005']);
        JournalEntryLine::create(['journal_entry_id' => $billJE5->id, 'account_id' => $accountMap['2110']->id, 'account_code' => '2110', 'account_name' => 'Accounts Payable', 'debit' => 0.00, 'credit' => $totalBill5, 'description' => 'AP liability for BILL-2026-0005', 'reference' => 'BILL-2026-0005']);

        // JE-2026-0019: Operating Expense - Freight & Heavy Logistics
        $freightJE = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0019'],
            [
                'type' => 'manual',
                'description' => 'Quarterly heavy transport and site logistics expenses for urban furniture deliveries',
                'posting_date' => '2026-07-28',
                'fiscal_year' => 2026,
                'period' => 7,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-07-28 17:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $freightJE->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $freightJE->id, 'account_id' => $accountMap['5200']->id, 'account_code' => '5200', 'account_name' => 'Freight & Logistics Expense', 'debit' => 28500.00, 'credit' => 0.00, 'description' => 'Dedicated flatbed logistics and municipal site freight', 'reference' => 'FREIGHT-Q2-2026']);
        JournalEntryLine::create(['journal_entry_id' => $freightJE->id, 'account_id' => $accountMap['1110']->id, 'account_code' => '1110', 'account_name' => 'Cash & Bank Accounts', 'debit' => 0.00, 'credit' => 28500.00, 'description' => 'Bank direct disbursement', 'reference' => 'FREIGHT-Q2-2026']);

        // JE-2026-0020: Operating Expense - Administrative Overhead & Showroom Facilities
        $adminJE = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0020'],
            [
                'type' => 'manual',
                'description' => 'Administrative overhead, showroom maintenance, and workshop facility power',
                'posting_date' => '2026-08-30',
                'fiscal_year' => 2026,
                'period' => 8,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-08-30 18:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $adminJE->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $adminJE->id, 'account_id' => $accountMap['5400']->id, 'account_code' => '5400', 'account_name' => 'Administrative & Facility Costs', 'debit' => 42000.00, 'credit' => 0.00, 'description' => 'Facility electricity, high-voltage workshop power, and office supplies', 'reference' => 'ADMIN-AUG-2026']);
        JournalEntryLine::create(['journal_entry_id' => $adminJE->id, 'account_id' => $accountMap['1110']->id, 'account_code' => '1110', 'account_name' => 'Cash & Bank Accounts', 'debit' => 0.00, 'credit' => 42000.00, 'description' => 'Bank payment for facility overhead', 'reference' => 'ADMIN-AUG-2026']);

        // JE-2026-0021: Non-Cash Expense - Quarterly Depreciation on Showroom Machinery & Equipment
        $deprJE = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0021'],
            [
                'type' => 'manual',
                'description' => 'Quarterly straight-line depreciation for fabrication tooling and showroom equipment',
                'posting_date' => '2026-06-30',
                'fiscal_year' => 2026,
                'period' => 6,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-06-30 18:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $deprJE->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $deprJE->id, 'account_id' => $accountMap['5400']->id, 'account_code' => '5400', 'account_name' => 'Administrative & Facility Costs', 'debit' => 25000.00, 'credit' => 0.00, 'description' => 'Q1-Q2 equipment depreciation expense', 'reference' => 'DEPR-Q2-2026']);
        JournalEntryLine::create(['journal_entry_id' => $deprJE->id, 'account_id' => $accountMap['1220']->id, 'account_code' => '1220', 'account_name' => 'Accumulated Depreciation', 'debit' => 0.00, 'credit' => 25000.00, 'description' => 'Accumulated depreciation reserve addition', 'reference' => 'DEPR-Q2-2026']);

        // JE-2026-0022: Auto-Posted Sales Tax Invoice: INV-2026-0006 (Azure Corporate Interiors)
        $saleJE6 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0022'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $inv6->id,
                'description' => 'Auto-Posted Sales Tax Invoice: INV-2026-0006 Azure Corporate Interiors (Conference Fittings)',
                'posting_date' => '2026-07-02',
                'fiscal_year' => 2026,
                'period' => 7,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-07-02 12:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $saleJE6->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $saleJE6->id, 'account_id' => $accountMap['1120']->id, 'account_code' => '1120', 'account_name' => 'Accounts Receivable', 'debit' => $totalInv6, 'credit' => 0.00, 'description' => 'AR Invoice INV-2026-0006', 'reference' => 'INV-2026-0006']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE6->id, 'account_id' => $accountMap['4100']->id, 'account_code' => '4100', 'account_name' => 'Sales Revenue - Urban Furniture', 'debit' => 0.00, 'credit' => $subtotalInv6, 'description' => 'Conference accessories sales revenue', 'reference' => 'INV-2026-0006']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE6->id, 'account_id' => $accountMap['2121']->id, 'account_code' => '2121', 'account_name' => 'CGST Output Tax Payable (9%)', 'debit' => 0.00, 'credit' => $cgstInv6, 'description' => '9% Central GST Output', 'reference' => 'INV-2026-0006']);
        JournalEntryLine::create(['journal_entry_id' => $saleJE6->id, 'account_id' => $accountMap['2122']->id, 'account_code' => '2122', 'account_name' => 'SGST Output Tax Payable (9%)', 'debit' => 0.00, 'credit' => $sgstInv6, 'description' => '9% State GST Output', 'reference' => 'INV-2026-0006']);

        // JE-2026-0023: Auto-Posted Vendor Bill: BILL-2026-0006 (Rahul Sharma Timber Crafts)
        $billJE6 = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0023'],
            [
                'type' => 'auto',
                'reference_type' => Invoice::class,
                'reference_id' => $bill6->id,
                'description' => 'Auto-Posted Vendor Bill: BILL-2026-0006 Rahul Sharma Timber Crafts (Joinery & Components)',
                'posting_date' => '2026-07-02',
                'fiscal_year' => 2026,
                'period' => 7,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-07-02 12:30:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $billJE6->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $billJE6->id, 'account_id' => $accountMap['1130']->id, 'account_code' => '1130', 'account_name' => 'Inventory (Finished Furniture)', 'debit' => $subtotalBill6, 'credit' => 0.00, 'description' => 'Timber joinery and component inventory intake', 'reference' => 'BILL-2026-0006']);
        JournalEntryLine::create(['journal_entry_id' => $billJE6->id, 'account_id' => $accountMap['2131']->id, 'account_code' => '2131', 'account_name' => 'CGST Input Tax Credit (9%)', 'debit' => $cgstBill6, 'credit' => 0.00, 'description' => '9% Central GST Input Credit', 'reference' => 'BILL-2026-0006']);
        JournalEntryLine::create(['journal_entry_id' => $billJE6->id, 'account_id' => $accountMap['2132']->id, 'account_code' => '2132', 'account_name' => 'SGST Input Tax Credit (9%)', 'debit' => $sgstBill6, 'credit' => 0.00, 'description' => '9% State GST Input Credit', 'reference' => 'BILL-2026-0006']);
        JournalEntryLine::create(['journal_entry_id' => $billJE6->id, 'account_id' => $accountMap['2110']->id, 'account_code' => '2110', 'account_name' => 'Accounts Payable', 'debit' => 0.00, 'credit' => $totalBill6, 'description' => 'AP liability for BILL-2026-0006', 'reference' => 'BILL-2026-0006']);

        // JE-2026-0024: Commercial Early Settlement Discount Allowed (Contra-Revenue)
        $discJE = JournalEntry::updateOrCreate(
            ['entry_number' => 'JE-2026-0024'],
            [
                'type' => 'manual',
                'description' => 'Commercial settlement discount allowed on corporate deliveries',
                'posting_date' => '2026-07-15',
                'fiscal_year' => 2026,
                'period' => 7,
                'status' => 'posted',
                'posted_by' => $admin->id,
                'posted_at' => '2026-07-15 14:00:00',
                'created_by' => $admin->id,
            ]
        );
        JournalEntryLine::where('journal_entry_id', $discJE->id)->delete();
        JournalEntryLine::create(['journal_entry_id' => $discJE->id, 'account_id' => $accountMap['4300']->id, 'account_code' => '4300', 'account_name' => 'Discounts Allowed', 'debit' => 12500.00, 'credit' => 0.00, 'description' => 'Volume customer early payment discount', 'reference' => 'DISC-2026-0001']);
        JournalEntryLine::create(['journal_entry_id' => $discJE->id, 'account_id' => $accountMap['1120']->id, 'account_code' => '1120', 'account_name' => 'Accounts Receivable', 'debit' => 0.00, 'credit' => 12500.00, 'description' => 'Receivable reduction for early settlement discount', 'reference' => 'DISC-2026-0001']);

        // JE-2026-0025: Miscellaneous Operating & Incidental Workshop Costs
        $otherExpAcc = Account::where('code', '5002')->first();
        if ($otherExpAcc) {
            $miscJE = JournalEntry::updateOrCreate(
                ['entry_number' => 'JE-2026-0025'],
                [
                    'type' => 'manual',
                    'description' => 'Incidental fabrication plant consumables and safety gear',
                    'posting_date' => '2026-07-20',
                    'fiscal_year' => 2026,
                    'period' => 7,
                    'status' => 'posted',
                    'posted_by' => $admin->id,
                    'posted_at' => '2026-07-20 16:00:00',
                    'created_by' => $admin->id,
                ]
            );
            JournalEntryLine::where('journal_entry_id', $miscJE->id)->delete();
            JournalEntryLine::create(['journal_entry_id' => $miscJE->id, 'account_id' => $otherExpAcc->id, 'account_code' => '5002', 'account_name' => 'Other Expense A/c', 'debit' => 18000.00, 'credit' => 0.00, 'description' => 'Workshop safety equipment and consumables', 'reference' => 'MISC-2026-0001']);
            JournalEntryLine::create(['journal_entry_id' => $miscJE->id, 'account_id' => $accountMap['1110']->id, 'account_code' => '1110', 'account_name' => 'Cash & Bank Accounts', 'debit' => 0.00, 'credit' => 18000.00, 'description' => 'Direct payment from checking account', 'reference' => 'MISC-2026-0001']);
        }

        // =========================================================================
        // 14. Seed Idempotent Inventory Movements across All 7 Master Products
        // =========================================================================
        $movementsData = [
            // 1. UF-TBL-002: Purchase intake from PO-2026-0001
            [
                'product_id' => $productMap['UF-TBL-002']->id,
                'type' => 'purchase',
                'quantity' => 10.00,
                'unit_cost' => 7500.00,
                'total_value' => 75000.00,
                'reference_type' => PurchaseOrder::class,
                'reference_id' => $po1->id,
                'notes' => 'Wooden Tables received against PO-2026-0001 from Azure Furniture',
                'performed_by' => $manager->id,
            ],
            // 2. UF-CHAIR-001: Delivery fulfillment for SO-2026-0001
            [
                'product_id' => $productMap['UF-CHAIR-001']->id,
                'type' => 'sale',
                'quantity' => -5.00,
                'unit_cost' => 2800.00,
                'total_value' => -14000.00,
                'reference_type' => SalesOrder::class,
                'reference_id' => $so1->id,
                'notes' => 'Delivery fulfillment for SO-2026-0001 to Nimesh Pathak (5x Office Chairs)',
                'performed_by' => $manager->id,
            ],
            // 3. UF-CHAIR-001: Delivery fulfillment for SO-2026-0002
            [
                'product_id' => $productMap['UF-CHAIR-001']->id,
                'type' => 'sale',
                'quantity' => -8.00,
                'unit_cost' => 2800.00,
                'total_value' => -22400.00,
                'reference_type' => SalesOrder::class,
                'reference_id' => $so2->id,
                'notes' => 'Delivery fulfillment for SO-2026-0002 to Azure Corporate Interiors (8x Office Chairs)',
                'performed_by' => $manager->id,
            ],
            // 4. UF-TBL-002: Delivery fulfillment for SO-2026-0002
            [
                'product_id' => $productMap['UF-TBL-002']->id,
                'type' => 'sale',
                'quantity' => -4.00,
                'unit_cost' => 7500.00,
                'total_value' => -30000.00,
                'reference_type' => SalesOrder::class,
                'reference_id' => $so2->id,
                'notes' => 'Delivery fulfillment for SO-2026-0002 to Azure Corporate Interiors (4x Wooden Tables)',
                'performed_by' => $manager->id,
            ],
            // 5. UF-DTBL-004: Bulk interstate intake from PO-2026-0002
            [
                'product_id' => $productMap['UF-DTBL-004']->id,
                'type' => 'purchase',
                'quantity' => 15.00,
                'unit_cost' => 11000.00,
                'total_value' => 165000.00,
                'reference_type' => PurchaseOrder::class,
                'reference_id' => $po2->id,
                'notes' => 'Solid Oak Dining Tables received against PO-2026-0002 from Open Wood Furnishings',
                'performed_by' => $manager2->id,
            ],
            // 6. UF-DTBL-004: Delivery fulfillment for SO-2026-0003
            [
                'product_id' => $productMap['UF-DTBL-004']->id,
                'type' => 'sale',
                'quantity' => -12.00,
                'unit_cost' => 11000.00,
                'total_value' => -132000.00,
                'reference_type' => SalesOrder::class,
                'reference_id' => $so3->id,
                'notes' => 'Delivery fulfillment for SO-2026-0003 to Greenfield Tech (12x Dining Tables)',
                'performed_by' => $manager2->id,
            ],
            // 7. UF-SOFA-003: Purchase intake from PO-2026-0003
            [
                'product_id' => $productMap['UF-SOFA-003']->id,
                'type' => 'purchase',
                'quantity' => 10.00,
                'unit_cost' => 16000.00,
                'total_value' => 160000.00,
                'reference_type' => PurchaseOrder::class,
                'reference_id' => $po3->id,
                'notes' => 'Lounge Sofas received against PO-2026-0003 from Rahul Sharma Timber Crafts',
                'performed_by' => $manager->id,
            ],
            // 8. UF-SOFA-003: Partial delivery fulfillment for SO-2026-0004
            [
                'product_id' => $productMap['UF-SOFA-003']->id,
                'type' => 'sale',
                'quantity' => -4.00,
                'unit_cost' => 16000.00,
                'total_value' => -64000.00,
                'reference_type' => SalesOrder::class,
                'reference_id' => $so4->id,
                'notes' => 'Delivery fulfillment for SO-2026-0004 to Azure Corporate Interiors (4x Sofas)',
                'performed_by' => $clerk->id,
            ],
            // 9. UF-WCHAIR-005: Workshop production completion intake
            [
                'product_id' => $productMap['UF-WCHAIR-005']->id,
                'type' => 'adjustment',
                'quantity' => 20.00,
                'unit_cost' => 1900.00,
                'total_value' => 38000.00,
                'reference_type' => 'production_batch',
                'reference_id' => 101,
                'notes' => 'Batch completion: 20 handcrafted cushioned wooden chairs added to inventory',
                'performed_by' => $clerk->id,
            ],
            // 10. UF-WCHAIR-005: Delivery fulfillment for SO-2026-0005
            [
                'product_id' => $productMap['UF-WCHAIR-005']->id,
                'type' => 'sale',
                'quantity' => -15.00,
                'unit_cost' => 1900.00,
                'total_value' => -28500.00,
                'reference_type' => SalesOrder::class,
                'reference_id' => $so5->id,
                'notes' => 'First dispatch batch for SO-2026-0005 to Greenfield Tech (15x Wooden Chairs)',
                'performed_by' => $clerk->id,
            ],
            // 11. UF-SRV-006: Turnkey installation service delivery
            [
                'product_id' => $productMap['UF-SRV-006']->id,
                'type' => 'sale',
                'quantity' => -1.00,
                'unit_cost' => 500.00,
                'total_value' => -500.00,
                'reference_type' => SalesOrder::class,
                'reference_id' => $so3->id,
                'notes' => 'On-site installation completed for Greenfield Tech SEZ cafeteria',
                'performed_by' => $manager2->id,
            ],
            // 12. UF-CMB-007: Combo unit dispatch for SO-2026-0004
            [
                'product_id' => $productMap['UF-CMB-007']->id,
                'type' => 'sale',
                'quantity' => -2.00,
                'unit_cost' => 9500.00,
                'total_value' => -19000.00,
                'reference_type' => SalesOrder::class,
                'reference_id' => $so4->id,
                'notes' => 'Executive Office Suite Combos (2 sets) delivered to Azure Corporate Interiors',
                'performed_by' => $clerk->id,
            ],
        ];

        foreach ($movementsData as $m) {
            InventoryMovement::updateOrCreate(
                [
                    'product_id' => $m['product_id'],
                    'type' => $m['type'],
                    'reference_type' => $m['reference_type'],
                    'reference_id' => $m['reference_id'],
                ],
                $m
            );
        }

        // =========================================================================
        // 15. Seed Items Table (Work Items & Action Items across Roles & Statuses)
        // =========================================================================
        $itemsData = [
            [
                'user_id' => $manager->id,
                'title' => 'Quarterly Showroom Equipment Calibration & Audit',
                'description' => 'Inspect precision wood cutting and joinery equipment in main showroom for annual calibration certification.',
                'status' => 'completed',
                'priority' => 'high',
            ],
            [
                'user_id' => $admin->id,
                'title' => 'Verify Karnataka Interstate Tax Rates on Portal',
                'description' => 'Verify HSN 94036000 and 94018000 IGST rates against updated GST portal notification before Q3 filings.',
                'status' => 'completed',
                'priority' => 'medium',
            ],
            [
                'user_id' => $manager2->id,
                'title' => 'Follow up with Azure Corporate Interiors on INV-2026-0002 balance',
                'description' => 'Coordinate with finance contact Harish Iyer for pending settlement of ₹49,120 against 8 Chairs + 4 Tables delivery.',
                'status' => 'in_progress',
                'priority' => 'high',
            ],
            [
                'user_id' => $clerk->id,
                'title' => 'Reconcile Bengaluru Logistics Freight Consignment Notes',
                'description' => 'Cross check transporter consignment notes with PO-2026-0002 teak delivery logs and fuel surcharges.',
                'status' => 'in_progress',
                'priority' => 'medium',
            ],
            [
                'user_id' => $clerk->id,
                'title' => 'Physically verify warehouse stock for UF-SOFA-003',
                'description' => 'Count raw framing structures and finished 3-seater lounge units before month-end closing.',
                'status' => 'in_progress',
                'priority' => 'low',
            ],
            [
                'user_id' => $admin->id,
                'title' => 'Prepare FY27 Capital Expenditure Budget for New CNC Lathe',
                'description' => 'Draft projections for high-grade automated woodworking lathe machine and dust extraction system for factory.',
                'status' => 'pending',
                'priority' => 'high',
            ],
            [
                'user_id' => $user->id,
                'title' => 'Review Greenfield Tech Corporate Delivery Sign-off Documents',
                'description' => 'Obtain client receipt seal on commercial park delivery challans for 12 Teak Dining Tables.',
                'status' => 'pending',
                'priority' => 'medium',
            ],
            [
                'user_id' => $manager->id,
                'title' => 'Setup automatic payment reminders for aging customer accounts',
                'description' => 'Configure system alerts for customer receivable accounts past 30 days due date threshold.',
                'status' => 'pending',
                'priority' => 'low',
            ],
        ];

        foreach ($itemsData as $item) {
            Item::updateOrCreate(
                ['title' => $item['title']],
                $item
            );
        }

        // =========================================================================
        // 16. Recalculate General Ledger Account Balances
        // =========================================================================
        foreach ($accountMap as $acc) {
            $acc->recalculateBalance();
        }

        // =========================================================================
        // 17. Seed Excalidraw Accounting Masters (Analytic Accounts, Budgets, Journals)
        // =========================================================================
        $this->call(ExcalidrawAccountingSeeder::class);

        // =========================================================================
        // 18. Seed 250+ Records Across All Modules with Realistic Operations Data
        // =========================================================================
        $this->call(ComprehensiveOperationsSeeder::class);
    }
}
