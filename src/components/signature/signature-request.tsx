"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSignature,
  Plus,
  Trash2,
  Send,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Eye,
  Mail,
  Loader2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

// === Types ===

interface SignerInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  routingOrder: number;
}

interface DocumentInfo {
  id: string;
  name: string;
  size: number;
  file: File | null;
}

interface SignatureRequestData {
  caseId?: string;
  tenderReference?: string;
  documents: DocumentInfo[];
  signers: SignerInfo[];
  emailSubject: string;
  emailMessage: string;
  sendImmediately: boolean;
}

interface SignatureStatus {
  envelopeId: string;
  status: "created" | "sent" | "delivered" | "signed" | "completed" | "declined" | "voided";
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
  voidedAt?: string;
  voidReason?: string;
  signers: Array<{
    email: string;
    name: string;
    status: string;
    signedAt?: string;
    declinedReason?: string;
  }>;
}

interface SignatureRequestProps {
  caseId?: string;
  tenderReference?: string;
  documents?: Array<{ name: string; content: Blob }>;
  onSuccess?: (envelopeId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

// === Status Badge Component ===

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
    created: { variant: "secondary", icon: <Clock className="h-3 w-3" />, label: "Brouillon" },
    sent: { variant: "outline", icon: <Send className="h-3 w-3" />, label: "Envoye" },
    delivered: { variant: "outline", icon: <Mail className="h-3 w-3" />, label: "Livre" },
    signed: { variant: "default", icon: <FileSignature className="h-3 w-3" />, label: "Signe" },
    completed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" />, label: "Complete" },
    declined: { variant: "destructive", icon: <XCircle className="h-3 w-3" />, label: "Refuse" },
    voided: { variant: "secondary", icon: <AlertCircle className="h-3 w-3" />, label: "Annule" },
  };

