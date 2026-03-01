'use client';

import * as React from 'react';
import { useDropzone, type DropzoneOptions, type FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/animations';
import {
  Upload,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
  RefreshCw,
  CloudUpload,
  HardDrive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ============================================
// Types
// ============================================

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  preview?: string;
}

interface FileValidation {
  valid: boolean;
  errors: string[];
}

interface UploadDropzoneProps {
  onFilesAccepted?: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
  onUploadComplete?: (files: UploadFile[]) => void;
  onUploadStart?: (files: UploadFile[]) => void;
  accept?: DropzoneOptions['accept'];
  maxFiles?: number;
  maxSize?: number;
  minSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  showPreview?: boolean;
  autoUpload?: boolean;
  uploadEndpoint?: string;
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

const getFileIcon = (file: File) => {
  const type = file.type;
  if (type.startsWith('image/')) return FileImage;
  if (type === 'application/pdf') return FileText;
  if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return FileArchive;
  return File;
};

const getFileColor = (file: File): string => {
  const type = file.type;
  if (type.startsWith('image/')) return 'text-purple-500';
  if (type === 'application/pdf') return 'text-red-500';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'text-emerald-500';
  if (type.includes('word')) return 'text-blue-500';
  if (type.includes('zip') || type.includes('archive')) return 'text-amber-500';
  return 'text-muted-foreground';
};

const validateFile = (file: File, maxSize: number, minSize: number): FileValidation => {
  const errors: string[] = [];

  if (file.size > maxSize) {
    errors.push('Fichier trop volumineux (max: ' + formatFileSize(maxSize) + ')');
  }

  if (file.size < minSize) {
    errors.push('Fichier trop petit (min: ' + formatFileSize(minSize) + ')');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================
// File Preview Component
// ============================================

interface FilePreviewProps {
  file: UploadFile;
  onClose: () => void;
}

function FilePreview({ file, onClose }: FilePreviewProps) {
  const isImage = file.file.type.startsWith('image/');
  const isPdf = file.file.type === 'application/pdf';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {file.file.name}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isImage && file.preview && (
            <img
              src={file.preview}
              alt={file.file.name}
              className="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-lg"
            />
          )}
          {isPdf && file.preview && (
            <iframe
              src={file.preview}
              title={file.file.name}
              className="w-full h-[60vh] rounded-lg border"
            />
          )}
          {!isImage && !isPdf && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              {React.createElement(getFileIcon(file.file), { className: 'w-16 h-16 mb-4' })}
              <p>Apercu non disponible pour ce type de fichier</p>
              <p className="text-sm mt-2">{file.file.type || 'Type inconnu'}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatFileSize(file.file.size)}</span>
          <span>{file.file.type || 'Type inconnu'}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// File Item Component
// ============================================

interface FileItemProps {
  file: UploadFile;
  onRemove: () => void;
  onPreview: () => void;
  onRetry?: () => void;
  showPreview: boolean;
}

function FileItem({ file, onRemove, onPreview, onRetry, showPreview }: FileItemProps) {
  const FileIcon = getFileIcon(file.file);
  const iconColor = getFileColor(file.file);

  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (file.status) {
      case 'pending':
        return <Badge variant="secondary" className="text-xs">En attente</Badge>;
      case 'uploading':
        return <Badge variant="outline" className="text-xs bg-primary/10 text-primary">Upload...</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600">Complete</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600">Erreur</Badge>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-xl border bg-card transition-all',
        'hover:shadow-md hover:border-primary/30',
        file.status === 'error' && 'border-red-500/50 bg-red-500/5',
        file.status === 'completed' && 'border-emerald-500/30 bg-emerald-500/5'
      )}
    >
      {/* Thumbnail / Icon */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center w-12 h-12 rounded-lg shrink-0 overflow-hidden',
          file.preview && file.file.type.startsWith('image/') ? 'bg-muted' : 'bg-muted/50'
        )}
        whileHover={{ scale: 1.05 }}
        transition={spring.snappy}
      >
        {file.preview && file.file.type.startsWith('image/') ? (
          <img
            src={file.preview}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileIcon className={cn('w-6 h-6', iconColor)} />
        )}
        {file.status === 'uploading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </motion.div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{file.file.name}</p>
          {getStatusIcon()}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatFileSize(file.file.size)}
          </span>
          {getStatusBadge()}
          {file.error && (
            <span className="text-xs text-red-500 truncate">{file.error}</span>
          )}
        </div>
        {file.status === 'uploading' && (
          <div className="mt-2">
            <Progress value={file.progress} className="h-1" />
            <span className="text-xs text-muted-foreground mt-1">{file.progress}%</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {showPreview && (file.file.type.startsWith('image/') || file.file.type === 'application/pdf') && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onPreview}
            className="h-8 w-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        {file.status === 'error' && onRetry && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function UploadDropzone({
  onFilesAccepted,
  onFileRemove,
  onUploadComplete,
  onUploadStart,
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  },
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024,
  minSize = 0,
  multiple = true,
  disabled = false,
  showPreview = true,
  autoUpload = false,
  className,
}: UploadDropzoneProps) {
  const [files, setFiles] = React.useState<UploadFile[]>([]);
  const [previewFile, setPreviewFile] = React.useState<UploadFile | null>(null);
  const [dragCounter, setDragCounter] = React.useState(0);

  // Calculate totals
  const totalSize = React.useMemo(
    () => files.reduce((acc, f) => acc + f.file.size, 0),
    [files]
  );
  const completedCount = files.filter((f) => f.status === 'completed').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  // Create file previews
  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const onDrop = React.useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const newFiles: UploadFile[] = await Promise.all(
        acceptedFiles.map(async (file) => {
          const validation = validateFile(file, maxSize, minSize);
          const preview = await createPreview(file);

          return {
            id: file.name + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            file,
            progress: 0,
            status: validation.valid ? 'pending' : 'error',
            error: validation.errors.join(', ') || undefined,
            preview,
          } as UploadFile;
        })
      );

      // Handle rejected files
      const rejectedUploads: UploadFile[] = rejectedFiles.map((rejection) => ({
        id: rejection.file.name + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        file: rejection.file,
        progress: 0,
        status: 'error' as const,
        error: rejection.errors.map((e) => e.message).join(', '),
      }));

      setFiles((prev) => [...prev, ...newFiles, ...rejectedUploads]);

      const validFiles = newFiles.filter((f) => f.status === 'pending');
      if (validFiles.length > 0) {
        onFilesAccepted?.(validFiles.map((f) => f.file));

        if (autoUpload) {
          onUploadStart?.(validFiles);
        }
      }
    },
    [onFilesAccepted, onUploadStart, autoUpload, maxSize, minSize]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - files.length,
    maxSize,
    multiple,
    disabled: disabled || files.length >= maxFiles,
    noClick: false,
    noKeyboard: false,
  });

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
    onFileRemove?.(fileId);
  };

  const clearAll = () => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  const retryFile = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'pending' as const, error: undefined, progress: 0 } : f
      )
    );
  };

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const rootProps = getRootProps();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div {...rootProps}>
        <input {...getInputProps()} />

        <motion.div
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer overflow-hidden',
            'hover:border-primary/50 hover:bg-primary/5',
            isDragActive && !isDragReject && 'border-primary bg-primary/10 scale-[1.02]',
            isDragReject && 'border-red-500 bg-red-500/10',
            (disabled || files.length >= maxFiles) && 'opacity-50 cursor-not-allowed'
          )}
          whileHover={!disabled && files.length < maxFiles ? { scale: 1.01 } : undefined}
          whileTap={!disabled && files.length < maxFiles ? { scale: 0.99 } : undefined}
          transition={spring.gentle}
        >
          {/* Animated Background */}
          <AnimatePresence>
            {isDragActive && !isDragReject && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"
              />
            )}
          </AnimatePresence>

          <div className="relative flex flex-col items-center justify-center gap-4 text-center">
            <motion.div
              className={cn(
                'p-4 rounded-2xl transition-colors',
                isDragActive && !isDragReject ? 'bg-primary/20' : 'bg-muted'
              )}
              animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
              transition={spring.bouncy}
            >
              {isDragActive ? (
                <CloudUpload className="w-10 h-10 text-primary" />
              ) : (
                <Upload className="w-10 h-10 text-muted-foreground" />
              )}
            </motion.div>

            <div>
              <p className="text-lg font-medium text-foreground">
                {isDragActive
                  ? isDragReject
                    ? 'Type de fichier non accepte'
                    : 'Deposez les fichiers ici'
                  : 'Glissez-deposez vos fichiers'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ou cliquez pour parcourir
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1">
                <HardDrive className="w-3 h-3" />
                Max: {formatFileSize(maxSize)}
              </Badge>
              <Badge variant="outline">
                {maxFiles - files.length} fichier(s) restant(s)
              </Badge>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || files.length >= maxFiles}
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              Parcourir
            </Button>
          </div>
        </motion.div>
      </div>

      {/* File Stats */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-2"
        >
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{files.length} fichier(s)</span>
            <span>{formatFileSize(totalSize)}</span>
            {completedCount > 0 && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-xs">
                {completedCount} complete(s)
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="outline" className="bg-red-500/10 text-red-600 text-xs">
                {errorCount} erreur(s)
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Tout supprimer
          </Button>
        </motion.div>
      )}

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
                onPreview={() => setPreviewFile(file)}
                onRetry={() => retryFile(file.id)}
                showPreview={showPreview}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}

export default UploadDropzone;
