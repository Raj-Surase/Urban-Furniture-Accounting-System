import React, { useState } from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export const ActivityHeatmapCard: React.FC = () => {
  const [activeCell, setActiveCell] = useState<{ day: string; hour: string; count: number } | null>(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['1pm', '2pm', '3pm', '4pm', '5pm', '6pm'];

  // Matrix pattern calibrated to match the target image diamond concentration
  // Levels: 0 (darkest), 1 (subtle purple), 2 (mid purple), 3 (bright purple), 4 (lavender peak)
  const heatmapData: number[][] = [
    [0, 1, 1, 2, 1, 0, 0], // 1pm
    [0, 1, 3, 3, 2, 1, 0], // 2pm
    [0, 2, 3, 4, 3, 2, 0], // 3pm
    [1, 2, 3, 3, 2, 1, 0], // 4pm
    [0, 1, 2, 3, 2, 0, 0], // 5pm
    [0, 0, 1, 2, 1, 0, 0], // 6pm
  ];

  const getColorClass = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-[#c084fc] shadow-[0_0_12px_rgba(192,132,252,0.6)] text-black'; // Brightest Lavender
      case 3:
        return 'bg-[#7042f4] shadow-[0_0_8px_rgba(112,66,244,0.4)] text-white'; // Vibrant Purple
      case 2:
        return 'bg-[#4c2889] text-white/80'; // Mid Purple
      case 1:
        return 'bg-[#2f234c] text-white/60'; // Subtle Purple
      default:
        return 'bg-[#202029] text-transparent'; // Inactive dark
    }
  };

  return (
    <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-6 flex flex-col justify-between hover:border-white/[0.1] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/80" />
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight font-sans">
            Activity by time
          </h2>
        </div>

        <button
          className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#a0a0b0] hover:text-white flex items-center justify-center transition-colors"
          aria-label="View activity details"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Heatmap Grid matching Target Design */}
      <div className="mt-4 overflow-x-auto select-none">
        <div className="min-w-[280px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 gap-1.5 mb-2 text-center text-[11px] text-[#757588] font-sans">
            <span className="text-transparent">Hour</span>
            {days.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          {/* Matrix Rows */}
          <div className="space-y-1.5">
            {hours.map((hour, rIdx) => (
              <div key={hour} className="grid grid-cols-8 gap-1.5 items-center">
                {/* Y-axis Hour label */}
                <span className="text-[11px] text-[#757588] text-right pr-2 font-sans">
                  {hour}
                </span>

                {/* 7 Columns for Days */}
                {heatmapData[rIdx].map((level, cIdx) => {
                  const day = days[cIdx];
                  const count = level === 4 ? 42 : level === 3 ? 28 : level === 2 ? 16 : level === 1 ? 7 : 1;
                  return (
                    <motion.div
                      key={cIdx}
                      whileHover={{ scale: 1.25, zIndex: 10 }}
                      onMouseEnter={() => setActiveCell({ day, hour, count })}
                      onMouseLeave={() => setActiveCell(null)}
                      className={`h-6 sm:h-7 rounded-md transition-all duration-150 cursor-pointer ${getColorClass(
                        level
                      )}`}
                      title={`${day} at ${hour}: ${count} operations`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Hover Tooltip / Footer Legend */}
      <div className="flex items-center justify-between text-[11px] text-[#6d6d7e] font-sans pt-3 mt-2 border-t border-white/[0.04]">
        <div className="text-white/80 font-medium">
          {activeCell ? (
            <span>
              {activeCell.day} {activeCell.hour}: <strong className="text-[#c084fc]">{activeCell.count}</strong> events
            </span>
          ) : (
            <span>Peak: Thu 3pm</span>
          )}
        </div>

        {/* Legend: Less -> More */}
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#202029]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2f234c]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#4c2889]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#7042f4]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#c084fc]" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmapCard;

