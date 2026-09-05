import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, ExternalLink, X, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BudgetLineType } from '../../types';

export interface BudgetExceededItem {
  accountName: string;
  budgetName?: string;
  budgetId?: number;
  committed: number;
  achieved: number;
  exceededBy?: number;
  type?: BudgetLineType;
  lineIndex?: number;
  message?: string;
}

interface BudgetExceededAlertProps {
  items: BudgetExceededItem[];
  title?: string;
  subtitle?: string;
  onDismiss?: () => void;
  onReviseBudget?: (budgetId?: number) => void;
  showReviseButton?: boolean;
  className?: string;
  compact?: boolean;
}

export const BudgetExceededAlert: React.FC<BudgetExceededAlertProps> = ({
  items,
  title = 'Budget Exceeded Limit Alert',
  subtitle,
  onDismiss,
  onReviseBudget,
  showReviseButton = true,
  className = '',
  compact = false,
}) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  const totalExceeded = items.reduce((acc, item) => {
    const diff = item.exceededBy ?? Math.max(0, item.achieved - item.committed);
    return acc + diff;
  }, 0);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-semibold ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
        <span>Budget Exceeded (+₹{Math.round(totalExceeded).toLocaleString('en-IN')})</span>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/40 via-[#1e131d]/70 to-[#18181f] border border-rose-500/30 shadow-[0_4px_24px_rgba(244,63,94,0.15)] p-4 sm:p-5 ${className}`}
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 opacity-70" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0 mt-0.5 shadow-sm">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                  Critical Warning
                </span>
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>{title}</span>
                </h4>
              </div>

              <p className="text-xs text-rose-200/90 leading-relaxed max-w-2xl">
                {subtitle ||
                  (items.length === 1
                    ? `Operations on account "${items[0].accountName}" have exceeded the allocated budget limit!`
                    : `Operations across ${items.length} account lines have exceeded their allocated budget limits!`)}
              </p>

              {/* Items Breakdown Grid */}
              <div className="pt-2 space-y-2">
                {items.map((it, idx) => {
                  const exceeded = it.exceededBy ?? Math.max(0, it.achieved - it.committed);
                  const pct = it.committed > 0 ? Math.round((it.achieved / it.committed) * 100) : 0;

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/30 border border-white/[0.06] text-xs flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-[200px]">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <div>
                          <span className="font-bold text-white block">
                            {it.accountName}
                            {it.lineIndex !== undefined && (
                              <span className="text-[#a0a0b0] font-normal ml-1">(Line #{it.lineIndex + 1})</span>
                            )}
                          </span>
                          {it.budgetName && (
                            <span className="text-[11px] text-[#8a8a9a] block">
                              Budget: <strong className="text-[#c084fc] font-medium">{it.budgetName}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right ml-auto">
                        <div>
                          <span className="text-[10px] text-[#707080] block uppercase tracking-wider">Committed Limit</span>
                          <span className="font-mono text-white font-semibold">
                            ₹{Math.round(it.committed).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#707080] block uppercase tracking-wider">Actual / Projected</span>
                          <span className="font-mono text-rose-300 font-semibold">
                            ₹{Math.round(it.achieved).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="pl-2 border-l border-white/[0.08]">
                          <span className="text-[10px] text-rose-400 font-bold block uppercase tracking-wider">
                            Over Budget ({pct}%)
                          </span>
                          <span className="font-mono text-rose-400 font-bold text-sm">
                            +₹{Math.round(exceeded).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Action / Close */}
          <div className="flex items-center gap-2 shrink-0">
            {showReviseButton && (
              <button
                type="button"
                onClick={() => {
                  if (onReviseBudget) {
                    onReviseBudget(items[0]?.budgetId);
                  } else {
                    const targetBudgetId = items[0]?.budgetId;
                    navigate(targetBudgetId ? `/budgets?id=${targetBudgetId}` : '/budgets');
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7042f4] to-[#9062f8] hover:from-[#6032e4] hover:to-[#8052e8] text-white text-xs font-semibold shadow-md transition-all whitespace-nowrap"
              >
                <span>Revise Budget</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="p-1.5 rounded-lg text-[#8a8a9a] hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Small Screen Revise Button */}
        {showReviseButton && (
          <div className="sm:hidden mt-3 pt-3 border-t border-white/[0.08] flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (onReviseBudget) {
                  onReviseBudget(items[0]?.budgetId);
                } else {
                  const targetBudgetId = items[0]?.budgetId;
                  navigate(targetBudgetId ? `/budgets?id=${targetBudgetId}` : '/budgets');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7042f4] text-white text-xs font-semibold"
            >
              <span>Revise Budget</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

