<?php

namespace App\Providers;

use App\Models\Item;
use App\Models\User;
use App\Policies\ItemPolicy;
use App\Policies\UserPolicy;
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
        // 1. Explicitly bind model policies
        Gate::policy(Item::class, ItemPolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        // 2. Dynamically define Gates for all granular RBAC permissions
        foreach (array_keys(Rbac::getAllPermissions()) as $permission) {
            Gate::define($permission, function (User $user) use ($permission) {
                return $user->hasPermission($permission);
            });
        }
    }
}
