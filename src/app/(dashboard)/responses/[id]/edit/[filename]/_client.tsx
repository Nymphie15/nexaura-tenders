"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DocumentEditor } from "@/components/document-editor/document-editor";
import { useDocumentContent, useSaveDocument } from "@/hooks/use-tenders";
import { useWorkflow } from "@/hooks/use-workflows";
import { Loader2, FileText, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function EditResponseDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const filename = decodeURIComponent(params.filename as string);

  const { data: workflow, isLoading: isLoadingWf } = useWorkflow(caseId);
  const tenderId = workflow?.tender_id || "";
  const { data: docData, isLoading: isLoadingDoc, error } = useDocumentContent(
    tenderId,
    filename
  );
  const saveDocument = useSaveDocument();

  const isLoading = isLoadingWf || isLoadingDoc;

  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef<string>("");

  // Auto-save function
  const performAutoSave = useCallback(
    async (content: string) => {
      if (!tenderId || !filename) return;
      setAutoSaveStatus("saving");
      try {
        await saveDocument.mutateAsync({ tenderId, filename, content });
        setAutoSaveStatus("saved");
        setLastSaved(new Date());
      } catch {
        setAutoSaveStatus("error");
      }
    },
    [tenderId, filename, saveDocument]
  );

  // Track content changes for auto-save (debounce 5s)
  const handleContentChange = useCallback(
    (content: string) => {
      latestContentRef.current = content;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        performAutoSave(content);
      }, 5000);
    },
    [performAutoSave]
  );

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleSave = async (content: string) => {
    // Cancel pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    try {
      await saveDocument.mutateAsync({ tenderId, filename, content });
      setLastSaved(new Date());
      setAutoSaveStatus("saved");
      toast.success("Document sauvegarde");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleBack = () => {
    // Save before leaving if there are unsaved changes
    if (latestContentRef.current && autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      performAutoSave(latestContentRef.current);
    }
    router.push(`/projects/${caseId}`);
  };

  // Format relative time
  const getLastSavedText = () => {
    if (!lastSaved) return null;
    const diffSec = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (diffSec < 5) return "Sauvegarde a l'instant";
    if (diffSec < 60) return `Sauvegarde il y a ${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    return `Sauvegarde il y a ${diffMin}min`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Chargement du document...
          </p>
        </div>
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
          <p className="text-sm text-rose-600">
            Impossible de charger le document
          </p>
          <p className="text-xs text-muted-foreground">
            {(error as Error)?.message || "Erreur inconnue"}
          </p>
        </div>
      </div>
    );
  }

  const displayName = filename
    .replace(/_upload-[a-f0-9]+/g, "")
    .replace(/\.(docx|txt|md|json)$/i, "")
    .replace(/_/g, " ");

  const savedText = getLastSavedText();

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header with save indicator */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold capitalize">{displayName}</h1>
            <p className="text-xs text-muted-foreground">
              {filename} &middot; {docData.format || "text"} &middot;{" "}
              {((docData.size || 0) / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          {autoSaveStatus === "saving" && (
            <Badge
              variant="secondary"
              className="gap-1 text-xs bg-blue-50 text-blue-600"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Sauvegarde...
            </Badge>
          )}
          {autoSaveStatus === "saved" && savedText && (
            <Badge
              variant="secondary"
              className="gap-1 text-xs bg-green-50 text-green-600"
            >
              <CheckCircle2 className="h-3 w-3" />
              {savedText}
            </Badge>
          )}
          {autoSaveStatus === "error" && (
            <Badge
              variant="secondary"
              className="gap-1 text-xs bg-red-50 text-red-600"
            >
              <AlertTriangle className="h-3 w-3" />
              Erreur de sauvegarde
            </Badge>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <DocumentEditor
          documentId={`${tenderId}-${filename}`}
          initialContent={docData.content}
          documentType="memoire"
          onSave={handleSave}
          isSaving={saveDocument.isPending}
          onBack={handleBack}
          onContentChange={handleContentChange}
          className="h-full border-0 rounded-none"
        />
      </div>
    </div>
  );
}
