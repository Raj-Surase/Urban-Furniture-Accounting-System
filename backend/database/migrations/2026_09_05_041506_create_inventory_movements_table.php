<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("inventory_movements", function (Blueprint $table) {
            $table->id();
            $table->foreignId("product_id")->constrained("products")->cascadeOnDelete();
            $table->enum("type", ["purchase", "sale", "adjustment", "return"]);
            $table->decimal("quantity", 12, 2);
            $table->decimal("unit_cost", 15, 2)->default(0);
            $table->decimal("total_value", 15, 2)->default(0);
            $table->string("reference_type")->nullable();
            $table->unsignedBigInteger("reference_id")->nullable();
            $table->text("notes")->nullable();
            $table->foreignId("performed_by")->nullable()->constrained("users")->nullOnDelete();
            $table->timestamps();

            $table->index(["reference_type", "reference_id"]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("inventory_movements");
    }
};
