"use client";

import { useParams, useRouter } from "next/navigation";
import { DocumentEditor } from "@/components/document-editor/document-editor";
import { useDocumentContent, useSaveDocument } from "@/hooks/use-tenders";
import { Loader2, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function EditDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params.id as string;
  const filename = decodeURIComponent(params.filename as string);

  const { data: docData, isLoading, error } = useDocumentContent(tenderId, filename);
  const saveDocument = useSaveDocument();

  const handleSave = async (content: string) => {
    try {
      await saveDocument.mutateAsync({ tenderId, filename, content });
      toast.success("Document sauvegard\u00e9 avec succ\u00e8s");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleBack = () => {
    router.push(`/tenders/${tenderId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement du document...</p>
        </div>
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
          <p className="text-sm text-rose-600">Impossible de charger le document</p>
          <p className="text-xs text-muted-foreground">{(error as Error)?.message || "Erreur inconnue"}</p>
        </div>
      </div>
    );
  }

  // Clean filename for display
  const displayName = filename
    .replace(/_upload-[a-f0-9]+/g, "")
    .replace(/\.(docx|txt|md|json)$/i, "")
    .replace(/_/g, " ");

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b bg-muted/20">
        <FileText className="h-5 w-5 text-blue-600" />
        <div>
          <h1 className="text-lg font-semibold">{displayName}</h1>
          <p className="text-xs text-muted-foreground">
            {filename} &middot; {docData.format} &middot; {(docData.size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <DocumentEditor
          documentId={`${tenderId}-${filename}`}
          initialContent={docData.content}
          documentType="memoire"
          onSave={handleSave}
          isSaving={saveDocument.isPending}
          onBack={handleBack}
          className="h-full border-0 rounded-none"
        />
      </div>
    </div>
  );
}
