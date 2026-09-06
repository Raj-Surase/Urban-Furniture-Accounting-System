<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->boolean('is_custom')->default(false)->after('total_amount')->index();
            $table->json('customization_details')->nullable()->after('is_custom');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropIndex(['is_custom']);
            $table->dropColumn(['is_custom', 'customization_details']);
        });
    }
};

