<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("vendors", function (Blueprint $table) {
            $table->id();
            $table->string("name");
            $table->string("code")->unique();
            $table->string("contact_person")->nullable();
            $table->string("email")->nullable();
            $table->string("phone")->nullable();
            $table->text("address")->nullable();
            $table->string("city")->nullable();
            $table->string("state")->nullable();
            $table->string("country")->default("India");
            $table->string("gstin")->nullable();
            $table->string("pan")->nullable();
            $table->integer("payment_terms_days")->default(30);
            $table->foreignId("payable_account_id")->nullable()->constrained("accounts")->nullOnDelete();
            $table->string("currency")->default("INR");
            $table->boolean("is_active")->default(true);
            $table->text("notes")->nullable();
            $table->foreignId("created_by")->nullable()->constrained("users")->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("vendors");
    }
};
