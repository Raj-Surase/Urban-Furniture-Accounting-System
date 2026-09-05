import React from 'react';

export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  columns?: number;
  className?: string;
}

/**
 * Animated obsidian shimmer table skeleton for data loading states.
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  cols,
  columns,
  className = '',
}) => {
  const columnCount = columns ?? cols ?? 6;
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className={`animate-pulse ${className}`}>
          {Array.from({ length: columnCount }).map((_, colIndex) => {
            // Vary widths for realistic look
            const widths = ['w-24', 'w-32', 'w-20', 'w-28', 'w-16', 'w-36'];
            const widthClass = widths[(rowIndex + colIndex) % widths.length];

            return (
              <td key={colIndex} className="py-3.5 px-4">
                <div
                  className={`h-4 ${widthClass} bg-white/[0.06] rounded-md`}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
};

export default TableSkeleton;
