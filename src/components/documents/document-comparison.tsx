'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/animations';
import { GlassCard } from '@/components/premium/cards/glass-card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeftRight,
  FileText,
  Plus,
  Minus,
  Equal,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Download,
  RefreshCw,
  Layers,
  SplitSquareHorizontal,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffLine {
  lineNumber: number;
  content: string;
  type: DiffType;
  highlight?: boolean;
}

export interface DocumentData {
  id: string;
  name: string;
  content: string;
  version?: string;
  lastModified?: Date;
}

export type ViewMode = 'split' | 'overlay' | 'unified';

interface DocumentComparisonProps {
  leftDocument: DocumentData;
  rightDocument: DocumentData;
  syncScroll?: boolean;
  showLineNumbers?: boolean;
  highlightDiffs?: boolean;
  initialViewMode?: ViewMode;
  onDiffSelect?: (diff: DiffLine, side: 'left' | 'right') => void;
  className?: string;
}

// ============================================
// Utilities
// ============================================

function computeDiff(left: string, right: string): { left: DiffLine[]; right: DiffLine[]; unified: DiffLine[] } {
  const leftLines = left.split('\n');
  const rightLines = right.split('\n');

  const leftDiff: DiffLine[] = [];
  const rightDiff: DiffLine[] = [];
  const unified: DiffLine[] = [];

  const maxLines = Math.max(leftLines.length, rightLines.length);

  for (let i = 0; i < maxLines; i++) {
    const leftLine = leftLines[i] || '';
    const rightLine = rightLines[i] || '';

    if (i >= leftLines.length) {
      leftDiff.push({ lineNumber: i + 1, content: '', type: 'unchanged' });
      rightDiff.push({ lineNumber: i + 1, content: rightLine, type: 'added', highlight: true });
      unified.push({ lineNumber: i + 1, content: '+ ' + rightLine, type: 'added', highlight: true });
    } else if (i >= rightLines.length) {
      leftDiff.push({ lineNumber: i + 1, content: leftLine, type: 'removed', highlight: true });
      rightDiff.push({ lineNumber: i + 1, content: '', type: 'unchanged' });
      unified.push({ lineNumber: i + 1, content: '- ' + leftLine, type: 'removed', highlight: true });
    } else if (leftLine !== rightLine) {
      leftDiff.push({ lineNumber: i + 1, content: leftLine, type: 'modified', highlight: true });
      rightDiff.push({ lineNumber: i + 1, content: rightLine, type: 'modified', highlight: true });
      unified.push({ lineNumber: i + 1, content: '- ' + leftLine, type: 'removed', highlight: true });
      unified.push({ lineNumber: i + 1, content: '+ ' + rightLine, type: 'added', highlight: true });
    } else {
      leftDiff.push({ lineNumber: i + 1, content: leftLine, type: 'unchanged' });
      rightDiff.push({ lineNumber: i + 1, content: rightLine, type: 'unchanged' });
      unified.push({ lineNumber: i + 1, content: '  ' + leftLine, type: 'unchanged' });
    }
  }

  return { left: leftDiff, right: rightDiff, unified };
}

// ============================================
// Diff Stats Component
// ============================================

interface DiffStatsProps {
  added: number;
  removed: number;
  modified: number;
}

function DiffStats({ added, removed, modified }: DiffStatsProps) {
  return (
    <div className="flex items-center gap-2">
      {added > 0 && (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
          <Plus className="w-3 h-3" />
          {added}
        </Badge>
      )}
      {removed > 0 && (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 gap-1">
          <Minus className="w-3 h-3" />
          {removed}
        </Badge>
      )}
      {modified > 0 && (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
          <RefreshCw className="w-3 h-3" />
          {modified}
        </Badge>
      )}
      {added === 0 && removed === 0 && modified === 0 && (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 gap-1">
          <Equal className="w-3 h-3" />
          Identiques
        </Badge>
      )}
    </div>
  );
}

// ============================================
// Document Panel Component (Split View)
// ============================================

interface DocumentPanelProps {
  document: DocumentData;
  diffLines: DiffLine[];
  showLineNumbers: boolean;
  highlightDiffs: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  side: 'left' | 'right';
  currentDiffIndex: number;
  onLineClick?: (line: DiffLine) => void;
}

