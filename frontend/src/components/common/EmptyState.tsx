import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  colSpan?: number;
  className?: string;
}

/**
 * Obsidian styled empty state component with optional action buttons.
 * Supports both standalone placement and in-table placement via colSpan.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  colSpan,
  className = '',
}) => {
  const content = (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center max-w-md mx-auto space-y-3 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/50 shadow-inner">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight font-sans">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[#8e8e9f] font-sans leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-2.5 pt-2">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="bg-white text-black font-semibold rounded-full px-4 py-1.5 hover:bg-white/90 active:scale-95 text-xs transition-all shadow-sm select-none"
            >
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="bg-[#24242e] text-[#a0a0b0] hover:text-white hover:bg-[#2e2e3a] font-medium rounded-full px-4 py-1.5 text-xs active:scale-95 transition-all select-none border border-white/[0.06]"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (colSpan !== undefined) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-8">
          {content}
        </td>
      </tr>
    );
  }

  return content;
};

export default EmptyState;
