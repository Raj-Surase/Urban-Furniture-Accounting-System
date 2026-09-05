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
     * Return the complete RBAC matrix definition.
     */
    public function matrix(Request $request): JsonResponse
    {
        return response()->json(Rbac::getMatrix());
    }
}

