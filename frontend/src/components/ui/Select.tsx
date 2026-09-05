import React from 'react';
import { Select as HeroUISelect, SelectItem, SelectProps as HeroUISelectProps } from '@heroui/react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<HeroUISelectProps, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, variant = 'bordered', size = 'md', radius = 'lg', className, ...props }, ref) => {
    return (
      <HeroUISelect
        ref={ref}
        label={label}
        variant={variant}
        size={size}
        radius={radius}
        isInvalid={!!error}
        errorMessage={error}
        className={cn('transition-all duration-150', className)}
        popoverProps={{
          classNames: {
            content: 'rounded-2xl border border-border/50 dark:border-white/[0.08] bg-card/95 backdrop-blur-xl shadow-hero-dropdown p-1.5',
          },
        }}
        {...props}
      >
        {options.map((opt) => (
          <SelectItem key={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </HeroUISelect>
    );
  }
);

Select.displayName = 'Select';
