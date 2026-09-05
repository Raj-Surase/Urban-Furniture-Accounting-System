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
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number', 64)->unique();
            $table->string('direction', 20)->default('inbound'); // inbound, outbound
            $table->string('flow_type', 50)->default('invoice_settlement'); // invoice_settlement, sales_order_advance, vendor_payout, refund
            $table->string('status', 30)->default('initiated'); // initiated, order_created, authorized, captured, failed, refunded, partially_refunded
            $table->string('party_type', 30); // customer, vendor
            $table->unsignedBigInteger('party_id');
            $table->string('source_type')->nullable(); // App\Models\Invoice, App\Models\SalesOrder
            $table->unsignedBigInteger('source_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('INR');
            $table->string('gateway', 50)->default('razorpay');
            $table->string('razorpay_order_id')->nullable()->index();
            $table->string('razorpay_payment_id')->nullable()->index();
            $table->string('razorpay_signature')->nullable();
            $table->string('razorpay_refund_id')->nullable();
            $table->decimal('gateway_fee', 10, 2)->default(0.00);
            $table->decimal('gateway_tax', 10, 2)->default(0.00);
            $table->json('method_details')->nullable();
            $table->string('error_code')->nullable();
            $table->text('error_description')->nullable();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->string('idempotency_key')->nullable()->index();
            $table->json('metadata')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['party_type', 'party_id']);
            $table->index(['source_type', 'source_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};

