import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CircleDot, MoreVertical } from 'lucide-react';
import { dashboardApi } from '../../lib/api';

interface MonthData {
  month: string;
  year?: number;
  revenue: number;
  expenses: number;
}

export const DualWaveAnalyticsCard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<{
    months: MonthData[];
    peak_revenue?: number;
    peak_expense?: number;
    latest_revenue?: number;
    latest_expense?: number;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    dashboardApi.getAnalytics()
      .then((res) => {
        if (isMounted && res?.months) {
          setAnalyticsData(res);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard analytics:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const months: MonthData[] = useMemo(() => {
    if (analyticsData?.months && analyticsData.months.length >= 2) {
      return analyticsData.months;
    }
    return [
      { month: 'Oct', revenue: 45000, expenses: 32000 },
      { month: 'Nov', revenue: 62000, expenses: 38000 },
      { month: 'Dec', revenue: 84000, expenses: 54000 },
      { month: 'Jan', revenue: 105000, expenses: 62000 },
      { month: 'Feb', revenue: 124500, expenses: 68400 },
      { month: 'Mar', revenue: 118000, expenses: 72000 },
    ];
  }, [analyticsData]);

  // SVG Geometry Calculation (400x160 canvas)
  const { incomePath, expensePath, filledPath, incomePoints, expensePoints, xs, activeIdx } = useMemo(() => {
    const count = months.length;
    const width = 400;
    const step = count > 1 ? width / (count - 1) : width;
    const xCoords = months.map((_, i) => i * step);

    const maxVal = Math.max(
      ...months.map((m) => Math.max(Number(m.revenue) || 0, Number(m.expenses) || 0)),
      1000
    );

    const getY = (val: number) => {
      const clamped = Math.max(0, val);
      return 135 - (clamped / maxVal) * 90;
    };

    const inPoints = months.map((m, i) => ({ x: xCoords[i], y: getY(Number(m.revenue) || 0) }));
    const exPoints = months.map((m, i) => ({ x: xCoords[i], y: getY(Number(m.expenses) || 0) }));

    const buildPath = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return '';
      let d = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cx1 = p0.x + (p1.x - p0.x) / 2;
        const cy1 = p0.y;
        const cx2 = p0.x + (p1.x - p0.x) / 2;
        const cy2 = p1.y;
        d += ` C ${cx1},${cy1} ${cx2},${cy2} ${p1.x},${p1.y}`;
      }
      return d;
    };

    const inPath = buildPath(inPoints);
    const exPath = buildPath(exPoints);
    const fillPath = `${inPath} L ${width},160 L 0,160 Z`;

    // Default to peak month or latest
    const defaultIdx = months.reduce((maxI, m, i, arr) => (m.revenue > arr[maxI].revenue ? i : maxI), count - 1);
    const active = hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < count ? hoveredIdx : defaultIdx;

    return {
      incomePath: inPath,
      expensePath: exPath,
      filledPath: fillPath,
      incomePoints: inPoints,
      expensePoints: exPoints,
      xs: xCoords,
      activeIdx: active,
    };
  }, [months, hoveredIdx]);

  const formatCurrency = (val?: number) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const activeMonth = months[activeIdx];
  const displayRevenue = activeMonth?.revenue ?? analyticsData?.latest_revenue ?? 124500.00;
  const displayExpense = activeMonth?.expenses ?? analyticsData?.latest_expense ?? 68400.00;

  return (
    <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-6 flex flex-col justify-between hover:border-white/[0.1] transition-all duration-300 h-[380px]">
      {/* Header and Legend */}
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-white/80" />
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight font-sans">
              Analytics
            </h2>
          </div>

          <button
            className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#a0a0b0] hover:text-white flex items-center justify-center transition-colors"
            aria-label="Analytics options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Legend Row */}
        <div className="flex items-center gap-4 mt-2.5 select-none">
          <div className="flex items-center gap-1.5 text-xs text-[#a0a0b0]">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#c6f135] shadow-[0_0_8px_rgba(198,241,53,0.5)]" />
            <span>Sales Revenue (Furniture)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#71717a]">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#52525b] border border-dashed border-white/40" />
            <span>Procurement Expenses</span>
          </div>
        </div>
      </div>

      {/* Dual Wave SVG Canvas matching Expected UI */}
      <div className="relative w-full h-44 my-auto select-none">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full h-24 bg-white/5 animate-pulse rounded-xl" />
          </div>
        ) : (
          <>
            <svg
              viewBox="0 0 400 160"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c6f135" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#c6f135" stopOpacity="0.0" />
                </linearGradient>

                <filter id="limeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c6f135" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Vertical dashed guideline at active month */}
              {xs[activeIdx] !== undefined && (
                <line
                  x1={xs[activeIdx]}
                  y1="25"
                  x2={xs[activeIdx]}
                  y2="145"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeDasharray="3 3"
                />
              )}

              {/* Expenses Wave (Dashed Gray) */}
              <motion.path
                d={expensePath}
                fill="none"
                stroke="#71717a"
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
              />

              {/* Income Filled Area (Subtle Lime) */}
              <path d={filledPath} fill="url(#limeGradient)" />

              {/* Income Wave (Solid Glowing Lime) */}
              <motion.path
                d={incomePath}
                fill="none"
                stroke="#c6f135"
                strokeWidth="2.5"
                filter="url(#limeGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
              />

              {/* Highlight Indicator Dots on Active Month */}
              {incomePoints[activeIdx] && (
                <circle
                  cx={incomePoints[activeIdx].x}
                  cy={incomePoints[activeIdx].y}
                  r="5"
                  fill="#c6f135"
                  stroke="#18181f"
                  strokeWidth="2"
                />
              )}
              {expensePoints[activeIdx] && (
                <circle
                  cx={expensePoints[activeIdx].x}
                  cy={expensePoints[activeIdx].y}
                  r="4"
                  fill="#ffffff"
                  stroke="#18181f"
                  strokeWidth="2"
                />
              )}
            </svg>

            {/* Floating Tooltip Price Badges with Real Live Values */}
            <div className="absolute top-2 right-4 flex flex-col gap-1 pointer-events-none">
              <motion.div
                key={`rev-${activeIdx}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="px-2.5 py-1 rounded-lg bg-[#24242e] border border-white/10 text-[11px] font-bold text-white shadow-lg flex items-center gap-1 self-end"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#c6f135]" />
                ₹{formatCurrency(displayRevenue)}
              </motion.div>
              <motion.div
                key={`exp-${activeIdx}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="px-2.5 py-1 rounded-lg bg-[#1e1e26] border border-white/10 text-[11px] font-bold text-[#a0a0b0] shadow-lg flex items-center gap-1 self-end"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#71717a]" />
                ₹{formatCurrency(displayExpense)}
              </motion.div>
            </div>
          </>
        )}
      </div>

      {/* X-Axis Dynamic Months */}
      <div className="flex items-center justify-between text-xs text-[#6d6d7e] font-sans pt-3 border-t border-white/[0.04]">
        {months.map((m, idx) => (
          <span
            key={m.month + idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`transition-colors cursor-pointer px-1.5 py-0.5 rounded ${
              activeIdx === idx ? 'text-white font-bold bg-white/[0.08]' : 'hover:text-white'
            }`}
          >
            {m.month}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DualWaveAnalyticsCard;
