import React from 'react';
import { motion } from 'framer-motion';
import { List, LayoutGrid, Plus, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../ui/Button';

export interface MasterViewLayoutProps {
  title: string;
  subtitle?: string;
  viewMode: 'list' | 'kanban' | 'form';
  onViewModeChange?: (mode: 'list' | 'kanban') => void;
  onNew?: () => void;
  onBack?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  extraHeaderActions?: React.ReactNode;
  children: React.ReactNode;
}

export const MasterViewLayout: React.FC<MasterViewLayoutProps> = ({
  title,
  subtitle,
  viewMode,
  onViewModeChange,
  onNew,
  onBack,
  searchPlaceholder = 'Search records...',
  searchValue = '',
  onSearchChange,
  extraHeaderActions,
  children,
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/90 dark:bg-[#18181f]/80 backdrop-blur-xl border border-border dark:border-white/[0.08] p-5 rounded-2xl shadow-card dark:shadow-obsidian-card">
        <div>
          <div className="flex items-center gap-3">
            {viewMode === 'form' && onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-muted/60 dark:bg-white/[0.05] hover:bg-muted dark:hover:bg-white/[0.1] text-muted-foreground hover:text-foreground dark:text-[#9090a0] dark:hover:text-white transition-all border border-border dark:border-white/[0.06]"
                title="Back to List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white tracking-tight">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-[#8a8a9a] mt-1 ml-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {viewMode !== 'form' && onSearchChange && (
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-[#707080]" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 bg-muted/50 dark:bg-[#121216] border border-border dark:border-white/[0.08] rounded-xl text-xs text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder-[#606070] focus:outline-none focus:border-primary transition-all"
              />
            </div>
          )}

          {/* List / Kanban Switcher */}
          {viewMode !== 'form' && onViewModeChange && (
            <div className="flex items-center bg-muted/50 dark:bg-[#121216] border border-border dark:border-white/[0.08] p-1 rounded-xl">
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === 'list'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground dark:text-[#8a8a9a] dark:hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('kanban')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground dark:text-[#8a8a9a] dark:hover:text-white'
                }`}
                title="Kanban View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}

          {extraHeaderActions}

          {onNew && viewMode !== 'form' && (
            <Button
              onClick={onNew}
              className="flex items-center gap-2 px-4 py-2 bg-[#7042f4] hover:bg-[#5f32e6] text-white rounded-xl text-xs font-semibold shadow-lg shadow-[#7042f4]/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
