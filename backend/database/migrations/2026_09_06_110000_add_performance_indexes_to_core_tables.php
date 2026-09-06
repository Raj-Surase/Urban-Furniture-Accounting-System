<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['party_type', 'party_id', 'status', 'balance_due'], 'invoices_party_status_bal_idx');
            $table->index(['type', 'status'], 'invoices_type_status_idx');
            $table->index(['created_by', 'status'], 'invoices_created_by_status_idx');
            $table->index('invoice_date', 'invoices_invoice_date_idx');
            $table->index('due_date', 'invoices_due_date_idx');
            $table->index('created_at', 'invoices_created_at_idx');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index(['type', 'status'], 'payments_type_status_idx');
            $table->index(['created_by', 'status'], 'payments_created_by_status_idx');
            $table->index('payment_date', 'payments_payment_date_idx');
            $table->index('created_at', 'payments_created_at_idx');
        });

        Schema::table('sales_orders', function (Blueprint $table) {
            $table->index('status', 'sales_orders_status_idx');
            $table->index(['created_by', 'status'], 'sales_orders_created_by_status_idx');
            $table->index('order_date', 'sales_orders_order_date_idx');
            $table->index('created_at', 'sales_orders_created_at_idx');
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->index('status', 'purchase_orders_status_idx');
            $table->index(['created_by', 'status'], 'purchase_orders_created_by_status_idx');
            $table->index('order_date', 'purchase_orders_order_date_idx');
            $table->index('created_at', 'purchase_orders_created_at_idx');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->index('name', 'customers_name_idx');
            $table->index('city', 'customers_city_idx');
            $table->index('state', 'customers_state_idx');
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->index('name', 'vendors_name_idx');
            $table->index('city', 'vendors_city_idx');
            $table->index('state', 'vendors_state_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('category', 'products_category_idx');
            $table->index('type', 'products_type_idx');
            $table->index('name', 'products_name_idx');
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->index('status', 'journal_entries_status_idx');
            $table->index('posting_date', 'journal_entries_posting_date_idx');
            $table->index('type', 'journal_entries_type_idx');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_party_status_bal_idx');
            $table->dropIndex('invoices_type_status_idx');
            $table->dropIndex('invoices_created_by_status_idx');
            $table->dropIndex('invoices_invoice_date_idx');
            $table->dropIndex('invoices_due_date_idx');
            $table->dropIndex('invoices_created_at_idx');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_type_status_idx');
            $table->dropIndex('payments_created_by_status_idx');
            $table->dropIndex('payments_payment_date_idx');
            $table->dropIndex('payments_created_at_idx');
        });

        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropIndex('sales_orders_status_idx');
            $table->dropIndex('sales_orders_created_by_status_idx');
            $table->dropIndex('sales_orders_order_date_idx');
            $table->dropIndex('sales_orders_created_at_idx');
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropIndex('purchase_orders_status_idx');
            $table->dropIndex('purchase_orders_created_by_status_idx');
            $table->dropIndex('purchase_orders_order_date_idx');
            $table->dropIndex('purchase_orders_created_at_idx');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('customers_name_idx');
            $table->dropIndex('customers_city_idx');
            $table->dropIndex('customers_state_idx');
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropIndex('vendors_name_idx');
            $table->dropIndex('vendors_city_idx');
            $table->dropIndex('vendors_state_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_category_idx');
            $table->dropIndex('products_type_idx');
            $table->dropIndex('products_name_idx');
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropIndex('journal_entries_status_idx');
            $table->dropIndex('journal_entries_posting_date_idx');
            $table->dropIndex('journal_entries_type_idx');
        });
    }
};

