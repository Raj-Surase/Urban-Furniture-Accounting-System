<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], Response::HTTP_UNAUTHORIZED);
        }

        $flattenedRoles = [];
        foreach ($roles as $roleGroup) {
            foreach (explode(',', $roleGroup) as $r) {
                $clean = trim($r);
                if ($clean !== '') {
                    $flattenedRoles[] = $clean;
                }
            }
        }

        if (empty($flattenedRoles)) {
            return $next($request);
        }

        if (! in_array($user->role, $flattenedRoles, true)) {
            return response()->json([
                'message' => 'Forbidden. Required role: ' . implode(' or ', $flattenedRoles),
                'required_roles' => $flattenedRoles,
                'current_role' => $user->role,
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}

