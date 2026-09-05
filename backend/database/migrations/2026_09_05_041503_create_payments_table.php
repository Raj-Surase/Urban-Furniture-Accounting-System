<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("payments", function (Blueprint $table) {
            $table->id();
            $table->string("payment_number")->unique();
            $table->enum("type", ["received", "made"]);
            $table->foreignId("invoice_id")->nullable()->constrained("invoices")->nullOnDelete();
            $table->string("party_type");
            $table->unsignedBigInteger("party_id");
            $table->decimal("amount", 15, 2);
            $table->date("payment_date");
            $table->enum("payment_method", ["bank_transfer", "cheque", "cash", "upi"])->default("bank_transfer");
            $table->string("reference_number")->nullable();
            $table->foreignId("bank_account_id")->nullable()->constrained("accounts")->nullOnDelete();
            $table->enum("status", ["pending", "cleared", "failed", "reversed"])->default("cleared");
            $table->text("notes")->nullable();
            $table->foreignId("reconciled_by")->nullable()->constrained("users")->nullOnDelete();
            $table->timestamp("reconciled_at")->nullable();
            $table->foreignId("created_by")->nullable()->constrained("users")->nullOnDelete();
            $table->timestamps();

            $table->index(["party_type", "party_id"]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("payments");
    }
};
