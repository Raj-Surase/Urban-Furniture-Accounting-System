<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Vendor;
use App\Services\RealtimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class VendorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Vendor::class);

        $query = Vendor::with('payableAccount')->orderBy('name', 'asc');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('gstin', 'like', "%{$search}%");
            });
        }

        $vendors = $query->paginate($request->query('per_page', 20));

        return response()->json($vendors);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Vendor::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:vendors,code'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'gstin' => ['nullable', 'string', 'max:20'],
            'pan' => ['nullable', 'string', 'max:20'],
            'payment_terms_days' => ['nullable', 'integer', 'min:0'],
            'payable_account_id' => ['nullable', 'exists:accounts,id'],
            'notes' => ['nullable', 'string'],
        ]);

        if (empty($validated['code'])) {
            $count = Vendor::count() + 1;
            $validated['code'] = sprintf("VEN-%03d", $count);
        }

        if (empty($validated['payable_account_id'])) {
            $defaultAp = Account::where('code', '2110')->first();
            $validated['payable_account_id'] = $defaultAp?->id;
        }

        $vendor = Vendor::create(array_merge($validated, [
            'country' => $validated['country'] ?? 'India',
            'payment_terms_days' => $validated['payment_terms_days'] ?? 30,
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]));

        $vendor->load('payableAccount');

        RealtimeService::broadcast('vendor:created', $vendor->toArray(), 'vendors');

        return response()->json([
            'message' => 'Vendor registered successfully',
            'data' => $vendor,
        ], 201);
    }

    public function show(Vendor $vendor): JsonResponse
    {
        Gate::authorize('view', $vendor);

        $vendor->load(['payableAccount', 'purchaseOrders' => function ($q) {
            $q->latest()->limit(10);
        }]);

        return response()->json([
            'data' => $vendor,
        ]);
    }

    public function update(Request $request, Vendor $vendor): JsonResponse
    {
        Gate::authorize('update', $vendor);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'gstin' => ['nullable', 'string', 'max:20'],
            'pan' => ['nullable', 'string', 'max:20'],
            'payment_terms_days' => ['sometimes', 'integer', 'min:0'],
            'payable_account_id' => ['nullable', 'exists:accounts,id'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $vendor->update($validated);
        $vendor->load('payableAccount');

        RealtimeService::broadcast('vendor:updated', $vendor->toArray(), 'vendors');

        return response()->json([
            'message' => 'Vendor updated successfully',
            'data' => $vendor,
        ]);
    }

    public function destroy(Vendor $vendor): JsonResponse
    {
        Gate::authorize('delete', $vendor);

        if ($vendor->purchaseOrders()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete vendor with existing purchase orders.',
            ], 422);
        }

        $id = $vendor->id;
        $vendor->delete();

        RealtimeService::broadcast('vendor:deleted', ['id' => $id], 'vendors');

        return response()->json([
            'message' => 'Vendor deleted successfully',
            'id' => $id,
        ]);
    }
}
