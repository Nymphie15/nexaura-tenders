'use client';

import * as React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FileSearch,
  FileText,
  Calculator,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  Sparkles,
  Zap,
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  List,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  prompt: string;
  category: 'analysis' | 'generation' | 'summary' | 'action';
  isNew?: boolean;
  isPremium?: boolean;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  onActionClick: (action: QuickAction) => void;
  className?: string;
  compact?: boolean;
  layout?: 'grid' | 'list';
}

// ============================================
// Animation Variants
// ============================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.9,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

const pulseVariants: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatDelay: 3,
    },
  },
};

// ============================================
// Default Actions
// ============================================

const defaultActions: QuickAction[] = [
  {
    id: 'analyze-tender',
    label: 'Analyser cet appel d\'offres',
    description: 'Extraire les criteres cles',
    icon: <FileSearch className="w-4 h-4" />,
    prompt: 'Analyse cet appel d\'offres et extrais les criteres de selection, les deadlines et les exigences principales.',
    category: 'analysis',
    isNew: true,
  },
  {
    id: 'generate-response',
    label: 'Générer une réponse',
    description: 'Créer un document de réponse',
    icon: <FileText className="w-4 h-4" />,
    prompt: 'Génère une réponse structurée pour cet appel d\'offres en suivant les exigences spécifiées.',
    category: 'generation',
  },
  {
    id: 'calculate-budget',
    label: 'Estimer le budget',
    description: 'Analyse financière',
    icon: <Calculator className="w-4 h-4" />,
    prompt: 'Estime le budget nécessaire pour répondre à cet appel d\'offres et fournis une ventilation des coûts.',
    category: 'analysis',
  },
  {
    id: 'check-deadlines',
    label: 'Vérifier les deadlines',
    description: 'Dates importantes',
    icon: <Calendar className="w-4 h-4" />,
    prompt: 'Liste toutes les dates limites et échéances importantes de cet appel d\'offres.',
    category: 'summary',
  },
  {
    id: 'identify-risks',
    label: 'Identifier les risques',
    description: 'Points d\'attention',
    icon: <AlertTriangle className="w-4 h-4" />,
    prompt: 'Identifie les risques potentiels et les points d\'attention pour cet appel d\'offres.',
    category: 'analysis',
    isPremium: true,
  },
  {
    id: 'compare-competitors',
    label: 'Analyser la concurrence',
    description: 'Position compétitive',
    icon: <Users className="w-4 h-4" />,
    prompt: 'Analyse le marché et identifie les concurrents potentiels pour cet appel d\'offres.',
    category: 'analysis',
  },
  {
    id: 'success-factors',
    label: 'Facteurs de succes',
    description: 'Comment gagner',
    icon: <TrendingUp className="w-4 h-4" />,
    prompt: 'Quels sont les facteurs cles de succes pour remporter cet appel d\'offres ?',
    category: 'summary',
  },
  {
    id: 'checklist',
    label: 'Creer une checklist',
    description: 'Actions requises',
    icon: <CheckSquare className="w-4 h-4" />,
    prompt: 'Cree une checklist des actions a realiser pour repondre a cet appel d\'offres.',
    category: 'action',
  },
];

// ============================================
// Category Styles
// ============================================

const categoryStyles = {
  analysis: {
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500',
    glow: 'hover:shadow-blue-500/10',
  },
  generation: {
    bg: 'bg-violet-500/10 hover:bg-violet-500/20',
    border: 'border-violet-500/20 hover:border-violet-500/40',
    text: 'text-violet-600 dark:text-violet-400',
    icon: 'text-violet-500',
    glow: 'hover:shadow-violet-500/10',
  },
  summary: {
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-500',
    glow: 'hover:shadow-emerald-500/10',
  },
  action: {
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500',
    glow: 'hover:shadow-amber-500/10',
  },
};

const categoryLabels = {
  analysis: 'Analyse',
  generation: 'Generation',
  summary: 'Resume',
  action: 'Actions',
};

// ============================================
// Action Button Component
// ============================================

interface ActionButtonProps {
  action: QuickAction;
  onClick: () => void;
  compact?: boolean;
  isGridLayout?: boolean;
}

