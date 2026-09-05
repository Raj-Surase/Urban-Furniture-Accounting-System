import React from 'react';
import {
  Card as HeroUICard,
  CardHeader as HeroUICardHeader,
  CardBody as HeroUICardBody,
  CardFooter as HeroUICardFooter,
  CardProps as HeroUICardProps,
} from '@heroui/react';
import { cn } from '../../lib/utils';

export interface CardProps extends HeroUICardProps {
  className?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => (
  <HeroUICard
    className={cn(
      'border border-border/50 dark:border-white/[0.08] bg-card/85 backdrop-blur-xl shadow-hero-card hover:shadow-hero-card-hover transition-all duration-300 rounded-2xl',
      className
    )}
    {...props}
  >
    {children}
  </HeroUICard>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <HeroUICardHeader className={cn('flex flex-col items-start gap-1.5 p-6 sm:p-7 pb-3', className)} {...props}>
    {children}
  </HeroUICardHeader>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('font-bold tracking-tight text-lg sm:text-xl text-foreground font-sans', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <HeroUICardBody className={cn('p-6 sm:p-7 pt-2', className)} {...props}>
    {children}
  </HeroUICardBody>
);

export const CardBody = HeroUICardBody;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <HeroUICardFooter className={cn('flex items-center p-6 sm:p-7 pt-2', className)} {...props}>
    {children}
  </HeroUICardFooter>
);
