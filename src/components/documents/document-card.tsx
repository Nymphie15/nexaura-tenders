'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/premium/cards/glass-card';
import { spring } from '@/lib/animations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Share2,
  Copy,
  ExternalLink,
  FolderOpen,
  Star,
  StarOff,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export type DocumentStatus = 'processing' | 'ready' | 'error' | 'uploading';

export interface DocumentData {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  createdAt: Date;
  uploadedBy?: string;
  thumbnailUrl?: string;
  url?: string;
  status?: DocumentStatus;
  category?: string;
  progress?: number;
  starred?: boolean;
  tags?: string[];
}

interface DocumentCardProps {
  document: DocumentData;
  selected?: boolean;
  onSelect?: (doc: DocumentData) => void;
  onView?: (doc: DocumentData) => void;
  onDownload?: (doc: DocumentData) => void;
  onDelete?: (doc: DocumentData) => void;
  onShare?: (doc: DocumentData) => void;
  onStar?: (doc: DocumentData) => void;
  showActions?: boolean;
  compact?: boolean;
  variant?: 'default' | 'grid' | 'list';
  delay?: number;
  className?: string;
}

// ============================================
// Utilities
// ============================================

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? "A l'instant" : 'Il y a ' + minutes + ' min';
    }
    return 'Il y a ' + hours + 'h';
  }
  if (days === 1) return 'Hier';
  if (days < 7) return 'Il y a ' + days + ' jours';

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return FileImage;
  if (type === 'application/pdf') return FileText;
  if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return FileArchive;
  return File;
};

const getFileColor = (type: string): string => {
  if (type.startsWith('image/')) return 'text-purple-500 bg-purple-500/10';
  if (type === 'application/pdf') return 'text-red-500 bg-red-500/10';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'text-emerald-500 bg-emerald-500/10';
  if (type.includes('word')) return 'text-blue-500 bg-blue-500/10';
  if (type.includes('zip') || type.includes('archive')) return 'text-amber-500 bg-amber-500/10';
  return 'text-muted-foreground bg-muted';
};

const getStatusConfig = (status?: DocumentStatus) => {
  switch (status) {
    case 'processing':
      return {
        icon: Loader2,
        label: 'En traitement',
        className: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        animate: true,
      };
    case 'uploading':
      return {
        icon: Loader2,
        label: 'Upload en cours',
        className: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
        animate: true,
      };
    case 'error':
      return {
        icon: AlertCircle,
        label: 'Erreur',
        className: 'text-red-500 bg-red-500/10 border-red-500/30',
        animate: false,
      };
    case 'ready':
    default:
      return {
        icon: CheckCircle,
        label: 'Pret',
        className: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
        animate: false,
      };
  }
};

// ============================================
// Status Badge Component
// ============================================

interface StatusBadgeProps {
  status?: DocumentStatus;
  progress?: number;
}

function StatusBadge({ status, progress }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('gap-1 text-xs', config.className)}>
      <Icon className={cn('w-3 h-3', config.animate && 'animate-spin')} />
      {status === 'uploading' && progress !== undefined ? (
        <span>{progress}%</span>
      ) : (
        <span>{config.label}</span>
      )}
    </Badge>
  );
}

// ============================================
// Default Card Variant
// ============================================

