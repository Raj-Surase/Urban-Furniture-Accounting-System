import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  Download,
  RotateCcw,
  Eye,
  EyeOff,
  DollarSign,
  Percent,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../lib/api';
import { exportIncomeStatementPdf } from '../components/pdf/ReportPdfGenerator';

type PresetKey = 'this-month' | 'last-month' | '30days' | 'quarter' | 'fy' | 'prev-fy' | 'all' | 'custom';
type CategoryFilter = 'all' | 'revenue' | 'cogs' | 'expense';

export const ProfitAndLossReportPage: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Filters & State
  const [fromDate, setFromDate] = useState<string>(`${currentYear}-01-01`);
  const [toDate, setToDate] = useState<string>(`${currentYear}-12-31`);
  const [activePreset, setActivePreset] = useState<PresetKey>('custom');
  const [showZeroBalances, setShowZeroBalances] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getIncomeStatement({
        from_date: fromDate,
        to_date: toDate,
        include_zero: showZeroBalances,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load profit and loss statement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate, showZeroBalances]);

  // Apply Quick Date Range Presets
  const handleApplyPreset = (preset: PresetKey) => {
    setActivePreset(preset);
    const now = new Date();
    const year = now.getFullYear();

    if (preset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'this-month') {
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setFromDate(`${year}-${month}-01`);
      setToDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'last-month') {
      const prevMonth = new Date(year, now.getMonth(), 0);
      const m = String(prevMonth.getMonth() + 1).padStart(2, '0');
      const y = prevMonth.getFullYear();
      const lastDay = prevMonth.getDate();
      setFromDate(`${y}-${m}-01`);
      setToDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === '30days') {
      const prior = new Date();
      prior.setDate(prior.getDate() - 30);
      setFromDate(prior.toISOString().slice(0, 10));
      setToDate(now.toISOString().slice(0, 10));
    } else if (preset === 'quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const qStart = new Date(year, qMonth, 1);
      const qEnd = new Date(year, qMonth + 3, 0);
      setFromDate(qStart.toISOString().slice(0, 10));
      setToDate(qEnd.toISOString().slice(0, 10));
    } else if (preset === 'fy') {
      const isPostMarch = now.getMonth() >= 3;
      const fyStartYear = isPostMarch ? year : year - 1;
      setFromDate(`${fyStartYear}-04-01`);
      setToDate(`${fyStartYear + 1}-03-31`);
    } else if (preset === 'prev-fy') {
      const isPostMarch = now.getMonth() >= 3;
      const prevFyStart = year - 1;
      setFromDate(`${prevFyStart}-04-01`);
      setToDate(`${prevFyStart + 1}-03-31`);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setShowZeroBalances(false);
    setActivePreset('custom');
    setFromDate(`${currentYear}-01-01`);
    setToDate(`${currentYear}-12-31`);
  };

  const handleExportPdf = () => {
    if (data) {
      exportIncomeStatementPdf(data, {
        fromDate,
        toDate,
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const revenues = data?.revenues || [];
  const expenses = data?.expenses || [];

  // Filter accounts by search query
  const matchesSearch = (item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.code && item.code.toLowerCase().includes(q)) ||
      (item.sub_type && item.sub_type.toLowerCase().includes(q))
    );
  };

  const filteredRevenues = useMemo(() => revenues.filter(matchesSearch), [revenues, searchQuery]);
  const filteredExpenses = useMemo(() => expenses.filter(matchesSearch), [expenses, searchQuery]);

  const cogsItems = filteredExpenses.filter((e: any) => e.code === '5100');
  const operatingExpenseItems = filteredExpenses.filter((e: any) => e.code !== '5100');

  const totalIncome = Number(data?.total_revenue) || 0;
  const cogsTotal = Number(data?.cogs) || 0;
  const operatingExpensesTotal = Number(data?.operating_expenses) || 0;
  const grossProfit = Number(data?.gross_profit) || (totalIncome - cogsTotal);
  const totalExpenses = cogsTotal + operatingExpensesTotal;
  const netIncome = Number(data?.net_profit) !== undefined ? Number(data?.net_profit) : (totalIncome - totalExpenses);

  const grossMarginPct = totalIncome > 0 ? ((grossProfit / totalIncome) * 100).toFixed(1) : '0.0';
  const netMarginPct = totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : '0.0';
  const opexRatioPct = totalIncome > 0 ? ((operatingExpensesTotal / totalIncome) * 100).toFixed(1) : '0.0';

  const showIncome = categoryFilter === 'all' || categoryFilter === 'revenue';
  const showCogs = categoryFilter === 'all' || categoryFilter === 'cogs';
  const showExpenses = categoryFilter === 'all' || categoryFilter === 'expense';

  const fmtCurrency = (val: number = 0) =>
    '₹' +
    Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 print:pb-0">
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
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                Profit and Loss Report
              </h1>
              <p className="text-xs text-[#8a8a9a] mt-0.5">
                Financial income, cost of goods sold, operating expenses, and net profit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Date range pickers */}
            <div className="flex items-center gap-1.5 bg-[#121216] border border-white/[0.08] px-2.5 py-1.5 rounded-xl text-xs text-white">
              <Calendar className="w-3.5 h-3.5 text-[#9090a0]" />
              <span className="text-[10px] uppercase text-[#707080] font-semibold">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-transparent font-mono text-white text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-[#121216] border border-white/[0.08] px-2.5 py-1.5 rounded-xl text-xs text-white">
              <span className="text-[10px] uppercase text-[#707080] font-semibold">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-transparent font-mono text-white text-xs focus:outline-none cursor-pointer"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchReport}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#9090a0] hover:text-white transition-all border border-white/[0.06]"
              title="Refresh Report Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Export Vector PDF */}
            <button
              onClick={handleExportPdf}
              disabled={loading || !data}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
              title="Download Vector PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* ── Independent Filters Operations Bar ── */}
        <div className="pt-3 border-t border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-[#707080] font-medium flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Presets:
            </span>
            <button
              onClick={() => handleApplyPreset('this-month')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activePreset === 'this-month'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-white/[0.04] text-[#9090a0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleApplyPreset('30days')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activePreset === '30days'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-white/[0.04] text-[#9090a0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handleApplyPreset('quarter')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activePreset === 'quarter'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-white/[0.04] text-[#9090a0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              This Quarter
            </button>
            <button
              onClick={() => handleApplyPreset('fy')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activePreset === 'fy'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-white/[0.04] text-[#9090a0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              FY 2026-27
            </button>
            <button
              onClick={() => handleApplyPreset('prev-fy')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activePreset === 'prev-fy'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-white/[0.04] text-[#9090a0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              FY 2025-26
            </button>
            <button
              onClick={() => handleApplyPreset('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activePreset === 'all'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-white/[0.04] text-[#9090a0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Classification Filter & Search Operations */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter Pills */}
            <div className="flex items-center bg-[#121216] p-0.5 rounded-xl border border-white/[0.08]">
              {(['all', 'revenue', 'cogs', 'expense'] as CategoryFilter[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium uppercase transition-all ${
                    categoryFilter === cat
                      ? 'bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/40'
                      : 'text-[#8a8a9a] hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat === 'cogs' ? 'COGS' : cat}
                </button>
              ))}
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 text-[#707080] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search account..."
                className="bg-[#121216] border border-white/[0.08] text-white text-xs pl-7 pr-3 py-1 rounded-xl focus:outline-none focus:border-emerald-500/60 w-36 sm:w-44 placeholder:text-[#555566]"
              />
            </div>

            {/* Zero-Balance Toggle */}
            <button
              onClick={() => setShowZeroBalances(!showZeroBalances)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                showZeroBalances
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/[0.04] text-[#8a8a9a] hover:text-white border-white/[0.06]'
              }`}
              title="Toggle zero-balance accounts"
            >
              {showZeroBalances ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-[#707080]" />}
              <span>{showZeroBalances ? '₹0 Visible' : '₹0 Hidden'}</span>
            </button>

            {/* Reset Filters */}
            {(searchQuery || categoryFilter !== 'all' || showZeroBalances || activePreset !== 'custom') && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] text-[#8a8a9a] hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Financial Performance Metric Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
        <div className="p-4 rounded-2xl bg-[#18181f] border border-white/[0.08]">
          <span className="text-[10px] uppercase font-bold text-[#8a8a9a] tracking-wider block">
            Operating Revenue
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {fmtCurrency(totalIncome)}
          </span>
          <span className="text-[11px] text-[#707080] mt-0.5 block">100% of top-line sales</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#18181f] border border-white/[0.08]">
          <span className="text-[10px] uppercase font-bold text-[#8a8a9a] tracking-wider block">
            Gross Profit
          </span>
          <span className="text-xl font-bold font-mono text-emerald-300 mt-1 block">
            {fmtCurrency(grossProfit)}
          </span>
          <span className="text-[11px] text-emerald-400/90 mt-0.5 block font-semibold">
            {grossMarginPct}% Gross Margin
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#18181f] border border-white/[0.08]">
          <span className="text-[10px] uppercase font-bold text-[#8a8a9a] tracking-wider block">
            Operating Expenses
          </span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {fmtCurrency(operatingExpensesTotal)}
          </span>
          <span className="text-[11px] text-[#707080] mt-0.5 block">
            {opexRatioPct}% OpEx Ratio
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            netIncome >= 0
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-rose-500/10 border-rose-500/20'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-[#8a8a9a] tracking-wider block">
            Net Profit / (Loss)
          </span>
          <span
            className={`text-xl font-bold font-mono mt-1 block ${
              netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {fmtCurrency(netIncome)}
          </span>
          <span
            className={`text-[11px] font-semibold mt-0.5 block ${
              netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {netMarginPct}% Net Margin
          </span>
        </div>
      </div>

      {/* ── Printable Report Document Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#18181f]/95 border border-white/[0.08] rounded-2xl p-8 shadow-obsidian-card space-y-8 print:border-none print:shadow-none print:p-0"
      >
        {/* Document Header */}
        <div className="border-b border-white/[0.08] pb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Profit and Loss Statement</h2>
            <p className="text-xs text-[#8a8a9a] mt-1">
              Urban Furniture Platform • {fromDate || 'Inception'} to {toDate || 'Present'}{' '}
              {searchQuery && `• Filtered by "${searchQuery}"`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#707080] block font-mono">Currency: INR (₹)</span>
            <span className="text-xs font-bold text-emerald-400">Accrual Basis</span>
          </div>
        </div>

        {/* 1. INCOME SECTION */}
        {showIncome && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Operating Revenue</span>
              </h3>
              <span className="text-xs text-[#8a8a9a]">Total Sales Income</span>
            </div>

            <div className="space-y-2 pl-4">
              {filteredRevenues.length > 0 ? (
                filteredRevenues.map((rev: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs py-1 text-[#d0d0dc] hover:text-white">
                    <span>
                      {rev.code && <span className="font-mono text-[#707080] mr-2">[{rev.code}]</span>}
                      {rev.name}
                    </span>
                    <span className="font-mono font-semibold text-white">
                      ₹{Number(rev.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#606070] italic pl-2">
                  No revenue items matching filter
                </div>
              )}
            </div>

            <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-white/[0.04] pl-2">
              <span>Total Revenue</span>
              <span className="font-mono text-emerald-400 text-sm">{fmtCurrency(totalIncome)}</span>
            </div>
          </div>
        )}

        {/* 2. COGS & GROSS PROFIT SECTION */}
        {showCogs && (
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>Cost of Goods Sold (COGS)</span>
              </h3>
              <span className="text-xs text-[#8a8a9a]">Direct Material & Workshop Cost</span>
            </div>

            <div className="space-y-2 pl-4">
              {cogsItems.length > 0 ? (
                cogsItems.map((c: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs py-1 text-[#d0d0dc] hover:text-white">
                    <span>
                      {c.code && <span className="font-mono text-[#707080] mr-2">[{c.code}]</span>}
                      {c.name}
                    </span>
                    <span className="font-mono font-semibold text-rose-400">
                      - ₹{Number(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-xs py-1 text-[#d0d0dc]">
                  <span>Direct Cost of Materials</span>
                  <span className="font-mono font-semibold text-rose-400">
                    - {fmtCurrency(cogsTotal)}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex justify-between items-center text-xs font-bold">
              <span className="text-emerald-300">Gross Operating Profit:</span>
              <span className="font-mono text-emerald-400 text-sm">
                {fmtCurrency(grossProfit)} ({grossMarginPct}%)
              </span>
            </div>
          </div>
        )}

        {/* 3. OPERATING EXPENSES SECTION */}
        {showExpenses && (
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                <span>Operating Expenses</span>
              </h3>
              <span className="text-xs text-[#8a8a9a]">Overheads & Administration</span>
            </div>

            <div className="space-y-2 pl-4">
              {operatingExpenseItems.length > 0 ? (
                operatingExpenseItems.map((exp: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs py-1 text-[#d0d0dc] hover:text-white">
                    <span>
                      {exp.code && <span className="font-mono text-[#707080] mr-2">[{exp.code}]</span>}
                      {exp.name}
                    </span>
                    <span className="font-mono font-semibold text-neutral-300">
                      ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#606070] italic pl-2">
                  No operating expenses matching filter
                </div>
              )}
            </div>

            <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-white/[0.04] pl-2">
              <span>Total Operating Expenses</span>
              <span className="font-mono text-rose-400 text-sm">{fmtCurrency(operatingExpensesTotal)}</span>
            </div>
          </div>
        )}

        {/* 4. NET INCOME SUMMARY */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#8a8a9a] uppercase tracking-wider block">
              Net Operating Profit / (Loss)
            </span>
            <span className="text-[11px] text-[#606070] mt-0.5 block">
              Total Revenue - Cost of Goods Sold - Operating Expenses
            </span>
          </div>
          <div className="text-right">
            <span
              className={`text-2xl font-mono font-bold ${
                netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {fmtCurrency(netIncome)}
            </span>
            <span
              className={`text-[11px] font-semibold block mt-0.5 ${
                netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {netMarginPct}% Net Margin
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
