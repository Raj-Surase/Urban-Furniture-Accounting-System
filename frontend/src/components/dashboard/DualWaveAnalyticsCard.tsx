import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CircleDot, MoreVertical } from 'lucide-react';

export const DualWaveAnalyticsCard: React.FC = () => {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

  return (
    <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-6 flex flex-col justify-between hover:border-white/[0.1] transition-all duration-300">
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
      <div className="flex items-center gap-4 mt-3 select-none">
        <div className="flex items-center gap-1.5 text-xs text-[#a0a0b0]">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#c6f135] shadow-[0_0_8px_rgba(198,241,53,0.5)]" />
          <span>Sales Revenue (Furniture)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#71717a]">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#52525b] border border-dashed border-white/40" />
          <span>Procurement Expenses</span>
        </div>
      </div>

      {/* Dual Wave SVG Canvas matching Expected UI */}
      <div className="relative w-full h-44 mt-4 select-none">
        <svg
          viewBox="0 0 400 160"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Lime Wave Gradient */}
            <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c6f135" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c6f135" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing Lime Shadow */}
            <filter id="limeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c6f135" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Vertical dashed guideline at peak month (June - x=250) */}
          <line
            x1="250"
            y1="25"
            x2="250"
            y2="145"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeDasharray="3 3"
          />

          {/* Expenses Wave (Dashed Gray) */}
          <motion.path
            d="M 0,110 C 60,115 100,85 150,110 C 200,135 240,75 290,110 C 340,145 370,120 400,125"
            fill="none"
            stroke="#71717a"
            strokeWidth="2"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Income Filled Area (Subtle Lime) */}
          <path
            d="M 0,105 C 50,110 80,60 130,50 C 180,40 210,110 260,115 C 310,120 350,70 400,85 L 400,160 L 0,160 Z"
            fill="url(#limeGradient)"
          />

          {/* Income Wave (Solid Glowing Lime) */}
          <motion.path
            d="M 0,105 C 50,110 80,60 130,50 C 180,40 210,110 260,115 C 310,120 350,70 400,85"
            fill="none"
            stroke="#c6f135"
            strokeWidth="2.5"
            filter="url(#limeGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Highlight Indicator Dots on June */}
          <circle cx="250" cy="113" r="4.5" fill="#c6f135" stroke="#18181f" strokeWidth="2" />
          <circle cx="250" cy="85" r="4" fill="#ffffff" stroke="#18181f" strokeWidth="2" />
        </svg>

        {/* Floating Tooltip Price Badges matching target image */}
        <div className="absolute top-2 right-12 flex flex-col gap-1 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="px-2.5 py-1 rounded-lg bg-[#24242e] border border-white/10 text-[11px] font-bold text-white shadow-lg flex items-center gap-1 self-end"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c6f135]" />
            ₹1,24,500.00
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="px-2.5 py-1 rounded-lg bg-[#1e1e26] border border-white/10 text-[11px] font-bold text-[#a0a0b0] shadow-lg flex items-center gap-1 self-end"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#71717a]" />
            ₹68,400.00
          </motion.div>
        </div>
      </div>

      {/* X-Axis Months */}
      <div className="flex items-center justify-between text-xs text-[#6d6d7e] font-sans pt-3 border-t border-white/[0.04]">
        {months.map((m) => (
          <span
            key={m}
            onMouseEnter={() => setHoveredMonth(m)}
            onMouseLeave={() => setHoveredMonth(null)}
            className={`transition-colors cursor-pointer px-1 py-0.5 rounded ${
              hoveredMonth === m ? 'text-white font-bold bg-white/[0.05]' : 'hover:text-white'
            }`}
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DualWaveAnalyticsCard;

