import React from 'react';
import { Loader2, ArrowDown, CheckCircle } from 'lucide-react';

export interface ScrollSentinelProps {
  sentinelRef: (node: HTMLElement | null) => void;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  visibleCount: number;
  onLoadMore?: () => void;
  entityName?: string;
  className?: string;
}

export const ScrollSentinel: React.FC<ScrollSentinelProps> = ({
  sentinelRef,
  loadingMore,
  hasMore,
  totalCount,
  visibleCount,
  onLoadMore,
  entityName = 'records',
  className = '',
}) => {
  const progressPct = totalCount > 0 ? Math.min(100, Math.round((visibleCount / totalCount) * 100)) : 100;

  return (
    <div
      ref={sentinelRef}
      className={`relative py-3.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8e8e9f] border-t border-white/[0.06] bg-[#141418]/80 backdrop-blur-md rounded-b-[20px] overflow-hidden ${className}`}
    >
      {/* Subtle progress track */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/[0.04]">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center gap-2.5">
        <span className="font-mono text-white/90 font-medium text-xs">
          Showing <strong className="text-white">{visibleCount}</strong> of{' '}
          <strong className="text-white">{totalCount}</strong> {entityName}
        </span>
        <span className="text-[10px] font-mono text-[#757588]">
          ({progressPct}%)
        </span>
        {!hasMore && (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
            <CheckCircle className="w-3 h-3" />
            All loaded
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {loadingMore ? (
          <div className="flex items-center gap-2 text-primary text-xs font-semibold py-1 px-3 bg-primary/10 rounded-full border border-primary/20 shadow-xs shadow-primary/20 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Loading next batch...</span>
          </div>
        ) : hasMore ? (
          <button
            type="button"
            onClick={onLoadMore}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white rounded-full border border-white/[0.08] transition-all cursor-pointer text-xs"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Scroll or click to load more</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

