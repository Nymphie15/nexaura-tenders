'use client';

import * as React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/animations';
import { GlassCard } from '@/components/premium/cards/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  Loader2,
  X,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  ChevronUp,
  ChevronDown,
  Printer,
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ============================================
// Types
// ============================================

interface PDFViewerProps {
  src: string;
  title?: string;
  initialPage?: number;
  showThumbnails?: boolean;
  showSearch?: boolean;
  allowDownload?: boolean;
  height?: string | number;
  onPageChange?: (page: number) => void;
  onLoadSuccess?: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
  className?: string;
}

interface SearchResult {
  pageIndex: number;
  matchIndex: number;
  text: string;
}

// ============================================
// Thumbnail Component
// ============================================

interface ThumbnailProps {
  src: string;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
  width?: number;
}

function Thumbnail({ src, pageNumber, isActive, onClick, width = 100 }: ThumbnailProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative w-full rounded-lg border-2 overflow-hidden transition-all',
        'hover:border-primary/50 hover:shadow-md',
        isActive ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-muted'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={spring.snappy}
    >
      <div className="relative bg-white dark:bg-gray-900">
        <Document file={src} loading={null}>
          <Page
            pageNumber={pageNumber}
            width={width - 16}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onLoadSuccess={() => setIsLoaded(true)}
          />
        </Document>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <div className={cn(
        'absolute bottom-0 left-0 right-0 py-1 text-xs font-medium text-center',
        'bg-background/90 dark:bg-background/80 backdrop-blur-sm',
        isActive && 'bg-primary text-primary-foreground'
      )}>
        {pageNumber}
      </div>
    </motion.button>
  );
}

// ============================================
// Search Panel Component
// ============================================

interface SearchPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  results: SearchResult[];
  currentResult: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onClose: () => void;
}

function SearchPanel({
  searchQuery,
  onSearchChange,
  results,
  currentResult,
  onNavigate,
  onClose,
}: SearchPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-14 right-4 z-50 w-80 p-3 rounded-xl border bg-card/95 backdrop-blur-md shadow-xl"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher dans le document..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 h-9"
            autoFocus
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {searchQuery && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {results.length > 0 ? (
              <>{currentResult + 1} sur {results.length} résultats</>
            ) : (
              <>Aucun resultat</>
            )}
          </span>
          {results.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('prev')}
                disabled={currentResult === 0}
                className="h-7 w-7 p-0"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('next')}
                disabled={currentResult === results.length - 1}
                className="h-7 w-7 p-0"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Toolbar Component
// ============================================

interface ToolbarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  showSearch: boolean;
  allowDownload: boolean;
  isDarkMode: boolean;
  isFullscreen: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (zoom: number) => void;
  onRotate: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onFullscreen: () => void;
  onToggleDarkMode: () => void;
  onSearchToggle: () => void;
  isSearchOpen: boolean;
}

function Toolbar({
  currentPage,
  totalPages,
  zoom,
  showSearch,
  allowDownload,
  isDarkMode,
  isFullscreen,
  onPrevPage,
  onNextPage,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onRotate,
  onDownload,
  onPrint,
  onFullscreen,
  onToggleDarkMode,
  onSearchToggle,
  isSearchOpen,
}: ToolbarProps) {
  const [pageInput, setPageInput] = React.useState(currentPage.toString());

  React.useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      onGoToPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card/80 backdrop-blur-sm">
        {/* Left - Navigation */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevPage}
                disabled={currentPage <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Page precedente</TooltipContent>
          </Tooltip>

          <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
            <Input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="w-12 h-8 text-center text-sm"
            />
            <span className="text-sm text-muted-foreground">/ {totalPages}</span>
          </form>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNextPage}
                disabled={currentPage >= totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Page suivante</TooltipContent>
          </Tooltip>
        </div>

        {/* Center - Zoom & Rotate */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomOut}
                disabled={zoom <= 25}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom arriere</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2 w-40">
            <Slider
              value={[zoom]}
              onValueChange={([v]) => onZoomChange(v)}
              min={25}
              max={300}
              step={5}
              className="flex-1"
            />
            <Badge variant="secondary" className="w-14 justify-center text-xs">
              {zoom}%
            </Badge>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomIn}
                disabled={zoom >= 300}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom avant</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onRotate} className="h-8 w-8 p-0">
                <RotateCw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rotation 90 degres</TooltipContent>
          </Tooltip>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1">
          {showSearch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSearchOpen ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={onSearchToggle}
                  className="h-8 w-8 p-0"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rechercher</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDarkMode}
                className="h-8 w-8 p-0"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isDarkMode ? 'Mode clair' : 'Mode sombre'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onPrint} className="h-8 w-8 p-0">
                <Printer className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Imprimer</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onFullscreen} className="h-8 w-8 p-0">
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Quitter plein ecran' : 'Plein ecran'}</TooltipContent>
          </Tooltip>

          {allowDownload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onDownload} className="h-8 w-8 p-0">
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Telecharger</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================
// Main Component
// ============================================

