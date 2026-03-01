'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/premium/cards/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Search,
  Database,
  BookOpen,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Eye,
  Zap,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export interface ContextSource {
  id: string;
  type: 'document' | 'database' | 'web' | 'knowledge';
  title: string;
  snippet: string;
  url?: string;
  relevanceScore: number;
  metadata?: {
    page?: number;
    section?: string;
    date?: Date;
    wordCount?: number;
    highlights?: string[];
  };
}

export interface ContextSearch {
  query: string;
  status: 'searching' | 'completed' | 'error';
  sources: ContextSource[];
  timestamp: Date;
  searchDuration?: number;
}

interface ContextPanelProps {
  searches: ContextSearch[];
  onSourceClick?: (source: ContextSource) => void;
  onRetry?: (searchIndex: number) => void;
  className?: string;
}

// ============================================
// Animation Variants
// ============================================

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// ============================================
// Relevance Score Component
// ============================================

interface RelevanceScoreProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function RelevanceScore({ score, showLabel = true, size = 'md' }: RelevanceScoreProps) {
  const percentage = Math.round(score * 100);

  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 0.8) return { bg: 'bg-emerald-500', text: 'text-emerald-500', glow: 'shadow-emerald-500/30' };
    if (score >= 0.6) return { bg: 'bg-amber-500', text: 'text-amber-500', glow: 'shadow-amber-500/30' };
    if (score >= 0.4) return { bg: 'bg-orange-500', text: 'text-orange-500', glow: 'shadow-orange-500/30' };
    return { bg: 'bg-slate-500', text: 'text-slate-500', glow: 'shadow-slate-500/30' };
  };

  const colors = getScoreColor();
  const sizeClasses = {
    sm: { ring: 'w-8 h-8', text: 'text-[10px]' },
    md: { ring: 'w-10 h-10', text: 'text-xs' },
    lg: { ring: 'w-12 h-12', text: 'text-sm' },
  };

  return (
    <div className="flex items-center gap-2">
      {/* Circular Progress */}
      <div className={cn('relative', sizeClasses[size].ring)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/30"
          />
          {/* Progress circle */}
          <motion.circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className={colors.text}
            initial={{ strokeDasharray: '0 100' }}
            animate={{ strokeDasharray: `${percentage} 100` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        {/* Center text */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center font-bold',
          sizeClasses[size].text,
          colors.text
        )}>
          {percentage}
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn('font-semibold', sizeClasses[size].text, colors.text)}>
            {percentage}% pertinent
          </span>
          <span className="text-[10px] text-muted-foreground">
            {score >= 0.8 ? 'Excellent' : score >= 0.6 ? 'Bon' : score >= 0.4 ? 'Moyen' : 'Faible'}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Source Card Component
// ============================================

interface SourceCardProps {
  source: ContextSource;
  onClick?: () => void;
  index: number;
}

function SourceCard({ source, onClick, index }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getIcon = () => {
    const iconClass = 'w-4 h-4';
    switch (source.type) {
      case 'document':
        return <FileText className={iconClass} />;
      case 'database':
        return <Database className={iconClass} />;
      case 'web':
        return <Globe className={iconClass} />;
      case 'knowledge':
        return <BookOpen className={iconClass} />;
    }
  };

  const getTypeConfig = () => {
    switch (source.type) {
      case 'document':
        return { label: 'Document', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'database':
        return { label: 'Base de donnees', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
      case 'web':
        return { label: 'Web', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      case 'knowledge':
        return { label: 'Connaissances', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    }
  };

  const typeConfig = getTypeConfig();

  return (
    <motion.div
      variants={staggerItem}
      layout
      className="group"
    >
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={springConfig}
        className={cn(
          'w-full text-left p-3 rounded-xl border bg-card/50',
          'hover:border-primary/30 hover:bg-primary/5',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20',
          isExpanded && 'border-primary/30 bg-primary/5'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            'p-2 rounded-lg shrink-0',
            'bg-muted/50 group-hover:bg-muted'
          )}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate flex-1">{source.title}</span>
              <Badge variant="outline" className={cn('shrink-0 text-[10px]', typeConfig.color)}>
                {typeConfig.label}
              </Badge>
            </div>

            {/* Snippet */}
            <p className={cn(
              'text-xs text-muted-foreground mb-2',
              isExpanded ? '' : 'line-clamp-2'
            )}>
              {source.snippet}
            </p>

            {/* Highlights (if available) */}
            {isExpanded && source.metadata?.highlights && source.metadata.highlights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <p className="text-[10px] font-medium text-amber-500 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Points cles:
                </p>
                <ul className="text-xs text-amber-600/80 dark:text-amber-400/80 space-y-0.5">
                  {source.metadata.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-amber-500 mt-1">-</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {source.metadata?.page && (
                  <span className="flex items-center gap-0.5">
                    <FileText className="w-3 h-3" />
                    Page {source.metadata.page}
                  </span>
                )}
                {source.metadata?.section && (
                  <span>{source.metadata.section}</span>
                )}
                {source.metadata?.wordCount && (
                  <span>{source.metadata.wordCount} mots</span>
                )}
              </div>

              {/* Relevance Score */}
              <RelevanceScore score={source.relevanceScore} showLabel={false} size="sm" />
            </div>
          </div>

          {/* Expand/View Button */}
          <div className="flex items-center gap-1 shrink-0">
            {source.url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={springConfig}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

// ============================================
// Search Section Component
// ============================================

interface SearchSectionProps {
  search: ContextSearch;
  index: number;
  onSourceClick?: (source: ContextSource) => void;
  onRetry?: () => void;
}

function SearchSection({ search, index, onSourceClick, onRetry }: SearchSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const getStatusConfig = () => {
    switch (search.status) {
      case 'searching':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Recherche en cours...',
          color: 'text-primary',
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: `${search.sources.length} sources trouvées`,
          color: 'text-emerald-500',
        };
      case 'error':
        return {
          icon: <XCircle className="w-4 h-4" />,
          text: 'Erreur de recherche',
          color: 'text-red-500',
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Calculate average relevance
  const avgRelevance = search.sources.length > 0
    ? search.sources.reduce((acc, s) => acc + s.relevanceScore, 0) / search.sources.length
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border rounded-xl overflow-hidden bg-card/30"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between p-3',
          'bg-muted/30 hover:bg-muted/50 transition-colors'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">
            &quot;{search.query}&quot;
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Average Relevance (if completed) */}
          {search.status === 'completed' && search.sources.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              <span>Moy: {Math.round(avgRelevance * 100)}%</span>
            </div>
          )}

          {/* Duration */}
          {search.searchDuration && (
            <span className="text-[10px] text-muted-foreground">
              {search.searchDuration}ms
            </span>
          )}

          {/* Status */}
          <div className={cn('flex items-center gap-1', statusConfig.color)}>
            {statusConfig.icon}
            <span className="text-xs hidden sm:inline">{statusConfig.text}</span>
          </div>

          {/* Expand Icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={springConfig}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 space-y-2">
              {search.status === 'searching' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="p-3 rounded-full bg-primary/10 mb-3"
                  >
                    <Search className="w-5 h-5 text-primary" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">
                    Recherche dans les sources...
                  </p>
                  <Progress value={66} className="w-32 h-1 mt-2" />
                </div>
              )}

              {search.status === 'error' && (
                <div className="flex flex-col items-center justify-center py-6">
                  <XCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-sm text-red-500 mb-3">
                    Erreur lors de la recherche
                  </p>
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    Réessayer
                  </Button>
                </div>
              )}

              {search.status === 'completed' && search.sources.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6">
                  <Search className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucune source pertinente trouvée
                  </p>
                </div>
              )}

              {search.status === 'completed' && search.sources.length > 0 && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="space-y-2"
                >
                  {search.sources
                    .sort((a, b) => b.relevanceScore - a.relevanceScore)
                    .map((source, sourceIndex) => (
                      <SourceCard
                        key={source.id}
                        source={source}
                        index={sourceIndex}
                        onClick={() => onSourceClick?.(source)}
                      />
                    ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function ContextPanel({
  searches,
  onSourceClick,
  onRetry,
  className,
}: ContextPanelProps) {
  const totalSources = searches.reduce((acc, s) => acc + s.sources.length, 0);
  const avgScore = totalSources > 0
    ? searches.reduce((acc, s) => acc + s.sources.reduce((a, src) => a + src.relevanceScore, 0), 0) / totalSources
    : 0;

  return (
    <GlassCard
      variant="subtle"
      size="sm"
      animate={false}
      hover={false}
      className={cn('flex flex-col h-full', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Database className="w-4 h-4 text-primary" />
          </motion.div>
          <h3 className="font-semibold text-foreground">Contexte RAG</h3>
        </div>

        <div className="flex items-center gap-2">
          {totalSources > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              <span>{Math.round(avgScore * 100)}%</span>
            </div>
          )}
          <Badge variant="secondary" className="text-xs">
            {totalSources} sources
          </Badge>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {searches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full py-12 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-4 rounded-full bg-muted mb-4"
            >
              <Search className="w-6 h-6 text-muted-foreground" />
            </motion.div>
            <p className="text-sm text-muted-foreground">
              Les sources utilisées pour répondre
              <br />
              apparaîtront ici
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {searches.map((search, index) => (
              <SearchSection
                key={index}
                search={search}
                index={index}
                onSourceClick={onSourceClick}
                onRetry={() => onRetry?.(index)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {searches.length > 0 && (
        <div className="px-4 py-2 border-t text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Derniere mise a jour:{' '}
            {searches[searches.length - 1]?.timestamp.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {totalSources > 0 && (
            <RelevanceScore score={avgScore} showLabel={false} size="sm" />
          )}
        </div>
      )}
    </GlassCard>
  );
}

export default ContextPanel;
