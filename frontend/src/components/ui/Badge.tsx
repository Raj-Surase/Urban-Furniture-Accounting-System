import React from 'react';
import { Chip, ChipProps } from '@heroui/react';

export interface BadgeProps extends Omit<ChipProps, 'color' | 'variant'> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'purple';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className, ...props }) => {
  let color: ChipProps['color'] = 'default';
  let chipVariant: ChipProps['variant'] = 'flat';

  switch (variant) {
    case 'success':
      color = 'success';
      chipVariant = 'flat';
      break;
    case 'warning':
      color = 'warning';
      chipVariant = 'flat';
      break;
    case 'danger':
      color = 'danger';
      chipVariant = 'flat';
      break;
    case 'purple':
      color = 'secondary';
      chipVariant = 'flat';
      break;
    case 'outline':
      color = 'default';
      chipVariant = 'bordered';
      break;
    case 'default':
    default:
      color = 'primary';
      chipVariant = 'flat';
      break;
  }

  return (
    <Chip
      size="sm"
      radius="lg"
      color={color}
      variant={chipVariant}
      className={`font-bold text-[11px] h-6 px-2.5 ${className || ''}`}
      {...props}
    >
      {children}
    </Chip>
  );
};
