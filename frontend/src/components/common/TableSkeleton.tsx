import React from 'react';

export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  columns?: number;
  className?: string;
  isPaginationLoader?: boolean;
}

/**
 * Animated obsidian shimmer table skeleton for data loading and pagination loading states.
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  cols,
  columns,
  className = '',
  isPaginationLoader = false,
}) => {
  const columnCount = columns ?? cols ?? 6;

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr
          key={`skel-row-${rowIndex}`}
          className={`border-b border-white/[0.03] transition-opacity duration-300 ${
            isPaginationLoader ? 'opacity-75 bg-white/[0.01]' : 'animate-pulse'
          } ${className}`}
        >
          {Array.from({ length: columnCount }).map((_, colIndex) => {
            // Vary widths for realistic look across columns
            const widths = [
              'w-24 sm:w-28',
              'w-36 sm:w-48',
              'w-20 sm:w-24',
              'w-28 sm:w-32',
              'w-16 sm:w-20',
              'w-24 sm:w-36',
              'w-14 sm:w-20',
              'w-20 sm:w-28',
            ];
            const widthClass = widths[(rowIndex * 2 + colIndex) % widths.length];

            // Render special elements for first and last columns occasionally
            const isFirst = colIndex === 0;
            const isLast = colIndex === columnCount - 1;

            return (
              <td key={`skel-cell-${rowIndex}-${colIndex}`} className="py-3.5 px-4">
                <div className="flex items-center gap-2">
                  {isFirst && !isPaginationLoader && (
                    <div className="w-5 h-5 rounded-md bg-white/[0.05] shrink-0 animate-pulse" />
                  )}
                  <div
                    className={`h-4 ${widthClass} rounded-md bg-gradient-to-r from-white/[0.04] via-white/[0.09] to-white/[0.04] animate-pulse`}
                  />
                  {isLast && (
                    <div className="w-4 h-4 ml-auto rounded-full bg-white/[0.03] hidden sm:block animate-pulse" />
                  )}
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
};

export default TableSkeleton;

