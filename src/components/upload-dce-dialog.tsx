"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useUploadDCE, useProcessTender } from "@/hooks/use-tenders";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDCEDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCEPTED_FILE_TYPES = [
  ".pdf",
  ".zip",
  ".docx",
  ".doc",
  ".xlsx",
  ".xls",
  ".rar",
  ".7z",
];

const MAX_FILE_SIZE = 100 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

type UploadStep = "idle" | "uploading" | "processing" | "done";

export function UploadDCEDialog({ open, onOpenChange }: UploadDCEDialogProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [deadline, setDeadline] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<UploadStep>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadDCE = useUploadDCE();
  const processTender = useProcessTender();

  const resetForm = useCallback(() => {
    setFiles([]);
    setTitle("");
    setClient("");
    setDeadline("");
    setUploadProgress(0);
    setStep("idle");
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFiles = useCallback((fileList: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ACCEPTED_FILE_TYPES.includes(ext)) {
        errors.push(`${file.name}: Type non supporte`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Trop volumineux (max 100MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      toast.error("Fichiers invalides", {
        description: errors.slice(0, 3).join("\n"),
      });
    }
    return validFiles;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const validFiles = validateFiles(e.dataTransfer.files);
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [validateFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const validFiles = validateFiles(e.target.files);
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [validateFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Aucun fichier", {
        description: "Veuillez selectionner au moins un fichier DCE",
      });
      return;
    }

    try {
      // Step 1: Upload
      setStep("uploading");
      setUploadProgress(10);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 80));
      }, 500);

      const uploadResult = await uploadDCE.mutateAsync({
        files,
        metadata: {
          title: title || undefined,
          client: client || undefined,
          deadline: deadline || undefined,
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Step 2: Auto-process
      setStep("processing");
      const uploadData = uploadResult as unknown as Record<string, unknown>;
      const tenderId = (uploadData?.id as string) || (uploadData?.tender_id as string);

      if (tenderId) {
        try {
          const processResult = await processTender.mutateAsync({
            id: tenderId,
          });

          setStep("done");
          const processData = processResult as Record<string, unknown>;
          const caseId =
            (processData?.case_id as string) ||
            (processData?.workflow_id as string) ||
            tenderId;

          toast.success("DCE importe ! Traitement en cours...", {
            description:
              "Vous allez etre redirige vers votre reponse.",
          });

          // Close dialog and redirect
          setTimeout(() => {
            onOpenChange(false);
            resetForm();
            router.push(`/responses/${caseId}`);
          }, 800);
        } catch {
          // Process failed but upload succeeded - redirect to tender
          toast.success("DCE importe avec succes", {
            description:
              "Le traitement automatique n'a pas pu demarrer. Lancez-le manuellement.",
          });
          setTimeout(() => {
            onOpenChange(false);
            resetForm();
            router.push(`/tenders/${tenderId}`);
          }, 800);
        }
      } else {
        // No tender ID returned - just close
        toast.success("DCE importe avec succes");
        setTimeout(() => {
          onOpenChange(false);
          resetForm();
        }, 500);
      }
    } catch (error) {
      setUploadProgress(0);
      setStep("idle");
      toast.error("Erreur d'upload", {
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'upload",
      });
    }
  };

  const isBusy = step === "uploading" || step === "processing";

  const stepLabel =
    step === "uploading"
      ? "Upload des fichiers..."
      : step === "processing"
      ? "Lancement de l'analyse IA..."
      : step === "done"
      ? "Redirection..."
      : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isBusy) {
          onOpenChange(newOpen);
          if (!newOpen) resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importer un DCE
          </DialogTitle>
          <DialogDescription>
            Importez vos fichiers DCE. L&apos;analyse IA demarrera automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop Zone */}
          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
              isBusy && "pointer-events-none opacity-50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES.join(",")}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isBusy}
            />
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  Glissez vos fichiers ici ou{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:underline"
                    disabled={isBusy}
                  >
                    parcourir
                  </button>
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, ZIP, DOCX, XLSX (max 100MB)
                </p>
              </div>
            </div>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Fichiers ({files.length})</Label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border p-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm">{file.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={isBusy}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titre (optionnel)</Label>
              <Input
                id="title"
                placeholder="Ex: Fournitures bureautiques"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isBusy}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client (optionnel)</Label>
              <Input
                id="client"
                placeholder="Ex: Mairie de Paris"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                disabled={isBusy}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Date limite (optionnel)</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={isBusy}
              className="h-10"
            />
          </div>

          {/* Progress */}
          {isBusy && (
            <div className="space-y-2 rounded-lg bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                {step === "processing" ? (
                  <Rocket className="h-5 w-5 text-primary animate-bounce" />
                ) : (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{stepLabel}</p>
                  <Progress
                    value={step === "processing" ? 100 : uploadProgress}
                    className="mt-2 h-2"
                  />
                </div>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700">
                Analyse lancee ! Redirection en cours...
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={files.length === 0 || isBusy}
            className="gap-2"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {step === "processing" ? "Analyse..." : "Upload..."}
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Importer et analyser
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
