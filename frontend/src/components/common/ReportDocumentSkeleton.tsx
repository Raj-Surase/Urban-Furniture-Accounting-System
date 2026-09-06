import React from 'react';

export interface ReportDocumentSkeletonProps {
  type?: 'dual-column' | 'single-column' | 'budget';
  className?: string;
}

/**
 * Animated obsidian shimmer skeleton for printable financial report documents.
 */
export const ReportDocumentSkeleton: React.FC<ReportDocumentSkeletonProps> = ({
  type = 'dual-column',
  className = '',
}) => {
  return (
    <div
      className={`bg-[#18181f]/95 border border-white/[0.08] rounded-2xl p-8 shadow-obsidian-card space-y-8 animate-pulse ${className}`}
    >
      {/* Document Header */}
      <div className="border-b border-white/[0.08] pb-6 flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-7 w-72 bg-gradient-to-r from-white/[0.05] via-white/[0.1] to-white/[0.05] rounded-md" />
          <div className="h-3.5 w-48 bg-white/[0.04] rounded" />
        </div>
        <div className="text-right space-y-2">
          <div className="h-3.5 w-32 bg-white/[0.04] rounded ml-auto" />
          <div className="h-5 w-36 bg-emerald-500/10 rounded-full border border-emerald-500/20 ml-auto" />
        </div>
      </div>

      {type === 'dual-column' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column (e.g. Assets or Revenue) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="h-4 w-32 bg-white/[0.08] rounded" />
              <div className="h-3.5 w-24 bg-white/[0.04] rounded" />
            </div>

            {/* Section 1 */}
            <div className="space-y-3 pl-2">
              <div className="h-3.5 w-20 bg-white/[0.06] rounded" />
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="flex justify-between items-center py-1 pl-3">
                  <div className="h-3 w-40 bg-white/[0.03] rounded" />
                  <div className="h-3 w-24 bg-white/[0.05] rounded" />
                </div>
              ))}
            </div>

            {/* Section 2 */}
            <div className="space-y-3 pl-2 pt-2">
              <div className="h-3.5 w-24 bg-white/[0.06] rounded" />
              {[1, 2].map((idx) => (
                <div key={idx} className="flex justify-between items-center py-1 pl-3">
                  <div className="h-3 w-36 bg-white/[0.03] rounded" />
                  <div className="h-3 w-20 bg-white/[0.05] rounded" />
                </div>
              ))}
            </div>

            {/* Column Total */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex justify-between items-center">
              <div className="h-4 w-28 bg-white/[0.07] rounded" />
              <div className="h-5 w-32 bg-white/[0.1] rounded font-mono" />
            </div>
          </div>

          {/* Right Column (e.g. Liabilities & Equity or Expenses) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="h-4 w-36 bg-white/[0.08] rounded" />
              <div className="h-3.5 w-24 bg-white/[0.04] rounded" />
            </div>

            {/* Section 1 */}
            <div className="space-y-3 pl-2">
              <div className="h-3.5 w-28 bg-white/[0.06] rounded" />
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="flex justify-between items-center py-1 pl-3">
                  <div className="h-3 w-44 bg-white/[0.03] rounded" />
                  <div className="h-3 w-24 bg-white/[0.05] rounded" />
                </div>
              ))}
            </div>

            {/* Section 2 */}
            <div className="space-y-3 pl-2 pt-2">
              <div className="h-3.5 w-20 bg-white/[0.06] rounded" />
              {[1, 2].map((idx) => (
                <div key={idx} className="flex justify-between items-center py-1 pl-3">
                  <div className="h-3 w-32 bg-white/[0.03] rounded" />
                  <div className="h-3 w-28 bg-white/[0.05] rounded" />
                </div>
              ))}
            </div>

            {/* Column Total */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex justify-between items-center">
              <div className="h-4 w-32 bg-white/[0.07] rounded" />
              <div className="h-5 w-32 bg-white/[0.1] rounded font-mono" />
            </div>
          </div>
        </div>
      ) : (
        /* Single column / budget report breakdown */
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 bg-white/[0.08] rounded" />
                <div className="h-3 w-28 bg-white/[0.04] rounded" />
              </div>
              <div className="flex items-center gap-6">
                <div className="h-4 w-20 bg-white/[0.05] rounded" />
                <div className="h-4 w-20 bg-white/[0.05] rounded" />
                <div className="h-4 w-16 bg-white/[0.06] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportDocumentSkeleton;
