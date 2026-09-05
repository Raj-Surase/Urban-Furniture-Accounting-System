<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("journal_entries", function (Blueprint $table) {
            $table->id();
            $table->string("entry_number")->unique();
            $table->enum("type", ["auto", "manual", "opening", "closing", "reversal", "adjustment"])->default("auto");
            $table->string("reference_type")->nullable();
            $table->unsignedBigInteger("reference_id")->nullable();
            $table->text("description");
            $table->date("posting_date");
            $table->integer("fiscal_year")->default(2026);
            $table->integer("period")->default(1);
            $table->enum("status", ["draft", "posted", "reversed"])->default("posted");
            $table->foreignId("reversed_entry_id")->nullable()->constrained("journal_entries")->nullOnDelete();
            $table->foreignId("posted_by")->nullable()->constrained("users")->nullOnDelete();
            $table->timestamp("posted_at")->nullable();
            $table->foreignId("created_by")->nullable()->constrained("users")->nullOnDelete();
            $table->timestamps();

            $table->index(["reference_type", "reference_id"]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("journal_entries");
    }
};