function ActionButton({ action, onClick, compact, isGridLayout }: ActionButtonProps) {
  const styles = categoryStyles[action.category];

  return (
    <motion.div
      variants={itemVariants}
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <button
        onClick={onClick}
        className={cn(
          'relative w-full text-left rounded-xl border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          'hover:shadow-lg',
          styles.bg,
          styles.border,
          styles.glow,
          compact ? 'px-3 py-2' : 'px-4 py-3',
          isGridLayout && 'flex flex-col h-full'
        )}
      >
        {/* Badges */}
        <div className="absolute -top-1.5 -right-1.5 flex gap-1">
          {action.isNew && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500 text-white rounded-full"
            >
              NEW
            </motion.span>
          )}
          {action.isPremium && (
            <motion.span
              variants={pulseVariants}
              initial="initial"
              animate="pulse"
              className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full flex items-center gap-0.5"
            >
              <Sparkles className="w-2.5 h-2.5" />
              PRO
            </motion.span>
          )}
        </div>

        <div className={cn(
          'flex items-start gap-3',
          isGridLayout && 'flex-col'
        )}>
          {/* Icon */}
          <motion.div
            className={cn(
              'shrink-0 p-2 rounded-lg bg-background/50',
              styles.icon
            )}
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.4 }}
          >
            {action.icon}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <span className={cn(
              'font-medium text-sm block',
              styles.text
            )}>
              {action.label}
            </span>
            {!compact && action.description && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.1 }}
                className="text-xs text-muted-foreground block mt-0.5"
              >
                {action.description}
              </motion.span>
            )}
          </div>

          {/* Arrow (only in list mode) */}
          {!isGridLayout && !compact && (
            <motion.div
              initial={{ x: 0, opacity: 0 }}
              whileHover={{ x: 3, opacity: 1 }}
              className={cn('shrink-0', styles.icon)}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          )}
        </div>
      </button>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function QuickActions({
  actions = defaultActions,
  onActionClick,
  className,
  compact = false,
  layout: initialLayout = 'list',
}: QuickActionsProps) {
  const [layout, setLayout] = React.useState(initialLayout);
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);

  // Group actions by category
  const groupedActions = React.useMemo(() => {
    return actions.reduce((acc, action) => {
      if (!acc[action.category]) {
        acc[action.category] = [];
      }
      acc[action.category].push(action);
      return acc;
    }, {} as Record<string, QuickAction[]>);
  }, [actions]);

  // Compact mode - show only first 4 actions
  if (compact) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className={cn('flex flex-wrap gap-2', className)}
      >
        <AnimatePresence mode="popLayout">
          {actions.slice(0, 4).map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              onClick={() => onActionClick(action)}
              compact
            />
          ))}
        </AnimatePresence>

        {actions.length > 4 && (
          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-3 py-2 rounded-xl"
            >
              <Zap className="w-4 h-4 mr-1" />
              +{actions.length - 4} autres
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>
          <h4 className="font-medium text-foreground">Actions rapides</h4>
        </div>

        {/* Layout Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
          <button
            onClick={() => setLayout('list')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              layout === 'list' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            )}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayout('grid')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              layout === 'grid' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      {layout === 'grid' && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="grid grid-cols-2 gap-2"
        >
          <AnimatePresence mode="popLayout">
            {actions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                onClick={() => onActionClick(action)}
                isGridLayout
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* List Layout - Grouped by Category */}
      {layout === 'list' && (
        <div className="space-y-4">
          {Object.entries(groupedActions).map(([category, categoryActions]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(
                  expandedCategory === category ? null : category
                )}
                className="flex items-center gap-2 mb-2 w-full text-left group"
              >
                <span className={cn(
                  'text-xs font-medium uppercase tracking-wider',
                  categoryStyles[category as keyof typeof categoryStyles].text
                )}>
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({categoryActions.length})
                </span>
                <div className="flex-1 h-px bg-border" />
                <motion.div
                  animate={{ rotate: expandedCategory === category ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </motion.div>
              </button>

              {/* Category Actions */}
              <AnimatePresence>
                {(expandedCategory === null || expandedCategory === category) && (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="space-y-2"
                  >
                    {categoryActions.map((action) => (
                      <ActionButton
                        key={action.id}
                        action={action}
                        onClick={() => onActionClick(action)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuickActions;
