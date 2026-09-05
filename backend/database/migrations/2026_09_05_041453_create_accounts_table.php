<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("accounts", function (Blueprint $table) {
            $table->id();
            $table->string("code")->unique();
            $table->string("name");
            $table->enum("type", ["asset", "liability", "equity", "revenue", "expense"]);
            $table->string("sub_type")->nullable();
            $table->foreignId("parent_id")->nullable()->constrained("accounts")->nullOnDelete();
            $table->enum("normal_balance", ["debit", "credit"]);
            $table->decimal("opening_balance", 15, 2)->default(0);
            $table->decimal("current_balance", 15, 2)->default(0);
            $table->text("description")->nullable();
            $table->boolean("is_active")->default(true);
            $table->foreignId("created_by")->nullable()->constrained("users")->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("accounts");
    }
};
