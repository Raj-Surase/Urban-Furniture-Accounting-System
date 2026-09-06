<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Customer;
use App\Models\User;
use App\Models\Vendor;
use App\Services\RealtimeService;
use App\Services\SequenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ContactController extends Controller
{
    /**
     * Display unified list of contacts (both Customers and Vendors).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! $user->hasPermission(\App\Security\Rbac::PERMISSION_CONTACTS_VIEW_ANY)) {
            abort(403, 'Unauthorized access to contacts directory.');
        }

        $search = $request->query('search');
        $type = $request->query('type'); // 'customer', 'vendor', or null for all

        $name = $request->query('name');
        $city = $request->query('city');
        $state = $request->query('state');
        $gstin = $request->query('gstin');

        $customers = Customer::query()
            ->when($name, fn($q) => $q->where('name', 'like', "%{$name}%"))
            ->when($city, fn($q) => $q->where('city', 'like', "%{$city}%"))
            ->when($state, fn($q) => $q->where('state', 'like', "%{$state}%"))
            ->when($gstin, fn($q) => $q->where('gstin', 'like', "%{$gstin}%"))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('gstin', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'code' => $c->code,
                    'contact_type' => 'customer',
                    'name' => $c->name,
                    'email' => $c->email,
                    'phone' => $c->phone,
                    'street' => $c->billing_address,
                    'city' => $c->city,
                    'state' => $c->state,
                    'country' => $c->country ?? 'India',
                    'pincode' => $c->pincode,
                    'gstin' => $c->gstin,
                    'pan' => substr($c->gstin ?? '', 2, 10) ?: null,
                    'image' => $c->avatar_url ?? null,
                    'created_at' => $c->created_at,
                ];
            });

        $vendors = Vendor::query()
            ->when($name, fn($q) => $q->where('name', 'like', "%{$name}%"))
            ->when($city, fn($q) => $q->where('city', 'like', "%{$city}%"))
            ->when($state, fn($q) => $q->where('state', 'like', "%{$state}%"))
            ->when($gstin, fn($q) => $q->where('gstin', 'like', "%{$gstin}%"))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('gstin', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->get()
            ->map(function ($v) {
                return [
                    'id' => $v->id,
                    'code' => $v->code,
                    'contact_type' => 'vendor',
                    'name' => $v->name,
                    'email' => $v->email,
                    'phone' => $v->phone,
                    'street' => $v->address,
                    'city' => $v->city,
                    'state' => $v->state,
                    'country' => $v->country ?? 'India',
                    'pincode' => $v->pincode,
                    'gstin' => $v->gstin,
                    'pan' => $v->pan ?? (substr($v->gstin ?? '', 2, 10) ?: null),
                    'image' => $v->avatar_url ?? null,
                    'created_at' => $v->created_at,
                ];
            });

        $contacts = collect();
        if ($type !== 'vendor') {
            $contacts = $contacts->merge($customers);
        }
        if ($type !== 'customer') {
            $contacts = $contacts->merge($vendors);
        }

        $sorted = $contacts->sortBy('name')->values();

        return response()->json([
            'success' => true,
            'data' => $sorted,
        ]);
    }

    /**
     * Store a new contact or update an existing contact.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! $user->hasPermission(\App\Security\Rbac::PERMISSION_CONTACTS_MANAGE)) {
            abort(403, 'Unauthorized. Contact management privileges required.');
        }

        $validated = $request->validate([
            'id' => 'nullable|integer',
            'contact_type' => 'required|in:customer,vendor,both',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'street' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:20',
            'gstin' => 'nullable|string|max:20',
            'pan' => 'nullable|string|max:20',
            'image' => 'nullable|string',
            'create_portal_user' => 'nullable|boolean',
            'login_id' => 'nullable|string|min:6|max:12',
            'portal_password' => 'nullable|string|min:6',
        ]);

        $created = [];

        if (in_array($validated['contact_type'], ['customer', 'both'])) {
            $defaultAr = Account::where('code', '1120')->first();
            $customerData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'billing_address' => $validated['street'] ?? null,
                'shipping_address' => $validated['street'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'country' => $validated['country'] ?? 'India',
                'pincode' => $validated['pincode'] ?? null,
                'gstin' => $validated['gstin'] ?? null,
                'credit_limit' => 500000.00,
                'payment_terms_days' => 30,
                'receivable_account_id' => $defaultAr?->id,
                'is_active' => true,
                'created_by' => $user?->id,
            ];

            if (!empty($validated['id']) && $validated['contact_type'] === 'customer') {
                $customer = Customer::find($validated['id']);
                if ($customer) {
                    $customer->update($customerData);
                    RealtimeService::broadcast('customer:updated', $customer->toArray(), 'customers');
                } else {
                    $customerData['code'] = SequenceService::generate('CUST', null, 3);
                    $customer = Customer::create($customerData);
                    RealtimeService::broadcast('customer:created', $customer->toArray(), 'customers');
                }
            } else {
                $customerData['code'] = SequenceService::generate('CUST', null, 3);
                $customer = Customer::create($customerData);
                RealtimeService::broadcast('customer:created', $customer->toArray(), 'customers');
            }
            $created['customer'] = $customer;
        }

        if (in_array($validated['contact_type'], ['vendor', 'both'])) {
            $defaultAp = Account::where('code', '2110')->first();
            $pan = !empty($validated['pan'])
                ? $validated['pan']
                : (!empty($validated['gstin']) && strlen($validated['gstin']) >= 12 ? substr($validated['gstin'], 2, 10) : null);

            $vendorData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['street'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'country' => $validated['country'] ?? 'India',
                'pincode' => $validated['pincode'] ?? null,
                'gstin' => $validated['gstin'] ?? null,
                'pan' => $pan,
                'payment_terms_days' => 30,
                'payable_account_id' => $defaultAp?->id,
                'is_active' => true,
                'created_by' => $user?->id,
            ];

            if (!empty($validated['id']) && $validated['contact_type'] === 'vendor') {
                $vendor = Vendor::find($validated['id']);
                if ($vendor) {
                    $vendor->update($vendorData);
                    RealtimeService::broadcast('vendor:updated', $vendor->toArray(), 'vendors');
                } else {
                    $vendorData['code'] = SequenceService::generate('VEN', null, 3);
                    $vendor = Vendor::create($vendorData);
                    RealtimeService::broadcast('vendor:created', $vendor->toArray(), 'vendors');
                }
            } else {
                $vendorData['code'] = SequenceService::generate('VEN', null, 3);
                $vendor = Vendor::create($vendorData);
                RealtimeService::broadcast('vendor:created', $vendor->toArray(), 'vendors');
            }
            $created['vendor'] = $vendor;
        }

        // Optional Portal User Provisioning
        if ($request->boolean('create_portal_user') && !empty($validated['login_id'])) {
            $existingUser = User::where('login_id', $validated['login_id'])
                ->orWhere('email', $validated['email'])
                ->first();

            if ($existingUser) {
                if (!empty($validated['portal_password'])) {
                    $existingUser->password = Hash::make($validated['portal_password']);
                }
                $existingUser->is_customer = in_array($validated['contact_type'], ['customer', 'both']);
                $existingUser->is_vendor = in_array($validated['contact_type'], ['vendor', 'both']);
                $existingUser->save();
                $created['portal_user'] = [
                    'id' => $existingUser->id,
                    'login_id' => $existingUser->login_id,
                    'email' => $existingUser->email,
                    'status' => 'updated',
                ];
            } else {
                $password = !empty($validated['portal_password']) ? $validated['portal_password'] : 'Welcome@123';
                $portalUser = User::create([
                    'name' => $validated['name'],
                    'login_id' => $validated['login_id'],
                    'email' => $validated['email'],
                    'password' => Hash::make($password),
                    'role' => User::ROLE_USER,
                    'is_customer' => in_array($validated['contact_type'], ['customer', 'both']),
                    'is_vendor' => in_array($validated['contact_type'], ['vendor', 'both']),
                    'phone' => $validated['phone'] ?? null,
                    'city' => $validated['city'] ?? null,
                    'state' => $validated['state'] ?? null,
                    'country' => $validated['country'] ?? 'India',
                    'gstin' => $validated['gstin'] ?? null,
                ]);
                $created['portal_user'] = [
                    'id' => $portalUser->id,
                    'login_id' => $portalUser->login_id,
                    'email' => $portalUser->email,
                    'status' => 'created',
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Contact saved successfully',
            'data' => $created,
        ], 201);
    }
}
