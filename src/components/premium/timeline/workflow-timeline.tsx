'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ease } from '@/lib/animations';
import {
  FileInput,
  FileSearch,
  BarChart3,
  CheckSquare,
  Lightbulb,
  FileEdit,
  ShieldCheck,
  FolderArchive,
  Eye,
  Send,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  SkipForward
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// Types
// ============================================================================

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'error' | 'skipped';

export interface WorkflowPhase {
  id: string;
  name: string;
  shortName: string;
  status: PhaseStatus;
  progress?: number;
  duration?: string;
  estimatedDuration?: string;
  description?: string;
  completedAt?: string;
  startedAt?: string;
  errorMessage?: string;
}

interface WorkflowTimelineProps {
  phases: WorkflowPhase[];
  currentPhase?: string;
  onPhaseClick?: (phase: WorkflowPhase) => void;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  showProgress?: boolean;
  compact?: boolean;
  animated?: boolean;
  className?: string;
}

// ============================================================================
// Default 10 Phases Configuration
// ============================================================================

export const WORKFLOW_PHASES_CONFIG = [
  { id: 'ingestion', name: 'Ingestion', shortName: 'Ingest', icon: FileInput, description: 'Reception et stockage des documents DCE' },
  { id: 'parsing', name: 'Parsing', shortName: 'Parse', icon: FileSearch, description: 'Extraction du contenu et structure des documents' },
  { id: 'analysis', name: 'Analysis', shortName: 'Analyze', icon: BarChart3, description: 'Analyse semantique et extraction des exigences' },
  { id: 'eligibility', name: 'Eligibility', shortName: 'Eligible', icon: CheckSquare, description: "Verification des criteres d'eligibilite" },
  { id: 'strategy', name: 'Strategy', shortName: 'Strategy', icon: Lightbulb, description: 'Definition de la strategie de reponse' },
  { id: 'generation', name: 'Generation', shortName: 'Generate', icon: FileEdit, description: 'Generation automatique du contenu' },
  { id: 'validation', name: 'Validation', shortName: 'Validate', icon: ShieldCheck, description: 'Validation IA et conformite' },
  { id: 'assembly', name: 'Assembly', shortName: 'Assemble', icon: FolderArchive, description: 'Assemblage final du dossier' },
  { id: 'review', name: 'Review', shortName: 'Review', icon: Eye, description: 'Revue humaine et approbations HITL' },
  { id: 'submission', name: 'Submission', shortName: 'Submit', icon: Send, description: "Soumission finale de l'offre" },
] as const;

// ============================================================================
// Status Configuration
// ============================================================================

const statusConfig: Record<PhaseStatus, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  label: string;
}> = {
  completed: {
    icon: Check,
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-500/50 dark:border-emerald-400/50',
    glowColor: 'shadow-emerald-500/25',
    label: 'Termine',
  },
  in_progress: {
    icon: Loader2,
    color: 'text-primary',
    bgColor: 'bg-primary/10 dark:bg-primary/20',
    borderColor: 'border-primary dark:border-primary',
    glowColor: 'shadow-primary/30',
    label: 'En cours',
  },
  pending: {
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50 dark:bg-muted/30',
    borderColor: 'border-border dark:border-border',
    glowColor: 'shadow-transparent',
    label: 'En attente',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-500/10 dark:bg-red-500/20',
    borderColor: 'border-red-500/50 dark:border-red-400/50',
    glowColor: 'shadow-red-500/25',
    label: 'Erreur',
  },
  skipped: {
    icon: SkipForward,
    color: 'text-slate-400 dark:text-slate-500',
    bgColor: 'bg-slate-500/5 dark:bg-slate-500/10',
    borderColor: 'border-slate-300/50 dark:border-slate-600/50',
    glowColor: 'shadow-transparent',
    label: 'Ignore',
  },
};

// ============================================================================
// Circular Progress Component
// ============================================================================

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function CircularProgress({ progress, size = 48, strokeWidth = 3, className }: CircularProgressProps) {
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
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
    });
    return animation.stop;
  }, [progress, progressValue]);

  return (
    <svg
      width={size}
      height={size}
      className={cn('transform -rotate-90', className)}
    >
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
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{ strokeDashoffset }}
        className="text-primary"
      />
    </svg>
  );
}

// ============================================================================
// Phase Node Component
// ============================================================================

interface PhaseNodeInternalProps {
  phase: WorkflowPhase;
  config: typeof WORKFLOW_PHASES_CONFIG[number];
  index: number;
  isLast: boolean;
  isCurrent: boolean;
  onClick?: () => void;
  showLabel: boolean;
  showProgress: boolean;
  compact: boolean;
  animated: boolean;
}

