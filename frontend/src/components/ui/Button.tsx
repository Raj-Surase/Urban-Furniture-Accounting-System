import React from 'react';
import { Button as HeroUIButton, ButtonProps as HeroUIButtonProps } from '@heroui/react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends Omit<HeroUIButtonProps, 'variant' | 'color'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', color, isLoading, children, className, radius = 'lg', ...props }, ref) => {
    let heroColor: HeroUIButtonProps['color'] = color || 'default';
    let heroVariant: HeroUIButtonProps['variant'] = 'solid';

    switch (variant) {
      case 'primary':
        heroColor = color || 'primary';
        heroVariant = 'solid';
        break;
      case 'secondary':
        heroColor = color || 'secondary';
        heroVariant = 'flat';
        break;
      case 'outline':
        heroColor = color || 'default';
        heroVariant = 'bordered';
        break;
      case 'danger':
        heroColor = color || 'danger';
        heroVariant = 'solid';
        break;
      case 'ghost':
        heroColor = color || 'default';
        heroVariant = 'light';
        break;
      case 'solid':
      case 'bordered':
      case 'light':
      case 'flat':
      case 'faded':
      case 'shadow':
        heroVariant = variant;
        if (!color) heroColor = 'primary';
        break;
      default:
        heroVariant = 'solid';
        break;
    }

    return (
      <HeroUIButton
        ref={ref}
        color={heroColor}
        variant={heroVariant}
        radius={radius}
        isLoading={isLoading}
        className={cn(
          'font-semibold rounded-xl active:scale-[0.97] transition-all duration-150 select-none shadow-xs hover:shadow-sm',
          className
        )}
        {...props}
      >
        {children}
      </HeroUIButton>
    );
  }
);

Button.displayName = 'Button';
