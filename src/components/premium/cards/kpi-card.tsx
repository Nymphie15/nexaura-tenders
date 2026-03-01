'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from './glass-card';
import { spring } from '@/lib/animations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';

type KPIStatus = 'positive' | 'negative' | 'neutral' | 'warning';

interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  changePeriod?: string;
  status?: KPIStatus;
  tooltip?: string;
  target?: number;
  progress?: number;
  icon?: React.ReactNode;
  onClick?: () => void;
  delay?: number;
  compact?: boolean;
  className?: string;
}

const statusStyles: Record<KPIStatus, { bg: string; text: string; border: string }> = {
  positive: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
  negative: {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/20',
  },
  neutral: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
  },
};

interface ProgressBarProps {
  progress: number;
  status: KPIStatus;
  className?: string;
}

function ProgressBar({ progress, status, className }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  return (
    <div className={cn('h-1.5 bg-muted rounded-full overflow-hidden', className)}>
      <motion.div
        className={cn(
          'h-full rounded-full',
          status === 'positive' && 'bg-emerald-500',
          status === 'negative' && 'bg-red-500',
          status === 'neutral' && 'bg-slate-500',
          status === 'warning' && 'bg-amber-500'
        )}
        initial={{ width: 0 }}
        animate={{ width: `${clampedProgress}%` }}
        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
      />
    </div>
  );
}

interface ChangeBadgeProps {
  change: number;
  period?: string;
  className?: string;
}

function ChangeBadge({ change, period, className }: ChangeBadgeProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        isPositive && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        isNegative && 'bg-red-500/10 text-red-600 dark:text-red-400',
        !isPositive && !isNegative && 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, ...spring.bouncy }}
    >
      {(isPositive || isNegative) && <Icon className="w-3 h-3" />}
      <span>
        {isPositive && '+'}
        {change.toFixed(1)}%
      </span>
      {period && <span className="text-muted-foreground font-normal">{period}</span>}
    </motion.div>
  );
}

export function KPICard({
  label,
  value,
  change,
  changePeriod = 'vs last period',
  status = 'neutral',
  tooltip,
  target,
  progress,
  icon,
  onClick,
  delay = 0,
  compact = false,
  className,
}: KPICardProps) {
  const styles = statusStyles[status];
  const isClickable = !!onClick;

  return (
    <GlassCard
      variant={compact ? 'subtle' : 'default'}
      size={compact ? 'sm' : 'md'}
      hover={isClickable}
      delay={delay}
      className={cn(isClickable && 'cursor-pointer', className)}
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && (
              <motion.div
                className={cn('p-1.5 rounded-lg', styles.bg)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.2, ...spring.bouncy }}
              >
                <span className={styles.text}>{icon}</span>
              </motion.div>
            )}
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
          </div>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 rounded-md hover:bg-muted transition-colors">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <motion.div
          className="flex items-end gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.3, duration: 0.4 }}
        >
          <span className={cn('font-bold tracking-tight text-foreground', compact ? 'text-2xl' : 'text-3xl')}>
            {value}
          </span>
          {change !== undefined && <ChangeBadge change={change} period={!compact ? changePeriod : undefined} />}
        </motion.div>
        {progress !== undefined && (
          <div className="space-y-1.5">
            <ProgressBar progress={progress} status={status} />
            {target !== undefined && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress.toFixed(0)}% complete</span>
                <span>Target: {target}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default KPICard;
