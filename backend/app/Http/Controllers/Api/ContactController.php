<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    /**
     * Display unified list of contacts (both Customers and Vendors).
     */
    public function index(Request $request): JsonResponse
    {
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
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            })
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'contact_type' => 'customer',
                    'name' => $c->name,
                    'email' => $c->email,
                    'phone' => $c->phone,
                    'street' => $c->street ?? $c->billing_address,
                    'city' => $c->city ?? $c->billing_city,
                    'state' => $c->state ?? $c->billing_state,
                    'country' => $c->country ?? $c->billing_country ?? 'India',
                    'pincode' => $c->pincode ?? $c->billing_postal_code,
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
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('gstin', 'like', "%{$search}%");
            })
            ->get()
            ->map(function ($v) {
                return [
                    'id' => $v->id,
                    'contact_type' => 'vendor',
                    'name' => $v->name,
                    'email' => $v->email,
                    'phone' => $v->phone,
                    'street' => $v->street ?? $v->address,
                    'city' => $v->city,
                    'state' => $v->state,
                    'country' => $v->country ?? 'India',
                    'pincode' => $v->pincode ?? $v->postal_code,
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
     * Store a new contact.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
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
        ]);

        $created = [];

        if (in_array($validated['contact_type'], ['customer', 'both'])) {
            $customer = Customer::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'billing_address' => $validated['street'],
                'billing_city' => $validated['city'],
                'billing_state' => $validated['state'],
                'billing_postal_code' => $validated['pincode'],
                'billing_country' => $validated['country'] ?? 'India',
                'gstin' => $validated['gstin'] ?? null,
                'customer_code' => 'CUST-' . strtoupper(substr(uniqid(), -6)),
            ]);
            $created['customer'] = $customer;
        }

        if (in_array($validated['contact_type'], ['vendor', 'both'])) {
            $vendor = Vendor::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['street'],
                'city' => $validated['city'],
                'state' => $validated['state'],
                'postal_code' => $validated['pincode'],
                'country' => $validated['country'] ?? 'India',
                'gstin' => $validated['gstin'] ?? null,
                'pan' => $validated['pan'] ?? null,
                'vendor_code' => 'VEND-' . strtoupper(substr(uniqid(), -6)),
            ]);
            $created['vendor'] = $vendor;
        }

        return response()->json([
            'success' => true,
            'message' => 'Contact saved successfully',
            'data' => $created,
        ], 201);
    }
}
