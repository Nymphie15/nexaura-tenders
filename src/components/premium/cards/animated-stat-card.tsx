'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from './glass-card';
import { spring } from '@/lib/animations';
import { ArrowDown, ArrowUp, Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface AnimatedStatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon?: React.ReactNode;
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  description?: string;
  sparklineData?: number[];
  delay?: number;
  hover?: boolean;
  className?: string;
}

const accentStyles = {
  primary: {
    icon: 'bg-primary/10 text-primary',
    trend: 'text-primary',
    sparkline: 'stroke-primary',
  },
  success: {
    icon: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
    trend: 'text-emerald-500 dark:text-emerald-400',
    sparkline: 'stroke-emerald-500',
  },
  warning: {
    icon: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
    trend: 'text-amber-500 dark:text-amber-400',
    sparkline: 'stroke-amber-500',
  },
  destructive: {
    icon: 'bg-red-500/10 text-red-500 dark:text-red-400',
    trend: 'text-red-500 dark:text-red-400',
    sparkline: 'stroke-red-500',
  },
  info: {
    icon: 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
    trend: 'text-blue-500 dark:text-blue-400',
    sparkline: 'stroke-blue-500',
  },
};

function useAnimatedCounter(value: number, duration: number = 1000, decimals: number = 0) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => latest.toFixed(decimals));
  const [displayValue, setDisplayValue] = React.useState('0');

  React.useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: duration / 1000,
      ease: [0.25, 0.1, 0.25, 1],
    });
    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, decimals, motionValue, rounded]);

  return displayValue;
}

interface SparklineProps {
  data: number[];
  className?: string;
  strokeColor?: string;
}

function Sparkline({ data, className, strokeColor = 'currentColor' }: SparklineProps) {
  if (!data || data.length < 2) return null;
  const width = 80;
  const height = 24;
  const padding = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('w-20 h-6', className)} preserveAspectRatio="none">
      <motion.polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
      />
    </svg>
  );
}

interface TrendIndicatorProps {
  current: number;
  previous: number;
  className?: string;
}

function TrendIndicator({ current, previous, className }: TrendIndicatorProps) {
  const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const absChange = Math.abs(change).toFixed(1);
  const ArrowIcon = isNeutral ? Minus : isPositive ? ArrowUp : ArrowDown;

  return (
    <motion.div
      className={cn(
        'flex items-center gap-1 text-sm font-medium',
        isPositive && 'text-emerald-500 dark:text-emerald-400',
        !isPositive && !isNeutral && 'text-red-500 dark:text-red-400',
        isNeutral && 'text-muted-foreground',
        className
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8, ...spring.gentle }}
    >
      <ArrowIcon className="w-3.5 h-3.5" />
      <span>{absChange}%</span>
    </motion.div>
  );
}

export function AnimatedStatCard({
  title,
  value,
  previousValue,
  suffix = '',
  prefix = '',
  decimals = 0,
  icon,
  accent = 'primary',
  description,
  sparklineData,
  delay = 0,
  hover = true,
  className,
}: AnimatedStatCardProps) {
  const displayValue = useAnimatedCounter(value, 1200, decimals);
  const styles = accentStyles[accent];

  return (
    <GlassCard variant="default" size="md" hover={hover} delay={delay} className={cn('relative overflow-hidden', className)}>
      <div
        className={cn(
          'absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-2xl',
          accent === 'primary' && 'bg-primary',
          accent === 'success' && 'bg-emerald-500',
          accent === 'warning' && 'bg-amber-500',
          accent === 'destructive' && 'bg-red-500',
          accent === 'info' && 'bg-blue-500'
        )}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <motion.div
                className={cn('p-2.5 rounded-xl', styles.icon)}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: delay + 0.2, ...spring.bouncy }}
              >
                {icon}
              </motion.div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {description && <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>}
            </div>
          </div>
          {sparklineData && sparklineData.length > 1 && <Sparkline data={sparklineData} className={styles.sparkline} />}
        </div>
        <div className="flex items-end justify-between">
          <motion.div
            className="flex items-baseline gap-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.3, duration: 0.4 }}
          >
            {prefix && <span className="text-lg font-semibold text-muted-foreground">{prefix}</span>}
            <span className="text-3xl font-bold tracking-tight text-foreground">{displayValue}</span>
            {suffix && <span className="text-lg font-semibold text-muted-foreground ml-0.5">{suffix}</span>}
          </motion.div>
          {previousValue !== undefined && <TrendIndicator current={value} previous={previousValue} />}
        </div>
      </div>
    </GlassCard>
  );
}

export default AnimatedStatCard;
