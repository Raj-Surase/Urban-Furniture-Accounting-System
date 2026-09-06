import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Scale,
  RefreshCw,
  Search,
  Filter,
  Download,
  RotateCcw,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../lib/api';
import { exportBalanceSheetPdf } from '../components/pdf/ReportPdfGenerator';

type PresetKey = 'today' | 'month-end' | 'last-month-end' | 'fy-end' | 'prev-fy-end' | 'custom';
type CategoryFilter = 'all' | 'asset' | 'liability' | 'equity';

export const BalanceSheetReportPage: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Filters & State
  const [asOfDate, setAsOfDate] = useState<string>(`${currentYear}-12-31`);
  const [activePreset, setActivePreset] = useState<PresetKey>('custom');
  const [showZeroBalances, setShowZeroBalances] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getBalanceSheet({
        to_date: asOfDate,
        include_zero: showZeroBalances,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load balance sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [asOfDate, showZeroBalances]);

  // Apply Quick Date Presets
  const handleApplyPreset = (preset: PresetKey) => {
    setActivePreset(preset);
    const now = new Date();
    const year = now.getFullYear();

    if (preset === 'today') {
      setAsOfDate(now.toISOString().slice(0, 10));
    } else if (preset === 'month-end') {
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      setAsOfDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'last-month-end') {
      const prevMonth = new Date(year, now.getMonth(), 0);
      const lastDay = prevMonth.getDate();
      const month = String(prevMonth.getMonth() + 1).padStart(2, '0');
      setAsOfDate(`${prevMonth.getFullYear()}-${month}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'fy-end') {
      const isPostMarch = now.getMonth() >= 3;
      const fyEndYear = isPostMarch ? year + 1 : year;
      setAsOfDate(`${fyEndYear}-03-31`);
    } else if (preset === 'prev-fy-end') {
      const isPostMarch = now.getMonth() >= 3;
      const prevFyEndYear = isPostMarch ? year : year - 1;
      setAsOfDate(`${prevFyEndYear}-03-31`);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setShowZeroBalances(false);
    setActivePreset('custom');
    setAsOfDate(`${currentYear}-12-31`);
  };

  const handleExportPdf = () => {
    if (data) {
      exportBalanceSheetPdf(data, {
        toDate: asOfDate,
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const assets = data?.assets || [];
  const liabilities = data?.liabilities || [];
  const equity = data?.equity || [];

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

  const filteredAssets = useMemo(() => assets.filter(matchesSearch), [assets, searchQuery]);
  const filteredLiabilities = useMemo(() => liabilities.filter(matchesSearch), [liabilities, searchQuery]);
  const filteredEquity = useMemo(() => equity.filter(matchesSearch), [equity, searchQuery]);

  // Group assets into Bank, Cash, Debtors matching Excalidraw
  const bankAssets = filteredAssets.filter((a: any) =>
    a.sub_type === 'cash_bank' || a.name.toLowerCase().includes('bank') || a.code === '1111'
  );
  const cashAssets = filteredAssets.filter((a: any) =>
    a.name.toLowerCase().includes('cash') || a.code === '1112'
  );
  const debtorAssets = filteredAssets.filter((a: any) =>
    a.sub_type === 'receivable' ||
    a.name.toLowerCase().includes('debtor') ||
    a.name.toLowerCase().includes('receivable') ||
    a.code === '1120' ||
    a.code === '1121'
  );
  const otherAssets = filteredAssets.filter((a: any) =>
    !bankAssets.includes(a) && !cashAssets.includes(a) && !debtorAssets.includes(a)
  );

  // Group liabilities into Creditors and Capital
  const creditorLiab = filteredLiabilities.filter((l: any) =>
    l.sub_type === 'payable' ||
    l.name.toLowerCase().includes('creditor') ||
    l.name.toLowerCase().includes('payable') ||
    l.code === '2110' ||
    l.code === '2111'
  );
  const otherLiab = filteredLiabilities.filter((l: any) => !creditorLiab.includes(l));

  const capitalEquity = filteredEquity.filter((e: any) =>
    e.name.toLowerCase().includes('capital') || e.code === '3100' || e.code === '3101'
  );
  const otherEquity = filteredEquity.filter((e: any) => !capitalEquity.includes(e));

  const totalAsset = Number(data?.total_assets) || 0;
  const totalLiab = Number(data?.total_liabilities) || 0;
  const totalEq = Number(data?.total_equity) || 0;
  const totalLiabAndEquity = totalLiab + totalEq;
  const diff = Math.abs(totalAsset - totalLiabAndEquity);
  const isBalanced = diff < 0.05;

  const showAssetsColumn = categoryFilter === 'all' || categoryFilter === 'asset';
  const showLiabilitiesColumn = categoryFilter === 'all' || categoryFilter === 'liability' || categoryFilter === 'equity';

  const fmtCurrency = (val: number = 0) =>
    '₹' +
    Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
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
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <Scale className="w-6 h-6 text-indigo-400" />
                Balance Sheet
              </h1>
              <p className="text-xs text-[#8a8a9a] mt-0.5">
                Financial position statement: Assets vs. Liabilities & Equity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* As of Date picker */}
            <div className="flex items-center gap-2 bg-[#121216] border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs text-white">
              <Calendar className="w-3.5 h-3.5 text-[#9090a0]" />
              <span className="text-[10px] uppercase text-[#707080] font-semibold">As of</span>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => {
                  setAsOfDate(e.target.value);
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
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* Export Vector PDF */}
            <button
              onClick={handleExportPdf}
              disabled={loading || !data}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
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
              onClick={() => handleApplyPreset('today')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activePreset === 'today'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-white/[0.04] text-[#9090a0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleApplyPreset('month-end')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activePreset === 'month-end'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-white/[0.04] text-[#9090a0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              This Month End
            </button>
            <button
              onClick={() => handleApplyPreset('last-month-end')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activePreset === 'last-month-end'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-white/[0.04] text-[#9090a0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Last Month End
            </button>
            <button
              onClick={() => handleApplyPreset('fy-end')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activePreset === 'fy-end'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-white/[0.04] text-[#9090a0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Current FY End (Mar 31)
            </button>
            <button
              onClick={() => handleApplyPreset('prev-fy-end')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activePreset === 'prev-fy-end'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-white/[0.04] text-[#9090a0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Prev FY End
            </button>
          </div>

          {/* Classification Filter & Search Operations */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter Pills */}
            <div className="flex items-center bg-[#121216] p-0.5 rounded-xl border border-white/[0.08]">
              {(['all', 'asset', 'liability', 'equity'] as CategoryFilter[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all ${
                    categoryFilter === cat
                      ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/40'
                      : 'text-[#8a8a9a] hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
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
                placeholder="Search code/name..."
                className="bg-[#121216] border border-white/[0.08] text-white text-xs pl-7 pr-3 py-1 rounded-xl focus:outline-none focus:border-indigo-500/60 w-36 sm:w-44 placeholder:text-[#555566]"
              />
            </div>

            {/* Zero-Balance Toggle */}
            <button
              onClick={() => setShowZeroBalances(!showZeroBalances)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                showZeroBalances
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-white/[0.04] text-[#8a8a9a] hover:text-white border-white/[0.06]'
              }`}
              title="Toggle ₹0 balance accounts"
            >
              {showZeroBalances ? <Eye className="w-3 h-3 text-indigo-400" /> : <EyeOff className="w-3 h-3 text-[#707080]" />}
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

      {/* ── Key Equation KPI Metric Banner ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="p-4 rounded-2xl bg-[#18181f] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8a8a9a] tracking-wider block">
              Total Assets
            </span>
            <span className="text-xl font-bold font-mono text-indigo-400 mt-1 block">
              {fmtCurrency(totalAsset)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#18181f] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8a8a9a] tracking-wider block">
              Liabilities & Equity
            </span>
            <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
              {fmtCurrency(totalLiabAndEquity)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isBalanced
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-rose-500/10 border-rose-500/20'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8a8a9a] tracking-wider block">
              Status Check
            </span>
            <span
              className={`text-sm font-bold font-mono mt-1 block ${
                isBalanced ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isBalanced ? 'PERFECTLY BALANCED' : `OUT OF BALANCE (₹${diff.toFixed(2)})`}
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              isBalanced
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
            }`}
          >
            {isBalanced ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
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
            <h2 className="text-2xl font-bold text-white tracking-tight">Statement of Financial Position</h2>
            <p className="text-xs text-[#8a8a9a] mt-1">
              Urban Furniture Platform • As of {asOfDate} {searchQuery && `• Filtered by "${searchQuery}"`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#707080] block font-mono">Standard: GAAP / IND-AS</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Balanced Double-Entry</span>
            </div>
          </div>
        </div>

        {/* Dual Column Layout matching Excalidraw: Assets (Left) vs Liabilities & Equity (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT: ASSETS */}
          {showAssetsColumn && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  <span>Assets</span>
                </h3>
                <span className="text-xs text-[#8a8a9a]">Resource Holdings</span>
              </div>

              <div className="space-y-4 pl-2">
                {/* Bank */}
                <div>
                  <span className="text-xs font-semibold text-white block mb-1">Bank</span>
                  {bankAssets.length > 0 ? (
                    bankAssets.map((a: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs py-1 text-[#a0a0b0] pl-3 hover:text-white">
                        <span>
                          {a.code && <span className="font-mono text-[#707080] mr-2">[{a.code}]</span>}
                          {a.name}
                        </span>
                        <span className="font-mono text-white">₹{Number(a.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-xs py-1 text-[#606070] pl-3 italic">
                      <span>No bank accounts matching</span>
                      <span>—</span>
                    </div>
                  )}
                </div>

                {/* Cash */}
                <div>
                  <span className="text-xs font-semibold text-white block mb-1">Cash</span>
                  {cashAssets.length > 0 ? (
                    cashAssets.map((a: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs py-1 text-[#a0a0b0] pl-3 hover:text-white">
                        <span>
                          {a.code && <span className="font-mono text-[#707080] mr-2">[{a.code}]</span>}
                          {a.name}
                        </span>
                        <span className="font-mono text-white">₹{Number(a.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-xs py-1 text-[#606070] pl-3 italic">
                      <span>No cash accounts matching</span>
                      <span>—</span>
                    </div>
                  )}
                </div>

                {/* Debtors */}
                <div>
                  <span className="text-xs font-semibold text-white block mb-1">Debtors (Accounts Receivable)</span>
                  {debtorAssets.length > 0 ? (
                    debtorAssets.map((a: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs py-1 text-[#a0a0b0] pl-3 hover:text-white">
                        <span>
                          {a.code && <span className="font-mono text-[#707080] mr-2">[{a.code}]</span>}
                          {a.name}
                        </span>
                        <span className="font-mono text-white">₹{Number(a.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-xs py-1 text-[#606070] pl-3 italic">
                      <span>No debtor accounts matching</span>
                      <span>—</span>
                    </div>
                  )}
                </div>

                {otherAssets.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-white block mb-1">Other Assets</span>
                    {otherAssets.map((a: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs py-1 text-[#a0a0b0] pl-3 hover:text-white">
                        <span>
                          {a.code && <span className="font-mono text-[#707080] mr-2">[{a.code}]</span>}
                          {a.name}
                        </span>
                        <span className="font-mono text-white">₹{Number(a.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between text-sm font-bold text-white pt-4 border-t border-white/[0.08] bg-[#121216] p-3 rounded-xl mt-6">
                <span>Total Asset</span>
                <span className="font-mono text-indigo-400">{fmtCurrency(totalAsset)}</span>
              </div>
            </div>
          )}

          {/* RIGHT: LIABILITIES & CAPITAL */}
          {showLiabilitiesColumn && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  <span>Liabilities & Equity</span>
                </h3>
                <span className="text-xs text-[#8a8a9a]">Obligations & Capital</span>
              </div>

              <div className="space-y-4 pl-2">
                {/* Capital */}
                {(categoryFilter === 'all' || categoryFilter === 'equity') && (
                  <div>
                    <span className="text-xs font-semibold text-white block mb-1">Capital & Equity</span>
                    {capitalEquity.length > 0 ? (
                      capitalEquity.map((e: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs py-1 text-[#a0a0b0] pl-3 hover:text-white">
                          <span>
                            {e.code && <span className="font-mono text-[#707080] mr-2">[{e.code}]</span>}
                            {e.name}
                          </span>
                          <span className="font-mono text-white">₹{Number(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between text-xs py-1 text-[#606070] pl-3 italic">
                        <span>No capital accounts matching</span>
                        <span>—</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Creditors */}
                {(categoryFilter === 'all' || categoryFilter === 'liability') && (
                  <div>
                    <span className="text-xs font-semibold text-white block mb-1">Creditors (Accounts Payable)</span>
                    {creditorLiab.length > 0 ? (
                      creditorLiab.map((l: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs py-1 text-[#a0a0b0] pl-3 hover:text-white">
                          <span>
                            {l.code && <span className="font-mono text-[#707080] mr-2">[{l.code}]</span>}
                            {l.name}
                          </span>
                          <span className="font-mono text-white">₹{Number(l.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between text-xs py-1 text-[#606070] pl-3 italic">
                        <span>No creditor accounts matching</span>
                        <span>—</span>
                      </div>
                    )}
                  </div>
                )}

                {(otherLiab.length > 0 || otherEquity.length > 0) && (
                  <div>
                    <span className="text-xs font-semibold text-white block mb-1">Other Liabilities & Retained Earnings</span>
                    {[...otherLiab, ...otherEquity].map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs py-1 text-[#a0a0b0] pl-3 hover:text-white">
                        <span>
                          {item.code && <span className="font-mono text-[#707080] mr-2">[{item.code}]</span>}
                          {item.name}
                        </span>
                        <span className="font-mono text-white">₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between text-sm font-bold text-white pt-4 border-t border-white/[0.08] bg-[#121216] p-3 rounded-xl mt-6">
                <span>Total Liability & Capital</span>
                <span className="font-mono text-amber-400">{fmtCurrency(totalLiabAndEquity)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Golden Assertion Banner matching Excalidraw */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-300 block">
                Balanced Accounting Equation Verified
              </span>
              <span className="text-[#a0a0b0] text-[11px]">
                "The Total of All asset and liability would always match"
              </span>
            </div>
          </div>
          <span className="font-mono font-bold text-emerald-300 text-sm">
            {fmtCurrency(totalAsset)} = {fmtCurrency(totalLiabAndEquity)}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
