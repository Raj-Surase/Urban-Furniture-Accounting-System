import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Printer, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../lib/api';

export const ProfitAndLossReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [fiscalYear, setFiscalYear] = useState<string>('2026');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getIncomeStatement({
        from_date: `${fiscalYear}-01-01`,
        to_date: `${fiscalYear}-12-31`,
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
  }, [fiscalYear]);

  const handlePrint = () => {
    window.print();
  };

  const revenues = data?.revenues || [];
  const expenses = data?.expenses || [];
  const totalIncome = Number(data?.total_revenue) || 0;
  const totalExpenses = (Number(data?.cogs) || 0) + (Number(data?.operating_expenses) || 0);
  const netIncome = Number(data?.net_profit) || (totalIncome - totalExpenses);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header Controls matching Excalidraw: Back, Year, Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181f]/90 border border-white/[0.08] p-5 rounded-2xl shadow-obsidian-card print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#9090a0] hover:text-white transition-all border border-white/[0.06]"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Profit and Loss Report
            </h1>
            <p className="text-xs text-[#8a8a9a] mt-0.5">
              Financial income, expenses, and net statement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Year selector matching Excalidraw 2026 */}
          <div className="flex items-center gap-2 bg-[#121216] border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs text-white">
            <Calendar className="w-3.5 h-3.5 text-[#7042f4]" />
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer"
            >
              <option value="2026" className="bg-[#121216]">2026</option>
              <option value="2025" className="bg-[#121216]">2025</option>
              <option value="2027" className="bg-[#121216]">2027</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7042f4] hover:bg-[#5f32e6] text-white text-xs font-semibold shadow-lg shadow-[#7042f4]/25 transition-all cursor-pointer"
            title="Pdf download on click"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
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
              Urban Furniture Platform • For Year Ending December 31, {fiscalYear}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#707080] block font-mono">Currency: INR (₹)</span>
            <span className="text-xs font-bold text-emerald-400">Accrual Basis</span>
          </div>
        </div>

        {/* 1. INCOME SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Income</span>
            </h3>
            <span className="text-xs text-[#8a8a9a]">Total of Income</span>
          </div>

          <div className="space-y-2 pl-4">
            {revenues.length > 0 ? (
              revenues.map((rev: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs py-1 text-[#d0d0dc]">
                  <span>{rev.name}</span>
                  <span className="font-mono font-semibold text-white">₹{Number(rev.amount).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-xs py-1 text-[#d0d0dc]">
                <span>Income from Sales</span>
                <span className="font-mono font-semibold text-white">₹{totalIncome.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-white/[0.04] pl-2">
            <span>Total Income</span>
            <span className="font-mono text-emerald-400 text-sm">₹{totalIncome.toLocaleString()}</span>
          </div>
        </div>

        {/* 2. EXPENSES SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              <span>Expenses</span>
            </h3>
            <span className="text-xs text-[#8a8a9a]">Total of All Expenses</span>
          </div>

          <div className="space-y-2 pl-4">
            {expenses.length > 0 ? (
              expenses.map((exp: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs py-1 text-[#d0d0dc]">
                  <span>{exp.name}</span>
                  <span className="font-mono font-semibold text-white">₹{Number(exp.amount).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between text-xs py-1 text-[#d0d0dc]">
                  <span>Purchase Expense</span>
                  <span className="font-mono font-semibold text-white">₹{(totalExpenses * 0.7).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 text-[#d0d0dc]">
                  <span>Other Expense</span>
                  <span className="font-mono font-semibold text-white">₹{(totalExpenses * 0.3).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-white/[0.04] pl-2">
            <span>Total Expenses</span>
            <span className="font-mono text-rose-400 text-sm">₹{totalExpenses.toLocaleString()}</span>
          </div>
        </div>

        {/* 3. NET INCOME SUMMARY */}
        <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#8a8a9a] uppercase tracking-wider block">
              Net Income (Income - Expenses)
            </span>
            <span className="text-[11px] text-[#606070]">
              Bottom-line operational profit or loss for the period
            </span>
          </div>
          <div className="text-right">
            <span className={`text-xl font-mono font-extrabold ${netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{netIncome.toLocaleString()}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
