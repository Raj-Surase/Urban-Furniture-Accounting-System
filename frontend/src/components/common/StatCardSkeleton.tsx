import React from 'react';

export interface StatCardSkeletonProps {
  count?: number;
  columns?: string;
  className?: string;
}

/**
 * Animated obsidian shimmer skeleton for KPI stat cards at the top of pages.
 */
export const StatCardSkeleton: React.FC<StatCardSkeletonProps> = ({
  count = 4,
  columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  className = '',
}) => {
  return (
    <div className={`grid ${columns} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skel-stat-${i}`}
          className="bg-[#18181f] border border-white/[0.06] rounded-2xl p-5 shadow-obsidian-card animate-pulse flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-28 bg-white/[0.06] rounded" />
            <div className="w-8 h-8 rounded-xl bg-white/[0.04]" />
          </div>

          <div className="space-y-1">
            <div className="h-7 w-36 bg-gradient-to-r from-white/[0.05] via-white/[0.1] to-white/[0.05] rounded-md" />
            <div className="h-3 w-24 bg-white/[0.04] rounded mt-1.5" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCardSkeleton;
