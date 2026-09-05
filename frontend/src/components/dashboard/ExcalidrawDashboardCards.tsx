import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ShoppingBag, PieChart, Plus, BarChart3, ArrowRight, FileText, Receipt, CreditCard, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ExcalidrawDashboardCardsProps {
  salesData?: { all: number; confirmed: number; draft: number };
  purchaseData?: { all: number; confirmed: number; draft: number };
  budgetData?: { budget: number; committed: number; achieved: number };
  loading?: boolean;
}

export const ExcalidrawDashboardCards: React.FC<ExcalidrawDashboardCardsProps> = ({
  salesData = { all: 0, confirmed: 0, draft: 0 },
  purchaseData = { all: 0, confirmed: 0, draft: 0 },
  budgetData = { budget: 0, committed: 0, achieved: 0 },
  loading = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. SALES CARD */}
      <motion.div
        whileHover={{ y: -3 }}
        className="p-6 rounded-2xl bg-[#18181f]/90 border border-white/[0.08] shadow-obsidian-card hover:border-[#7042f4]/40 transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#7042f4]/15 border border-[#7042f4]/30 text-[#c084fc]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Sales</h2>
              <span className="text-[11px] text-[#8a8a9a]">Customer orders & billing</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/sales-orders?new=true')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7042f4] hover:bg-[#5f32e6] text-white text-xs font-semibold shadow-md shadow-[#7042f4]/25 transition-all cursor-pointer"
            title="Create New Sales Order"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Metrics Grid: All, Confirmed, Draft */}
        <div className="grid grid-cols-3 gap-2 py-4 text-center">
          <div className="p-3 rounded-xl bg-[#121216] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a8a9a] block uppercase tracking-wider">All</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {loading ? '—' : salesData.all}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#121216] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a8a9a] block uppercase tracking-wider">Confirmed</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              {loading ? '—' : salesData.confirmed}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#121216] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a8a9a] block uppercase tracking-wider">Draft</span>
            <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
              {loading ? '—' : salesData.draft}
            </span>
          </div>
        </div>

        {/* Sub-operations */}
        <div className="flex items-center gap-2 pb-3">
          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e2a] hover:bg-[#27273a] border border-white/[0.06] text-[11px] text-[#9090a0] hover:text-white transition-all"
          >
            <FileText className="w-3 h-3 text-indigo-400" />
            Invoices →
          </button>
          <button
            onClick={() => navigate('/payments?type=receive')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e2a] hover:bg-[#27273a] border border-white/[0.06] text-[11px] text-[#9090a0] hover:text-white transition-all"
          >
            <Receipt className="w-3 h-3 text-emerald-400" />
            Receipts →
          </button>
        </div>

        <button
          onClick={() => navigate('/sales-orders')}
          className="text-xs text-[#7042f4] hover:text-[#a855f7] font-semibold flex items-center justify-between pt-2 border-t border-white/[0.04] transition-colors"
        >
          <span>View All Sales Orders</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* 2. PURCHASE CARD */}
      <motion.div
        whileHover={{ y: -3 }}
        className="p-6 rounded-2xl bg-[#18181f]/90 border border-white/[0.08] shadow-obsidian-card hover:border-amber-400/40 transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Purchase</h2>
              <span className="text-[11px] text-[#8a8a9a]">Vendor orders & bills</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/purchase-orders?new=true')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-500/25 transition-all cursor-pointer"
            title="Create New Purchase Order"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Metrics Grid: All, Confirmed, Draft */}
        <div className="grid grid-cols-3 gap-2 py-4 text-center">
          <div className="p-3 rounded-xl bg-[#121216] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a8a9a] block uppercase tracking-wider">All</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {loading ? '—' : purchaseData.all}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#121216] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a8a9a] block uppercase tracking-wider">Confirmed</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              {loading ? '—' : purchaseData.confirmed}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#121216] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a8a9a] block uppercase tracking-wider">Draft</span>
            <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
              {loading ? '—' : purchaseData.draft}
            </span>
          </div>
        </div>

        {/* Sub-operations */}
        <div className="flex items-center gap-2 pb-3">
          <button
            onClick={() => navigate('/bills')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e2a] hover:bg-[#27273a] border border-white/[0.06] text-[11px] text-[#9090a0] hover:text-white transition-all"
          >
            <FileText className="w-3 h-3 text-amber-400" />
            Bills →
          </button>
          <button
            onClick={() => navigate('/payments?type=send')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e2a] hover:bg-[#27273a] border border-white/[0.06] text-[11px] text-[#9090a0] hover:text-white transition-all"
          >
            <CreditCard className="w-3 h-3 text-rose-400" />
            Payments →
          </button>
        </div>

        <button
          onClick={() => navigate('/purchase-orders')}
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center justify-between pt-2 border-t border-white/[0.04] transition-colors"
        >
          <span>View All Purchase Orders</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* 3. BUDGET REPORTS CARD */}
      <motion.div
        whileHover={{ y: -3 }}
        className="p-6 rounded-2xl bg-[#18181f]/90 border border-white/[0.08] shadow-obsidian-card hover:border-purple-400/40 transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Budget Reports</h2>
              <span className="text-[11px] text-[#8a8a9a]">Analytical budget variance</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/reports/budget')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-500/25 transition-all cursor-pointer"
            title="Open Budget Report"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
        </div>

        {/* Metrics Grid: Budget count, Committed ₹, Achieved ₹ */}
        <div className="grid grid-cols-3 gap-2 py-4 text-center">
          <div className="p-3 rounded-xl bg-[#121216] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a8a9a] block uppercase tracking-wider">Budget</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {loading ? '—' : budgetData.budget}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#121216] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a8a9a] block uppercase tracking-wider">Committed</span>
            <span className="text-xs font-bold font-mono text-indigo-300 mt-2 block truncate">
              {loading ? '—' : `₹${Math.round(budgetData.committed).toLocaleString('en-IN')}`}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#121216] border border-white/[0.04]">
            <span className="text-[11px] text-[#8a8a9a] block uppercase tracking-wider">Achieved</span>
            <span className="text-xs font-bold font-mono text-emerald-400 mt-2 block truncate">
              {loading ? '—' : `₹${Math.round(budgetData.achieved).toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>

        {/* Sub-operations */}
        <div className="flex items-center gap-2 pb-3">
          <button
            onClick={() => navigate('/budgets')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e2a] hover:bg-[#27273a] border border-white/[0.06] text-[11px] text-[#9090a0] hover:text-white transition-all"
          >
            <Banknote className="w-3 h-3 text-purple-400" />
            Manage →
          </button>
          <button
            onClick={() => navigate('/reports/budget')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e2a] hover:bg-[#27273a] border border-white/[0.06] text-[11px] text-[#9090a0] hover:text-white transition-all"
          >
            <BarChart3 className="w-3 h-3 text-purple-400" />
            Budget Report →
          </button>
        </div>

        <button
          onClick={() => navigate('/budgets')}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center justify-between pt-2 border-t border-white/[0.04] transition-colors"
        >
          <span>Manage Analytical Budgets</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </div>
  );
};
