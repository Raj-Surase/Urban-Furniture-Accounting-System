import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Printer,
  ChevronDown,
  ChevronRight,
  X,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Search,
  Filter,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { budgetsApi } from '../lib/api';
import { BudgetLineType } from '../types';
import { StatCardSkeleton } from '../components/common/StatCardSkeleton';

// ── SVG Donut Chart (no external dep) ──────────────────────────────────────────
interface DonutProps {
  achieved: number;
  committed: number;
  size?: number;
  strokeWidth?: number;
  onClick?: () => void;
}

const DonutChart: React.FC<DonutProps> = ({
  achieved,
  committed,
  size = 60,
  strokeWidth = 8,
  onClick,
}) => {
  const pct = committed > 0 ? Math.min((achieved / committed) * 100, 100) : 0;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const center = size / 2;

  const color =
    pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
      onClick={onClick}
    >
      <title>Click to view detail</title>
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="#2a2a3a"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Center label */}
      <text
        x={center}
        y={center + 4}
        textAnchor="middle"
        fontSize={size * 0.2}
        fontWeight="bold"
        fill="white"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
};

// ── Large Pie Modal ─────────────────────────────────────────────────────────────
interface PieModalProps {
  budget: any;
  onClose: () => void;
}

const PieModal: React.FC<PieModalProps> = ({ budget, onClose }) => {
  const totalCommitted = budget.total_committed ?? 0;
  const totalAchieved = budget.total_achieved ?? 0;
  const remaining = Math.max(0, totalCommitted - totalAchieved);
  const pct = totalCommitted > 0 ? Math.min((totalAchieved / totalCommitted) * 100, 100) : 0;

  const size = 260;
  const strokeWidth = 32;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const achievedDash = (pct / 100) * circ;
  const center = size / 2;
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e';

  const fmt = (v: number) =>
    '₹' + Math.round(v).toLocaleString('en-IN');

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#18181f] border border-white/[0.1] rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 space-y-6"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white">{budget.name}</h3>
            <p className="text-xs text-[#8a8a9a] mt-0.5">Budget vs Actual</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#9090a0] hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Large Donut */}
        <div className="flex justify-center">
          <div className="relative">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle cx={center} cy={center} r={r} fill="none" stroke="#2a2a3a" strokeWidth={strokeWidth} />
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${achievedDash} ${circ - achievedDash}`}
                strokeDashoffset={circ * 0.25}
                strokeLinecap="round"
              />
              {remaining > 0 && achievedDash < circ && (
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke="#f43f5e40"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circ - achievedDash} ${achievedDash}`}
                  strokeDashoffset={circ * 0.25 - achievedDash}
                  strokeLinecap="round"
                />
              )}
              <text x={center} y={center - 12} textAnchor="middle" fontSize="32" fontWeight="bold" fill="white">
                {Math.round(pct)}%
              </text>
              <text x={center} y={center + 14} textAnchor="middle" fontSize="11" fill="#8a8a9a">
                Achievement
              </text>
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-emerald-400 font-semibold">Achieved</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">{fmt(totalAchieved)}</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[11px] text-rose-400 font-semibold">Remaining</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">{fmt(remaining)}</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] flex justify-between text-xs">
          <span className="text-[#8a8a9a]">Total Committed</span>
          <span className="font-mono font-bold text-white">{fmt(totalCommitted)}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Status badge ────────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    draft: 'bg-[#2a2a3a] text-[#9090a0] border-white/[0.06]',
    confirm: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    revised: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
  };
  const labels: Record<string, string> = {
    draft: 'Draft',
    confirm: 'Confirmed',
    revised: 'Revised',
    cancelled: 'Cancelled',
  };
  const cls = map[status] || map.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {labels[status] || status}
    </span>
  );
};

type PerformanceTier = 'all' | 'over' | 'warning' | 'ontrack';
type SortOption = 'committed_desc' | 'achieved_desc' | 'progress_desc' | 'name_asc';

