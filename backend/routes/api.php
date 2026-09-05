<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AnalyticAccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\JournalController;
use App\Http\Controllers\Api\JournalEntryController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SalesOrderController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VendorController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'Urban Furniture Accounting Platform',
        'framework' => 'Laravel ' . app()->version(),
        'database' => config('database.default'),
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::get('/rbac/matrix', [UserController::class, 'matrix']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Current user profile & logout
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard & Metrics
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/transactions', [DashboardController::class, 'recentTransactions']);
    Route::get('/dashboard/alerts', [DashboardController::class, 'alerts']);
    Route::get('/dashboard/analytics', [DashboardController::class, 'analytics']);
    Route::get('/dashboard/activity', [DashboardController::class, 'activity']);

    // Legacy Items Resource
    Route::apiResource('items', ItemController::class);

    // User Governance, Onboarding & Administrative Telemetry
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{user}/role', [UserController::class, 'updateRole']);
    Route::post('/admin/onboard-manager', [UserController::class, 'onboardManager']);
    Route::post('/admin/create-user', [UserController::class, 'createUser']);
    Route::get('/admin/stats', [UserController::class, 'stats']);

    // Unified Contacts Master
    Route::get('/contacts', [ContactController::class, 'index']);
    Route::post('/contacts', [ContactController::class, 'store']);

    // Chart of Accounts, Journals & General Ledger
    Route::get('/accounts/{account}/ledger', [AccountController::class, 'ledger']);
    Route::apiResource('accounts', AccountController::class);
    Route::apiResource('journals', JournalController::class);

    // Analytic Accounts & Budgets
    Route::apiResource('analytic-accounts', AnalyticAccountController::class);
    Route::post('/budgets/{budget}/confirm', [BudgetController::class, 'confirm']);
    Route::post('/budgets/{budget}/revise', [BudgetController::class, 'revise']);
    Route::post('/budgets/{budget}/cancel', [BudgetController::class, 'cancel']);
    Route::post('/budgets/check-limit', [BudgetController::class, 'checkLimit']);
    Route::get('/budgets/{budget}/analytic-transactions', [BudgetController::class, 'analyticTransactions']);
    Route::apiResource('budgets', BudgetController::class);

    Route::post('/journal/{journal_entry}/reverse', [JournalEntryController::class, 'reverse']);
    Route::apiResource('journal', JournalEntryController::class)->only(['index', 'store', 'show']);

    // Products & Inventory
    Route::post('/products/{product}/adjust', [ProductController::class, 'adjust']);
    Route::apiResource('products', ProductController::class);

    // Procurement & Vendors
    Route::apiResource('vendors', VendorController::class);

    Route::post('/purchase-orders/{purchase_order}/submit', [PurchaseOrderController::class, 'submit']);
    Route::post('/purchase-orders/{purchase_order}/approve', [PurchaseOrderController::class, 'approve']);
    Route::post('/purchase-orders/{purchase_order}/reject', [PurchaseOrderController::class, 'reject']);
    Route::post('/purchase-orders/{purchase_order}/receive', [PurchaseOrderController::class, 'receive']);
    Route::apiResource('purchase-orders', PurchaseOrderController::class);

    // Sales & Customers
    Route::apiResource('customers', CustomerController::class);

    Route::post('/sales-orders/{sales_order}/confirm', [SalesOrderController::class, 'confirm']);
    Route::post('/sales-orders/{sales_order}/approve', [SalesOrderController::class, 'approve']);
    Route::post('/sales-orders/{sales_order}/deliver', [SalesOrderController::class, 'deliver']);
    Route::apiResource('sales-orders', SalesOrderController::class);

    // Invoices (AR + AP)
    Route::post('/invoices/{invoice}/approve', [InvoiceController::class, 'approve']);
    Route::post('/invoices/{invoice}/void', [InvoiceController::class, 'void']);
    Route::apiResource('invoices', InvoiceController::class);

    // Payments & Treasury
    Route::post('/payments/{payment}/reconcile', [PaymentController::class, 'reconcile']);
    Route::apiResource('payments', PaymentController::class);

    // Financial Reports
    Route::prefix('reports')->group(function () {
        Route::get('/trial-balance', [ReportController::class, 'trialBalance']);
        Route::get('/income-statement', [ReportController::class, 'incomeStatement']);
        Route::get('/balance-sheet', [ReportController::class, 'balanceSheet']);
        Route::get('/ar-aging', [ReportController::class, 'arAging']);
        Route::get('/ap-aging', [ReportController::class, 'apAging']);
        Route::get('/gst-summary', [ReportController::class, 'gstSummary']);
    });
});
