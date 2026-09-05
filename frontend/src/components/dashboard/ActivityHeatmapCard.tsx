import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardApi } from '../../lib/api';

interface PeakInfo {
  day: string;
  hour: string;
  count: number;
  description: string;
}

export const ActivityHeatmapCard: React.FC = () => {
  const [activeCell, setActiveCell] = useState<{ day: string; hour: string; count: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [days, setDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [hours, setHours] = useState<string[]>(['1pm', '2pm', '3pm', '4pm', '5pm', '6pm']);
  const [matrix, setMatrix] = useState<number[][]>([
    [0, 1, 1, 2, 1, 0, 0],
    [0, 1, 3, 3, 2, 1, 0],
    [0, 2, 3, 4, 3, 2, 0],
    [1, 2, 3, 3, 2, 1, 0],
    [0, 1, 2, 3, 2, 0, 0],
    [0, 0, 1, 2, 1, 0, 0],
  ]);
  const [countsMatrix, setCountsMatrix] = useState<number[][]>([]);
  const [peak, setPeak] = useState<PeakInfo>({
    day: 'Thu',
    hour: '3pm',
    count: 42,
    description: 'Order dispatch & posting',
  });

  useEffect(() => {
    let isMounted = true;
    dashboardApi.getActivity()
      .then((res) => {
        if (isMounted && res) {
          if (res.days) setDays(res.days);
          if (res.hours) setHours(res.hours);
          if (res.matrix) setMatrix(res.matrix);
          if (res.counts) setCountsMatrix(res.counts);
          if (res.peak) setPeak(res.peak);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch activity heatmap:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    <div className="bg-[#18181f] border border-white/[0.06] rounded-[24px] p-6 flex flex-col justify-between hover:border-white/[0.1] transition-all duration-300 h-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/80" />
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight font-sans">
            Workshop & Accounting Activity
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
      <div className="my-auto overflow-x-auto select-none">
        <div className="min-w-[280px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 gap-1.5 mb-2 text-center text-[11px] text-[#757588] font-sans">
            <span className="text-transparent">Hour</span>
            {days.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          {/* Matrix Rows */}
          {loading ? (
            <div className="space-y-1.5 py-1">
              {[1, 2, 3, 4, 5, 6].map((r) => (
                <div key={r} className="grid grid-cols-8 gap-1.5 items-center">
                  <div className="h-6 w-8 bg-white/5 rounded" />
                  {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                    <div key={c} className="h-6 sm:h-7 rounded-md bg-white/5 animate-pulse" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {hours.map((hour, rIdx) => (
                <div key={hour} className="grid grid-cols-8 gap-1.5 items-center">
                  {/* Y-axis Hour label */}
                  <span className="text-[11px] text-[#757588] text-right pr-2 font-sans">
                    {hour}
                  </span>

                  {/* 7 Columns for Days */}
                  {(matrix[rIdx] || []).map((level, cIdx) => {
                    const day = days[cIdx] || '';
                    const actualCount = countsMatrix[rIdx]?.[cIdx] ?? (level > 0 ? level * 8 : 0);
                    return (
                      <motion.div
                        key={cIdx}
                        whileHover={{ scale: 1.25, zIndex: 10 }}
                        onMouseEnter={() => setActiveCell({ day, hour, count: actualCount })}
                        onMouseLeave={() => setActiveCell(null)}
                        className={`h-6 sm:h-7 rounded-md transition-all duration-150 cursor-pointer ${getColorClass(
                          level
                        )}`}
                        title={`${day} at ${hour}: ${actualCount} operations`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Hover Tooltip / Footer Legend */}
      <div className="flex items-center justify-between text-[11px] text-[#6d6d7e] font-sans pt-3 border-t border-white/[0.04]">
        <div className="text-white/80 font-medium truncate pr-2">
          {activeCell ? (
            <span>
              {activeCell.day} {activeCell.hour}: <strong className="text-[#c084fc]">{activeCell.count}</strong> events
            </span>
          ) : (
            <span>
              Peak: <span className="text-white">{peak.day} {peak.hour}</span> &bull; {peak.description}
            </span>
          )}
        </div>

        {/* Legend: Less -> More */}
        <div className="flex items-center gap-1.5 shrink-0">
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