// ── Main Page ───────────────────────────────────────────────────────────────────
export const BudgetReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pieModalBudget, setPieModalBudget] = useState<any | null>(null);

  // Filter Operations State
  const [fiscalYear, setFiscalYear] = useState('2026');
  const [statusFilter, setStatusFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceTier>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('committed_desc');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await budgetsApi.list();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setBudgets(list);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleResetFilters = () => {
    setFiscalYear('all');
    setStatusFilter('all');
    setPerformanceFilter('all');
    setSearchQuery('');
    setSortBy('committed_desc');
  };

  const filtered = useMemo(() => {
    return budgets
      .filter((b) => {
        // Year filter
        const yearMatch =
          fiscalYear === 'all' ||
          !fiscalYear ||
          b.start_date?.startsWith(fiscalYear) ||
          b.end_date?.startsWith(fiscalYear);

        // Status filter
        const statusMatch = statusFilter === 'all' || b.status === statusFilter;

        // Performance Tier filter
        const pct = b.progress_percent ?? 0;
        let perfMatch = true;
        if (performanceFilter === 'over') {
          perfMatch = pct >= 100;
        } else if (performanceFilter === 'warning') {
          perfMatch = pct >= 80 && pct < 100;
        } else if (performanceFilter === 'ontrack') {
          perfMatch = pct < 80;
        }

        // Live search filter
        let searchMatch = true;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = b.name?.toLowerCase().includes(q);
          const userMatch = b.responsible?.name?.toLowerCase().includes(q);
          const lineMatch = (b.computed_lines || []).some((l: any) =>
            l.analytic_account_name?.toLowerCase().includes(q)
          );
          searchMatch = Boolean(nameMatch || userMatch || lineMatch);
        }

        return yearMatch && statusMatch && perfMatch && searchMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'committed_desc') {
          return (b.total_committed ?? 0) - (a.total_committed ?? 0);
        } else if (sortBy === 'achieved_desc') {
          return (b.total_achieved ?? 0) - (a.total_achieved ?? 0);
        } else if (sortBy === 'progress_desc') {
          return (b.progress_percent ?? 0) - (a.progress_percent ?? 0);
        } else if (sortBy === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        return 0;
      });
  }, [budgets, fiscalYear, statusFilter, performanceFilter, searchQuery, sortBy]);

  const fmt = (v: number | undefined) =>
    '₹' + Math.round(v ?? 0).toLocaleString('en-IN');

  const variance = (b: any) => (b.total_achieved ?? 0) - (b.total_committed ?? 0);

  const totalCommittedSum = filtered.reduce((s, b) => s + (b.total_committed ?? 0), 0);
  const totalAchievedSum = filtered.reduce((s, b) => s + (b.total_achieved ?? 0), 0);
  const overallRate = totalCommittedSum > 0 ? Math.round((totalAchievedSum / totalCommittedSum) * 100) : 0;

  return (
    <>
      {/* Pie Modal */}
      <AnimatePresence>
        {pieModalBudget && (
          <PieModal
            budget={pieModalBudget}
            onClose={() => setPieModalBudget(null)}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6 max-w-6xl mx-auto pb-12 print:pb-0">
        {/* ── Top Header Controls & Actions ── */}
        <div className="bg-[#18181f]/90 border border-white/[0.08] p-5 rounded-2xl shadow-obsidian-card print:hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#9090a0] hover:text-white transition-all border border-white/[0.06]"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#7042f4]" />
                  Budget Performance Report
                </h1>
                <p className="text-xs text-[#8a8a9a] mt-0.5">
                  Analytical budget vs. actual expenditure telemetry & cost-center analytics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Refresh */}
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#9090a0] hover:text-white transition-all border border-white/[0.06]"
                title="Refresh Report Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7042f4]' : ''}`} />
              </button>

              {/* Print */}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>

              {/* New Budget */}
              <button
                onClick={() => navigate('/budgets?new=true')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7042f4] hover:bg-[#5f32e6] text-white text-xs font-semibold shadow-lg shadow-[#7042f4]/25 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Budget</span>
              </button>
            </div>
          </div>

          {/* ── Independent Filters Operations Bar ── */}
          <div className="pt-3 border-t border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Fiscal Year & Status Selectors */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Fiscal Year */}
              <div className="flex items-center gap-1 bg-[#121216] px-2.5 py-1.5 rounded-xl border border-white/[0.08]">
                <span className="text-[10px] uppercase text-[#707080] font-semibold">Year:</span>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#18181f]">All Years</option>
                  <option value="2024" className="bg-[#18181f]">FY 2024</option>
                  <option value="2025" className="bg-[#18181f]">FY 2025</option>
                  <option value="2026" className="bg-[#18181f]">FY 2026</option>
                  <option value="2027" className="bg-[#18181f]">FY 2027</option>
                  <option value="2028" className="bg-[#18181f]">FY 2028</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-[#121216] px-2.5 py-1.5 rounded-xl border border-white/[0.08]">
                <span className="text-[10px] uppercase text-[#707080] font-semibold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#18181f]">All Statuses</option>
                  <option value="confirm" className="bg-[#18181f]">Confirmed</option>
                  <option value="revised" className="bg-[#18181f]">Revised</option>
                  <option value="draft" className="bg-[#18181f]">Draft</option>
                  <option value="cancelled" className="bg-[#18181f]">Cancelled</option>
                </select>
              </div>

              {/* Performance Tier Filter Pills */}
              <div className="flex items-center bg-[#121216] p-0.5 rounded-xl border border-white/[0.08]">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'over', label: 'Over Budget' },
                  { key: 'warning', label: 'Near Limit' },
                  { key: 'ontrack', label: 'On Track' },
                ].map((tier) => (
                  <button
                    key={tier.key}
                    onClick={() => setPerformanceFilter(tier.key as PerformanceTier)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      performanceFilter === tier.key
                        ? 'bg-[#7042f4]/30 text-purple-300 font-semibold border border-[#7042f4]/40'
                        : 'text-[#8a8a9a] hover:text-white'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Search & Sort Operations */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-3 h-3 text-[#707080] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search budget / cost center..."
                  className="bg-[#121216] border border-white/[0.08] text-white text-xs pl-7 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-[#7042f4]/60 w-44 sm:w-52 placeholder:text-[#555566]"
                />
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1 bg-[#121216] px-2.5 py-1.5 rounded-xl border border-white/[0.08]">
                <SlidersHorizontal className="w-3 h-3 text-[#707080]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="committed_desc" className="bg-[#18181f]">Highest Committed</option>
                  <option value="achieved_desc" className="bg-[#18181f]">Highest Achieved</option>
                  <option value="progress_desc" className="bg-[#18181f]">Highest %</option>
                  <option value="name_asc" className="bg-[#18181f]">Name (A-Z)</option>
                </select>
              </div>

              {/* Reset Filters */}
              {(fiscalYear !== '2026' || statusFilter !== 'all' || performanceFilter !== 'all' || searchQuery || sortBy !== 'committed_desc') && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-[11px] text-[#8a8a9a] hover:text-rose-400 px-2 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Summary KPI Row ── */}
        {loading ? (
          <StatCardSkeleton count={4} columns="grid-cols-2 sm:grid-cols-4" className="print:hidden" />
        ) : filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
            <div className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl p-4">
              <p className="text-[11px] text-[#8a8a9a] uppercase tracking-wider">Filtered Budgets</p>
              <p className="text-xl font-bold mt-1 text-white">{filtered.length}</p>
              <p className="text-[10px] text-[#707080] mt-0.5">of {budgets.length} total registered</p>
            </div>

            <div className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl p-4">
              <p className="text-[11px] text-[#8a8a9a] uppercase tracking-wider">Total Committed</p>
              <p className="text-xl font-bold mt-1 font-mono text-indigo-400">{fmt(totalCommittedSum)}</p>
              <p className="text-[10px] text-[#707080] mt-0.5">Approved fiscal envelope</p>
            </div>

            <div className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl p-4">
              <p className="text-[11px] text-[#8a8a9a] uppercase tracking-wider">Total Achieved</p>
              <p className="text-xl font-bold mt-1 font-mono text-emerald-400">{fmt(totalAchievedSum)}</p>
              <p className="text-[10px] text-[#707080] mt-0.5">Realized GL expenditures</p>
            </div>

            <div className="bg-[#18181f]/90 border border-white/[0.08] rounded-2xl p-4">
              <p className="text-[11px] text-[#8a8a9a] uppercase tracking-wider">Overall Achievement</p>
              <p className={`text-xl font-bold mt-1 font-mono ${overallRate >= 100 ? 'text-rose-400' : overallRate >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {overallRate}%
              </p>
              <p className="text-[10px] text-[#707080] mt-0.5">Aggregate spend ratio</p>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-[#18181f]/95 border border-white/[0.08] rounded-2xl overflow-hidden shadow-obsidian-card">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_0.8fr_1fr_1fr_1fr_1fr_64px] gap-2 px-5 py-3 bg-[#141418] border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-wider text-[#6a6a7a]">
            <span>Budget Name</span>
            <span>Period</span>
            <span>Responsible</span>
            <span>Status</span>
            <span className="text-right">Committed</span>
            <span className="text-right">Achieved</span>
            <span className="text-right">Variance</span>
            <span className="text-right">Progress</span>
            <span className="text-center">Chart</span>
          </div>

          {loading ? (
            <div className="divide-y divide-white/[0.04] animate-pulse">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[2fr_1.5fr_1fr_0.8fr_1fr_1fr_1fr_1fr_64px] gap-2 px-5 py-4 items-center bg-white/[0.01]"
                >
                  <div className="space-y-1.5">
                    <div className="h-4 w-40 bg-white/[0.08] rounded" />
                    <div className="h-3 w-24 bg-white/[0.04] rounded" />
                  </div>
                  <div className="h-3.5 w-28 bg-white/[0.05] rounded" />
                  <div className="h-3.5 w-20 bg-white/[0.05] rounded" />
                  <div className="h-5 w-16 bg-white/[0.06] rounded-full" />
                  <div className="h-3.5 w-20 bg-white/[0.06] rounded ml-auto" />
                  <div className="h-3.5 w-20 bg-white/[0.06] rounded ml-auto" />
                  <div className="h-3.5 w-16 bg-white/[0.05] rounded ml-auto" />
                  <div className="h-3.5 w-12 bg-white/[0.05] rounded ml-auto" />
                  <div className="w-8 h-8 rounded-full bg-white/[0.06] mx-auto" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#6a6a7a]">
              <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-semibold text-white">No budgets matching active filters</p>
              <p className="text-xs mt-1">Try resetting the fiscal year, status, or search query</p>
              <button
                onClick={handleResetFilters}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((budget) => {
                const isExpanded = expandedId === budget.id;
                const vari = variance(budget);
                const pct = budget.progress_percent ?? 0;
                const lines = budget.computed_lines ?? [];

                return (
                  <div key={budget.id}>
                    {/* Row */}
                    <motion.div
                      className="grid grid-cols-[2fr_1.5fr_1fr_0.8fr_1fr_1fr_1fr_1fr_64px] gap-2 px-5 py-3.5 hover:bg-white/[0.02] transition-colors items-center cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : budget.id)}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                    >
                      {/* Budget Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[#7042f4] shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[#6a6a7a] shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-white truncate">{budget.name}</span>
                      </div>

                      {/* Period */}
                      <span className="text-xs text-[#8a8a9a] font-mono">
                        {budget.start_date?.slice(0, 7)} → {budget.end_date?.slice(0, 7)}
                      </span>

                      {/* Responsible */}
                      <span className="text-xs text-[#8a8a9a] truncate">
                        {budget.responsible?.name ?? '—'}
                      </span>

                      {/* Status */}
                      <StatusBadge status={budget.status} />

                      {/* Committed */}
                      <span className="text-xs font-mono text-right text-indigo-300">
                        {fmt(budget.total_committed)}
                      </span>

                      {/* Achieved */}
                      <span className="text-xs font-mono text-right text-emerald-400">
                        {fmt(budget.total_achieved)}
                      </span>

                      {/* Variance */}
                      <span
                        className={`text-xs font-mono text-right flex items-center justify-end gap-1 ${
                          vari >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {vari >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {fmt(Math.abs(vari))}
                      </span>

                      {/* Progress bar */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono text-white">{Math.round(pct)}%</span>
                        <div className="w-full h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Pie Chart (click opens modal) */}
                      <div
                        className="flex justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPieModalBudget(budget);
                        }}
                      >
                        <DonutChart
                          achieved={budget.total_achieved ?? 0}
                          committed={budget.total_committed ?? 1}
                          size={48}
                          strokeWidth={6}
                          onClick={() => setPieModalBudget(budget)}
                        />
                      </div>
                    </motion.div>

                    {/* Expanded analytic breakdown */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          key="expanded"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-[#121216] border-t border-white/[0.04] px-5 py-4">
                            {lines.length === 0 ? (
                              <p className="text-xs text-[#6a6a7a] py-2 text-center">
                                No analytic lines found for this budget.
                              </p>
                            ) : (
                              <>
                                <p className="text-[10px] text-[#7042f4] font-bold uppercase tracking-wider mb-3">
                                  Analytic Account Breakdown
                                </p>
                                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                                  {/* Sub-table header */}
                                  <div className="grid grid-cols-[2fr_0.6fr_1fr_1fr_1fr_1.5fr] gap-2 px-4 py-2 bg-[#1a1a24] text-[10px] font-bold uppercase tracking-wider text-[#5a5a6a]">
                                    <span>Analytic Account</span>
                                    <span>Type</span>
                                    <span className="text-right">Committed</span>
                                    <span className="text-right">Achieved</span>
                                    <span className="text-right">Variance</span>
                                    <span>Progress</span>
                                  </div>
                                  <div className="divide-y divide-white/[0.04]">
                                    {lines.map((line: any, i: number) => {
                                      const lv = (line.achieved_amount ?? 0) - (line.committed_amount ?? 0);
                                      const lp = line.achieved_percent ?? 0;
                                      return (
                                        <div
                                          key={i}
                                          className="grid grid-cols-[2fr_0.6fr_1fr_1fr_1fr_1.5fr] gap-2 px-4 py-2.5 hover:bg-white/[0.02] items-center"
                                        >
                                          <span className="text-xs text-white font-medium truncate">
                                            {line.analytic_account_name ?? '—'}
                                          </span>
                                          <span
                                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold uppercase ${
                                              line.type === BudgetLineType.INCOME
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-rose-500/10 text-rose-400'
                                            }`}
                                          >
                                            {line.type}
                                          </span>
                                          <span className="text-xs font-mono text-right text-indigo-300">
                                            {fmt(line.committed_amount)}
                                          </span>
                                          <span className="text-xs font-mono text-right text-emerald-400">
                                            {fmt(line.achieved_amount)}
                                          </span>
                                          <span
                                            className={`text-xs font-mono text-right ${
                                              lv >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                            }`}
                                          >
                                            {lv >= 0 ? '+' : ''}
                                            {fmt(lv)}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
                                              <div
                                                className={`h-full rounded-full ${
                                                  lp >= 80
                                                    ? 'bg-emerald-500'
                                                    : lp >= 50
                                                    ? 'bg-amber-500'
                                                    : 'bg-rose-500'
                                                }`}
                                                style={{ width: `${Math.min(lp, 100)}%` }}
                                              />
                                            </div>
                                            <span className="text-[10px] font-mono text-[#8a8a9a] shrink-0">
                                              {Math.round(lp)}%
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer note ── */}
        {!loading && (
          <p className="text-center text-[11px] text-[#5a5a6a] print:hidden">
            Showing {filtered.length} of {budgets.length} budgets ·{' '}
            <button
              onClick={() => navigate('/budgets')}
              className="text-[#7042f4] hover:underline"
            >
              Manage Budgets →
            </button>
          </p>
        )}
      </div>
    </>
  );
};

export default BudgetReportPage;
