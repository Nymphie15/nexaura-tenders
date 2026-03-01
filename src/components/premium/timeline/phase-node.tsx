'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/premium/cards/glass-card';
import { spring, ease, duration } from '@/lib/animations';
import {
  Check,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
  SkipForward,
  Play,
  Pause,
  RotateCcw,
  Timer,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// Types
// ============================================================================

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'error' | 'skipped' | 'paused';

export interface PhaseNodeProps {
  id: string;
  name: string;
  description?: string;
  status: PhaseStatus;
  progress?: number;
  duration?: string;
  estimatedDuration?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  metrics?: PhaseMetrics;
  onClick?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onRetry?: () => void;
  onSkip?: () => void;
  isExpanded?: boolean;
  showActions?: boolean;
  delay?: number;
  className?: string;
}

export interface PhaseMetrics {
  itemsProcessed?: number;
  totalItems?: number;
  accuracy?: number;
  warnings?: number;
  errors?: number;
}

// ============================================================================
// Status Configuration
// ============================================================================

const statusConfig: Record<PhaseStatus, {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  progressColor: string;
}> = {
  completed: {
    icon: Check,
    label: 'Termine',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    progressColor: 'bg-emerald-500',
  },
  in_progress: {
    icon: Loader2,
    label: 'En cours',
    color: 'text-primary',
    bgColor: 'bg-primary/10 dark:bg-primary/20',
    borderColor: 'border-primary/30',
    progressColor: 'bg-primary',
  },
  pending: {
    icon: Clock,
    label: 'En attente',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-border',
    progressColor: 'bg-muted-foreground',
  },
  error: {
    icon: AlertCircle,
    label: 'Erreur',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10 dark:bg-red-500/20',
    borderColor: 'border-red-500/30',
    progressColor: 'bg-red-500',
  },
  skipped: {
    icon: SkipForward,
    label: 'Ignore',
    color: 'text-slate-400 dark:text-slate-500',
    bgColor: 'bg-slate-500/5',
    borderColor: 'border-slate-300/30',
    progressColor: 'bg-slate-400',
  },
  paused: {
    icon: Pause,
    label: 'En pause',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    progressColor: 'bg-amber-500',
  },
};

// ============================================================================
// Circular Progress Component
// ============================================================================

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
}

function CircularProgress({
  progress,
  size = 64,
  strokeWidth = 4,
  showPercentage = true,
  className
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressValue = useMotionValue(0);
  const strokeDashoffset = useTransform(
    progressValue,
    [0, 100],
    [circumference, 0]
  );

  React.useEffect(() => {
    const animation = animate(progressValue, progress, {
      duration: 1,
      ease: [0.25, 0.1, 0.25, 1],
    });
    return animation.stop;
  }, [progress, progressValue]);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
          </linearGradient>
        </defs>
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
        />
      </svg>
      {showPercentage && (
        <motion.span
          className="absolute text-sm font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {Math.round(progress)}%
        </motion.span>
      )}
    </div>
  );
}

// ============================================================================
// Metrics Display Component
// ============================================================================

interface MetricsDisplayProps {
  metrics: PhaseMetrics;
}

