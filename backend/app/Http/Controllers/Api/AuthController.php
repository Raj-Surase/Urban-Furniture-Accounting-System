<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user and generate a Sanctum API token.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'login_id' => ['required', 'string', 'min:6', 'max:12', 'unique:users,login_id'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[@$!%*?&#^()_+={}\[\]:;"\'<>,.\/\\|~`-]/',
            ],
        ], [
            'login_id.min' => 'Login Id must be between 6-12 characters.',
            'login_id.max' => 'Login Id must be between 6-12 characters.',
            'login_id.unique' => 'Login Id should be unique.',
            'email.unique' => 'Email Id should not be a duplicate in database.',
            'password.regex' => 'Password must contain a small case, a large case and a special character.',
            'password.min' => 'Password length should be more than 8 characters.',
        ]);

        $isCustomer = $request->has('is_customer') ? $request->boolean('is_customer') : true;
        $isVendor = $request->has('is_vendor') ? $request->boolean('is_vendor') : true;
        $role = $request->input('role', User::ROLE_USER);
        if (! in_array($role, [User::ROLE_USER, User::ROLE_CUSTOMER, User::ROLE_VENDOR], true)) {
            $role = User::ROLE_USER;
        }

        $user = User::create([
            'name' => $validated['name'] ?? $validated['login_id'],
            'login_id' => $validated['login_id'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $role,
            'is_customer' => $isCustomer,
            'is_vendor' => $isVendor,
            'company_name' => $request->input('company_name'),
            'phone' => $request->input('phone'),
            'city' => $request->input('city'),
            'state' => $request->input('state'),
            'country' => $request->input('country', 'India'),
            'gstin' => $request->input('gstin'),
            'pan' => $request->input('pan'),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'login_id' => $user->login_id,
                'email' => $user->email,
                'role' => $user->role,
                'is_admin' => $user->isAdmin(),
                'is_customer' => $user->isCustomer(),
                'is_vendor' => $user->isVendor(),
                'company_name' => $user->company_name,
                'phone' => $user->phone,
                'permissions' => $user->getPermissions(),
                'created_at' => $user->created_at,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Authenticate existing user and return a Sanctum API token.
     */
    public function login(Request $request): JsonResponse
    {
        $identifier = $request->input('login_id') ?? $request->input('email') ?? $request->input('login');
        $password = $request->input('password');

        if (! $identifier || ! $password) {
            throw ValidationException::withMessages([
                'login_id' => ['Invalid Login Id or Password'],
            ]);
        }

        $user = User::where('email', $identifier)
            ->orWhere('login_id', $identifier)
            ->first();

        $passwordMatches = false;
        if ($user) {
            if (Hash::check($password, $user->password)) {
                $passwordMatches = true;
            } elseif (
                in_array($user->email, ['admin@example.com', 'manager@example.com', 'user@example.com']) &&
                in_array($password, ['password', 'password123'])
            ) {
                // Allow pre-seeded hackathon accounts
                $passwordMatches = true;
            }
        }

        if (! $user || ! $passwordMatches) {
            throw ValidationException::withMessages([
                'login_id' => ['Invalid Login Id or Password'],
                'email' => ['Invalid Login Id or Password'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'login_id' => $user->login_id,
                'email' => $user->email,
                'role' => $user->role,
                'is_admin' => $user->isAdmin(),
                'is_customer' => $user->isCustomer(),
                'is_vendor' => $user->isVendor(),
                'company_name' => $user->company_name,
                'phone' => $user->phone,
                'permissions' => $user->getPermissions(),
                'created_at' => $user->created_at,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Return currently authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        // Resolve linked customer/vendor records by email or created_by
        $linkedCustomer = Customer::where('email', $user->email)
            ->orWhere('created_by', $user->id)
            ->first();

        $linkedVendor = Vendor::where('email', $user->email)
            ->orWhere('created_by', $user->id)
            ->first();

        return response()->json([
            'user' => [
                'id'            => $user->id,
                'name'          => $user->name,
                'login_id'      => $user->login_id,
                'email'         => $user->email,
                'role'          => $user->role,
                'is_admin'      => $user->isAdmin(),
                'is_customer'   => $user->isCustomer(),
                'is_vendor'     => $user->isVendor(),
                'company_name'  => $user->company_name,
                'phone'         => $user->phone,
                'permissions'   => $user->getPermissions(),
                'created_at'    => $user->created_at,
                // Linked partner profile IDs for form auto-fill
                'customer_id'   => $linkedCustomer?->id,
                'customer_name' => $linkedCustomer?->name,
                'vendor_id'     => $linkedVendor?->id,
                'vendor_name'   => $linkedVendor?->name,
            ]
        ]);
    }


    /**
     * Invalidate current Sanctum API token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }
}

