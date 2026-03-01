"use client";

import { useCallback, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  FileArchive,
  FileCode,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface DocumentUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  className?: string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  zip: FileArchive,
  rar: FileArchive,
  json: FileCode,
  xml: FileCode,
};

const FILE_COLORS: Record<string, string> = {
  pdf: "text-red-500",
  doc: "text-blue-500",
  docx: "text-blue-500",
  xls: "text-green-500",
  xlsx: "text-green-500",
  png: "text-purple-500",
  jpg: "text-purple-500",
  zip: "text-yellow-600",
  json: "text-amber-500",
};

const DEFAULT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.zip,.rar,.json,.xml";
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function DocumentUpload({
  onUpload,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  multiple = true,
  className,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check size
      if (file.size > maxSize) {
        return `Le fichier depasse la taille maximale de ${formatFileSize(maxSize)}`;
      }

      // Check type
      const extension = "." + getFileExtension(file.name);
      const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());

      if (!acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return extension === type;
        }
        // Handle MIME types like "image/*"
        if (type.endsWith("/*")) {
          const category = type.replace("/*", "");
          return file.type.startsWith(category);
        }
        return file.type === type;
      })) {
        return `Type de fichier non supporte. Types acceptes: ${accept}`;
      }

      return null;
    },
    [accept, maxSize]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const validatedFiles: UploadFile[] = fileArray.map((file) => {
        const error = validateFile(file);
        return {
          id: generateId(),
          file,
          progress: 0,
          status: error ? "error" : "pending",
          error: error || undefined,
        };
      });

      if (!multiple && validatedFiles.length > 1) {
        setUploadFiles([validatedFiles[0]]);
      } else {
        setUploadFiles((prev) => [...prev, ...validatedFiles]);
      }
    },
    [validateFile, multiple]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const startUpload = useCallback(async () => {
    const pendingFiles = uploadFiles.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    // Simulate progress updates
    const updateProgress = (id: string, progress: number) => {
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress, status: "uploading" } : f
        )
      );
    };

    try {
      // Start progress animation for all pending files
      for (const uploadFile of pendingFiles) {
        updateProgress(uploadFile.id, 0);
      }

      // Simulate gradual progress
      const progressInterval = setInterval(() => {
        setUploadFiles((prev) =>
          prev.map((f) => {
            if (f.status === "uploading" && f.progress < 90) {
              return { ...f, progress: f.progress + 10 };
            }
            return f;
          })
        );
      }, 200);

      // Actual upload
      await onUpload(pendingFiles.map((f) => f.file));

      clearInterval(progressInterval);

      // Mark all as success
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading" ? { ...f, progress: 100, status: "success" } : f
        )
      );
    } catch (error) {
      // Mark all uploading as error
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Erreur lors du telechargement",
              }
            : f
        )
      );
    } finally {
      setIsUploading(false);
    }
  }, [uploadFiles, onUpload]);

  const clearCompleted = useCallback(() => {
    setUploadFiles((prev) => prev.filter((f) => f.status !== "success"));
  }, []);

  const clearAll = useCallback(() => {
    setUploadFiles([]);
  }, []);

  const pendingCount = uploadFiles.filter((f) => f.status === "pending").length;
  const successCount = uploadFiles.filter((f) => f.status === "success").length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Zone de depot de fichiers. Glissez-deposez ou appuyez sur Entree pour selectionner."
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        <Upload
          className={cn(
            "mb-4 h-10 w-10 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )}
        />

        <p className="mb-1 text-sm font-medium">
          {isDragging ? "Deposez les fichiers ici" : "Glissez-deposez vos fichiers"}
        </p>
        <p className="text-xs text-muted-foreground">
          ou cliquez pour selectionner
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Taille max: {formatFileSize(maxSize)} | Types: {accept.split(",").slice(0, 5).join(", ")}...
        </p>
      </div>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {uploadFiles.length} fichier(s)
            </span>
            <div className="flex gap-2">
              {successCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCompleted}>
                  Effacer termines
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Tout effacer
              </Button>
            </div>
          </div>

          <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border p-2">
            {uploadFiles.map((uploadFile) => {
              const extension = getFileExtension(uploadFile.file.name);
              const IconComponent = FILE_ICONS[extension] || File;
              const iconColor = FILE_COLORS[extension] || "text-muted-foreground";

              return (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 rounded-md bg-muted/50 p-2"
                >
                  <div className={cn("shrink-0", iconColor)}>
                    <IconComponent className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {uploadFile.file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)}
                      </span>
                      {uploadFile.status === "error" && (
                        <span className="text-xs text-destructive">
                          {uploadFile.error}
                        </span>
                      )}
                    </div>
                    {uploadFile.status === "uploading" && (
                      <Progress value={uploadFile.progress} className="mt-1 h-1" />
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {uploadFile.status === "success" && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {uploadFile.status === "error" && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    {(uploadFile.status === "pending" || uploadFile.status === "error") && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeFile(uploadFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {pendingCount > 0 && (
        <Button
          onClick={startUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>Telechargement en cours...</>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Telecharger {pendingCount} fichier(s)
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default DocumentUpload;
