<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Return role-scoped KPI cards and executive metrics.
     * Admins and managers receive full financial KPIs (AR, AP, cash, revenue).
     * Standard users receive a personal work summary (drafts, order count).
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isAdmin() || $user->isManager()) {
             // --- Admin / Manager: Full financial + operations KPIs ---

            // Cash & Bank: pull balance from GL account code 1110
            $bankAcc = Account::where('code', '1110')->first();
            $bankBalance = $bankAcc ? (float) $bankAcc->current_balance : 0.00;

            // Gross revenue from GL account code 4100 (Sales Revenue)
            $revAcc = Account::where('code', '4100')->first();
            $revAcc?->recalculateBalance();
            $totalRevenue = $revAcc ? (float) $revAcc->current_balance : 0.00;

            // Accounts Receivable: sum of balance_due on approved/partially-paid sales invoices
            $arTotal = (float) Invoice::where('type', 'receivable')
                ->whereIn('status', ['approved', 'partially_paid'])
                ->sum('balance_due');

            // Accounts Payable: sum of balance_due on approved/partially-paid purchase invoices
            $apTotal = (float) Invoice::where('type', 'payable')
                ->whereIn('status', ['approved', 'partially_paid'])
                ->sum('balance_due');

            // Operational KPIs: stock alerts, pending orders, and open invoice count
            $lowStockCount = Product::whereColumn('current_stock', '<=', 'reorder_point')->count();
            $pendingPos = PurchaseOrder::whereIn('status', ['draft', 'submitted'])->count();
            $pendingSos = SalesOrder::whereIn('status', ['draft', 'confirmed'])->count();
            $unpaidInvoicesCount = Invoice::where('balance_due', '>', 0)->count();

            return response()->json([
                'role' => $user->role,
                'kpis' => [
                    'cash_bank_balance' => round($bankBalance, 2),
                    'total_revenue' => round($totalRevenue, 2),
                    'receivables_outstanding' => round($arTotal, 2),
                    'payables_outstanding' => round($apTotal, 2),
                    'low_stock_items_count' => $lowStockCount,
                    'pending_purchase_orders' => $pendingPos,
                    'pending_sales_orders' => $pendingSos,
                    'unpaid_invoices_count' => $unpaidInvoicesCount,
                ],
            ]);
        }

        // --- Standard User / Clerk: personal work summary ---
        $myDraftPos = PurchaseOrder::where('created_by', $user->id)->where('status', 'draft')->count();
        $myDraftSos = SalesOrder::where('created_by', $user->id)->where('status', 'draft')->count();
        $myTotalOrders = SalesOrder::where('created_by', $user->id)->count() + PurchaseOrder::where('created_by', $user->id)->count();
        $lowStockCount = Product::whereColumn('current_stock', '<=', 'reorder_point')->count();

        return response()->json([
            'role' => $user->role,
            'kpis' => [
                'my_draft_pos' => $myDraftPos,
                'my_draft_sos' => $myDraftSos,
                'my_total_orders' => $myTotalOrders,
                'catalog_low_stock_count' => $lowStockCount,
            ],
        ]);
    }

    /**
     * Return recent general ledger and operational audit trail.
     */
    public function recentTransactions(Request $request): JsonResponse
    {
        $entries = JournalEntry::with('lines.account')
            ->latest('posting_date')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => $entries,
        ]);
    }

    /**
     * Return actionable alerts (low stock, overdue invoices, pending PO approvals).
     * Intended for the dashboard notification panel — returns lightweight projections.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function alerts(Request $request): JsonResponse
    {
        $lowStock = Product::whereColumn('current_stock', '<=', 'reorder_point')
            ->select(['id', 'sku', 'name', 'current_stock', 'reorder_point'])
            ->get();

        $overdueInvoices = Invoice::where('due_date', '<', now()->toDateString())
            ->whereIn('status', ['approved', 'partially_paid'])
            ->where('balance_due', '>', 0)
            ->select(['id', 'invoice_number', 'type', 'due_date', 'balance_due', 'party_type', 'party_id'])
            ->get();

        $pendingPos = PurchaseOrder::where('status', 'submitted')
            ->with('vendor')
            ->select(['id', 'po_number', 'vendor_id', 'total_amount', 'created_at'])
            ->get();

        return response()->json([
            'low_stock' => $lowStock,
            'overdue_invoices' => $overdueInvoices,
            'pending_purchase_approvals' => $pendingPos,
        ]);
    }
}