export function PDFViewer({
  src,
  title,
  initialPage = 1,
  showThumbnails = true,
  showSearch = true,
  allowDownload = true,
  height = 700,
  onPageChange,
  onLoadSuccess,
  onLoadError,
  className,
}: PDFViewerProps) {
  const [numPages, setNumPages] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [zoom, setZoom] = React.useState(100);
  const [rotation, setRotation] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [currentSearchResult, setCurrentSearchResult] = React.useState(0);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(showThumbnails);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleDocumentLoadSuccess = ({ numPages: np }: { numPages: number }) => {
    setNumPages(np);
    setIsLoading(false);
    setError(null);
    onLoadSuccess?.(np);
  };

  const handleDocumentLoadError = (err: Error) => {
    setIsLoading(false);
    setError(err.message || 'Erreur de chargement du document');
    onLoadError?.(err);
  };

  const handlePageChange = React.useCallback((page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
      onPageChange?.(page);
      const thumbnailEl = document.getElementById('thumbnail-' + page);
      thumbnailEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [numPages, onPageChange]);

  const handleZoomIn = React.useCallback(() => setZoom((z) => Math.min(300, z + 25)), []);
  const handleZoomOut = React.useCallback(() => setZoom((z) => Math.max(25, z - 25)), []);
  const handleZoomChange = (newZoom: number) => setZoom(newZoom);
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = title || 'document.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open(src, '_blank');
    printWindow?.print();
  };

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

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleSearchNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentSearchResult > 0) {
      setCurrentSearchResult(currentSearchResult - 1);
    } else if (direction === 'next' && currentSearchResult < searchResults.length - 1) {
      setCurrentSearchResult(currentSearchResult + 1);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            setIsSearchOpen(true);
            break;
          case '+':
          case '=':
            e.preventDefault();
            handleZoomIn();
            break;
          case '-':
            e.preventDefault();
            handleZoomOut();
            break;
        }
      } else {
        switch (e.key) {
          case 'ArrowLeft':
          case 'PageUp':
            handlePageChange(currentPage - 1);
            break;
          case 'ArrowRight':
          case 'PageDown':
            handlePageChange(currentPage + 1);
            break;
          case 'Home':
            handlePageChange(1);
            break;
          case 'End':
            handlePageChange(numPages);
            break;
          case 'Escape':
            if (isSearchOpen) setIsSearchOpen(false);
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages, isSearchOpen, handlePageChange, handleZoomIn, handleZoomOut]);

  const heightStyle = typeof height === 'number' ? height + 'px' : height;

  return (
    <GlassCard
      variant="default"
      size="sm"
      animate={false}
      hover={false}
      className={cn('overflow-hidden', isDarkMode && 'dark', className)}
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground truncate">{title}</h3>
              {numPages > 0 && (
                <p className="text-xs text-muted-foreground">{numPages} pages</p>
              )}
            </div>
          </div>
          {showThumbnails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 p-0"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      )}

      <Toolbar
        currentPage={currentPage}
        totalPages={numPages}
        zoom={zoom}
        showSearch={showSearch}
        allowDownload={allowDownload}
        isDarkMode={isDarkMode}
        isFullscreen={isFullscreen}
        onPrevPage={() => handlePageChange(currentPage - 1)}
        onNextPage={() => handlePageChange(currentPage + 1)}
        onGoToPage={handlePageChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomChange={handleZoomChange}
        onRotate={handleRotate}
        onDownload={handleDownload}
        onPrint={handlePrint}
        onFullscreen={handleFullscreen}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
        isSearchOpen={isSearchOpen}
      />

      <div
        ref={containerRef}
        className={cn('relative flex', isDarkMode ? 'bg-gray-900' : 'bg-muted/30')}
        style={{ height: heightStyle }}
      >
        <AnimatePresence>
          {isSearchOpen && (
            <SearchPanel
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              results={searchResults}
              currentResult={currentSearchResult}
              onNavigate={handleSearchNavigate}
              onClose={() => setIsSearchOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sidebarOpen && showThumbnails && numPages > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 140, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r bg-card/50 overflow-hidden shrink-0"
            >
              <ScrollArea className="h-full">
                <div className="p-3 space-y-3">
                  {Array.from({ length: numPages }, (_, i) => (
                    <div key={i + 1} id={'thumbnail-' + (i + 1)}>
                      <Thumbnail
                        src={src}
                        pageNumber={i + 1}
                        isActive={currentPage === i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        width={120}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Chargement du document...</p>
              </motion.div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8"
              >
                <div className="p-4 rounded-full bg-red-500/10 w-fit mx-auto mb-4">
                  <FileText className="w-12 h-12 text-red-500" />
                </div>
                <p className="text-lg font-semibold text-foreground">Erreur de chargement</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Reessayer
                </Button>
              </motion.div>
            </div>
          ) : (
            <motion.div
              className="flex flex-col items-center py-6 px-4 min-h-full"
              style={{
                transform: 'scale(' + (zoom / 100) + ')',
                transformOrigin: 'top center',
              }}
            >
              <Document
                file={src}
                onLoadSuccess={handleDocumentLoadSuccess}
                onLoadError={handleDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                }
                className="flex flex-col items-center gap-4"
              >
                <Page
                  pageNumber={currentPage}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className={cn(
                    'shadow-2xl rounded-lg overflow-hidden',
                    isDarkMode && 'invert hue-rotate-180'
                  )}
                  loading={
                    <div className="flex items-center justify-center p-8 min-w-[600px] min-h-[800px] bg-card">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  }
                />
              </Document>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t bg-card/80 backdrop-blur-sm text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Page {currentPage} / {numPages}</span>
          <span>Zoom: {zoom}%</span>
          {rotation !== 0 && <span>Rotation: {rotation}deg</span>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">PDF</Badge>
          {isDarkMode && (
            <Badge variant="secondary" className="text-xs">Mode sombre</Badge>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default PDFViewer;