  const config = statusConfig[status] || statusConfig.created;

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

// === Signer Row Component ===

function SignerRow({
  signer,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  signer: SignerInfo;
  index: number;
  onUpdate: (id: string, field: keyof SignerInfo, value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <GripVertical className="h-4 w-4" />
        <span className="text-sm font-medium">{index + 1}</span>
      </div>

      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input
            type="email"
            placeholder="email@example.com"
            value={signer.email}
            onChange={(e) => onUpdate(signer.id, "email", e.target.value)}
            className="h-8"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Nom</Label>
          <Input
            type="text"
            placeholder="Jean Dupont"
            value={signer.name}
            onChange={(e) => onUpdate(signer.id, "name", e.target.value)}
            className="h-8"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Role</Label>
          <Select
            value={signer.role}
            onValueChange={(value) => onUpdate(signer.id, "role", value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Selectionnez un role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Directeur">Directeur</SelectItem>
              <SelectItem value="Responsable">Responsable</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Technique">Technique</SelectItem>
              <SelectItem value="Autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(signer.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// === Document Row Component ===

function DocumentRow({
  document,
  onRemove,
}: {
  document: DocumentInfo;
  onRemove: (id: string) => void;
}) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-red-500" />
        <div>
          <p className="text-sm font-medium">{document.name}</p>
          <p className="text-xs text-muted-foreground">{formatSize(document.size)}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(document.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// === Main Component ===

export function SignatureRequest({
  caseId,
  tenderReference,
  documents: initialDocuments,
  onSuccess,
  onError,
  className,
}: SignatureRequestProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signers, setSigners] = useState<SignerInfo[]>([
    { id: "1", email: "", name: "", role: "Directeur", routingOrder: 1 },
  ]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [emailSubject, setEmailSubject] = useState(
    tenderReference ? `Signature requise - Réponse AO ${tenderReference}` : "Signature requise - Documents à signer"
  );
  const [emailMessage, setEmailMessage] = useState(
    "Veuillez signer les documents ci-joints pour finaliser la réponse à l'appel d'offres."
  );
  const [sendImmediately, setSendImmediately] = useState(true);

  // Load initial documents if provided
  useEffect(() => {
    if (initialDocuments && initialDocuments.length > 0) {
      const docs = initialDocuments.map((doc, idx) => ({
        id: `doc-${idx + 1}`,
        name: doc.name,
        size: doc.content.size,
        file: new File([doc.content], doc.name, { type: doc.content.type }),
      }));
      setDocuments(docs);
    }
  }, [initialDocuments]);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Signer management
  const addSigner = useCallback(() => {
    const newOrder = signers.length + 1;
    setSigners((prev) => [
      ...prev,
      { id: generateId(), email: "", name: "", role: "", routingOrder: newOrder },
    ]);
  }, [signers.length]);

  const removeSigner = useCallback((id: string) => {
    setSigners((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      // Reorder remaining signers
      return filtered.map((s, idx) => ({ ...s, routingOrder: idx + 1 }));
    });
  }, []);

  const updateSigner = useCallback((id: string, field: keyof SignerInfo, value: string | number) => {
    setSigners((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }, []);

  // Document management
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs: DocumentInfo[] = Array.from(files).map((file) => ({
      id: generateId(),
      name: file.name,
      size: file.size,
      file,
    }));

    setDocuments((prev) => [...prev, ...newDocs]);

    // Reset input
    e.target.value = "";
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Form validation
  const isValid = useCallback(() => {
    if (documents.length === 0) return false;
    if (signers.length === 0) return false;

    return signers.every(
      (s) =>
        s.email.trim() !== "" &&
        s.name.trim() !== "" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)
    );
  }, [documents, signers]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!isValid()) {
      onError?.("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert documents to base64
      const documentsPayload = await Promise.all(
        documents.map(async (doc) => {
          if (!doc.file) throw new Error(`Fichier manquant: ${doc.name}`);

          const arrayBuffer = await doc.file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );

          return {
            document_id: doc.id,
            name: doc.name,
            content_base64: base64,
            extension: doc.name.split(".").pop() || "pdf",
          };
        })
      );

      // Build request payload
      const payload = {
        case_id: caseId,
        tender_reference: tenderReference,
        documents: documentsPayload,
        signers: signers.map((s) => ({
          email: s.email,
          name: s.name,
          role: s.role,
          routing_order: s.routingOrder,
        })),
        email_subject: emailSubject,
        email_message: emailMessage,
        send_immediately: sendImmediately,
      };

      // Send request
      const response = await fetch("/api/signatures/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erreur lors de la creation de la demande de signature");
      }

      const result = await response.json();

      onSuccess?.(result.envelope_id);
      setIsOpen(false);

      // Reset form
      setSigners([{ id: "1", email: "", name: "", role: "Directeur", routingOrder: 1 }]);
      setDocuments([]);
    } catch (error) {
      console.error("Signature request error:", error);
      onError?.(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isValid,
    documents,
    signers,
    emailSubject,
    emailMessage,
    sendImmediately,
    caseId,
    tenderReference,
    onSuccess,
    onError,
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={cn("gap-2", className)}>
          <FileSignature className="h-4 w-4" />
          Demander une signature
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Nouvelle demande de signature
          </DialogTitle>
          <DialogDescription>
            Envoyez des documents pour signature electronique via DocuSign.
            {tenderReference && (
              <span className="mt-1 block text-xs">
                Reference: <strong>{tenderReference}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Documents Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents ({documents.length})
              </Label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-3 w-3" />
                  Ajouter
                </Button>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                <span className="text-sm">Aucun document selectionne</span>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <DocumentRow key={doc.id} document={doc} onRemove={removeDocument} />
                ))}
              </div>
            )}
          </div>

          {/* Signers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Signataires ({signers.length})
              </Label>
              <Button variant="outline" size="sm" className="gap-1" onClick={addSigner}>
                <Plus className="h-3 w-3" />
                Ajouter
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Les signataires recevront le document dans l'ordre indique.
            </p>

            <div className="space-y-2">
              {signers.map((signer, index) => (
                <SignerRow
                  key={signer.id}
                  signer={signer}
                  index={index}
                  onUpdate={updateSigner}
                  onRemove={removeSigner}
                  canRemove={signers.length > 1}
                />
              ))}
            </div>
          </div>

          {/* Email Configuration */}
          <div className="space-y-3">
            <Label>Configuration de l'email</Label>

            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Sujet</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Signature requise - ..."
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Message</Label>
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Message pour les signataires..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid() || isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Envoyer pour signature
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// === Signature Status Component ===

interface SignatureStatusCardProps {
  envelopeId: string;
  onDownload?: (envelopeId: string) => void;
  onResend?: (envelopeId: string) => void;
  onVoid?: (envelopeId: string) => void;
  className?: string;
}

export function SignatureStatusCard({
  envelopeId,
  onDownload,
  onResend,
  onVoid,
  className,
}: SignatureStatusCardProps) {
  const [status, setStatus] = useState<SignatureStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/signatures/${envelopeId}/status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la recuperation du statut");
      }

      const data = await response.json();
      setStatus({
        envelopeId: data.envelope_id,
        status: data.status,
        createdAt: data.created_at,
        sentAt: data.sent_at,
        completedAt: data.completed_at,
        voidedAt: data.voided_at,
        voidReason: data.void_reason,
        signers: data.signers || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, [envelopeId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const getProgress = () => {
    if (!status) return 0;
    const completedSigners = status.signers.filter(
      (s) => s.status === "completed" || s.status === "signed"
    ).length;
    return Math.round((completedSigners / status.signers.length) * 100);
  };

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-4 w-32 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            Erreur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchStatus}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Reessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSignature className="h-4 w-4" />
            Signature electronique
          </CardTitle>
          <StatusBadge status={status.status} />
        </div>
        <CardDescription className="text-xs">
          ID: {status.envelopeId.substring(0, 8)}...
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        {status.status !== "completed" && status.status !== "voided" && status.status !== "declined" && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progression</span>
              <span>{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        )}

        {/* Signers Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Signataire</TableHead>
                <TableHead className="text-xs">Statut</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status.signers.map((signer, idx) => (
                <TableRow key={idx}>
                  <TableCell className="py-2">
                    <div>
                      <p className="text-sm font-medium">{signer.name}</p>
                      <p className="text-xs text-muted-foreground">{signer.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <StatusBadge status={signer.status} />
                  </TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground">
                    {signer.signedAt
                      ? new Date(signer.signedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => fetchStatus()}
          >
            <RefreshCw className="h-3 w-3" />
            Actualiser
          </Button>

          {status.status === "completed" && onDownload && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => onDownload(envelopeId)}
            >
              <Download className="h-3 w-3" />
              Telecharger
            </Button>
          )}

          {(status.status === "sent" || status.status === "delivered") && (
            <>
              {onResend && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => onResend(envelopeId)}
                >
                  <Mail className="h-3 w-3" />
                  Renvoyer
                </Button>
              )}
              {onVoid && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => onVoid(envelopeId)}
                >
                  <XCircle className="h-3 w-3" />
                  Annuler
                </Button>
              )}
            </>
          )}
        </div>

        {/* Void reason if voided */}
        {status.status === "voided" && status.voidReason && (
          <div className="rounded-lg border border-muted bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Raison de l'annulation:</p>
            <p className="text-sm">{status.voidReason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// === Embedded Signing Component ===

interface EmbeddedSigningProps {
  envelopeId: string;
  signerEmail: string;
  signerName: string;
  returnUrl: string;
  onComplete?: () => void;
  onDecline?: () => void;
  className?: string;
}

export function EmbeddedSigning({
  envelopeId,
  signerEmail,
  signerName,
  returnUrl,
  onComplete,
  onDecline,
  className,
}: EmbeddedSigningProps) {
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSigningUrl = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/signatures/${envelopeId}/embedded-signing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          signer_email: signerEmail,
          signer_name: signerName,
          return_url: returnUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la generation du lien de signature");
      }

      const data = await response.json();
      setSigningUrl(data.signing_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, [envelopeId, signerEmail, signerName, returnUrl]);

  const handleOpenSigning = () => {
    if (signingUrl) {
      window.open(signingUrl, "_blank");
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="h-4 w-4" />
          Signer maintenant
        </CardTitle>
        <CardDescription>
          Signez les documents directement depuis cette page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {!signingUrl ? (
            <Button onClick={fetchSigningUrl} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4" />
                  Generer le lien de signature
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleOpenSigning} className="gap-2">
              <Eye className="h-4 w-4" />
              Ouvrir pour signer
            </Button>
          )}
        </div>

        {signingUrl && (
          <p className="text-xs text-muted-foreground">
            Le lien est valide pendant 5 minutes. Une nouvelle fenetre s'ouvrira pour la signature.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default SignatureRequest;
