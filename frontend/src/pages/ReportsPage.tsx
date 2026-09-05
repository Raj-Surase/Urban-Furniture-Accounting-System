import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Scale,
  Clock,
  Percent,
  RefreshCw,
  Printer,
  Download,
  Calendar,
  Filter,
  X,
} from 'lucide-react';
import { reportsApi } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  exportTrialBalancePdf,
  exportIncomeStatementPdf,
  exportBalanceSheetPdf,
  exportAgingPdf,
  exportGstSummaryPdf,
} from '../components/pdf/ReportPdfGenerator';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const ReportsPage: React.FC = () => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'trial-balance' | 'income-statement' | 'balance-sheet' | 'aging' | 'gst-summary'
  >('trial-balance');

  const [loading, setLoading] = useState(false);
  const [trialBalanceData, setTrialBalanceData] = useState<any>(null);
  const [pnlData, setPnlData] = useState<any>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<any>(null);
  const [arAgingData, setArAgingData] = useState<any>(null);
  const [apAgingData, setApAgingData] = useState<any>(null);
  const [gstData, setGstData] = useState<any>(null);

  // Date range filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const fetchReport = async (overrideFrom?: string, overrideTo?: string) => {
    try {
      setLoading(true);
      const start = overrideFrom !== undefined ? overrideFrom : fromDate;
      const end = overrideTo !== undefined ? overrideTo : toDate;
      const params: Record<string, any> = {};
      if (start) params.from_date = start;
      if (end) params.to_date = end;

      if (activeTab === 'trial-balance') {
        const res = await reportsApi.getTrialBalance(params);
        setTrialBalanceData(res);
      } else if (activeTab === 'income-statement') {
        const res = await reportsApi.getIncomeStatement(params);
        setPnlData(res);
      } else if (activeTab === 'balance-sheet') {
        const res = await reportsApi.getBalanceSheet(params);
        setBalanceSheetData(res);
      } else if (activeTab === 'aging') {
        const [ar, ap] = await Promise.all([
          reportsApi.getArAging(params),
          reportsApi.getApAging(params),
        ]);
        setArAgingData(ar);
        setApAgingData(ap);
      } else if (activeTab === 'gst-summary') {
        const res = await reportsApi.getGstSummary(params);
        setGstData(res);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
      addToast({
        type: 'error',
        title: 'Report Error',
        message: 'Could not compute financial report statements.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: 'all' | 'fy' | 'month' | '30days') => {
    const now = new Date();
    let start = '';
    let end = '';

    if (preset === 'all') {
      start = '';
      end = '';
    } else if (preset === 'fy') {
      const year = now.getFullYear();
      const isPostMarch = now.getMonth() >= 3;
      const fyStartYear = isPostMarch ? year : year - 1;
      start = `${fyStartYear}-04-01`;
      end = `${fyStartYear + 1}-03-31`;
    } else if (preset === 'month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      start = `${year}-${month}-01`;
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    } else if (preset === '30days') {
      const prior = new Date();
      prior.setDate(prior.getDate() - 30);
      start = prior.toISOString().slice(0, 10);
      end = now.toISOString().slice(0, 10);
    }

    setFromDate(start);
    setToDate(end);
    fetchReport(start, end);
  };

  const handleExportPdf = () => {
    const range = { fromDate, toDate };
    try {
      if (activeTab === 'trial-balance' && trialBalanceData) {
        exportTrialBalancePdf(trialBalanceData, range);
      } else if (activeTab === 'income-statement' && pnlData) {
        exportIncomeStatementPdf(pnlData, range);
      } else if (activeTab === 'balance-sheet' && balanceSheetData) {
        exportBalanceSheetPdf(balanceSheetData, range);
      } else if (activeTab === 'aging' && (arAgingData || apAgingData)) {
        exportAgingPdf(arAgingData, apAgingData, range);
      } else if (activeTab === 'gst-summary' && gstData) {
        exportGstSummaryPdf(gstData, range);
      } else {
        addToast({
          type: 'info',
          title: 'Exporting...',
          message: 'Report data is loading or empty.',
        });
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
      addToast({
        type: 'error',
        title: 'Export Error',
        message: 'Could not generate report PDF.',
      });
    }
  };

  useEffect(() => {
    fetchReport();

    const handleRoleUpdated = () => {
      fetchReport();
    };
    window.addEventListener('auth:role-updated', handleRoleUpdated);
    return () => window.removeEventListener('auth:role-updated', handleRoleUpdated);
  }, [activeTab]);

  const formatCurrency = (val: number = 0) => {
    return Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-indigo-400" />
            Financial & Statutory GST Reports
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Trial Balance, Profit & Loss, Balance Sheet, Aging schedules, and GSTR Tax Returns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPdf}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs shadow-sm font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReport()}
            disabled={loading}
            className="border-neutral-700 bg-neutral-800 text-neutral-300 gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="border-neutral-700 bg-neutral-800 text-neutral-300 gap-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-[#141418] border border-white/[0.06] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Date Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-[#1c1c23] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              placeholder="From date"
              title="From date"
            />
            <span className="text-neutral-500 text-xs">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-[#1c1c23] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              placeholder="To date"
              title="To date"
            />
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchReport()}
            disabled={loading}
            className="text-xs px-3 py-1.5 h-8 bg-neutral-800 hover:bg-neutral-700 text-white"
          >
            Apply
          </Button>

          {(fromDate || toDate) && (
            <button
              onClick={() => handleApplyPreset('all')}
              className="text-neutral-400 hover:text-white text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded bg-white/[0.04]"
              title="Clear date filter"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto select-none">
          <span className="text-[11px] text-neutral-500 mr-1 hidden sm:inline">Presets:</span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'fy', label: 'FY 2026-27' },
            { id: 'month', label: 'This Month' },
            { id: '30days', label: 'Last 30 Days' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset.id as any)}
              className="px-2.5 py-1 rounded-full text-[11px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-neutral-300 hover:text-white transition-all whitespace-nowrap"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex border-b border-white/[0.06] overflow-x-auto gap-2 pb-1">
        <button
          onClick={() => setActiveTab('trial-balance')}
          className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'trial-balance'
              ? 'bg-[#141418] text-white border-t border-x border-white/[0.08] -mb-px'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4 text-purple-400" />
          Trial Balance
        </button>

        <button
          onClick={() => setActiveTab('income-statement')}
          className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'income-statement'
              ? 'bg-[#141418] text-white border-t border-x border-white/[0.08] -mb-px'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Profit & Loss (P&L)
        </button>

        <button
          onClick={() => setActiveTab('balance-sheet')}
          className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'balance-sheet'
              ? 'bg-[#141418] text-white border-t border-x border-white/[0.08] -mb-px'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4 text-indigo-400" />
          Balance Sheet
        </button>

        <button
          onClick={() => setActiveTab('aging')}
          className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'aging'
              ? 'bg-[#141418] text-white border-t border-x border-white/[0.08] -mb-px'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          AR & AP Aging
        </button>

        <button
          onClick={() => setActiveTab('gst-summary')}
          className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'gst-summary'
              ? 'bg-[#141418] text-white border-t border-x border-white/[0.08] -mb-px'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Percent className="w-4 h-4 text-rose-400" />
          GST Statutory Summary
        </button>
      </div>

      {/* TAB 1: TRIAL BALANCE */}
      {activeTab === 'trial-balance' && (
        <div className="space-y-4">
          {/* Balanced Status Banner */}
          {trialBalanceData && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                trialBalanceData.is_balanced
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {trialBalanceData.is_balanced ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                )}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                    {trialBalanceData.is_balanced
                      ? 'Trial Balance Status: Perfectly Balanced'
                      : 'Trial Balance Status: Out of Balance'}
                  </h3>
                  <p className="text-xs opacity-80">
                    Total Debits: ₹{formatCurrency(trialBalanceData.total_debit)} · Total Credits: ₹
                    {formatCurrency(trialBalanceData.total_credit)} (Difference: ₹
                    {Math.abs(trialBalanceData.total_debit - trialBalanceData.total_credit).toFixed(2)})
                  </p>
                </div>
              </div>

              <div className="font-mono font-bold text-xs bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                As of {trialBalanceData.as_of_date}
              </div>
            </div>
          )}

          <Card className="bg-[#141418] border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Account Code</th>
                    <th className="py-3 px-4">Account Title</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4 text-right">Debit Balance (₹)</th>
                    <th className="py-3 px-4 text-right">Credit Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {loading ? (
                    <TableSkeleton columns={5} rows={6} />
                  ) : !trialBalanceData?.rows || trialBalanceData.rows.length === 0 ? (
                    <EmptyState
                      colSpan={5}
                      icon={Scale}
                      title="No accounts available"
                      description="No journal entries or account balances found for the selected period."
                    />
                  ) : (
                    trialBalanceData.rows.map((row: any) => (
                      <tr key={row.id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 font-mono font-bold text-purple-400">{row.code}</td>
                        <td className="py-2.5 px-4 font-semibold text-white">{row.name}</td>
                        <td className="py-2.5 px-4 text-neutral-400 uppercase text-[10px]">{row.type}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-400">
                          {row.debit_balance > 0 ? `₹${formatCurrency(row.debit_balance)}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-indigo-400">
                          {row.credit_balance > 0 ? `₹${formatCurrency(row.credit_balance)}` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {trialBalanceData && (
                  <tfoot>
                    <tr className="border-t-2 border-white/20 bg-white/[0.03] font-mono font-bold text-sm text-white">
                      <td colSpan={3} className="py-3 px-4 uppercase text-xs">
                        Grand Total
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400">
                        ₹{formatCurrency(trialBalanceData.total_debit)}
                      </td>
                      <td className="py-3 px-4 text-right text-indigo-400">
                        ₹{formatCurrency(trialBalanceData.total_credit)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: INCOME STATEMENT / P&L */}
      {activeTab === 'income-statement' && (
        <div className="space-y-4 max-w-4xl">
          <Card className="p-6 bg-[#141418] border-white/[0.06] text-white space-y-6">
            <div className="border-b border-white/[0.06] pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Income Statement (Profit & Loss)</h3>
                <p className="text-xs text-neutral-400">{pnlData?.period || 'Current Fiscal Period'}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400 block">Net Income</span>
                <span
                  className={`text-xl font-bold font-mono ${
                    (pnlData?.net_profit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  ₹{formatCurrency(pnlData?.net_profit)}
                </span>
              </div>
            </div>

            {/* Operating Revenue */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-purple-400">
                <span>Operating Revenue</span>
                <span className="font-mono text-white">₹{formatCurrency(pnlData?.total_revenue)}</span>
              </div>
              <div className="divide-y divide-white/[0.04] text-xs">
                {(pnlData?.revenues || []).map((rev: any) => (
                  <div key={rev.code} className="py-2 flex justify-between text-neutral-300">
                    <span>
                      {rev.code} - {rev.name}
                    </span>
                    <span className="font-mono text-white">₹{formatCurrency(rev.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost of Goods Sold & Gross Profit */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex justify-between items-center text-xs font-semibold text-neutral-300">
                <span>Cost of Goods Sold (COGS - 5100)</span>
                <span className="font-mono text-rose-400">- ₹{formatCurrency(pnlData?.cogs)}</span>
              </div>

              <div className="p-3 bg-white/[0.02] rounded-lg flex justify-between items-center font-bold text-sm">
                <span className="text-emerald-400">Gross Profit:</span>
                <span className="font-mono text-emerald-400">₹{formatCurrency(pnlData?.gross_profit)}</span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-amber-400">
                <span>Operating Expenses</span>
                <span className="font-mono text-white">₹{formatCurrency(pnlData?.operating_expenses)}</span>
              </div>
              <div className="divide-y divide-white/[0.04] text-xs">
                {(pnlData?.expenses || [])
                  .filter((e: any) => e.code !== '5100')
                  .map((exp: any) => (
                    <div key={exp.code} className="py-2 flex justify-between text-neutral-300">
                      <span>
                        {exp.code} - {exp.name}
                      </span>
                      <span className="font-mono text-neutral-400">₹{formatCurrency(exp.amount)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Net Income Summary Bar */}
            <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-xl flex justify-between items-center text-base font-bold">
              <span>Net Operating Profit / (Loss):</span>
              <span
                className={`font-mono text-lg ${
                  (pnlData?.net_profit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ₹{formatCurrency(pnlData?.net_profit)}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: BALANCE SHEET */}
      {activeTab === 'balance-sheet' && (
        <div className="space-y-4 max-w-5xl">
          {balanceSheetData && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                balanceSheetData.is_balanced
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Scale className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                    Accounting Equation: Assets = Liabilities + Equity
                  </h3>
                  <p className="text-xs opacity-80">
                    Total Assets: ₹{formatCurrency(balanceSheetData.total_assets)} = Total Liabilities & Equity: ₹
                    {formatCurrency(balanceSheetData.total_liabilities_and_equity)}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                {balanceSheetData.is_balanced ? 'VERIFIED BALANCED' : 'IMBALANCE DETECTED'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Assets */}
            <Card className="p-5 bg-[#141418] border-white/[0.06] text-white space-y-4">
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-blue-400">Total Assets</h4>
                <span className="font-mono font-bold text-base text-blue-400">
                  ₹{formatCurrency(balanceSheetData?.total_assets)}
                </span>
              </div>
              <div className="divide-y divide-white/[0.04] text-xs">
                {(balanceSheetData?.assets || []).map((ast: any) => (
                  <div key={ast.code} className="py-2.5 flex justify-between text-neutral-300">
                    <span>
                      {ast.code} - {ast.name}
                    </span>
                    <span className="font-mono text-white font-semibold">₹{formatCurrency(ast.amount)}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Right: Liabilities & Equity */}
            <div className="space-y-6">
              <Card className="p-5 bg-[#141418] border-white/[0.06] text-white space-y-4">
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400">Liabilities & GST</h4>
                  <span className="font-mono font-bold text-base text-amber-400">
                    ₹{formatCurrency(balanceSheetData?.total_liabilities)}
                  </span>
                </div>
                <div className="divide-y divide-white/[0.04] text-xs">
                  {(balanceSheetData?.liabilities || []).map((lia: any) => (
                    <div key={lia.code} className="py-2.5 flex justify-between text-neutral-300">
                      <span>
                        {lia.code} - {lia.name}
                      </span>
                      <span className="font-mono text-white font-semibold">₹{formatCurrency(lia.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 bg-[#141418] border-white/[0.06] text-white space-y-4">
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-purple-400">Owner's Equity</h4>
                  <span className="font-mono font-bold text-base text-purple-400">
                    ₹{formatCurrency(balanceSheetData?.total_equity)}
                  </span>
                </div>
                <div className="divide-y divide-white/[0.04] text-xs">
                  {(balanceSheetData?.equity || []).map((eq: any) => (
                    <div key={eq.code} className="py-2.5 flex justify-between text-neutral-300">
                      <span>
                        {eq.code} - {eq.name}
                      </span>
                      <span className="font-mono text-white font-semibold">₹{formatCurrency(eq.amount)}</span>
                    </div>
                  ))}
                  <div className="py-2.5 flex justify-between text-emerald-400 font-semibold">
                    <span>Current Period Net Income:</span>
                    <span className="font-mono">₹{formatCurrency(balanceSheetData?.current_period_net_income)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AGING SCHEDULES */}
      {activeTab === 'aging' && (
        <div className="space-y-6">
          {/* Accounts Receivable Aging */}
          <Card className="bg-[#141418] border-white/[0.06] p-5 space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
              Accounts Receivable Aging (Customer Invoices Outstanding)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block uppercase">Current</span>
                <span className="text-sm font-bold font-mono text-white">
                  ₹{formatCurrency(arAgingData?.summary?.current)}
                </span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block uppercase">1-30 Days</span>
                <span className="text-sm font-bold font-mono text-amber-300">
                  ₹{formatCurrency(arAgingData?.summary?.days_1_30)}
                </span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block uppercase">31-60 Days</span>
                <span className="text-sm font-bold font-mono text-orange-400">
                  ₹{formatCurrency(arAgingData?.summary?.days_31_60)}
                </span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block uppercase">61-90 Days</span>
                <span className="text-sm font-bold font-mono text-rose-400">
                  ₹{formatCurrency(arAgingData?.summary?.days_61_90)}
                </span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block uppercase">Over 90 Days</span>
                <span className="text-sm font-bold font-mono text-rose-500">
                  ₹{formatCurrency(arAgingData?.summary?.over_90)}
                </span>
              </div>
            </div>
          </Card>

          {/* Accounts Payable Aging */}
          <Card className="bg-[#141418] border-white/[0.06] p-5 space-y-4">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">
              Accounts Payable Aging (Vendor Bills Payable)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block uppercase">Current</span>
                <span className="text-sm font-bold font-mono text-white">
                  ₹{formatCurrency(apAgingData?.summary?.current)}
                </span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block uppercase">1-30 Days</span>
                <span className="text-sm font-bold font-mono text-amber-300">
                  ₹{formatCurrency(apAgingData?.summary?.days_1_30)}
                </span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block uppercase">31-60 Days</span>
                <span className="text-sm font-bold font-mono text-orange-400">
                  ₹{formatCurrency(apAgingData?.summary?.days_31_60)}
                </span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block uppercase">61-90 Days</span>
                <span className="text-sm font-bold font-mono text-rose-400">
                  ₹{formatCurrency(apAgingData?.summary?.days_61_90)}
                </span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block uppercase">Over 90 Days</span>
                <span className="text-sm font-bold font-mono text-rose-500">
                  ₹{formatCurrency(apAgingData?.summary?.over_90)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: GST STATUTORY SUMMARY */}
      {activeTab === 'gst-summary' && (
        <div className="space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Output Tax (GSTR-1) */}
            <Card className="p-5 bg-[#141418] border-white/[0.06] text-white space-y-4">
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-rose-400">
                  GST Output Liability (GSTR-1)
                </h4>
                <span className="font-mono font-bold text-base text-rose-400">
                  ₹{formatCurrency(gstData?.output_tax?.total_output)}
                </span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-neutral-300">
                  <span>CGST Output (2121 - 9%):</span>
                  <span className="font-mono text-white font-semibold">
                    ₹{formatCurrency(gstData?.output_tax?.cgst_output)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>SGST Output (2122 - 9%):</span>
                  <span className="font-mono text-white font-semibold">
                    ₹{formatCurrency(gstData?.output_tax?.sgst_output)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>IGST Output (2123 - 18% Interstate):</span>
                  <span className="font-mono text-white font-semibold">
                    ₹{formatCurrency(gstData?.output_tax?.igst_output)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Input Tax Credit (GSTR-2B) */}
            <Card className="p-5 bg-[#141418] border-white/[0.06] text-white space-y-4">
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                  Input Tax Credit - ITC (GSTR-2B)
                </h4>
                <span className="font-mono font-bold text-base text-emerald-400">
                  ₹{formatCurrency(gstData?.input_tax_credit?.total_input_credit)}
                </span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-neutral-300">
                  <span>CGST Input ITC (2131):</span>
                  <span className="font-mono text-white font-semibold">
                    ₹{formatCurrency(gstData?.input_tax_credit?.cgst_input)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>SGST Input ITC (2132):</span>
                  <span className="font-mono text-white font-semibold">
                    ₹{formatCurrency(gstData?.input_tax_credit?.sgst_input)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>IGST Input ITC (2133):</span>
                  <span className="font-mono text-white font-semibold">
                    ₹{formatCurrency(gstData?.input_tax_credit?.igst_input)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Net Settlement (GSTR-3B) */}
          <Card className="p-6 bg-[#141418] border-white/[0.06] text-white space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-purple-400">
              Net Statutory Tax Settlement (GSTR-3B Monthly Return)
            </h4>
            <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 flex justify-between items-center text-sm font-bold">
              <div>
                <span>Net GST Cash Payable to Government:</span>
                <p className="text-[11px] font-normal text-neutral-500">
                  Payable after set-off of available Input Tax Credit
                </p>
              </div>
              <span className="font-mono text-lg text-rose-400">
                ₹{formatCurrency(gstData?.net_gst_payable)}
              </span>
            </div>

            {(gstData?.input_credit_carryover ?? 0) > 0 && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center text-sm font-bold text-emerald-300">
                <span>Input Tax Credit Carried Forward to Next Month:</span>
                <span className="font-mono text-lg">
                  ₹{formatCurrency(gstData?.input_credit_carryover)}
                </span>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

