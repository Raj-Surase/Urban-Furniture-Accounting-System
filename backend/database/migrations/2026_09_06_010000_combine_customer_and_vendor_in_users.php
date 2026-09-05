<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_customer')) {
                $table->boolean('is_customer')->default(false)->after('role');
            }
            if (!Schema::hasColumn('users', 'is_vendor')) {
                $table->boolean('is_vendor')->default(false)->after('is_customer');
            }
            if (!Schema::hasColumn('users', 'company_name')) {
                $table->string('company_name')->nullable()->after('is_vendor');
            }
            if (!Schema::hasColumn('users', 'contact_person')) {
                $table->string('contact_person')->nullable()->after('company_name');
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->after('contact_person');
            }
            if (!Schema::hasColumn('users', 'billing_address')) {
                $table->text('billing_address')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('users', 'shipping_address')) {
                $table->text('shipping_address')->nullable()->after('billing_address');
            }
            if (!Schema::hasColumn('users', 'city')) {
                $table->string('city')->nullable()->after('shipping_address');
            }
            if (!Schema::hasColumn('users', 'state')) {
                $table->string('state')->nullable()->after('city');
            }
            if (!Schema::hasColumn('users', 'country')) {
                $table->string('country')->default('India')->after('state');
            }
            if (!Schema::hasColumn('users', 'pincode')) {
                $table->string('pincode')->nullable()->after('country');
            }
            if (!Schema::hasColumn('users', 'gstin')) {
                $table->string('gstin')->nullable()->after('pincode');
            }
            if (!Schema::hasColumn('users', 'pan')) {
                $table->string('pan')->nullable()->after('gstin');
            }
            if (!Schema::hasColumn('users', 'credit_limit')) {
                $table->decimal('credit_limit', 15, 2)->default(0.00)->after('pan');
            }
            if (!Schema::hasColumn('users', 'payment_terms_days')) {
                $table->integer('payment_terms_days')->default(30)->after('credit_limit');
            }
            if (!Schema::hasColumn('users', 'currency')) {
                $table->string('currency')->default('INR')->after('payment_terms_days');
            }
            if (!Schema::hasColumn('users', 'default_portal_view')) {
                $table->string('default_portal_view')->default('customer')->after('currency');
            }
            if (!Schema::hasColumn('users', 'notes')) {
                $table->text('notes')->nullable()->after('default_portal_view');
            }
            if (!Schema::hasColumn('users', 'receivable_account_id')) {
                $table->foreignId('receivable_account_id')->nullable()->constrained('accounts')->nullOnDelete()->after('notes');
            }
            if (!Schema::hasColumn('users', 'payable_account_id')) {
                $table->foreignId('payable_account_id')->nullable()->constrained('accounts')->nullOnDelete()->after('receivable_account_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $cols = [
                'is_customer',
                'is_vendor',
                'company_name',
                'contact_person',
                'phone',
                'billing_address',
                'shipping_address',
                'city',
                'state',
                'country',
                'pincode',
                'gstin',
                'pan',
                'credit_limit',
                'payment_terms_days',
                'currency',
                'default_portal_view',
                'notes',
                'receivable_account_id',
                'payable_account_id',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
