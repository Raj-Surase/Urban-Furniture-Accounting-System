import React from 'react';
import { Alert as HeroUIAlert, AlertProps as HeroUIAlertProps } from '@heroui/react';

export interface AlertProps extends Omit<HeroUIAlertProps, 'color' | 'variant'> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className,
  ...props
}) => {
  let color: HeroUIAlertProps['color'] = 'primary';
  switch (variant) {
    case 'success':
      color = 'success';
      break;
    case 'warning':
      color = 'warning';
      break;
    case 'error':
      color = 'danger';
      break;
    case 'info':
    default:
      color = 'primary';
      break;
  }

  return (
    <HeroUIAlert
      color={color}
      title={title}
      variant="flat"
      className={className}
      {...props}
    >
      {children}
    </HeroUIAlert>
  );
};
