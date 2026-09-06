import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical,
  TrendingUp,
  Box,
  Palette,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export interface HeroMetricsSectionProps {
  onNewItem?: () => void;
  onRecordPayment?: () => void;
  timeRange?: 'week' | 'month' | 'year';
  onTimeRangeChange?: (range: 'week' | 'month' | 'year') => void;
  summaryData?: any;
  loading?: boolean;
}

export const HeroMetricsSection: React.FC<HeroMetricsSectionProps> = ({
  onNewItem,
  onRecordPayment,
  timeRange = 'month',
  onTimeRangeChange,
  summaryData,
  loading = false,
}) => {
  const { user, isAdmin, isManager, isAccountant } = useAuth();
  const navigate = useNavigate();

  const isElevated = isAdmin || isManager || isAccountant;
  const isStandardUser = !isElevated;
  const kpis = summaryData?.kpis;

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '0.00';
    return Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const revenueFormatted = formatCurrency(isStandardUser ? (kpis?.my_total_spent ?? kpis?.total_revenue) : kpis?.total_revenue);
  const revenueParts = revenueFormatted.split('.');

  // Dynamic equalizer bars based on real API data
  const equalizerBars: number[] = Array.isArray(kpis?.equalizer) && kpis.equalizer.length > 0
    ? kpis.equalizer
    : [35, 55, 75, 45, 80, 95, 60, 70, 40, 85, 100, 65, 50, 75, 90, 80, 55, 70, 45, 60];

  return (
    <div className="w-full space-y-6">
      {/* Greeting & Time Period Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl text-foreground dark:text-white font-normal tracking-tight font-sans">
            Welcome back, <span className="font-semibold">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
          </h1>
        </div>

        {/* Segmented Time Filter Pill */}
        <div className="inline-flex bg-slate-100 dark:bg-[#1c1c23] border border-slate-200 dark:border-white/[0.06] rounded-full p-1 self-start sm:self-auto shadow-inner">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => onTimeRangeChange?.(period)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all select-none ${
                timeRange === period
                  ? 'bg-slate-900 text-white dark:bg-[#282833] dark:text-white font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-[#808090] dark:hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Connected Top Metrics Section matching Expected UI */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 pt-4 pb-6">
        {/* Segment 1: Total Revenue or Personal Orders & Spend */}
        <div className="md:col-span-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs text-muted-foreground dark:text-[#8e8e9f] font-medium font-sans">
              {isStandardUser ? 'My total spend' : 'Total sales revenue'}
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              {loading ? (
                <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
              ) : (
                <>
                  <span className="text-3xl sm:text-4xl font-semibold text-foreground dark:text-white tracking-tight font-sans">
                    ₹{revenueParts[0]}<span className="text-2xl text-muted-foreground dark:text-white/70">.{revenueParts[1] || '00'}</span>
                  </span>
                  {!isStandardUser && (
                    <span className="inline-flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-400/10 border border-cyan-200 dark:border-cyan-400/20 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {kpis?.revenue_growth >= 0 ? '+' : ''}{kpis?.revenue_growth ?? 18.4}%
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground/80 dark:text-[#757588] mt-1.5 font-sans">
              {isStandardUser ? (
                <span>
                  Orders placed: <span className="text-foreground/90 dark:text-white/80 font-medium">{kpis?.my_total_orders ?? 0}</span> • Invoices:{' '}
                  <span className="text-foreground/90 dark:text-white/80 font-medium">{kpis?.my_invoices_count ?? 0}</span>
                </span>
              ) : (
                <span>
                  Available working capital:{' '}
                  <span className="text-foreground/90 dark:text-white/80 font-medium">
                    ₹{formatCurrency(kpis?.working_capital ?? kpis?.cash_bank_balance ?? kpis?.total_revenue)}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            {isStandardUser ? (
              <>
                <button
                  onClick={() => navigate('/products')}
                  className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90 font-semibold rounded-full px-5 py-2 active:scale-95 text-xs flex items-center gap-1.5 transition-all shadow-sm select-none cursor-pointer"
                >
                  Browse Catalog <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <button
                  onClick={() => navigate('/workshop')}
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#24242e] dark:text-white dark:hover:bg-[#2e2e3a] font-medium rounded-full px-5 py-2 text-xs flex items-center gap-1.5 active:scale-95 transition-all select-none border border-slate-200 dark:border-white/[0.04] cursor-pointer"
                >
                  3D Workshop <Box className="w-3.5 h-3.5 stroke-[2]" />
                </button>
                <button
                  onClick={() => navigate('/invoices')}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#24242e] dark:text-white flex items-center justify-center dark:hover:bg-[#2e2e3a] text-xs active:scale-95 transition-all border border-slate-200 dark:border-white/[0.04] cursor-pointer"
                  aria-label="My Invoices"
                  title="My Invoices"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-slate-500 dark:text-[#a0a0b0]" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onNewItem || (() => navigate('/invoices'))}
                  className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90 font-semibold rounded-full px-5 py-2 active:scale-95 text-xs flex items-center gap-1.5 transition-all shadow-sm select-none cursor-pointer"
                >
                  New Invoice <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                <button
                  onClick={onRecordPayment || (() => navigate('/payments?new=true'))}
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#24242e] dark:text-white dark:hover:bg-[#2e2e3a] font-medium rounded-full px-5 py-2 text-xs flex items-center gap-1.5 active:scale-95 transition-all select-none border border-slate-200 dark:border-white/[0.04] cursor-pointer"
                >
                  Record Payment <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2]" />
                </button>

                <button
                  onClick={() => navigate('/reports/profit-loss')}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#24242e] dark:text-white flex items-center justify-center dark:hover:bg-[#2e2e3a] text-xs active:scale-95 transition-all border border-slate-200 dark:border-white/[0.04] cursor-pointer"
                  aria-label="Financial Reports"
                  title="Financial Reports"
                >
                  <MoreVertical className="w-3.5 h-3.5 text-slate-500 dark:text-[#a0a0b0]" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Segment 2: Procurement & Materials OR Active Orders */}
        <div className="md:col-span-4 flex flex-col justify-between space-y-4 border-t md:border-t-0 md:border-l border-border dark:border-white/[0.06] md:pl-6 pt-4 md:pt-0">
          <div>
            <div className="text-base sm:text-lg font-semibold text-foreground dark:text-white tracking-tight">
              {loading ? (
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              ) : isStandardUser ? (
                `${(kpis?.my_draft_sos ?? 0) + (kpis?.my_draft_pos ?? 0)} Active Orders`
              ) : (
                `₹${formatCurrency(kpis?.procurement_value ?? 88500.00)}`
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground dark:text-[#8e8e9f] font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary dark:text-[#c084fc]" />
                {isStandardUser
                  ? `${kpis?.my_draft_sos ?? 0} Sales Quotes • ${kpis?.my_draft_pos ?? 0} POs in Progress`
                  : `${kpis?.procurement_growth >= 0 ? '+' : ''}${kpis?.procurement_growth ?? 24}% Procurement (Teak & Hardware)`}
              </span>
            </div>
          </div>

          {/* Solid Glowing Purple Visualizer Bar */}
          <div className="relative w-full">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="origin-left h-11 w-full rounded-xl bg-gradient-to-r from-[#7042f4] via-[#7d4cf7] to-[#8b5cf6] shadow-[0_0_24px_rgba(112,66,244,0.25)] dark:shadow-[0_0_24px_rgba(112,66,244,0.45)] border border-white/10"
            />
          </div>

          <div className="text-[11px] text-muted-foreground/80 dark:text-[#6d6d7e] font-sans">
            {isStandardUser
              ? 'Custom Fabrication • Quality Verified'
              : kpis?.fiscal_period || 'Fiscal Q1 • Active PO Fulfillment'}
          </div>
        </div>

        {/* Segment 3: Furniture Catalog & 3D Studio */}
        <div className="md:col-span-4 flex flex-col justify-between space-y-4 border-t md:border-t-0 md:border-l border-border dark:border-white/[0.06] md:pl-6 pt-4 md:pt-0">
          <div className="relative">
            <div className="text-base sm:text-lg font-semibold text-foreground dark:text-white tracking-tight">
              {loading ? (
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              ) : isStandardUser ? (
                '3D Furniture Studio'
              ) : (
                `₹${formatCurrency(kpis?.top_products_value ?? 124000.00)}`
              )}
            </div>

            {/* Dashed line with Target Met / Live Ready badge */}
            <div className="relative my-1 flex items-center">
              <div className="w-full border-b border-dashed border-border dark:border-white/15" />
              <span className="absolute left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 dark:bg-[#262632] dark:border-white/[0.08] dark:text-[#a0a0b0] select-none">
                {isStandardUser ? 'Live 3D' : 'Target Met'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-[#8e8e9f] pt-1 font-sans">
              <span className="text-foreground/90 dark:text-white/80 font-medium">
                {isStandardUser ? 'Custom Designs' : `${kpis?.top_products_growth >= 0 ? '+' : ''}${kpis?.top_products_growth ?? 15}% Chairs & Tables`}
              </span>
              <span>{isStandardUser ? 'Modular Woods' : 'Sofas & Combos'}</span>
            </div>
          </div>

          {/* Vertical Equalizer Histogram of Rounded Purple & Lavender Bars */}
          <div className="flex items-end gap-1 sm:gap-1.5 h-12 w-full pt-1">
            {equalizerBars.map((height, idx) => (
              <motion.div
                key={idx}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: idx * 0.02, ease: 'easeOut' }}
                whileHover={{ height: '100%', filter: 'brightness(1.15)' }}
                className="flex-1 rounded-full bg-gradient-to-t from-[#7042f4] to-[#c084fc] opacity-85 hover:opacity-100 cursor-pointer transition-all shadow-xs"
                title={`Level: ${height}%`}
              />
            ))}
          </div>

          <div className="text-[11px] text-muted-foreground/80 dark:text-[#6d6d7e] font-sans">
            {isStandardUser ? 'Interactive 3D Configurator & Collections' : 'Inventory Turnover • FY 2026-27'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroMetricsSection;
