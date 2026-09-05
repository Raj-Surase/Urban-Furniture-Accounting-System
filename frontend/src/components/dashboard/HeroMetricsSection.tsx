import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface HeroMetricsSectionProps {
  onNewItem?: () => void;
  onBroadcast?: () => void;
  timeRange?: 'week' | 'month' | 'year';
  onTimeRangeChange?: (range: 'week' | 'month' | 'year') => void;
  summaryData?: any;
  loading?: boolean;
}

export const HeroMetricsSection: React.FC<HeroMetricsSectionProps> = ({
  onNewItem,
  timeRange = 'month',
  onTimeRangeChange,
  summaryData,
  loading = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const kpis = summaryData?.kpis;

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '0.00';
    return Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const revenueFormatted = formatCurrency(kpis?.total_revenue);
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
          <h1 className="text-3xl sm:text-4xl text-white font-normal tracking-tight font-sans">
            Welcome back, <span className="font-semibold">{user?.name ? user.name.split(' ')[0] : 'Admin'}</span>
          </h1>
        </div>

        {/* Segmented Time Filter Pill */}
        <div className="inline-flex bg-[#1c1c23] border border-white/[0.06] rounded-full p-1 self-start sm:self-auto shadow-inner">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => onTimeRangeChange?.(period)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all select-none ${
                timeRange === period
                  ? 'bg-[#282833] text-white font-semibold shadow-xs'
                  : 'text-[#808090] hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Connected Top Metrics Section matching Expected UI */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 pt-4 pb-6">
        {/* Segment 1: Total Revenue / Core Total */}
        <div className="md:col-span-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs text-[#8e8e9f] font-medium font-sans">
              Total sales revenue
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              {loading ? (
                <div className="h-10 w-48 bg-white/10 animate-pulse rounded-lg" />
              ) : (
                <>
                  <span className="text-3xl sm:text-4xl font-semibold text-white tracking-tight font-sans">
                    ₹{revenueParts[0]}<span className="text-2xl text-white/70">.{revenueParts[1] || '00'}</span>
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {kpis?.revenue_growth >= 0 ? '+' : ''}{kpis?.revenue_growth ?? 18.4}%
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-[#757588] mt-1.5 font-sans">
              Available working capital:{' '}
              <span className="text-white/80 font-medium">
                ₹{formatCurrency(kpis?.working_capital ?? kpis?.cash_bank_balance ?? kpis?.total_revenue)}
              </span>
            </div>
          </div>

          {/* Action Buttons: New Invoice / Record Payment / More */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              onClick={onNewItem || (() => navigate('/invoices'))}
              className="bg-white text-black font-semibold rounded-full px-5 py-2 hover:bg-white/90 active:scale-95 text-xs flex items-center gap-1.5 transition-all shadow-sm select-none"
            >
              New Invoice <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <button
              onClick={() => navigate('/payments')}
              className="bg-[#24242e] text-white hover:bg-[#2e2e3a] font-medium rounded-full px-5 py-2 text-xs flex items-center gap-1.5 active:scale-95 transition-all select-none border border-white/[0.04]"
            >
              Record Payment <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2]" />
            </button>

            <button
              onClick={() => navigate('/reports')}
              className="w-8 h-8 rounded-full bg-[#24242e] text-white flex items-center justify-center hover:bg-[#2e2e3a] text-xs active:scale-95 transition-all border border-white/[0.04]"
              aria-label="Financial Reports"
              title="Financial Reports"
            >
              <MoreVertical className="w-3.5 h-3.5 text-[#a0a0b0]" />
            </button>
          </div>
        </div>

        {/* Segment 2: Procurement & Materials */}
        <div className="md:col-span-4 flex flex-col justify-between space-y-4 border-t md:border-t-0 md:border-l border-white/[0.06] md:pl-6 pt-4 md:pt-0">
          <div>
            <div className="text-base sm:text-lg font-semibold text-white tracking-tight">
              {loading ? (
                <div className="h-6 w-32 bg-white/10 animate-pulse rounded" />
              ) : (
                `₹${formatCurrency(kpis?.procurement_value ?? 88500.00)}`
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#8e8e9f] font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[#c084fc]" />
                {kpis?.procurement_growth >= 0 ? '+' : ''}{kpis?.procurement_growth ?? 24}% Procurement (Teak & Hardware)
              </span>
            </div>
          </div>

          {/* Solid Glowing Purple Visualizer Bar */}
          <div className="relative w-full">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="origin-left h-11 w-full rounded-xl bg-gradient-to-r from-[#7042f4] via-[#7d4cf7] to-[#8b5cf6] shadow-[0_0_24px_rgba(112,66,244,0.45)] border border-white/10"
            />
          </div>

          <div className="text-[11px] text-[#6d6d7e] font-sans">
            {kpis?.fiscal_period || 'Fiscal Q1 • Active PO Fulfillment'}
          </div>
        </div>

        {/* Segment 3: Top Products / Furniture Catalog */}
        <div className="md:col-span-4 flex flex-col justify-between space-y-4 border-t md:border-t-0 md:border-l border-white/[0.06] md:pl-6 pt-4 md:pt-0">
          <div className="relative">
            <div className="text-base sm:text-lg font-semibold text-white tracking-tight">
              {loading ? (
                <div className="h-6 w-32 bg-white/10 animate-pulse rounded" />
              ) : (
                `₹${formatCurrency(kpis?.top_products_value ?? 124000.00)}`
              )}
            </div>

            {/* Dashed line with Target Met badge */}
            <div className="relative my-1 flex items-center">
              <div className="w-full border-b border-dashed border-white/15" />
              <span className="absolute left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#262632] border border-white/[0.08] text-[#a0a0b0] select-none">
                Target Met
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#8e8e9f] pt-1 font-sans">
              <span className="text-white/80 font-medium">
                {kpis?.top_products_growth >= 0 ? '+' : ''}{kpis?.top_products_growth ?? 15}% Chairs & Tables
              </span>
              <span>Sofas & Combos</span>
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
                whileHover={{ height: '100%', filter: 'brightness(1.3)' }}
                className="flex-1 rounded-full bg-gradient-to-t from-[#7042f4] to-[#c084fc] opacity-85 hover:opacity-100 cursor-pointer transition-all shadow-[0_0_6px_rgba(112,66,244,0.3)]"
                title={`Level: ${height}%`}
              />
            ))}
          </div>

          <div className="text-[11px] text-[#6d6d7e] font-sans">
            Inventory Turnover &bull; FY 2026-27
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroMetricsSection;
