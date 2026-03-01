'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeInUp, hoverLift, spring } from '@/lib/animations';

type GlassVariant = 'default' | 'subtle' | 'strong' | 'gradient' | 'bordered';
type GlassSize = 'sm' | 'md' | 'lg' | 'xl';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: GlassVariant;
  size?: GlassSize;
  hover?: boolean;
  animate?: boolean;
  delay?: number;
  glow?: boolean;
  className?: string;
}

const variantStyles: Record<GlassVariant, string> = {
  default: cn(
    'bg-white/70 dark:bg-slate-900/70',
    'border border-white/20 dark:border-slate-700/50',
    'shadow-xl shadow-slate-900/5 dark:shadow-black/20'
  ),
  subtle: cn(
    'bg-white/50 dark:bg-slate-900/50',
    'border border-white/10 dark:border-slate-700/30',
    'shadow-lg shadow-slate-900/5 dark:shadow-black/10'
  ),
  strong: cn(
    'bg-white/90 dark:bg-slate-900/90',
    'border border-white/30 dark:border-slate-700/60',
    'shadow-2xl shadow-slate-900/10 dark:shadow-black/30'
  ),
  gradient: cn(
    'bg-gradient-to-br from-white/80 via-white/60 to-white/40',
    'dark:from-slate-900/80 dark:via-slate-800/60 dark:to-slate-900/40',
    'border border-white/30 dark:border-slate-700/50',
    'shadow-xl shadow-slate-900/5 dark:shadow-black/20'
  ),
  bordered: cn(
    'bg-white/60 dark:bg-slate-900/60',
    'border-2 border-primary/20 dark:border-primary/30',
    'shadow-lg shadow-primary/5 dark:shadow-primary/10'
  ),
};

const sizeStyles: Record<GlassSize, string> = {
  sm: 'p-4 rounded-xl',
  md: 'p-6 rounded-2xl',
  lg: 'p-8 rounded-3xl',
  xl: 'p-10 rounded-[2rem]',
};

const glowStyles = cn(
  'relative overflow-hidden',
  'before:absolute before:inset-0 before:opacity-0',
  'before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent',
  'before:transition-opacity before:duration-500',
  'hover:before:opacity-100'
);

export function GlassCard({
  children,
  variant = 'default',
  size = 'md',
  hover = true,
  animate = true,
  delay = 0,
  glow = false,
  className,
  ...props
}: GlassCardProps) {
  const animationProps = animate
    ? {
        initial: fadeInUp.initial,
        animate: fadeInUp.animate,
        exit: fadeInUp.exit,
        transition: { ...fadeInUp.transition, delay },
      }
    : {};

  const hoverProps = hover
    ? {
        whileHover: hoverLift,
        whileTap: { scale: 0.995 },
        transition: spring.gentle,
      }
    : {};

  return (
    <motion.div
      className={cn(
        'backdrop-blur-xl',
        variantStyles[variant],
        sizeStyles[size],
        glow && glowStyles,
        className
      )}
      {...animationProps}
      {...hoverProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface GlassCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function GlassCardHeader({
  title,
  description,
  action,
  children,
  className,
  ...props
}: GlassCardHeaderProps) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4 mb-4', className)}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface GlassCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function GlassCardContent({
  children,
  className,
  ...props
}: GlassCardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

interface GlassCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function GlassCardFooter({
  children,
  className,
  ...props
}: GlassCardFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 mt-4 pt-4',
        'border-t border-white/10 dark:border-slate-700/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

GlassCard.Header = GlassCardHeader;
GlassCard.Content = GlassCardContent;
GlassCard.Footer = GlassCardFooter;

export default GlassCard;
