<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role' => User::ROLE_ADMIN,
            ]
        );
        $admin->role = User::ROLE_ADMIN;
        $admin->save();

        // 2. Seed Operations Manager User
        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Operations Manager',
                'password' => Hash::make('password'),
                'role' => User::ROLE_MANAGER,
            ]
        );
        $manager->role = User::ROLE_MANAGER;
        $manager->save();

        // 3. Seed Standard User
        $user = User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Standard User',
                'password' => Hash::make('password'),
                'role' => User::ROLE_USER,
            ]
        );
        $user->role = User::ROLE_USER;
        $user->save();

        // 4. Seed Sample Items
        $sampleItems = [
            [
                'user_id' => $admin->id,
                'title' => 'Core Security Clearance Framework',
                'description' => 'Enforce granular RBAC policies, Gates, and role-based routes across all micro-services.',
                'status' => 'completed',
                'priority' => 'high',
            ],
            [
                'user_id' => $manager->id,
                'title' => 'Department Operations & Resource Allocation',
                'description' => 'Review operational team tasks and audit transactional integrity across inventory.',
                'status' => 'in_progress',
                'priority' => 'high',
            ],
            [
                'user_id' => $user->id,
                'title' => 'Personal Workspace & Task Checklist',
                'description' => 'Standard user tasks demonstrating individual ownership policy (only author can edit).',
                'status' => 'in_progress',
                'priority' => 'medium',
            ],
            [
                'user_id' => $admin->id,
                'title' => 'System Telemetry & Audit Logs Pipeline',
                'description' => 'Real-time telemetry diagnostics and automated database query health monitoring.',
                'status' => 'completed',
                'priority' => 'medium',
            ],
            [
                'user_id' => $user->id,
                'title' => 'Submit Hackathon Presentation Slides',
                'description' => 'Prepare final pitch deck demonstrating real-time RBAC policy enforcement.',
                'status' => 'pending',
                'priority' => 'low',
            ],
        ];

        // Ensure fresh sample items without duplication
        Item::truncate();
        foreach ($sampleItems as $item) {
            Item::create($item);
        }
    }
}
