"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useWorkflow, useWorkflowHistory, useRequirements, useUpdateRequirements } from "@/hooks/use-workflows";
import {
  useTender,
  useTenderDocuments,
  useDownloadDocument,
  useTenderComplianceResults,
} from "@/hooks/use-tenders";
import { useHITLCheckpoint, useSubmitDecision } from "@/hooks/use-hitl";
import { useAssistantWebSocket } from "@/hooks/use-assistant-websocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  Pencil,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  Sparkles,
  Building2,
  Calendar,
  Euro,
  Target,
  Wifi,
  WifiOff,
  DownloadCloud,
  Calculator,
  FileCheck,
  TrendingUp,
  History,
  Terminal,
  Filter,
  Package,
  ClipboardList,
} from "lucide-react";
import { cn, formatCurrency, formatDate, formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";
import type { WorkflowState, TenderDocument, HITLCheckpointInfo } from "@/types";

/**
 * Extended workflow state with extra fields returned by the API
 * that are not yet in the base WorkflowState type.
 */
interface ExtendedWorkflowState extends WorkflowState {
  tender_title?: string;
  tender_reference?: string;
  requirements_count?: number;
  matching_rate?: number;
  risk_score?: number;
  // risk_decision already defined in WorkflowState as RiskDecision
  compliance_score?: number;
  generated_documents?: Record<string, unknown>[];
  awaiting_human?: boolean;
  pending_checkpoint?: string;
  hitl_checkpoints?: Array<{ checkpoint: string; status: string; [key: string]: unknown }>;
}

/** Shape of a phase history entry from the workflow history API. */
interface PhaseHistoryEntry {
  phase: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  agent_name?: string;
  result?: Record<string, unknown>;
}

/** Shape of the workflow history response. */
interface WorkflowHistoryData {
  phases?: PhaseHistoryEntry[];
  events?: Array<{ type: string; message: string; timestamp: string; [key: string]: unknown }>;
}

/** Shape of a compliance check result. */
interface ComplianceCheck {
  check_id?: string;
  name: string;
  passed: boolean;
  details?: string;
}

/** Shape of the compliance results from the API. */
interface ComplianceResults {
  compliance_score?: number;
  checks?: ComplianceCheck[];
}

/** Shape of requirement entries. */
interface RequirementEntry {
  description?: string;
  text?: string;
  type?: string;
  mandatory?: boolean;
  required?: boolean;
  status?: string;
  met?: boolean;
  unmet?: boolean;
  [key: string]: unknown;
}

const PHASES = [
  { id: "INGESTION", label: "Ingestion" },
  { id: "EXTRACTION", label: "Extraction" },
  { id: "MATCHING", label: "Matching" },
  { id: "RISK_ANALYSIS", label: "Analyse Risque" },
  { id: "STRATEGY", label: "Strategie" },
  { id: "CALCULATION", label: "Calcul" },
  { id: "GENERATION", label: "Generation" },
  { id: "VALIDATION", label: "Validation" },
  { id: "PACKAGING", label: "Packaging" },
];

const CHECKPOINT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  go_nogo: { label: "Go/No-Go", icon: Target, color: "text-purple-600", bgColor: "bg-purple-100" },
  strategy_review: { label: "Validation Strategie", icon: TrendingUp, color: "text-orange-600", bgColor: "bg-orange-100" },
  price_review: { label: "Validation Prix", icon: Calculator, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  tech_review: { label: "Revision Technique", icon: FileCheck, color: "text-teal-600", bgColor: "bg-teal-100" },
};

function getPhaseLabel(phase: string): string {
  const EXTRA_LABELS: Record<string, string> = {
    CREATED: "Cree",
    COMPLETED: "Termine",
    ERROR: "Erreur",
    REJECTED: "Rejete",
  };
  const up = (phase || "").toUpperCase();
  if (EXTRA_LABELS[up]) return EXTRA_LABELS[up];
  return PHASES.find((p) => p.id === up)?.label || phase;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    running: {
      label: "En cours",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    completed: {
      label: "Termine",
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    waiting_hitl: {
      label: "Attente decision",
      className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      icon: <Clock className="h-3 w-3" />,
    },
    failed: {
      label: "Echoue",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      icon: <XCircle className="h-3 w-3" />,
    },
    paused: {
      label: "En pause",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      icon: <Clock className="h-3 w-3" />,
    },
  };
  const s = (status || "").toLowerCase();
  const c = config[s] || { label: status, className: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", icon: null };
  return (
    <Badge className={cn("gap-1", c.className)}>
      {c.icon}
      {c.label}
    </Badge>
  );
}

// Chat suggestions for the AI assistant
const CHAT_SUGGESTIONS = [
  "Resume les exigences principales du DCE",
  "Ameliore l'introduction du memoire technique",
  "Quels sont les points forts de notre reponse ?",
  "Verifie la conformite de notre reponse",
];

// ──────────────────────────────────────────
// ExecutionSummary: 4 KPI chips above tabs
// ──────────────────────────────────────────
function ExecutionSummary({ workflow }: { workflow: ExtendedWorkflowState }) {
  const rateRaw = workflow.matching_rate;
  const rateDisplay = rateRaw != null ? `${Math.round(rateRaw <= 1 ? rateRaw * 100 : rateRaw)}%` : "—";
  const riskDecision = (workflow.risk_decision || "").toUpperCase();
  const riskColor =
    riskDecision === "GO"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : riskDecision === "NO_GO"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-amber-50 border-amber-200 text-amber-700";

  const items = [
    {
      emoji: "📋",
      label: `${workflow.requirements_count} exigences`,
      colorClass: "bg-violet-50 border-violet-200 text-violet-700",
      show: workflow.requirements_count != null,
    },
    {
      emoji: "🎯",
      label: `Matching ${rateDisplay}`,
      colorClass: "bg-blue-50 border-blue-200 text-blue-700",
      show: rateRaw != null,
    },
    {
      emoji: riskDecision === "NO_GO" ? "🚫" : "⚠️",
      label: `Risque ${workflow.risk_score ?? "—"}/100${riskDecision ? ` — ${riskDecision}` : ""}`,
      colorClass: riskColor,
      show: workflow.risk_score != null,
    },
    {
      emoji: "✅",
      label: `Conformite ${workflow.compliance_score ?? "—"}%`,
      colorClass:
        (workflow.compliance_score ?? 0) >= 90
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : (workflow.compliance_score ?? 0) >= 70
          ? "bg-amber-50 border-amber-200 text-amber-700"
          : "bg-rose-50 border-rose-200 text-rose-700",
      show: workflow.compliance_score != null,
    },
  ].filter((i) => i.show);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className={cn(
            "flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border font-medium",
            item.colorClass
          )}
        >
          <span>{item.emoji}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────
// PhaseResultCard: phase-specific content
// ──────────────────────────────────────────
function PhaseResultCard({
  phase,
  result,
  workflow,
}: {
  phase: string;
  result: Record<string, unknown> | undefined;
  workflow: ExtendedWorkflowState;
}) {
  const r: Record<string, unknown> = result || {};
  const renderEmpty = (msg: string) => (
    <p className="text-sm text-muted-foreground italic py-1">{msg}</p>
  );

  switch (phase) {
    case "INGESTION": {
      const files = (r.files_processed || r.documents || r.ingested_files || []) as Array<string | Record<string, unknown>>;
      const fileCount = (r.file_count ?? files.length) as number;
      const pageCount = r.total_pages as number | undefined;
      return (
        <div className="space-y-2 pt-1">
          {fileCount > 0 ? (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{fileCount} fichier(s) traite(s)</span>
              {pageCount != null && <span className="text-muted-foreground">&middot; {pageCount} pages</span>}
            </div>
          ) : null}
          {files.length > 0 && (
            <div className="space-y-1">
              {files.slice(0, 5).map((f, i: number) => {
                const fObj = typeof f === "string" ? null : f;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span className="truncate">
                      {typeof f === "string" ? f : (fObj?.name as string) || (fObj?.filename as string) || JSON.stringify(f)}
                    </span>
                    {fObj?.pages != null && <span className="shrink-0 text-muted-foreground/60">({String(fObj.pages)}p)</span>}
                  </div>
                );
              })}
            </div>
          )}
          {files.length === 0 && fileCount === 0 && renderEmpty("Documents DCE ingeres")}
        </div>
      );
    }

    case "EXTRACTION": {
      const count = (r.requirements_count ?? r.extracted_count ?? workflow.requirements_count) as number | undefined;
      const byType = (r.requirements_by_type || r.by_type || {}) as Record<string, number>;
      const examples = (r.requirements_examples || r.sample_requirements || []) as Array<string | Record<string, unknown>>;
      return (
        <div className="space-y-3 pt-1">
          {count != null && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">{count}</span>
              <span className="text-sm text-muted-foreground">exigences extraites</span>
            </div>
          )}
          {Object.keys(byType).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(byType).map(([type, cnt]) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type}: {String(cnt)}
                </Badge>
              ))}
            </div>
          )}
          {examples.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Exemples :</p>
              {examples.slice(0, 3).map((ex, i: number) => (
                <p key={i} className="text-xs text-muted-foreground truncate">
                  &middot; {typeof ex === "string" ? ex : (ex as Record<string, unknown>).description as string || (ex as Record<string, unknown>).text as string || JSON.stringify(ex)}
                </p>
              ))}
            </div>
          )}
          {count == null && Object.keys(byType).length === 0 && renderEmpty("Exigences extraites du DCE")}
        </div>
      );
    }

    case "MATCHING": {
      const rate = (r.matching_rate ?? workflow.matching_rate) as number | undefined;
      const matched = r.matched_count as number | undefined;
      const unmatched = r.unmatched_count as number | undefined;
      const total = r.total_requirements as number | undefined;
      const rateDisplay = rate != null ? Math.round(rate <= 1 ? rate * 100 : rate) : null;
      return (
        <div className="space-y-3 pt-1">
          {rateDisplay != null && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taux de matching</span>
                <span className="font-medium">{rateDisplay}%</span>
              </div>
              <Progress value={rateDisplay} className="h-2" />
            </div>
          )}
          {(matched != null || unmatched != null) && (
            <div className="flex gap-4 text-sm">
              {matched != null && <span className="text-emerald-600">✓ {String(matched)} matchees</span>}
              {unmatched != null && <span className="text-amber-600">⚠ {String(unmatched)} non-matchees</span>}
              {total != null && <span className="text-muted-foreground">/ {String(total)} total</span>}
            </div>
          )}
          {rate == null && matched == null && renderEmpty("Matching produits/exigences effectue")}
        </div>
      );
    }

    case "RISK_ANALYSIS": {
      const score = (r.risk_score ?? workflow.risk_score) as number | undefined;
      const decision = (String(r.risk_decision ?? workflow.risk_decision ?? "")).toUpperCase();
      const factors = (r.risk_factors || r.top_risks || []) as Array<string | Record<string, unknown>>;
      const decisionColor =
        decision === "GO"
          ? "bg-emerald-100 text-emerald-700"
          : decision === "NO_GO"
          ? "bg-red-100 text-red-700"
          : "bg-amber-100 text-amber-700";
      return (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3 flex-wrap">
            {decision && (
              <Badge className={cn("font-bold", decisionColor)}>{decision}</Badge>
            )}
            {score != null && (
              <span className="text-sm text-muted-foreground">
                Score :{" "}
                <span className={cn("font-medium", score > 60 ? "text-red-600" : score > 30 ? "text-amber-600" : "text-emerald-600")}>
                  {score}/100
                </span>
              </span>
            )}
          </div>
          {factors.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Facteurs de risque :</p>
              {factors.slice(0, 3).map((f, i: number) => {
                const fObj = typeof f === "string" ? null : f;
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">
                      {typeof f === "string" ? f : (fObj?.description as string) || (fObj?.type as string) || JSON.stringify(f)}
                      {fObj?.severity != null && <span className="ml-1 font-medium">({String(fObj.severity)})</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {score == null && !decision && renderEmpty("Analyse de risque effectuee")}
        </div>
      );
    }

    case "STRATEGY": {
      const themes = (r.win_themes || r.themes || []) as Array<string | Record<string, unknown>>;
      const confidence = (r.confidence_score ?? r.strategy_confidence) as number | undefined;
      const positioning = r.competitive_positioning || r.positioning;
      return (
        <div className="space-y-3 pt-1">
          {themes.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1.5">Win themes :</p>
              <div className="flex flex-wrap gap-1.5">
                {themes.slice(0, 6).map((t, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {typeof t === "string" ? t : (t as Record<string, unknown>).theme as string || (t as Record<string, unknown>).name as string || JSON.stringify(t)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {confidence != null && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Confiance strategique :</span>
              <span className="font-medium">
                {Math.round(confidence <= 1 ? confidence * 100 : confidence)}%
              </span>
            </div>
          )}
          {positioning != null && (
            <p className="text-xs text-muted-foreground truncate">
              {typeof positioning === "string" ? positioning : JSON.stringify(positioning)}
            </p>
          )}
          {themes.length === 0 && confidence == null && renderEmpty("Strategie de reponse elaboree")}
        </div>
      );
    }

    case "CALCULATION": {
      const totalHT = (r.total_ht ?? r.total_amount ?? r.price_total) as number | undefined;
      const margin = (r.margin_rate ?? r.margin_percent ?? r.marge) as number | undefined;
      const indices = (r.revision_indices || r.indices_used || []) as Array<string | Record<string, unknown>>;
      return (
        <div className="space-y-2 pt-1">
          {totalHT != null && (
            <div className="flex items-center gap-2 text-sm">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total HT :</span>
              <span className="font-medium">{formatCurrency(totalHT)}</span>
            </div>
          )}
          {margin != null && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Marge :</span>
              <span className="font-medium">
                {margin <= 1 ? `${Math.round(margin * 100)}%` : `${margin}%`}
              </span>
            </div>
          )}
          {indices.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-xs text-muted-foreground mr-1">Indices :</span>
              {indices.map((idx, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {typeof idx === "string" ? idx : (idx as Record<string, unknown>).name as string || JSON.stringify(idx)}
                </Badge>
              ))}
            </div>
          )}
          {totalHT == null && margin == null && renderEmpty("Calcul du prix effectue")}
        </div>
      );
    }

    case "GENERATION": {
      const docs = (workflow.generated_documents || r.generated_documents || r.documents || []) as Array<string | Record<string, unknown>>;
      return (
        <div className="space-y-2 pt-1">
          {docs.length > 0 ? (
            <div className="space-y-1.5">
              {docs.map((doc, i: number) => {
                const docObj = typeof doc === "string" ? null : doc;
                const name =
                  typeof doc === "string"
                    ? doc
                    : (docObj?.name as string) || (docObj?.filename as string) || (docObj?.type as string) || JSON.stringify(doc);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-muted-foreground truncate">{name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            renderEmpty("Documents de reponse generes")
          )}
        </div>
      );
    }

    case "VALIDATION": {
      const score = (r.compliance_score ?? workflow.compliance_score) as number | undefined;
      const validationStatus = (r.validation_status || r.status) as string | undefined;
      const issues = (r.issues || r.top_issues || r.failed_checks || []) as Array<string | Record<string, unknown>>;
      return (
        <div className="space-y-3 pt-1">
          {score != null && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Score de conformite</span>
                <span
                  className={cn(
                    "font-medium",
                    score >= 90
                      ? "text-emerald-600"
                      : score >= 70
                      ? "text-amber-600"
                      : "text-red-600"
                  )}
                >
                  {score}%
                </span>
              </div>
              <Progress value={score} className="h-2" />
            </div>
          )}
          {validationStatus && (
            <Badge variant="secondary" className="text-xs">{validationStatus}</Badge>
          )}
          {issues.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Problemes detectes :</p>
              {issues.slice(0, 3).map((issue, i: number) => {
                const issueObj = typeof issue === "string" ? null : issue;
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">
                      {typeof issue === "string"
                        ? issue
                        : (issueObj?.message as string) || (issueObj?.description as string) || JSON.stringify(issue)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {score == null && !validationStatus && renderEmpty("Validation de la conformite effectuee")}
        </div>
      );
    }

    case "PACKAGING": {
      const fileCount = (r.file_count ?? r.total_files) as number | undefined;
      const size = (r.package_size ?? r.total_size) as number | undefined;
      return (
        <div className="space-y-2 pt-1">
          {fileCount != null && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{fileCount} fichier(s) package(s)</span>
            </div>
          )}
          {size != null && (
            <div className="text-sm text-muted-foreground">
              Taille :{" "}
              {size > 1024 * 1024
                ? `${(size / 1024 / 1024).toFixed(1)} MB`
                : `${(size / 1024).toFixed(0)} KB`}
            </div>
          )}
          {fileCount == null && size == null && renderEmpty("Packaging final effectue")}
        </div>
      );
    }

    default:
      return renderEmpty("Phase executee");
  }
}

export default function ProjectDetailPage() {
  const params = useParams();
  const caseId = params.id as string;
  const router = useRouter();

  // Data hooks
  const { data: rawWorkflow, isLoading: isLoadingWf, error: wfError } = useWorkflow(caseId);
  const workflow = rawWorkflow as ExtendedWorkflowState | undefined;
  const { data: history } = useWorkflowHistory(caseId) as { data: WorkflowHistoryData | undefined };
  const tenderId = workflow?.tender_id;
  const { data: tender } = useTender(tenderId || "");
  const { data: documents, refetch: refetchDocuments } = useTenderDocuments(tenderId || "");
  const { data: complianceResults } = useTenderComplianceResults(tenderId || "") as { data: ComplianceResults | undefined };
  const downloadDocument = useDownloadDocument();

  // HITL
  const pendingCheckpoint = workflow?.pending_checkpoint ||
    workflow?.hitl_checkpoints?.find((cp) => cp.status !== "resolved")?.checkpoint;
  const { data: hitlContext } = useHITLCheckpoint(caseId, pendingCheckpoint || "");
  const submitDecision = useSubmitDecision();
  const [editedContent, setEditedContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Requirements
  const { data: requirementsData } = useRequirements(caseId);
  const updateRequirementsMutation = useUpdateRequirements();
  const [isEditingRequirements, setIsEditingRequirements] = useState(false);
  const [editedRequirements, setEditedRequirements] = useState<RequirementEntry[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<"documents" | "chat" | "history" | "logs" | "requirements">("documents");
  const [showCompliance, setShowCompliance] = useState(false);
  const [openPhase, setOpenPhase] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<"all" | "info" | "warning" | "error">("all");
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Chat IA - WebSocket
  const getToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  }, []);

  const isRealWorkflow = !!workflow;

  const wsOptions = isRealWorkflow
    ? { caseId, getToken, onError: (err: string) => console.warn("[Chat]", err) }
    : { caseId: "", getToken, onError: () => {} };

  const {
    isConnected: wsConnected,
    messages,
    isTyping,
    sendMessage,
    conversationId,
  } = useAssistantWebSocket(wsOptions);

  const isConnected = isRealWorkflow && wsConnected;

  // Auto-refresh documents during processing
  useEffect(() => {
    if (workflow?.awaiting_human || (workflow?.current_phase || "").toLowerCase() === "running") {
      const interval = setInterval(() => refetchDocuments(), 5000);
      return () => clearInterval(interval);
    }
  }, [workflow?.awaiting_human, workflow?.current_phase, refetchDocuments]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Set default edited content from AI recommendation
  useEffect(() => {
    if (hitlContext?.ai_recommendation && !editedContent) {
      const rec = hitlContext.ai_recommendation;
      setEditedContent(typeof rec === "string" ? rec : rec.reasoning || "");
    }
  }, [hitlContext?.ai_recommendation]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendChat = async () => {
    if (!chatInput.trim() || !conversationId) return;
    const msg = chatInput;
    setChatInput("");
    try {
      await sendMessage(msg, { case_id: caseId });
    } catch (err) {
      console.error("[ChatIA] sendMessage failed:", err);
      toast.error("Erreur du chat IA");
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      await downloadDocument.mutateAsync({ tenderId: tenderId!, filename });
      toast.success("Telecharge");
    } catch (err) {
      console.error("[Download] single document failed:", err);
      toast.error("Erreur de telechargement");
    }
  };

  const handleDownloadAll = async () => {
    const docs = tenderDocuments || [];
    let failed = 0;
    for (const doc of docs) {
      try {
        await downloadDocument.mutateAsync({ tenderId: tenderId!, filename: doc.name });
      } catch (err) {
        failed++;
        console.error("[Download] batch item failed:", doc.name, err);
      }
    }
    if (failed > 0) {
      toast.error(`${failed}/${docs.length} document(s) en erreur`);
    } else {
      toast.success(`${docs.length} document(s) telecharge(s)`);
    }
  };

  const handleDecision = async (decisionAction: "APPROVE" | "REJECT") => {
    if (!pendingCheckpoint) return;
    setIsSubmitting(true);
    try {
      await submitDecision.mutateAsync({
        caseId,
        checkpoint: pendingCheckpoint,
        decision: {
          action: decisionAction,
          comments: editedContent || undefined,
          data: decisionAction === "APPROVE" && editedContent
            ? { modified_content: editedContent }
            : undefined,
        },
      });
      toast.success(decisionAction === "APPROVE" ? "Decision approuvee" : "Decision rejetee");
      setEditedContent("");
    } catch (err) {
      console.error("[HITL] decision submit failed:", err);
      toast.error("Erreur lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading
  if (isLoadingWf) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Error
  if (wfError || !workflow) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Projet non trouve</h2>
        <p className="text-muted-foreground mt-1">
          Ce dossier n&apos;existe pas ou a ete supprime.
        </p>
        <Button asChild className="mt-4">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Link>
        </Button>
      </div>
    );
  }

  const wfStatus = (workflow.status || workflow.current_phase || "").toLowerCase();
  const isRunning = wfStatus === "running";
  const isCompleted = wfStatus === "completed";
  const isFailed = wfStatus === "failed";
  const isWaitingHitl = !!(workflow?.awaiting_human) && !!workflow?.pending_checkpoint;
  const tenderDocuments = (documents || []).filter(
    (d) => !d.name?.endsWith(".bak")
  );
  const editableExts = [".docx", ".txt", ".md", ".json"];

  const HITL_PHASE_IDX: Record<string, number> = {
    "HITL_GO_NOGO": 3,
    "HITL_STRATEGY_REVIEW": 4,
    "HITL_PRICE_REVIEW": 5,
    "HITL_TECH_REVIEW": 7,
  };
  const rawPhase = (workflow?.current_phase || "").toUpperCase();
  const directIdx = PHASES.findIndex((p) => p.id === rawPhase);
  const currentPhaseIdx = directIdx !== -1 ? directIdx : (HITL_PHASE_IDX[rawPhase] ?? -1);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/projects" className="hover:text-foreground transition-colors">
                Projets
              </Link>
              <span>/</span>
              <span className="truncate max-w-[300px]">
                {tender?.title?.slice(0, 40) ||
                  workflow.tender_title?.slice(0, 40) ||
                  caseId.slice(0, 8)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {tender?.title ||
                  workflow.tender_title ||
                  workflow.tender_reference ||
                  `Projet ${caseId.slice(0, 8)}`}
              </h1>
              <StatusBadge status={workflow.status} />
            </div>
            {tender && (
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                {tender.client && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {tender.client}
                  </span>
                )}
                {tender.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(tender.deadline)}
                  </span>
                )}
                {tender.budget && (
                  <span className="flex items-center gap-1">
                    <Euro className="h-3.5 w-3.5" />
                    {formatCurrency(tender.budget)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {tenderId && (
          <Button variant="outline" asChild>
            <Link href={`/opportunities/${tenderId}`}>
              <FileText className="h-4 w-4 mr-2" />
              Voir l&apos;AO
            </Link>
          </Button>
        )}
      </div>

      {/* Phase Timeline - Horizontal chips */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-1 flex-wrap">
            {PHASES.map((phase, idx) => {
              const isDone = isCompleted || currentPhaseIdx > idx ||
                history?.phases?.find((h) => h.phase === phase.id)?.status === "completed";
              const isCurrent = workflow.current_phase === phase.id && !isCompleted;
              return (
                <div
                  key={phase.id}
                  className={cn(
                    "flex items-center gap-1 text-xs rounded-full px-2 py-0.5",
                    isDone ? "bg-emerald-100 text-emerald-700" :
                    isCurrent ? "bg-indigo-100 text-indigo-700 font-medium" :
                    "bg-zinc-100 text-zinc-400"
                  )}
                >
                  {isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />}
                  {phase.label}
                </div>
              );
            })}
          </div>
          {isRunning && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Traitement en cours...
            </p>
          )}
          {isFailed && (workflow.errors?.length ?? 0) > 0 && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {workflow.errors?.[0]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Execution Summary KPIs */}
      <ExecutionSummary workflow={workflow} />

      {/* HITL Decision Panel */}
      {isWaitingHitl && pendingCheckpoint && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Decision requise — {CHECKPOINT_CONFIG[pendingCheckpoint]?.label || pendingCheckpoint}
              </CardTitle>
              <Badge className="bg-amber-100 text-amber-800">
                Confiance IA: {hitlContext?.context?.confidence_level != null ? `${Math.round(hitlContext.context.confidence_level)}%` : "—"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left column: AI context (read-only) */}
              <div className="rounded-lg bg-violet-50 border border-violet-200 p-4 relative">
                <span className="absolute top-2 right-2 text-[10px] font-medium bg-violet-200 text-violet-700 rounded px-1.5 py-0.5">IA</span>
                <h4 className="text-sm font-medium text-violet-900 mb-2">Analyse IA</h4>
                <div className="text-sm text-violet-800 space-y-2">
                  {pendingCheckpoint === "go_nogo" && hitlContext?.context?.risk_decision && (
                    <p>{`Risque ${hitlContext.context.risk_decision} · Score ${hitlContext.context.risk_score ?? "?"}/100 · Matching ${Math.round(hitlContext.context.matching_rate ?? 0)}%`}</p>
                  )}
                  {pendingCheckpoint === "strategy_review" && Array.isArray(hitlContext?.context?.win_themes) && (
                    <p>{hitlContext.context.win_themes.length} win themes identifiés</p>
                  )}
                  {pendingCheckpoint === "price_review" && hitlContext?.context?.total_ht != null && (
                    <p>{`Total HT: ${formatCurrency(hitlContext.context.total_ht)} · Marge: ${Math.round((hitlContext.context.margin_rate ?? 0) * 100)}%`}</p>
                  )}
                  {pendingCheckpoint === "tech_review" && hitlContext?.context?.requirements_count != null && (
                    <p>{`${hitlContext.context.requirements_count} exigences · Conformité: ${hitlContext.context.compliance_score ?? "?"}%`}</p>
                  )}
                  {hitlContext?.context?.risk_score != null && pendingCheckpoint !== "go_nogo" && (
                    <p><span className="font-medium">Score de risque:</span> {hitlContext.context.risk_score}/100</p>
                  )}
                  {hitlContext?.context?.budget_estimate != null && (
                    <p><span className="font-medium">Budget:</span> {formatCurrency(hitlContext.context.budget_estimate)}</p>
                  )}
                  {hitlContext?.ai_recommendation && (
                    <p><span className="font-medium">Recommandation:</span> {typeof hitlContext.ai_recommendation === "string" ? hitlContext.ai_recommendation : hitlContext.ai_recommendation.reasoning}</p>
                  )}
                  {!hitlContext?.context && !hitlContext?.ai_recommendation && (
                    <p className="text-violet-500 italic">Chargement du contexte IA...</p>
                  )}
                </div>
              </div>
              {/* Right column: editable zone */}
              <div className="space-y-3">
                <Textarea
                  defaultValue={hitlContext?.ai_recommendation?.reasoning || ""}
                  className="min-h-[120px] resize-none"
                  placeholder="Modifiez ou completez l'analyse..."
                  onChange={(e) => setEditedContent(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleDecision("APPROVE")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Approuver
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDecision("REJECT")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Rejeter
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { id: "documents" as const, label: "Documents", icon: FileText },
          { id: "chat" as const, label: "Assistant IA", icon: MessageSquare },
          { id: "history" as const, label: "Historique", icon: History },
          { id: "logs" as const, label: "Logs", icon: Terminal },
          { id: "requirements" as const, label: "Exigences", icon: ClipboardList },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Documents */}
      {activeTab === "documents" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents generes
                {tenderDocuments.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-600"
                  >
                    {tenderDocuments.length}
                  </Badge>
                )}
              </CardTitle>
              {tenderDocuments.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAll}
                  className="gap-2"
                >
                  <DownloadCloud className="h-4 w-4" />
                  Tout telecharger
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {tenderDocuments.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tenderDocuments.map((doc: any, index: number) => {
                  const isDocx =
                    doc.type === "docx" || doc.name?.endsWith(".docx");
                  const isJson =
                    doc.type === "json" || doc.name?.endsWith(".json");
                  const canEdit = editableExts.some((ext) =>
                    doc.name?.endsWith(ext)
                  );
                  const sizeStr = doc.size
                    ? doc.size > 1024 * 1024
                      ? (doc.size / 1024 / 1024).toFixed(1) + " MB"
                      : (doc.size / 1024).toFixed(0) + " KB"
                    : "";
                  const displayName = (doc.name || "")
                    .replace(/_upload-[a-f0-9]+/g, "")
                    .replace(/\.(docx|txt|md|json|xlsx|pdf)$/i, "")
                    .replace(/_/g, " ");

                  return (
                    <div
                      key={doc.name || index}
                      className={cn(
                        "flex flex-col rounded-xl border p-4 transition-colors hover:bg-muted/40",
                        isDocx
                          ? "bg-blue-500/5 border-blue-500/20"
                          : "bg-muted/20"
                      )}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            isDocx
                              ? "bg-blue-500/10"
                              : isJson
                              ? "bg-amber-500/10"
                              : "bg-muted"
                          )}
                        >
                          <FileText
                            className={cn(
                              "h-5 w-5",
                              isDocx
                                ? "text-blue-600"
                                : isJson
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate capitalize">
                            {displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.name?.split(".").pop()?.toUpperCase()} {sizeStr && `- ${sizeStr}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        {canEdit && (
                          <Button
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() =>
                              router.push(
                                `/projects/${caseId}/edit/${encodeURIComponent(doc.name)}`
                              )
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editer
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(!canEdit && "flex-1", "gap-1")}
                          onClick={() => handleDownload(doc.name)}
                          disabled={downloadDocument.isPending}
                        >
                          <Download className="h-3.5 w-3.5" />
                          {!canEdit && "Telecharger"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Aucun document genere</p>
                <p className="text-sm mt-1">
                  {isRunning
                    ? "Les documents apparaitront apres la phase de generation..."
                    : "Lancez le traitement pour generer les documents."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Chat IA */}
      {activeTab === "chat" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Assistant IA
              {isConnected ? (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 text-xs gap-1"
                >
                  <Wifi className="h-3 w-3" />
                  Connecte
                </Badge>
              ) : isRealWorkflow ? (
                <Badge
                  variant="secondary"
                  className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs gap-1"
                >
                  <WifiOff className="h-3 w-3" />
                  Connexion...
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Chat messages */}
            <div
              ref={chatScrollRef}
              className="min-h-[120px] max-h-[300px] overflow-y-auto mb-4 space-y-3 rounded-lg border bg-muted/20 p-4"
            >
              {messages.length === 0 && !isTyping && (
                <div className="text-center py-6">
                  <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Posez une question sur votre reponse ou demandez une amelioration.
                  </p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg text-sm max-w-[85%] whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-background border mr-auto"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  L&apos;IA redige sa reponse...
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {CHAT_SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setChatInput(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  isConnected
                    ? "Posez une question sur votre reponse..."
                    : isRealWorkflow
                    ? "Connexion en cours..."
                    : "Chat disponible apres traitement du DCE"
                }
                className="min-h-[44px] max-h-[100px] text-sm resize-none"
                disabled={!isConnected || !conversationId}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
              />
              <Button
                size="icon"
                className="shrink-0 h-[44px] w-[44px]"
                onClick={handleSendChat}
                disabled={
                  !chatInput.trim() || !isConnected || !conversationId || isTyping
                }
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: History — Accordion */}
      {activeTab === "history" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique du workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div>
              {PHASES.map((phase, index) => {
                const historyEntry = history?.phases?.find(
                  (h) => h.phase === phase.id
                );
                const isPhaseCompleted =
                  isCompleted || currentPhaseIdx > index || historyEntry?.status === "completed";
                const isCurrent = workflow.current_phase === phase.id && !isCompleted;
                const isOpen = openPhase === phase.id;
                const canExpand = isPhaseCompleted || isCurrent;

                return (
                  <div key={phase.id} className="border-b last:border-0">
                    {/* Accordion header */}
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 py-3 transition-colors rounded-lg",
                        canExpand
                          ? "hover:bg-muted/40 cursor-pointer"
                          : "cursor-default opacity-60"
                      )}
                      onClick={() => canExpand && setOpenPhase(isOpen ? null : phase.id)}
                      disabled={!canExpand}
                    >
                      {/* Status icon */}
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0",
                          isPhaseCompleted
                            ? "bg-green-100 border-green-500"
                            : isCurrent
                            ? "bg-blue-100 border-blue-500"
                            : "bg-muted border-muted-foreground/30"
                        )}
                      >
                        {isPhaseCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        ) : (
                          <span className="text-xs text-muted-foreground">{index + 1}</span>
                        )}
                      </div>

                      {/* Phase name + agent */}
                      <div className="flex-1 text-left min-w-0">
                        <span
                          className={cn(
                            "text-sm",
                            isPhaseCompleted || isCurrent ? "font-medium" : "text-muted-foreground"
                          )}
                        >
                          {phase.label}
                        </span>
                        {historyEntry?.agent_name && (
                          <span className="ml-2 text-xs text-muted-foreground/70">
                            ({historyEntry.agent_name})
                          </span>
                        )}
                      </div>

                      {/* Right side: time + duration + status badges + chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isCurrent && isRunning && (
                          <Badge className="text-xs bg-blue-100 text-blue-700">En cours</Badge>
                        )}
                        {historyEntry?.completed_at && (
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {formatRelativeDate(historyEntry.completed_at)}
                          </span>
                        )}
                        {historyEntry?.duration_ms && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                            {(historyEntry.duration_ms / 1000).toFixed(1)}s
                          </span>
                        )}
                        {canExpand && (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform duration-200",
                              isOpen && "rotate-180"
                            )}
                          />
                        )}
                      </div>
                    </button>

                    {/* Accordion content */}
                    {isOpen && (
                      <div className="pb-4 px-2 ml-11">
                        <div className="rounded-lg bg-muted/30 border px-4 py-3">
                          <PhaseResultCard
                            phase={phase.id}
                            result={historyEntry?.result}
                            workflow={workflow}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Logs — always visible, with level filter */}
      {activeTab === "logs" && (() => {
        // Build synthetic log entries from phase history + workflow errors
        const phaseEntries = (history?.phases || []).map((p) => ({
          level: (p.status === "failed" ? "error" : "info") as "error" | "info" | "warning",
          message: `Phase ${getPhaseLabel(p.phase)} ${
            p.status === "completed"
              ? "terminee"
              : p.status === "failed"
              ? "echouee"
              : p.status || "executee"
          }${p.duration_ms ? ` (${(p.duration_ms / 1000).toFixed(1)}s)` : ""}`,
          agent: p.agent_name || null,
          timestamp: p.completed_at || p.started_at || null,
        }));
        const errorEntries = (workflow.errors || []).map((err: string) => ({
          level: "error" as const,
          message: err,
          agent: null,
          timestamp: null,
        }));
        const allEntries = [...phaseEntries, ...errorEntries];

        const filtered = allEntries.filter((e) => {
          if (logFilter === "all") return true;
          return e.level === logFilter;
        });

        const levelColors: Record<string, string> = {
          info: "bg-blue-50 border-blue-100 text-blue-800",
          warning: "bg-amber-50 border-amber-100 text-amber-800",
          error: "bg-red-50 border-red-200 text-red-800",
        };
        const levelBadgeColors: Record<string, string> = {
          info: "bg-blue-100 text-blue-700",
          warning: "bg-amber-100 text-amber-700",
          error: "bg-red-100 text-red-700",
        };

        return (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Logs d&apos;execution
                  {allEntries.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{allEntries.length}</Badge>
                  )}
                </CardTitle>
                {/* Filter pills */}
                <div className="flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                  {(["all", "info", "warning", "error"] as const).map((level) => {
                    const count = level === "all"
                      ? allEntries.length
                      : allEntries.filter((e) => e.level === level).length;
                    return (
                      <button
                        key={level}
                        onClick={() => setLogFilter(level)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full border transition-colors",
                          logFilter === level
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                        )}
                      >
                        {level === "all" ? "Tous" : level.toUpperCase()}
                        {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length > 0 ? (
                <div className="space-y-1.5">
                  {filtered.map((entry, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3",
                        levelColors[entry.level] || "bg-muted border-border"
                      )}
                    >
                      {entry.level === "error" ? (
                        <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
                      ) : entry.level === "warning" ? (
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono">{entry.message}</p>
                        {(entry.agent || entry.timestamp) && (
                          <div className="flex items-center gap-2 mt-0.5 text-xs opacity-60">
                            {entry.agent && <span>{entry.agent}</span>}
                            {entry.agent && entry.timestamp && <span>·</span>}
                            {entry.timestamp && <span>{formatRelativeDate(entry.timestamp)}</span>}
                          </div>
                        )}
                      </div>
                      <Badge className={cn("text-xs shrink-0", levelBadgeColors[entry.level] || "")}>
                        {entry.level.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : allEntries.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Terminal className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Aucun log disponible</p>
                  <p className="text-sm mt-1">Les logs apparaitront apres execution du workflow.</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Aucune entree pour le filtre &ldquo;{logFilter.toUpperCase()}&rdquo;</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Tab: Exigences */}
      {activeTab === "requirements" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Exigences extraites
                {requirementsData?.count != null && (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                    {requirementsData.count}
                  </Badge>
                )}
              </CardTitle>
              {!isEditingRequirements ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditedRequirements(requirementsData?.requirements || []);
                    setIsEditingRequirements(true);
                  }}
                  disabled={!requirementsData?.requirements?.length}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingRequirements(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await updateRequirementsMutation.mutateAsync({ caseId, requirements: editedRequirements });
                        setIsEditingRequirements(false);
                        toast.success("Exigences sauvegardees");
                      } catch {
                        toast.error("Erreur lors de la sauvegarde");
                      }
                    }}
                    disabled={updateRequirementsMutation.isPending}
                  >
                    {updateRequirementsMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(requirementsData?.requirements || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left pb-2 font-medium w-[50%]">Description</th>
                      <th className="text-left pb-2 font-medium">Type</th>
                      <th className="text-center pb-2 font-medium">Obligatoire</th>
                      <th className="text-center pb-2 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditingRequirements ? editedRequirements : (requirementsData?.requirements || [])).map(
                      (req: any, idx: number) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-4">
                            {isEditingRequirements ? (
                              <input
                                className="w-full border rounded px-2 py-1 text-sm bg-background"
                                value={req.description || req.text || ""}
                                onChange={(e) => {
                                  const updated = [...editedRequirements];
                                  updated[idx] = { ...updated[idx], description: e.target.value };
                                  setEditedRequirements(updated);
                                }}
                              />
                            ) : (
                              <span>{req.description || req.text || "—"}</span>
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            <Badge variant="outline" className="text-xs">
                              {req.type || "OTHER"}
                            </Badge>
                          </td>
                          <td className="py-2 text-center">
                            {req.mandatory || req.required ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 text-center">
                            {req.status === "met" || req.met ? (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">Conforme</Badge>
                            ) : req.status === "unmet" || req.unmet ? (
                              <Badge className="bg-red-100 text-red-700 text-xs">Non conforme</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">En attente</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {workflow?.requirements_count
                    ? "Chargement des exigences..."
                    : "Aucune exigence extraite pour ce workflow"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conformite - Collapsible (always visible) */}
      {complianceResults && (
        <Card className="border-0 shadow-sm">
          <CardHeader
            className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
            onClick={() => setShowCompliance(!showCompliance)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Conformite
                {complianceResults.compliance_score != null && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-sm",
                      complianceResults.compliance_score >= 90
                        ? "bg-emerald-500/10 text-emerald-600"
                        : complianceResults.compliance_score >= 70
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-rose-500/10 text-rose-600"
                    )}
                  >
                    {complianceResults.compliance_score}%
                  </Badge>
                )}
              </CardTitle>
              {showCompliance ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {showCompliance && (
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">
                        Score de conformite
                      </span>
                      <span className="font-medium">
                        {complianceResults.compliance_score || 0}%
                      </span>
                    </div>
                    <Progress
                      value={complianceResults.compliance_score || 0}
                      className="h-2"
                    />
                  </div>
                </div>
                {(complianceResults.checks?.length ?? 0) > 0 && (
                  <div className="space-y-2 mt-4">
                    {complianceResults.checks?.map(
                      (check: any, index: number) => (
                        <div
                          key={check.check_id || index}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3",
                            check.passed
                              ? "bg-emerald-500/5 border-emerald-500/20"
                              : "bg-rose-500/5 border-rose-500/20"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {check.passed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-rose-600" />
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                {check.name}
                              </p>
                              {check.details && (
                                <p className="text-xs text-muted-foreground">
                                  {check.details}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              check.passed
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-rose-500/10 text-rose-600"
                            )}
                          >
                            {check.passed ? "Valide" : "Echoue"}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
