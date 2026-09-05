<?php

namespace App\Providers;

use App\Models\Account;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\User;
use App\Models\Vendor;
use App\Policies\AccountPolicy;
use App\Policies\CustomerPolicy;
use App\Policies\InvoicePolicy;
use App\Policies\ItemPolicy;
use App\Policies\JournalEntryPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\ProductPolicy;
use App\Policies\PurchaseOrderPolicy;
use App\Policies\SalesOrderPolicy;
use App\Policies\UserPolicy;
use App\Policies\VendorPolicy;
use App\Security\Rbac;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 1. Explicitly bind all domain model policies
        Gate::policy(Item::class, ItemPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Account::class, AccountPolicy::class);
        Gate::policy(Customer::class, CustomerPolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(JournalEntry::class, JournalEntryPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(PurchaseOrder::class, PurchaseOrderPolicy::class);
        Gate::policy(SalesOrder::class, SalesOrderPolicy::class);
        Gate::policy(Vendor::class, VendorPolicy::class);

        // 2. Dynamically define Gates for all granular RBAC permissions
        foreach (array_keys(Rbac::getAllPermissions()) as $permission) {
            Gate::define($permission, function (User $user) use ($permission) {
                return $user->hasPermission($permission);
            });
        }

        // 3. Register morph map for polymorphic party relations
        \Illuminate\Database\Eloquent\Relations\Relation::morphMap([
            'customer' => Customer::class,
            'vendor' => Vendor::class,
        ]);
    }
}