function DefaultCard({
  document,
  selected,
  onSelect,
  onView,
  onDownload,
  onDelete,
  onShare,
  onStar,
  showActions,
  delay,
  className,
}: DocumentCardProps) {
  const Icon = getFileIcon(document.type);
  const iconColor = getFileColor(document.type);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <TooltipProvider>
      <GlassCard
        variant="subtle"
        size="md"
        hover
        delay={delay}
        className={cn(
          'group transition-all cursor-pointer',
          selected && 'ring-2 ring-primary',
          className
        )}
        onClick={() => onSelect?.(document)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex gap-4 items-start">
          {/* Thumbnail / Icon */}
          <div className="relative shrink-0">
            {document.thumbnailUrl ? (
              <motion.div
                className="relative w-16 h-20 rounded-lg overflow-hidden bg-muted"
                whileHover={{ scale: 1.05 }}
                transition={spring.snappy}
              >
                <img
                  src={document.thumbnailUrl}
                  alt={document.name}
                  className="w-full h-full object-cover"
                />
                <motion.div
                  className="absolute inset-0 bg-black/50 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                >
                  <Eye className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                className={cn(
                  'flex items-center justify-center w-14 h-14 rounded-xl',
                  iconColor.split(' ')[1]
                )}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={spring.snappy}
              >
                <Icon className={cn('w-7 h-7', iconColor.split(' ')[0])} />
              </motion.div>
            )}

            {/* Star indicator */}
            {document.starred && (
              <div className="absolute -top-1 -right-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h4 className="font-medium text-foreground truncate cursor-default">
                      {document.name}
                    </h4>
                  </TooltipTrigger>
                  <TooltipContent>{document.name}</TooltipContent>
                </Tooltip>

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(document.size)}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(document.uploadedAt)}
                  </span>
                  {document.uploadedBy && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {document.uploadedBy}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {document.tags && document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {document.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                    {document.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        +{document.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-2">
                {document.status && document.status !== 'ready' && (
                  <StatusBadge status={document.status} progress={document.progress} />
                )}

                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(document)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualiser
                        </DropdownMenuItem>
                      )}
                      {onDownload && (
                        <DropdownMenuItem onClick={() => onDownload(document)}>
                          <Download className="w-4 h-4 mr-2" />
                          Telecharger
                        </DropdownMenuItem>
                      )}
                      {onShare && (
                        <DropdownMenuItem onClick={() => onShare(document)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Partager
                        </DropdownMenuItem>
                      )}
                      {document.url && (
                        <DropdownMenuItem onClick={() => window.open(document.url, '_blank')}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ouvrir dans un nouvel onglet
                        </DropdownMenuItem>
                      )}
                      {onStar && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onStar(document)}>
                            {document.starred ? (
                              <>
                                <StarOff className="w-4 h-4 mr-2" />
                                Retirer des favoris
                              </>
                            ) : (
                              <>
                                <Star className="w-4 h-4 mr-2" />
                                Ajouter aux favoris
                              </>
                            )}
                          </DropdownMenuItem>
                        </>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(document)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Progress bar for uploading status */}
            {document.status === 'uploading' && document.progress !== undefined && (
              <div className="mt-3">
                <Progress value={document.progress} className="h-1" />
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </TooltipProvider>
  );
}

// ============================================
// Grid Card Variant
// ============================================

function GridCard({
  document,
  selected,
  onSelect,
  onView,
  onDownload,
  onDelete,
  onStar,
  showActions,
  delay,
  className,
}: DocumentCardProps) {
  const Icon = getFileIcon(document.type);
  const iconColor = getFileColor(document.type);

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay ? delay * 0.05 : 0, ...spring.gentle }}
        className={cn(
          'group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all cursor-pointer',
          'hover:shadow-lg hover:border-primary/30',
          selected && 'ring-2 ring-primary',
          className
        )}
        onClick={() => onSelect?.(document)}
      >
        {/* Thumbnail Area */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {document.thumbnailUrl ? (
            <img
              src={document.thumbnailUrl}
              alt={document.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className={cn('w-12 h-12', iconColor.split(' ')[0])} />
            </div>
          )}

          {/* Overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            {onView && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(document);
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                Voir
              </Button>
            )}
          </motion.div>

          {/* Status Badge */}
          {document.status && document.status !== 'ready' && (
            <div className="absolute top-2 left-2">
              <StatusBadge status={document.status} progress={document.progress} />
            </div>
          )}

          {/* Star */}
          {document.starred && (
            <div className="absolute top-2 right-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500 drop-shadow" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="font-medium text-sm truncate">{document.name}</h4>
            </TooltipTrigger>
            <TooltipContent>{document.name}</TooltipContent>
          </Tooltip>
          <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
            <span>{formatFileSize(document.size)}</span>
            <span>{formatDate(document.uploadedAt)}</span>
          </div>
        </div>

        {/* Progress */}
        {document.status === 'uploading' && document.progress !== undefined && (
          <Progress value={document.progress} className="h-1 rounded-none" />
        )}
      </motion.div>
    </TooltipProvider>
  );
}

// ============================================
// List Card Variant (Compact)
// ============================================

function ListCard({
  document,
  selected,
  onSelect,
  onView,
  onDownload,
  onDelete,
  showActions,
  delay,
  className,
}: DocumentCardProps) {
  const Icon = getFileIcon(document.type);
  const iconColor = getFileColor(document.type);

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay ? delay * 0.03 : 0 }}
        className={cn(
          'group flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer',
          'hover:bg-muted/50',
          selected && 'bg-primary/10',
          className
        )}
        onClick={() => onSelect?.(document)}
      >
        <div className={cn('p-1.5 rounded-md', iconColor.split(' ')[1])}>
          <Icon className={cn('w-4 h-4', iconColor.split(' ')[0])} />
        </div>

        <div className="flex-1 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm font-medium truncate block">{document.name}</span>
            </TooltipTrigger>
            <TooltipContent>{document.name}</TooltipContent>
          </Tooltip>
        </div>

        <span className="text-xs text-muted-foreground shrink-0">
          {formatFileSize(document.size)}
        </span>

        <span className="text-xs text-muted-foreground shrink-0 w-20">
          {formatDate(document.uploadedAt)}
        </span>

        {document.status && document.status !== 'ready' && (
          <StatusBadge status={document.status} progress={document.progress} />
        )}

        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(document);
                }}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(document);
                }}
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(document);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}

// ============================================
// Main Component
// ============================================

export function DocumentCard(props: DocumentCardProps) {
  const { variant = 'default', compact } = props;

  if (compact || variant === 'list') {
    return <ListCard {...props} />;
  }

  if (variant === 'grid') {
    return <GridCard {...props} />;
  }

  return <DefaultCard {...props} />;
}

export default DocumentCard;

// Type alias for backwards compatibility
export type TenderDocument = DocumentData;
