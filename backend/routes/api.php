<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Healthcheck
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'framework' => 'Laravel ' . app()->version(),
        'database' => config('database.default'),
        'timestamp' => now()->toIso8601String(),
    ]);
});

// RBAC Matrix (Public schema description)
Route::get('/rbac/matrix', [UserController::class, 'matrix']);

// Authentication Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Authenticated Routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Current user profile & logout
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // CRUD Resource: Items (Strict object-level authorization handled via ItemPolicy)
    Route::apiResource('items', ItemController::class);

    // User Governance & Role Management
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{user}/role', [UserController::class, 'updateRole']);

    // Role-protected route example (Admin only)
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', function () {
            return response()->json([
                'total_users' => \App\Models\User::count(),
                'total_items' => \App\Models\Item::count(),
                'system_time' => now()->toIso8601String(),
                'role' => 'admin_access_granted'
            ]);
        });
    });
});
