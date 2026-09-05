<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        $users = User::withCount('items')
            ->orderBy('id', 'asc')
            ->get(['id', 'name', 'email', 'role', 'created_at']);

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
            'role' => ['required', 'string', 'in:' . implode(',', [User::ROLE_ADMIN, User::ROLE_MANAGER, User::ROLE_USER])],
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
     * Return the complete RBAC matrix definition.
     */
    public function matrix(Request $request): JsonResponse
    {
        return response()->json(Rbac::getMatrix());
    }
}