function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  return (
    <motion.div
      className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {metrics.itemsProcessed !== undefined && metrics.totalItems !== undefined && (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Traites</p>
            <p className="text-sm font-semibold">
              {metrics.itemsProcessed}/{metrics.totalItems}
            </p>
          </div>
        </div>
      )}
      {metrics.accuracy !== undefined && (
        <div className="flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <div>
            <p className="text-xs text-muted-foreground">Precision</p>
            <p className="text-sm font-semibold">{metrics.accuracy}%</p>
          </div>
        </div>
      )}
      {metrics.warnings !== undefined && metrics.warnings > 0 && (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">Warnings</p>
            <p className="text-sm font-semibold">{metrics.warnings}</p>
          </div>
        </div>
      )}
      {metrics.errors !== undefined && metrics.errors > 0 && (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">Erreurs</p>
            <p className="text-sm font-semibold">{metrics.errors}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Phase Node Component
// ============================================================================

export function PhaseNode({
  id,
  name,
  description,
  status,
  progress = 0,
  duration,
  estimatedDuration,
  startedAt,
  completedAt,
  errorMessage,
  metrics,
  onClick,
  onStart,
  onPause,
  onRetry,
  onSkip,
  isExpanded = false,
  showActions = true,
  delay = 0,
  className,
}: PhaseNodeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isClickable = !!onClick;

  const effectiveProgress = status === 'completed' ? 100 :
                            status === 'pending' ? 0 :
                            status === 'skipped' ? 100 : progress;

  const showCircularProgress = status === 'in_progress' || status === 'paused';

  return (
    <GlassCard
      variant="subtle"
      size="sm"
      hover={isClickable}
      delay={delay}
      className={cn(
        'relative overflow-hidden transition-all',
        isClickable && 'cursor-pointer',
        status === 'in_progress' && 'ring-2 ring-primary/20',
        status === 'error' && 'ring-2 ring-red-500/20',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Left: Icon or Circular Progress */}
        <div className="flex-shrink-0">
          {showCircularProgress ? (
            <CircularProgress
              progress={effectiveProgress}
              size={56}
              strokeWidth={4}
            />
          ) : (
            <motion.div
              className={cn(
                'flex items-center justify-center rounded-xl w-14 h-14',
                config.bgColor,
                'border',
                config.borderColor
              )}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: delay + 0.1, type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Icon
                className={cn(
                  'w-6 h-6',
                  config.color
                )}
              />
            </motion.div>
          )}
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground truncate">{name}</h4>
            <span className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap',
              config.bgColor,
              config.color
            )}>
              {config.label}
            </span>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {description}
            </p>
          )}

          {/* Progress Bar (for non-circular states) */}
          {!showCircularProgress && (status === 'completed' || effectiveProgress > 0) && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium text-foreground">{effectiveProgress}%</span>
              </div>
              <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', config.progressColor)}
                  initial={{ width: 0 }}
                  animate={{ width: `${effectiveProgress}%` }}
                  transition={{ duration: 0.6, ease: ease.out }}
                />
              </div>
            </div>
          )}

          {/* Duration Info */}
          {(duration || estimatedDuration) && (
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              {duration && (
                <div className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Duree: <span className="font-medium text-foreground">{duration}</span></span>
                </div>
              )}
              {estimatedDuration && status === 'pending' && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Est: <span className="font-medium text-foreground">{estimatedDuration}</span></span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && status === 'error' && (
            <motion.div
              className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {errorMessage}
              </p>
            </motion.div>
          )}

          {/* Metrics */}
          {metrics && <MetricsDisplay metrics={metrics} />}

          {/* Actions */}
          {showActions && (onStart || onPause || onRetry || onSkip) && (
            <motion.div
              className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {status === 'pending' && onStart && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); onStart(); }}
                        className="gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Demarrer
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Demarrer cette phase</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {status === 'in_progress' && onPause && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); onPause(); }}
                        className="gap-1.5"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Pause
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mettre en pause</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {status === 'paused' && onStart && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); onStart(); }}
                        className="gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Reprendre
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reprendre la phase</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {status === 'error' && onRetry && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); onRetry(); }}
                        className="gap-1.5 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reessayer
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Relancer cette phase</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {(status === 'pending' || status === 'error') && onSkip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); onSkip(); }}
                        className="gap-1.5 text-muted-foreground"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        Ignorer
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ignorer cette phase</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Active Phase Indicator */}
      {status === 'in_progress' && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60"
          initial={{ width: '0%' }}
          animate={{ width: `${effectiveProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}

      {/* Subtle Glow Effect for Active */}
      {status === 'in_progress' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)'
          }}
        />
      )}
    </GlassCard>
  );
}

export default PhaseNode;
