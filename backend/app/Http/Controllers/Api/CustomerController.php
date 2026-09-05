<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Customer;
use App\Security\Rbac;
use App\Services\RealtimeService;
use App\Services\SequenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Customer::class);

        $user = $request->user();
        $query = Customer::with('receivableAccount')->orderBy('name', 'asc');

        // Non-admin/manager/accountant users: scope to own records only
        if (!$user->hasPermission(Rbac::PERMISSION_CUSTOMERS_VIEW_ANY)) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhere('email', $user->email);
            });
        }

        if ($name = $request->query('name')) {
            $query->where('name', 'like', "%{$name}%");
        }

        if ($code = $request->query('code')) {
            $query->where('code', 'like', "%{$code}%");
        }

        if ($gstin = $request->query('gstin')) {
            $query->where('gstin', 'like', "%{$gstin}%");
        }

        if ($city = $request->query('city')) {
            $query->where('city', 'like', "%{$city}%");
        }

        if ($state = $request->query('state')) {
            $query->where('state', 'like', "%{$state}%");
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('gstin', 'like', "%{$search}%");
            });
        }

        $perPage = $request->query('per_page', 20);
        if ($perPage === 'all' || $perPage === '-1') {
            $customers = $query->get();
            return response()->json([
                'data' => $customers,
                'total' => $customers->count(),
            ]);
        }

        $customers = $query->paginate(is_numeric($perPage) ? (int)$perPage : 20);

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Customer::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:customers,code'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'billing_address' => ['nullable', 'string'],
            'shipping_address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'gstin' => ['nullable', 'string', 'max:20'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'payment_terms_days' => ['nullable', 'integer', 'min:0'],
            'receivable_account_id' => ['nullable', 'exists:accounts,id'],
            'notes' => ['nullable', 'string'],
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = SequenceService::generate('CUST', null, 3);
        }

        if (empty($validated['receivable_account_id'])) {
            $defaultAr = Account::where('code', '1120')->first();
            $validated['receivable_account_id'] = $defaultAr?->id;
        }

        $customer = Customer::create(array_merge($validated, [
            'country' => $validated['country'] ?? 'India',
            'credit_limit' => (float) ($validated['credit_limit'] ?? 500000.00),
            'payment_terms_days' => $validated['payment_terms_days'] ?? 30,
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]));

        $customer->load('receivableAccount');

        RealtimeService::broadcast('customer:created', $customer->toArray(), 'customers');

        return response()->json([
            'message' => 'Customer onboarded successfully',
            'data' => $customer,
        ], 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        Gate::authorize('view', $customer);

        $customer->load(['receivableAccount', 'salesOrders' => function ($q) {
            $q->latest()->limit(10);
        }]);

        return response()->json([
            'data' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        Gate::authorize('update', $customer);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'billing_address' => ['nullable', 'string'],
            'shipping_address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'gstin' => ['nullable', 'string', 'max:20'],
            'credit_limit' => ['sometimes', 'numeric', 'min:0'],
            'payment_terms_days' => ['sometimes', 'integer', 'min:0'],
            'receivable_account_id' => ['nullable', 'exists:accounts,id'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $customer->update($validated);
        $customer->load('receivableAccount');

        RealtimeService::broadcast('customer:updated', $customer->toArray(), 'customers');

        return response()->json([
            'message' => 'Customer updated successfully',
            'data' => $customer,
        ]);
    }

    public function destroy(Customer $customer): JsonResponse
    {
        Gate::authorize('delete', $customer);

        if ($customer->salesOrders()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete customer with active sales orders.',
            ], 422);
        }

        $id = $customer->id;
        $customer->delete();

        RealtimeService::broadcast('customer:deleted', ['id' => $id], 'customers');

        return response()->json([
            'message' => 'Customer deleted successfully',
            'id' => $id,
        ]);
    }
}
