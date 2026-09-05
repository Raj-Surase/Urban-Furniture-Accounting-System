<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$permissions
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], Response::HTTP_UNAUTHORIZED);
        }

        $flattenedPermissions = [];
        foreach ($permissions as $permissionGroup) {
            foreach (explode(',', $permissionGroup) as $p) {
                $clean = trim($p);
                if ($clean !== '') {
                    $flattenedPermissions[] = $clean;
                }
            }
        }

        if (empty($flattenedPermissions)) {
            return $next($request);
        }

        // Must possess at least one of the required permissions (or all if specified)
        $hasPermission = false;
        foreach ($flattenedPermissions as $permission) {
            if ($user->hasPermission($permission)) {
                $hasPermission = true;
                break;
            }
        }

        if (! $hasPermission) {
            return response()->json([
                'message' => 'Forbidden. Missing required permission: ' . implode(' or ', $flattenedPermissions),
                'required_permissions' => $flattenedPermissions,
                'user_role' => $user->role,
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}

