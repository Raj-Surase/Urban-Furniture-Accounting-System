import React from 'react';
import { X, Search } from 'lucide-react';

export interface ColumnFilterDef {
  key: string;
  filterType?: 'text' | 'select' | 'number' | 'date' | 'none';
  options?: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}

export interface ColumnFilterRowProps {
  columns: ColumnFilterDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  className?: string;
}

export const ColumnFilterRow: React.FC<ColumnFilterRowProps> = ({
  columns,
  values,
  onChange,
  className = '',
}) => {
  return (
    <tr className={`bg-[#101015]/90 border-b border-white/[0.08] ${className}`}>
      {columns.map((col, idx) => {
        if (!col.filterType || col.filterType === 'none') {
          return (
            <th key={col.key || idx} className="py-2 px-3 text-center text-[10px] text-[#606070] font-normal">
              —
            </th>
          );
        }

        const currentVal = values[col.key] || '';

        if (col.filterType === 'select' && col.options) {
          return (
            <th key={col.key || idx} className={`py-2 px-3 ${col.className || ''}`}>
              <div className="relative">
                <select
                  value={currentVal}
                  onChange={(e) => onChange(col.key, e.target.value)}
                  className="w-full py-1 px-2 pr-6 bg-[#16161d] border border-white/[0.08] rounded-lg text-[11px] text-white focus:outline-none focus:border-[#7042f4] transition-all font-normal"
                >
                  <option value="">All</option>
                  {col.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {currentVal && (
                  <button
                    type="button"
                    onClick={() => onChange(col.key, '')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </th>
          );
        }

        return (
          <th key={col.key || idx} className={`py-2 px-3 ${col.className || ''}`}>
            <div className="relative">
              <input
                type={col.filterType === 'number' ? 'number' : col.filterType === 'date' ? 'date' : 'text'}
                value={currentVal}
                placeholder={col.placeholder || 'Filter...'}
                onChange={(e) => onChange(col.key, e.target.value)}
                className="w-full py-1 px-2.5 bg-[#16161d] border border-white/[0.08] rounded-lg text-[11px] text-white placeholder-[#606070] focus:outline-none focus:border-[#7042f4] transition-all font-normal"
              />
              {currentVal && (
                <button
                  type="button"
                  onClick={() => onChange(col.key, '')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </th>
        );
      })}
    </tr>
  );
};

