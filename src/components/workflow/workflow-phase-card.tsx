'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ease, spring, staggerItem } from '@/lib/animations';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  RotateCcw,
  Clock,
  SkipForward,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Timer,
  TrendingUp,
  AlertTriangle,
  type LucideIcon,
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

export type PhaseStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'paused';

export interface WorkflowPhaseDetail {
  id: string;
  name: string;
  status: PhaseStatus;
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  estimatedDuration?: number;
  error?: string;
  warnings?: string[];
  metrics?: {
    itemsProcessed?: number;
    totalItems?: number;
    accuracy?: number;
  };
}

export interface WorkflowPhaseConfig {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  estimatedDuration?: number;
}

interface WorkflowPhaseCardProps {
  phase: WorkflowPhaseDetail;
  config?: WorkflowPhaseConfig;
  isActive?: boolean;
  isExpanded?: boolean;
  onRetry?: (phaseId: string) => void;
  onSkip?: (phaseId: string) => void;
  onPause?: (phaseId: string) => void;
  onResume?: (phaseId: string) => void;
  onToggleExpand?: () => void;
  animationDelay?: number;
  className?: string;
}

// ============================================================================
// Status Configuration
// ============================================================================

const statusStyles: Record<PhaseStatus, {
  border: string;
  bg: string;
  glassBg: string;
  icon: LucideIcon;
  iconClass: string;
  label: string;
  labelBg: string;
}> = {
  pending: {
    border: 'border-slate-200/50 dark:border-slate-700/50',
    bg: 'bg-slate-50/50 dark:bg-slate-900/30',
    glassBg: 'bg-white/40 dark:bg-slate-800/40',
    icon: Circle,
    iconClass: 'text-slate-400 dark:text-slate-500',
    label: 'En attente',
    labelBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  },
  running: {
    border: 'border-primary/30 dark:border-primary/40',
    bg: 'bg-primary/5 dark:bg-primary/10',
    glassBg: 'bg-white/60 dark:bg-slate-800/60',
    icon: Loader2,
    iconClass: 'text-primary animate-spin',
    label: 'En cours',
    labelBg: 'bg-primary/10 text-primary',
  },
  completed: {
    border: 'border-emerald-300/50 dark:border-emerald-500/30',
    bg: 'bg-emerald-50/50 dark:bg-emerald-900/20',
    glassBg: 'bg-white/50 dark:bg-slate-800/50',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    label: 'Termine',
    labelBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400',
  },
  failed: {
    border: 'border-red-300/50 dark:border-red-500/30',
    bg: 'bg-red-50/50 dark:bg-red-900/20',
    glassBg: 'bg-white/50 dark:bg-slate-800/50',
    icon: XCircle,
    iconClass: 'text-red-600 dark:text-red-400',
    label: 'Erreur',
    labelBg: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400',
  },
  skipped: {
    border: 'border-slate-200/50 dark:border-slate-700/50',
    bg: 'bg-slate-50/30 dark:bg-slate-900/20',
    glassBg: 'bg-white/30 dark:bg-slate-800/30',
    icon: SkipForward,
    iconClass: 'text-slate-400 dark:text-slate-500',
    label: 'Ignore',
    labelBg: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500',
  },
  paused: {
    border: 'border-amber-300/50 dark:border-amber-500/30',
    bg: 'bg-amber-50/50 dark:bg-amber-900/20',
    glassBg: 'bg-white/50 dark:bg-slate-800/50',
    icon: Pause,
    iconClass: 'text-amber-600 dark:text-amber-400',
    label: 'En pause',
    labelBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatDuration(ms?: number): string {
  if (!ms) return '--';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

// ============================================================================
// Progress Bar Component
// ============================================================================

interface ProgressBarProps {
  progress: number;
  status: PhaseStatus;
}

function ProgressBar({ progress, status }: ProgressBarProps) {
  const progressColor = status === 'completed' ? 'bg-emerald-500' :
                        status === 'failed' ? 'bg-red-500' :
                        status === 'paused' ? 'bg-amber-500' :
                        'bg-primary';

  return (
    <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
      <motion.div
        className={cn('absolute inset-y-0 left-0 rounded-full', progressColor)}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.6, ease: ease.out }}
      />
      {status === 'running' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WorkflowPhaseCard({
  phase,
  config,
  isActive = false,
  isExpanded = false,
  onRetry,
  onSkip,
  onPause,
  onResume,
  onToggleExpand,
  animationDelay = 0,
  className,
}: WorkflowPhaseCardProps) {
  const style = statusStyles[phase.status];
  const StatusIcon = style.icon;
  const PhaseIcon = config?.icon;
  const effectiveProgress = phase.status === 'completed' ? 100 :
                            phase.status === 'pending' ? 0 :
                            (phase.progress ?? 0);

  const hasActions = !!(onRetry || onSkip || onPause || onResume);
  const hasMetrics = phase.metrics && (
    phase.metrics.itemsProcessed !== undefined ||
    phase.metrics.accuracy !== undefined
  );
  const hasWarnings = phase.warnings && phase.warnings.length > 0;
  const isExpandable = hasMetrics || hasWarnings || phase.error || onToggleExpand;

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="show"
      custom={animationDelay}
      className={cn(
        'relative rounded-2xl border backdrop-blur-xl transition-all duration-300',
        'shadow-lg shadow-slate-900/5 dark:shadow-black/10',
        style.border,
        style.glassBg,
        isActive && 'ring-2 ring-primary/30 shadow-xl shadow-primary/10',
        className
      )}
    >
      {/* Glass Overlay */}
      <div className={cn(
        'absolute inset-0 rounded-2xl opacity-50',
        style.bg
      )} />

      {/* Content */}
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Status Icon with Animated Background */}
            <motion.div
              className={cn(
                'relative flex items-center justify-center w-12 h-12 rounded-xl',
                'bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm',
                'border border-white/20 dark:border-slate-600/30'
              )}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: animationDelay, ...spring.bouncy }}
            >
              <StatusIcon className={cn('h-6 w-6', style.iconClass)} />
              {phase.status === 'running' && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-primary/30"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {PhaseIcon && (
                  <PhaseIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <h3 className="font-semibold text-foreground truncate">
                  {config?.label || phase.name}
                </h3>
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  style.labelBg
                )}>
                  {style.label}
                </span>
              </div>
              {config?.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {config.description}
                </p>
              )}
            </div>
          </div>

          {/* Duration Badge */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-white/50 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg">
            <Timer className="h-3.5 w-3.5" />
            <span className="font-medium">{formatDuration(phase.duration)}</span>
          </div>
        </div>

        {/* Progress Section */}
        {(phase.status === 'running' || phase.status === 'paused' || effectiveProgress > 0) && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-semibold text-foreground">{effectiveProgress}%</span>
            </div>
            <ProgressBar progress={effectiveProgress} status={phase.status} />
          </div>
        )}

        {/* Running Animation */}
        {phase.status === 'running' && (
          <motion.div
            className="mt-3 flex items-center gap-2 text-sm text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Traitement en cours...
          </motion.div>
        )}

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: ease.out }}
              className="overflow-hidden"
            >
              {/* Metrics */}
              {hasMetrics && (
                <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-2 gap-4">
                  {phase.metrics?.itemsProcessed !== undefined && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Elements traites</p>
                        <p className="text-sm font-semibold">
                          {phase.metrics.itemsProcessed}
                          {phase.metrics.totalItems && ` / ${phase.metrics.totalItems}`}
                        </p>
                      </div>
                    </div>
                  )}
                  {phase.metrics?.accuracy !== undefined && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Precision</p>
                        <p className="text-sm font-semibold">{phase.metrics.accuracy}%</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Warnings */}
              {hasWarnings && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {phase.warnings!.length} avertissement{phase.warnings!.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                    {phase.warnings!.slice(0, 3).map((warning, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>-</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                    {phase.warnings!.length > 3 && (
                      <li className="text-amber-600 dark:text-amber-500">
                        +{phase.warnings!.length - 3} autre(s)...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Error Message */}
              {phase.status === 'failed' && phase.error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">{phase.error}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions Footer */}
        {(hasActions || isExpandable) && (
          <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between gap-2">
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {phase.status === 'failed' && onRetry && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetry(phase.id)}
                        className="gap-1.5 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reessayer
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Relancer cette phase</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {phase.status === 'running' && onPause && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPause(phase.id)}
                        className="gap-1.5"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mettre en pause</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {phase.status === 'paused' && onResume && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResume(phase.id)}
                        className="gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Reprendre
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reprendre la phase</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {(phase.status === 'pending' || phase.status === 'failed') && onSkip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSkip(phase.id)}
                        className="gap-1.5 text-muted-foreground"
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                        Ignorer
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ignorer cette phase</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Expand Toggle */}
            {isExpandable && onToggleExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="gap-1 text-muted-foreground"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Moins
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Details
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Active Phase Glow */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.15) 0%, transparent 70%)'
          }}
        />
      )}
    </motion.div>
  );
}

export default WorkflowPhaseCard;