function PhaseNodeInternal({
  phase,
  config,
  index,
  isLast,
  isCurrent,
  onClick,
  showLabel,
  showProgress,
  compact,
  animated
}: PhaseNodeInternalProps) {
  const statusStyle = statusConfig[phase.status];
  const PhaseIcon = config.icon;
  const StatusIcon = statusStyle.icon;
  const isClickable = !!onClick;
  const effectiveProgress = phase.status === 'completed' ? 100 : phase.status === 'pending' ? 0 : (phase.progress ?? 0);

  const nodeSize = compact ? 'w-10 h-10' : 'w-14 h-14';
  const iconSize = compact ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <motion.div
      className={cn('flex items-center', !isLast && 'flex-1')}
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: ease.out }}
    >
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              type="button"
              onClick={onClick}
              disabled={!isClickable}
              className={cn(
                'relative flex flex-col items-center gap-2 group',
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-default'
              )}
              whileHover={isClickable ? { scale: 1.08 } : undefined}
              whileTap={isClickable ? { scale: 0.95 } : undefined}
            >
              {/* Main Node Container */}
              <div className="relative">
                {/* Progress Ring (for active state) */}
                {showProgress && phase.status === 'in_progress' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CircularProgress
                      progress={effectiveProgress}
                      size={compact ? 48 : 64}
                      strokeWidth={compact ? 2 : 3}
                    />
                  </div>
                )}

                {/* Node Circle */}
                <motion.div
                  className={cn(
                    'relative flex items-center justify-center rounded-full border-2 transition-all',
                    'backdrop-blur-sm',
                    statusStyle.bgColor,
                    statusStyle.borderColor,
                    nodeSize,
                    isCurrent && 'ring-4 ring-primary/20 dark:ring-primary/30',
                    phase.status === 'in_progress' && `shadow-lg ${statusStyle.glowColor}`,
                    phase.status === 'completed' && `shadow-md ${statusStyle.glowColor}`
                  )}
                  initial={animated ? { scale: 0 } : false}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: index * 0.1,
                    type: 'spring',
                    stiffness: 400,
                    damping: 20
                  }}
                >
                  {/* Phase Icon */}
                  <PhaseIcon className={cn(iconSize, statusStyle.color)} />

                  {/* Status Badge */}
                  {phase.status !== 'pending' && (
                    <motion.div
                      className={cn(
                        'absolute -bottom-1 -right-1 flex items-center justify-center',
                        'w-5 h-5 rounded-full border-2 border-background',
                        statusStyle.bgColor
                      )}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                    >
                      <StatusIcon
                        className={cn(
                          'w-3 h-3',
                          statusStyle.color,
                          phase.status === 'in_progress' && 'animate-spin'
                        )}
                      />
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Label */}
              {showLabel && (
                <motion.div
                  className="flex flex-col items-center"
                  initial={animated ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.15 }}
                >
                  <span className={cn(
                    'text-xs font-medium text-center max-w-[70px] truncate transition-colors',
                    phase.status === 'in_progress' ? 'text-foreground' : 'text-muted-foreground',
                    'group-hover:text-foreground'
                  )}>
                    {phase.shortName}
                  </span>
                  {phase.status === 'in_progress' && showProgress && (
                    <span className="text-[10px] font-medium text-primary mt-0.5">
                      {effectiveProgress}%
                    </span>
                  )}
                </motion.div>
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="max-w-xs bg-popover/95 backdrop-blur-xl border-border/50"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PhaseIcon className={cn('w-4 h-4', statusStyle.color)} />
                <p className="font-semibold">{phase.name}</p>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  statusStyle.bgColor,
                  statusStyle.color
                )}>
                  {statusStyle.label}
                </span>
              </div>
              {config.description && (
                <p className="text-xs text-muted-foreground">{config.description}</p>
              )}
              {phase.status === 'in_progress' && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${effectiveProgress}%` }}
                    />
                  </div>
                  <span className="font-medium">{effectiveProgress}%</span>
                </div>
              )}
              {phase.duration && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Duree: {phase.duration}
                </p>
              )}
              {phase.estimatedDuration && phase.status === 'pending' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Estimation: {phase.estimatedDuration}
                </p>
              )}
              {phase.errorMessage && phase.status === 'error' && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-500/10 p-2 rounded">
                  {phase.errorMessage}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Connector Line */}
      {!isLast && (
        <div className="flex-1 mx-1 md:mx-2 relative h-0.5">
          {/* Background Line */}
          <div className="absolute inset-0 bg-border/50 dark:bg-border/30 rounded-full" />

          {/* Progress Line */}
          <motion.div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              phase.status === 'completed' ? 'bg-emerald-500' :
              phase.status === 'in_progress' ? 'bg-gradient-to-r from-emerald-500 to-primary' :
              'bg-transparent'
            )}
            initial={{ width: '0%' }}
            animate={{
              width: phase.status === 'completed' ? '100%' :
                     phase.status === 'in_progress' ? `${effectiveProgress}%` : '0%'
            }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.5, ease: ease.out }}
          />

          {/* Animated Pulse for Active */}
          {phase.status === 'in_progress' && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
              style={{ left: `${effectiveProgress}%` }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WorkflowTimeline({
  phases,
  currentPhase,
  onPhaseClick,
  orientation = 'horizontal',
  showLabels = true,
  showProgress = true,
  compact = false,
  animated = true,
  className,
}: WorkflowTimelineProps) {
  const isHorizontal = orientation === 'horizontal';

  // Merge provided phases with config
  const mergedPhases = WORKFLOW_PHASES_CONFIG.map(config => {
    const provided = phases.find(p => p.id === config.id);
    return {
      phase: provided ?? {
        id: config.id,
        name: config.name,
        shortName: config.shortName,
        status: 'pending' as PhaseStatus,
      },
      config,
    };
  });

  return (
    <motion.div
      className={cn(
        'w-full',
        isHorizontal ? 'overflow-x-auto pb-2' : '',
        className
      )}
      initial={animated ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={cn(
          'flex min-w-max',
          isHorizontal ? 'flex-row items-start px-2' : 'flex-col',
        )}
      >
        {mergedPhases.map(({ phase, config }, index) => (
          <PhaseNodeInternal
            key={phase.id}
            phase={phase}
            config={config}
            index={index}
            isLast={index === mergedPhases.length - 1}
            isCurrent={currentPhase === phase.id}
            onClick={onPhaseClick ? () => onPhaseClick(phase) : undefined}
            showLabel={showLabels}
            showProgress={showProgress}
            compact={compact}
            animated={animated}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

export default WorkflowTimeline;
