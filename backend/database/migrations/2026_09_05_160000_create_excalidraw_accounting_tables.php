<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update users table for login_id and roles
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'login_id')) {
                $table->string('login_id', 30)->nullable()->unique()->after('id');
            }
        });

        // 2. Create journals table
        if (!Schema::hasTable('journals')) {
            Schema::create('journals', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->enum('type', ['sales', 'purchase', 'bank', 'cash'])->default('sales');
                $table->foreignId('default_account_id')->nullable()->constrained('accounts')->nullOnDelete();
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 3. Create analytic_accounts table
        if (!Schema::hasTable('analytic_accounts')) {
            Schema::create('analytic_accounts', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->nullable();
                $table->enum('type', ['income', 'expense'])->default('expense');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 4. Create budgets table
        if (!Schema::hasTable('budgets')) {
            Schema::create('budgets', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->date('start_date');
                $table->date('end_date');
                $table->unsignedBigInteger('responsible_id')->nullable();
                $table->enum('status', ['draft', 'confirm', 'revised', 'cancelled'])->default('draft');
                $table->foreignId('original_budget_id')->nullable()->constrained('budgets')->nullOnDelete();
                $table->foreignId('revised_budget_id')->nullable()->constrained('budgets')->nullOnDelete();
                $table->timestamps();
            });
        }

        // 5. Create budget_lines table
        if (!Schema::hasTable('budget_lines')) {
            Schema::create('budget_lines', function (Blueprint $table) {
                $table->id();
                $table->foreignId('budget_id')->constrained('budgets')->cascadeOnDelete();
                $table->foreignId('analytic_account_id')->constrained('analytic_accounts')->cascadeOnDelete();
                $table->enum('type', ['income', 'expense'])->default('expense');
                $table->decimal('committed_amount', 15, 2)->default(0);
                $table->timestamps();
            });
        }

        // 6. Add analytic_account_id to purchase_order_items, sales_order_items, invoice_line_items
        Schema::table('purchase_order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_order_items', 'analytic_account_id')) {
                $table->foreignId('analytic_account_id')->nullable()->after('product_id')->constrained('analytic_accounts')->nullOnDelete();
            }
        });

        Schema::table('sales_order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_order_items', 'analytic_account_id')) {
                $table->foreignId('analytic_account_id')->nullable()->after('product_id')->constrained('analytic_accounts')->nullOnDelete();
            }
        });

        Schema::table('invoice_line_items', function (Blueprint $table) {
            if (!Schema::hasColumn('invoice_line_items', 'analytic_account_id')) {
                $table->foreignId('analytic_account_id')->nullable()->after('account_id')->constrained('analytic_accounts')->nullOnDelete();
            }
        });

        // 7. Add journal_id to journal_entries, and partner_id to journal_entry_lines
        Schema::table('journal_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('journal_entries', 'journal_id')) {
                $table->foreignId('journal_id')->nullable()->after('entry_number')->constrained('journals')->nullOnDelete();
            }
        });

        Schema::table('journal_entry_lines', function (Blueprint $table) {
            if (!Schema::hasColumn('journal_entry_lines', 'partner_id')) {
                $table->unsignedBigInteger('partner_id')->nullable()->after('account_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('journal_entry_lines', function (Blueprint $table) {
            if (Schema::hasColumn('journal_entry_lines', 'partner_id')) {
                $table->dropColumn('partner_id');
            }
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            if (Schema::hasColumn('journal_entries', 'journal_id')) {
                $table->dropConstrainedForeignId('journal_id');
            }
        });

        Schema::table('invoice_line_items', function (Blueprint $table) {
            if (Schema::hasColumn('invoice_line_items', 'analytic_account_id')) {
                $table->dropConstrainedForeignId('analytic_account_id');
            }
        });

        Schema::table('sales_order_items', function (Blueprint $table) {
            if (Schema::hasColumn('sales_order_items', 'analytic_account_id')) {
                $table->dropConstrainedForeignId('analytic_account_id');
            }
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            if (Schema::hasColumn('purchase_order_items', 'analytic_account_id')) {
                $table->dropConstrainedForeignId('analytic_account_id');
            }
        });

        Schema::dropIfExists('budget_lines');
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('analytic_accounts');
        Schema::dropIfExists('journals');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'login_id')) {
                $table->dropColumn('login_id');
            }
        });
    }
};