function DocumentPanel({
  document,
  diffLines,
  showLineNumbers,
  highlightDiffs,
  scrollRef,
  onScroll,
  side,
  currentDiffIndex,
  onLineClick,
}: DocumentPanelProps) {
  const getLineStyle = (type: DiffType, highlight: boolean | undefined, index: number) => {
    const isCurrentDiff = diffLines.findIndex((l, i) => l.highlight && i === currentDiffIndex) === index;

    if (!highlightDiffs || !highlight) return isCurrentDiff ? 'ring-2 ring-primary' : '';

    const baseStyles = {
      added: 'bg-emerald-500/10 border-l-2 border-emerald-500',
      removed: 'bg-red-500/10 border-l-2 border-red-500',
      modified: 'bg-amber-500/10 border-l-2 border-amber-500',
      unchanged: '',
    };

    return cn(baseStyles[type], isCurrentDiff && 'ring-2 ring-primary ring-offset-1');
  };

  return (
    <div className="flex-1 min-w-0 border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{document.name}</span>
          {document.version && (
            <Badge variant="secondary" className="shrink-0">
              v{document.version}
            </Badge>
          )}
        </div>
        {side === 'left' ? (
          <Badge variant="outline">Original</Badge>
        ) : (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Modifie
          </Badge>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="h-[500px]">
        <div
          ref={scrollRef as React.RefObject<HTMLDivElement>}
          onScroll={onScroll}
          className="font-mono text-sm"
        >
          {diffLines.map((line, index) => (
            <motion.div
              key={index}
              id={'diff-line-' + side + '-' + index}
              className={cn(
                'flex hover:bg-muted/50 transition-all cursor-pointer',
                getLineStyle(line.type, line.highlight, index)
              )}
              onClick={() => onLineClick?.(line)}
              whileHover={{ x: 2 }}
              transition={spring.snappy}
            >
              {showLineNumbers && (
                <span className="w-12 px-2 py-1 text-right text-muted-foreground bg-muted/30 border-r select-none shrink-0">
                  {line.content ? line.lineNumber : ''}
                </span>
              )}
              <span className="flex-1 px-4 py-1 whitespace-pre-wrap break-all">
                {line.content || '\u00A0'}
              </span>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// Overlay View Component
// ============================================

interface OverlayViewProps {
  leftDocument: DocumentData;
  rightDocument: DocumentData;
  leftDiff: DiffLine[];
  rightDiff: DiffLine[];
  showLineNumbers: boolean;
  opacity: number;
}

function OverlayView({
  leftDocument,
  rightDocument,
  leftDiff,
  rightDiff,
  showLineNumbers,
  opacity,
}: OverlayViewProps) {
  return (
    <div className="relative border rounded-xl overflow-hidden bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <span className="text-sm font-medium">{leftDocument.name}</span>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            <span className="text-sm font-medium">{rightDocument.name}</span>
          </div>
        </div>
        <Badge variant="secondary">Vue superposee</Badge>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="relative font-mono text-sm">
          {/* Base layer (left document) */}
          <div className="text-red-600 dark:text-red-400">
            {leftDiff.map((line, index) => (
              <div key={'left-' + index} className="flex">
                {showLineNumbers && (
                  <span className="w-12 px-2 py-1 text-right text-muted-foreground bg-muted/30 border-r select-none shrink-0">
                    {line.lineNumber}
                  </span>
                )}
                <span className="flex-1 px-4 py-1 whitespace-pre-wrap break-all">
                  {line.content || '\u00A0'}
                </span>
              </div>
            ))}
          </div>

          {/* Overlay layer (right document) */}
          <div
            className="absolute inset-0 text-emerald-600 dark:text-emerald-400 pointer-events-none"
            style={{ opacity }}
          >
            {rightDiff.map((line, index) => (
              <div key={'right-' + index} className="flex">
                {showLineNumbers && (
                  <span className="w-12 px-2 py-1 text-right opacity-0 select-none shrink-0">
                    {line.lineNumber}
                  </span>
                )}
                <span className="flex-1 px-4 py-1 whitespace-pre-wrap break-all">
                  {line.content || '\u00A0'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// Unified View Component
// ============================================

interface UnifiedViewProps {
  unifiedDiff: DiffLine[];
  showLineNumbers: boolean;
  currentDiffIndex: number;
}

function UnifiedView({ unifiedDiff, showLineNumbers, currentDiffIndex }: UnifiedViewProps) {
  const getLineStyle = (type: DiffType, index: number) => {
    const isCurrentDiff = index === currentDiffIndex;

    const baseStyles = {
      added: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      removed: 'bg-red-500/10 text-red-700 dark:text-red-300',
      modified: 'bg-amber-500/10',
      unchanged: '',
    };

    return cn(baseStyles[type], isCurrentDiff && 'ring-2 ring-primary');
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <span className="font-medium">Vue unifiee</span>
        <Badge variant="secondary">Unified Diff</Badge>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="font-mono text-sm">
          {unifiedDiff.map((line, index) => (
            <div
              key={index}
              id={'unified-line-' + index}
              className={cn('flex', getLineStyle(line.type, index))}
            >
              {showLineNumbers && (
                <span className="w-12 px-2 py-1 text-right text-muted-foreground bg-muted/30 border-r select-none shrink-0">
                  {line.lineNumber}
                </span>
              )}
              <span className="flex-1 px-4 py-1 whitespace-pre break-all">
                {line.content}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function DocumentComparison({
  leftDocument,
  rightDocument,
  syncScroll = true,
  showLineNumbers = true,
  highlightDiffs = true,
  initialViewMode = 'split',
  onDiffSelect,
  className,
}: DocumentComparisonProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>(initialViewMode);
  const [overlayOpacity, setOverlayOpacity] = React.useState(0.5);
  const [currentDiffIndex, setCurrentDiffIndex] = React.useState(-1);
  const [isSyncEnabled, setIsSyncEnabled] = React.useState(syncScroll);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [copiedSide, setCopiedSide] = React.useState<'left' | 'right' | null>(null);

  const leftScrollRef = React.useRef<HTMLDivElement>(null);
  const rightScrollRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = React.useState(false);

  // Compute diff
  const { left: leftDiff, right: rightDiff, unified: unifiedDiff } = React.useMemo(
    () => computeDiff(leftDocument.content, rightDocument.content),
    [leftDocument.content, rightDocument.content]
  );

  // Get all diff indices
  const diffIndices = React.useMemo(() => {
    return leftDiff
      .map((line, index) => (line.highlight ? index : -1))
      .filter((index) => index !== -1);
  }, [leftDiff]);

  // Calculate stats
  const stats = React.useMemo(() => {
    let added = 0;
    let removed = 0;
    let modified = 0;

    rightDiff.forEach((line) => {
      if (line.type === 'added' && line.highlight) added++;
      if (line.type === 'modified' && line.highlight) modified++;
    });
    leftDiff.forEach((line) => {
      if (line.type === 'removed' && line.highlight) removed++;
    });

    modified = Math.floor(modified / 2);

    return { added, removed, modified };
  }, [leftDiff, rightDiff]);

  // Synchronized scrolling
  const handleScroll = (source: 'left' | 'right') => (e: React.UIEvent<HTMLDivElement>) => {
    if (!isSyncEnabled || isScrolling) return;

    setIsScrolling(true);
    const target = e.currentTarget;
    const otherRef = source === 'left' ? rightScrollRef : leftScrollRef;

    if (otherRef.current) {
      otherRef.current.scrollTop = target.scrollTop;
      otherRef.current.scrollLeft = target.scrollLeft;
    }

    setTimeout(() => setIsScrolling(false), 50);
  };

  // Navigate to diff
  const navigateToDiff = (direction: 'prev' | 'next') => {
    if (diffIndices.length === 0) return;

    let newIndex: number;
    if (direction === 'next') {
      const nextIndex = diffIndices.findIndex((i) => i > currentDiffIndex);
      newIndex = nextIndex !== -1 ? diffIndices[nextIndex] : diffIndices[0];
    } else {
      const prevIndices = diffIndices.filter((i) => i < currentDiffIndex);
      newIndex = prevIndices.length > 0 ? prevIndices[prevIndices.length - 1] : diffIndices[diffIndices.length - 1];
    }

    setCurrentDiffIndex(newIndex);

    // Scroll to the diff
    const element = document.getElementById('diff-line-left-' + newIndex);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Copy content
  const handleCopy = async (side: 'left' | 'right') => {
    const content = side === 'left' ? leftDocument.content : rightDocument.content;
    await navigator.clipboard.writeText(content);
    setCopiedSide(side);
    setTimeout(() => setCopiedSide(null), 2000);
  };

  // Fullscreen
  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && e.altKey) {
        e.preventDefault();
        navigateToDiff('next');
      } else if (e.key === 'ArrowUp' && e.altKey) {
        e.preventDefault();
        navigateToDiff('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDiffIndex, diffIndices]);

  return (
    <TooltipProvider>
      <GlassCard
        ref={containerRef}
        variant="default"
        size="sm"
        animate={false}
        hover={false}
        className={cn('overflow-hidden', className)}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Comparaison de documents</h3>
              <p className="text-sm text-muted-foreground">
                {leftDocument.name} vs {rightDocument.name}
              </p>
            </div>
          </div>

          <DiffStats {...stats} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('split')}
                    className="h-7 px-2"
                  >
                    <SplitSquareHorizontal className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vue cote a cote</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'overlay' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('overlay')}
                    className="h-7 px-2"
                  >
                    <Layers className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vue superposee</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'unified' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('unified')}
                    className="h-7 px-2"
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vue unifiee</TooltipContent>
              </Tooltip>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateToDiff('prev')}
                    disabled={diffIndices.length === 0}
                    className="h-7"
                  >
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Precedent
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Alt + Fleche Haut</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateToDiff('next')}
                    disabled={diffIndices.length === 0}
                    className="h-7"
                  >
                    Suivant
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Alt + Fleche Bas</TooltipContent>
              </Tooltip>

              {diffIndices.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {currentDiffIndex >= 0 ? diffIndices.indexOf(currentDiffIndex) + 1 : 0} / {diffIndices.length}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Overlay Opacity (only in overlay mode) */}
            {viewMode === 'overlay' && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Opacite</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-20 h-1 accent-primary"
                />
                <span className="text-xs text-muted-foreground w-8">{Math.round(overlayOpacity * 100)}%</span>
              </div>
            )}

            {/* Sync Toggle (only in split mode) */}
            {viewMode === 'split' && (
              <div className="flex items-center gap-2">
                <Switch
                  id="sync-scroll"
                  checked={isSyncEnabled}
                  onCheckedChange={setIsSyncEnabled}
                />
                <Label htmlFor="sync-scroll" className="text-xs text-muted-foreground">
                  Sync
                </Label>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy('left')}
                    className="h-7 w-7 p-0"
                  >
                    {copiedSide === 'left' ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copier original</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFullscreen}
                    className="h-7 w-7 p-0"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? 'Quitter plein ecran' : 'Plein ecran'}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 bg-muted/20">
          <AnimatePresence mode="wait">
            {viewMode === 'split' && (
              <motion.div
                key="split"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2"
              >
                <DocumentPanel
                  document={leftDocument}
                  diffLines={leftDiff}
                  showLineNumbers={showLineNumbers}
                  highlightDiffs={highlightDiffs}
                  scrollRef={leftScrollRef}
                  onScroll={handleScroll('left')}
                  side="left"
                  currentDiffIndex={currentDiffIndex}
                  onLineClick={(line) => onDiffSelect?.(line, 'left')}
                />

                <div className="flex flex-col items-center justify-center w-8">
                  <motion.div
                    className="p-1.5 rounded-full bg-muted"
                    whileHover={{ scale: 1.1 }}
                    transition={spring.snappy}
                  >
                    <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </div>

                <DocumentPanel
                  document={rightDocument}
                  diffLines={rightDiff}
                  showLineNumbers={showLineNumbers}
                  highlightDiffs={highlightDiffs}
                  scrollRef={rightScrollRef}
                  onScroll={handleScroll('right')}
                  side="right"
                  currentDiffIndex={currentDiffIndex}
                  onLineClick={(line) => onDiffSelect?.(line, 'right')}
                />
              </motion.div>
            )}

            {viewMode === 'overlay' && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <OverlayView
                  leftDocument={leftDocument}
                  rightDocument={rightDocument}
                  leftDiff={leftDiff}
                  rightDiff={rightDiff}
                  showLineNumbers={showLineNumbers}
                  opacity={overlayOpacity}
                />
              </motion.div>
            )}

            {viewMode === 'unified' && (
              <motion.div
                key="unified"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <UnifiedView
                  unifiedDiff={unifiedDiff}
                  showLineNumbers={showLineNumbers}
                  currentDiffIndex={currentDiffIndex}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-card/50 text-sm text-muted-foreground">
          <span>
            {stats.added + stats.removed + stats.modified} differences trouvees
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs">Alt+Fleches pour naviguer</span>
            {viewMode === 'split' && (
              <span>Synchronisation: {isSyncEnabled ? 'activee' : 'desactivee'}</span>
            )}
          </div>
        </div>
      </GlassCard>
    </TooltipProvider>
  );
}

export default DocumentComparison;
