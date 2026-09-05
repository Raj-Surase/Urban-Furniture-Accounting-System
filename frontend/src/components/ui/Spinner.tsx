import React from 'react';
import { Spinner as HeroUISpinner, SpinnerProps as HeroUISpinnerProps } from '@heroui/react';

export interface SpinnerProps extends HeroUISpinnerProps {}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  label,
  ...props
}) => {
  return (
    <div className="flex items-center justify-center p-4">
      <HeroUISpinner
        size={size}
        color={color}
        label={label}
        className={className}
        {...props}
      />
    </div>
  );
};
