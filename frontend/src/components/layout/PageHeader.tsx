import React from 'react';
import { motion } from 'framer-motion';

export interface PageHeaderProps {
  icon?: React.ReactNode;
  customIcon?: React.ReactNode;
  badge?: React.ReactNode;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  customIcon,
  badge,
  title,
  description,
  actions,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 ${className}`}
    >
      <div className="flex items-start sm:items-center gap-4">
        {customIcon ? (
          customIcon
        ) : icon ? (
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-xs">
            {icon}
          </div>
        ) : null}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-sans">
              {title}
            </h1>
            {badge}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl font-sans">
            {description}
          </p>
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
};
