import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import {
  FieldFilterConfig,
  ActiveFieldFilter,
  FilterOperator,
} from '../../lib/filterUtils';

export interface FieldFilterBarProps {
  /** Search query state */
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;

  /** Configurable fields for this module */
  filterConfigs: FieldFilterConfig[];

  /** Currently applied field filters */
  activeFilters: ActiveFieldFilter[];
  onAddFilter: (filter: ActiveFieldFilter) => void;
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;

  /** Optional column filter row toggle */
  showColumnFilters?: boolean;
  onToggleColumnFilters?: () => void;

  /** Optional preset pill tabs (e.g. Quick status tabs) */
  presets?: {
    field: string;
    options: { label: string; value: string }[];
    currentValue: string;
    onChange: (val: string) => void;
  };

  /** Extra controls to render on the right */
  extraActions?: React.ReactNode;
  className?: string;
}

export const FieldFilterBar: React.FC<FieldFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterConfigs,
  activeFilters,
  onAddFilter,
  onRemoveFilter,
  onClearAll,
  showColumnFilters,
  onToggleColumnFilters,
  presets,
  extraActions,
  className = '',
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Popover form state
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>(
    filterConfigs[0]?.key || ''
  );
  const selectedConfig = filterConfigs.find((f) => f.key === selectedFieldKey) || filterConfigs[0];
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>('contains');
  const [filterValue, setFilterValue] = useState<string>('');

  // Update default operator when selected field changes
  useEffect(() => {
    if (!selectedConfig) return;
    if (selectedConfig.type === 'select') {
      setSelectedOperator('equals');
      if (selectedConfig.options && selectedConfig.options.length > 0) {
        setFilterValue(selectedConfig.options[0].value);
      }
    } else if (selectedConfig.type === 'number' || selectedConfig.type === 'date') {
      setSelectedOperator('gte');
      setFilterValue('');
    } else {
      setSelectedOperator('contains');
      setFilterValue('');
    }
  }, [selectedFieldKey, selectedConfig]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPopoverOpen]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig || !filterValue.toString().trim()) return;

    const newFilter: ActiveFieldFilter = {
      id: `${selectedConfig.key}-${Date.now()}`,
      field: selectedConfig.key,
      operator: selectedOperator,
      value: filterValue.trim(),
    };

    onAddFilter(newFilter);
    setIsPopoverOpen(false);
    // Reset value
    if (selectedConfig.type !== 'select') {
      setFilterValue('');
    }
  };

  const operatorLabels: Record<FilterOperator, string> = {
    contains: 'contains',
    equals: 'is',
    not_equals: 'is not',
    gte: '≥ (at least)',
    lte: '≤ (at most)',
  };

  const hasAnyFilter = searchQuery.trim() !== '' || activeFilters.length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#18181f] border border-white/[0.08] p-3 sm:p-4 rounded-2xl shadow-obsidian-card">
        {/* Left: Search & Quick Presets */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Universal Search Input */}
          <div className="relative min-w-[240px] flex-1 sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707080]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 bg-[#121216] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#606070] focus:outline-none focus:border-[#7042f4] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Presets Pills (e.g. Status tab selector) */}
          {presets && (
            <div className="flex items-center gap-1 bg-[#121216] border border-white/[0.08] p-1 rounded-xl overflow-x-auto max-w-full">
              {presets.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => presets.onChange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    presets.currentValue === opt.value
                      ? 'bg-white text-black font-bold shadow-xs'
                      : 'text-[#8a8a9a] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Field Filter Button & Column Filter Toggle */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {/* Add Field Filter Popover Button */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setIsPopoverOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeFilters.length > 0 || isPopoverOpen
                  ? 'bg-[#7042f4]/15 text-[#c084fc] border-[#7042f4]/40 shadow-xs'
                  : 'bg-[#121216] text-[#a0a0b0] hover:text-white border-white/[0.08]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Add Field Filter</span>
              {activeFilters.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#7042f4] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilters.length}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${isPopoverOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Field Filter Popover Modal */}
            {isPopoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#18181f] border border-white/12 rounded-2xl shadow-2xl p-4 z-50 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Filter className="w-3.5 h-3.5 text-[#7042f4]" />
                    <span>Filter by Field</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPopoverOpen(false)}
                    className="text-[#707080] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleApplyFilter} className="space-y-3 text-xs">
                  {/* Field Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8e8e9f] uppercase tracking-wider mb-1">
                      Target Field
                    </label>
                    <select
                      value={selectedFieldKey}
                      onChange={(e) => setSelectedFieldKey(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121216] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#7042f4]"
                    >
                      {filterConfigs.map((cfg) => (
                        <option key={cfg.key} value={cfg.key}>
                          {cfg.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8e8e9f] uppercase tracking-wider mb-1">
                      Operator / Condition
                    </label>
                    <select
                      value={selectedOperator}
                      onChange={(e) => setSelectedOperator(e.target.value as FilterOperator)}
                      className="w-full px-3 py-2 bg-[#121216] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#7042f4]"
                    >
                      {selectedConfig?.type === 'select' ? (
                        <>
                          <option value="equals">is equal to</option>
                          <option value="not_equals">is not</option>
                        </>
                      ) : selectedConfig?.type === 'number' || selectedConfig?.type === 'date' ? (
                        <>
                          <option value="gte">greater than or equal (≥)</option>
                          <option value="lte">less than or equal (≤)</option>
                          <option value="equals">is exactly</option>
                        </>
                      ) : (
                        <>
                          <option value="contains">contains text</option>
                          <option value="equals">exact match</option>
                          <option value="not_equals">does not contain</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Value Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8e8e9f] uppercase tracking-wider mb-1">
                      Filter Value
                    </label>
                    {selectedConfig?.type === 'select' && selectedConfig.options ? (
                      <select
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121216] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#7042f4]"
                      >
                        {selectedConfig.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : selectedConfig?.type === 'date' ? (
                      <input
                        type="date"
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121216] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#7042f4]"
                        required
                      />
                    ) : selectedConfig?.type === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        value={filterValue}
                        placeholder={selectedConfig.placeholder || 'Enter numeric amount...'}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121216] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#7042f4]"
                        required
                      />
                    ) : (
                      <input
                        type="text"
                        value={filterValue}
                        placeholder={selectedConfig?.placeholder || `Enter search text for ${selectedConfig?.label}...`}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121216] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#7042f4]"
                        required
                      />
                    )}
                  </div>

                  {/* Popover Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPopoverOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-[#8e8e9f] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#7042f4] hover:bg-[#5f32e6] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Apply Filter
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Toggle Inline Column Filters Row */}
          {onToggleColumnFilters && (
            <button
              type="button"
              onClick={onToggleColumnFilters}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showColumnFilters
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-xs'
                  : 'bg-[#121216] text-[#a0a0b0] hover:text-white border-white/[0.08]'
              }`}
              title="Toggle inline filters directly under table column headers"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Column Filters</span>
            </button>
          )}

          {extraActions}
        </div>
      </div>

      {/* Active Filter Chips / Badges Row */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1 px-1">
          <span className="text-[#8e8e9f] font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <span>Search: "{searchQuery}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:text-white p-0.5 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeFilters.map((af) => {
            const cfg = filterConfigs.find((c) => c.key === af.field);
            const label = cfg?.label || af.field;
            let displayVal = af.value;
            if (cfg?.type === 'select' && cfg.options) {
              const opt = cfg.options.find((o) => o.value === String(af.value));
              if (opt) displayVal = opt.label;
            }

            return (
              <span
                key={af.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#7042f4]/15 text-[#c084fc] border border-[#7042f4]/30"
              >
                <span>
                  <strong>{label}</strong> {operatorLabels[af.operator]} "{displayVal}"
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveFilter(af.id)}
                  className="hover:text-white p-0.5 rounded-full cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors ml-auto cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset all filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
