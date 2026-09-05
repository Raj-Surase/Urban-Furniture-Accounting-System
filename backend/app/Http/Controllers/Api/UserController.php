<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\User;
use App\Security\Rbac;
use App\Services\RealtimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    /**
     * Display a listing of system users with roles and metrics.
     * Guarded by UserPolicy::viewAny (Admins and Managers).
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', User::class);

        $query = User::withCount('items')->orderBy('id', 'asc');

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        if ($name = $request->query('name')) {
            $query->where('name', 'like', "%{$name}%");
        }

        if ($email = $request->query('email')) {
            $query->where('email', 'like', "%{$email}%");
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('role', 'like', "%{$search}%");
            });
        }

        $users = $query->get(['id', 'name', 'email', 'role', 'created_at']);

        return response()->json([
            'data' => $users,
            'total' => $users->count(),
        ]);
    }

    /**
     * Update a user's assigned role.
     * Guarded by UserPolicy::updateRole (Admins only).
     */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        Gate::authorize('updateRole', $user);

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:' . implode(',', [
                User::ROLE_ADMIN,
                User::ROLE_MANAGER,
                User::ROLE_ACCOUNTANT,
                User::ROLE_USER,
                User::ROLE_CUSTOMER,
                User::ROLE_VENDOR,
            ])],
        ]);

        $newRole = $validated['role'];

        // Safeguard: Do not allow demoting the last remaining admin
        if ($user->isAdmin() && $newRole !== User::ROLE_ADMIN) {
            $adminCount = User::where('role', User::ROLE_ADMIN)->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot demote the sole remaining administrator account.',
                ], 422);
            }
        }

        $oldRole = $user->role;
        $user->role = $newRole;
        $user->save();

        // Broadcast realtime notification to connected clients
        RealtimeService::broadcast('user:role_updated', [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'old_role' => $oldRole,
            'role' => $user->role,
            'updated_by' => $request->user()->name,
        ], 'users');

        return response()->json([
            'message' => "User role updated to {$newRole} successfully",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'permissions' => $user->getPermissions(),
            ],
        ]);
    }

    /**
     * Onboard a new Operations Manager with generated random credentials.
     * Guarded by UserPolicy::updateRole (Admins only).
     */
    public function onboardManager(Request $request): JsonResponse
    {
        Gate::authorize('updateRole', User::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        // Generate cryptographically secure random password
        $randomPassword = 'Mgr!' . \Illuminate\Support\Str::random(9);

        $manager = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($randomPassword),
            'role' => User::ROLE_MANAGER,
        ]);

        // Dispatch credentials email notification
        try {
            \Illuminate\Support\Facades\Mail::raw(
                "Hello {$manager->name},\n\n" .
                "You have been onboarded as an Operations Manager on the Urban Furniture Accounting Platform.\n\n" .
                "Login Credentials:\n" .
                "Portal URL: " . config('app.url', 'http://localhost:5173') . "/login\n" .
                "Email: {$manager->email}\n" .
                "Temporary Password: {$randomPassword}\n\n" .
                "Please sign in and change your password immediately in your profile settings.\n\n" .
                "Best regards,\nUrban Furniture Enterprise Administration",
                function ($message) use ($manager) {
                    $message->to($manager->email)
                        ->subject("Your Operations Manager Account Credentials — Urban Furniture Accounting");
                }
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("[OnboardManager] Email dispatch logged: " . $e->getMessage());
        }

        // Broadcast realtime notification
        RealtimeService::broadcast('user:manager_onboarded', [
            'id' => $manager->id,
            'name' => $manager->name,
            'email' => $manager->email,
            'role' => $manager->role,
            'onboarded_by' => $request->user()->name,
        ], 'users');

        return response()->json([
            'message' => "Operations Manager {$manager->name} onboarded successfully! Credentials dispatched to {$manager->email}.",
            'user' => [
                'id' => $manager->id,
                'name' => $manager->name,
                'email' => $manager->email,
                'role' => $manager->role,
                'permissions' => $manager->getPermissions(),
                'created_at' => $manager->created_at,
            ],
            'temporary_password' => $randomPassword,
        ], 201);
    }

    /**
     * Create user matching Excalidraw Create User page.
     * Roles: user, admin, accountant.
     */
    public function createUser(Request $request): JsonResponse
    {
        Gate::authorize('create', User::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'login_id' => ['required', 'string', 'min:6', 'max:12', 'unique:users,login_id'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'string', 'in:user,admin,accountant,manager,customer,vendor'],
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[@$!%*?&#^()_+={}\[\]:;"\'<>,.\/\\|~`-]/',
            ],
            're_enter_password' => ['required', 'same:password'],
        ], [
            'login_id.min' => 'Login Id must be between 6-12 characters.',
            'login_id.max' => 'Login Id must be between 6-12 characters.',
            'login_id.unique' => 'Login Id should be unique.',
            'email.unique' => 'Email should not be a duplicate in database.',
            'password.regex' => 'Password must contain a small case, a large case and a special character.',
            'password.min' => 'Password length must have more than 8 characters.',
            're_enter_password.same' => 'Passwords do not match.',
        ]);

        $role = $validated['role'];
        $isCustomer = $role === User::ROLE_CUSTOMER || $request->boolean('is_customer', $role === User::ROLE_USER);
        $isVendor = $role === User::ROLE_VENDOR || $request->boolean('is_vendor', $role === User::ROLE_USER);

        $user = User::create([
            'name' => $validated['name'],
            'login_id' => $validated['login_id'],
            'email' => $validated['email'],
            'role' => $role,
            'is_customer' => $isCustomer,
            'is_vendor' => $isVendor,
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'login_id' => $user->login_id,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at,
            ],
        ], 201);
    }

    /**
     * Return the complete RBAC matrix definition.
     */
    public function matrix(Request $request): JsonResponse
    {
        return response()->json(Rbac::getMatrix());
    }

    /**
     * Return administrative telemetry, user counts, and domain resource stats.
     * Guarded by UserPolicy::viewTelemetry (Admins only).
     */
    public function stats(Request $request): JsonResponse
    {
        Gate::authorize('viewTelemetry', User::class);

        $totalUsers = User::count();
        $adminCount = User::where('role', User::ROLE_ADMIN)->count();
        $managerCount = User::where('role', User::ROLE_MANAGER)->count();
        $userCount = User::where('role', User::ROLE_USER)->count();
        $totalItems = Item::count();
        $totalProducts = Product::count();
        $totalInvoices = Invoice::count();
        $totalSalesOrders = SalesOrder::count();
        $totalPurchaseOrders = PurchaseOrder::count();

        $defaultConn = config('database.default');

        return response()->json([
            'total_users' => $totalUsers,
            'admin_count' => $adminCount,
            'manager_count' => $managerCount,
            'user_count' => $userCount,
            'total_items' => $totalItems,
            'total_products' => $totalProducts,
            'total_invoices' => $totalInvoices,
            'total_sales_orders' => $totalSalesOrders,
            'total_purchase_orders' => $totalPurchaseOrders,
            'system_time' => now()->toIso8601String(),
            'database' => [
                'connection' => $defaultConn,
                'host' => config("database.connections.{$defaultConn}.host", '127.0.0.1'),
                'port' => config("database.connections.{$defaultConn}.port", 3306),
                'database' => config("database.connections.{$defaultConn}.database", 'urban_furniture_accounting'),
                'status' => 'connected',
            ],
            'framework' => 'Laravel ' . app()->version(),
            'environment' => config('app.env'),
        ]);
    }
}

