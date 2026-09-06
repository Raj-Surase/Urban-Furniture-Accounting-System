import React from 'react';

export interface CardGridSkeletonProps {
  count?: number;
  columns?: string; // e.g. "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
  isPaginationLoader?: boolean;
  className?: string;
}

/**
 * Animated obsidian shimmer skeleton for card grids and Kanban boards.
 */
export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
  columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  isPaginationLoader = false,
  className = '',
}) => {
  return (
    <div className={`grid ${columns} gap-5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skel-card-${i}`}
          className={`border border-white/[0.06] bg-[#18181f] rounded-[24px] p-6 sm:p-7 shadow-obsidian-card space-y-4 flex flex-col justify-between ${
            isPaginationLoader ? 'opacity-80' : 'animate-pulse'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 bg-gradient-to-r from-white/[0.05] via-white/[0.1] to-white/[0.05] rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-gradient-to-r from-white/[0.05] via-white/[0.1] to-white/[0.05] rounded-md animate-pulse" />
            </div>
            <div className="h-6 w-20 rounded-full bg-white/[0.05] animate-pulse shrink-0" />
          </div>

          {/* Body */}
          <div className="space-y-2 py-2">
            <div className="h-3.5 w-full bg-white/[0.04] rounded animate-pulse" />
            <div className="h-3.5 w-4/5 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-3.5 w-2/3 bg-white/[0.03] rounded animate-pulse" />
          </div>

          {/* Footer Metadata */}
          <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/[0.05] animate-pulse" />
              <div className="h-3 w-20 bg-white/[0.04] rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-white/[0.05] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardGridSkeleton;
