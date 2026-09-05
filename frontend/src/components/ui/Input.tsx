import React from 'react';
import { Input as HeroUIInput, InputProps as HeroUIInputProps } from '@heroui/react';
import { cn } from '../../lib/utils';

export interface InputProps extends Omit<HeroUIInputProps, 'error'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, variant = 'bordered', size = 'md', radius = 'lg', className, ...props }, ref) => {
    return (
      <HeroUIInput
        ref={ref}
        label={label}
        variant={variant}
        size={size}
        radius={radius}
        isInvalid={!!error}
        errorMessage={error}
        description={helperText}
        className={cn('transition-all duration-150', className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
