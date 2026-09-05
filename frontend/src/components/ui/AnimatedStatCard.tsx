import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Chip } from '@heroui/react';
import { AnimatedCounter } from './AnimatedCounter';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface AnimatedStatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  icon: React.ReactNode;
  colorScheme?: 'primary' | 'success' | 'warning' | 'secondary' | 'danger';
  delay?: number;
}

export const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  trend,
  icon,
  colorScheme = 'primary',
  delay = 0,
}) => {
  const colorStyles = {
    primary: {
      iconBg: 'bg-primary/10 text-primary border border-primary/20',
      border: 'hover:border-primary/40',
      chipColor: 'primary' as const,
    },
    success: {
      iconBg: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20',
      border: 'hover:border-emerald-500/40',
      chipColor: 'success' as const,
    },
    warning: {
      iconBg: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20',
      border: 'hover:border-amber-500/40',
      chipColor: 'warning' as const,
    },
    secondary: {
      iconBg: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20',
      border: 'hover:border-blue-500/40',
      chipColor: 'secondary' as const,
    },
    danger: {
      iconBg: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20',
      border: 'hover:border-rose-500/40',
      chipColor: 'danger' as const,
    },
  };

  const currentTheme = colorStyles[colorScheme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      className="group"
    >
      <Card
        className={`border border-border/50 dark:border-white/[0.08] bg-card/85 backdrop-blur-xl shadow-hero-card hover:shadow-hero-card-hover transition-all duration-300 ${currentTheme.border} rounded-2xl`}
      >
        <CardBody className="p-6 sm:p-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-sans">
              {title}
            </span>
            <div
              className={`p-3 rounded-xl ${currentTheme.iconBg} shadow-xs transition-transform duration-200 group-hover:scale-105`}
            >
              {icon}
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-sans">
              <AnimatedCounter
                value={value}
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
              />
            </div>

            {trend && (
              <div className="flex items-center gap-2 mt-2.5 text-xs">
                <Chip
                  size="sm"
                  color={trend.isPositive ? 'success' : 'danger'}
                  variant="flat"
                  startContent={
                    trend.isPositive ? (
                      <TrendingUp className="w-3 h-3 ml-0.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 ml-0.5" />
                    )
                  }
                  className="font-bold text-[10px] h-5"
                >
                  {trend.value}%
                </Chip>
                <span className="text-muted-foreground text-[11px] truncate font-medium">
                  {trend.label || 'synchronized'}
                </span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
