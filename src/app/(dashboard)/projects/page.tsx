"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkflows, useWorkflowStats } from "@/hooks/use-workflows";
import { useTenders } from "@/hooks/use-tenders";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  ArrowRight,
  Play,
  Pause,
  Plus,
  Loader2,
  FileText,
  Target,
  ChevronDown,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { WorkflowState } from "@/types";

/** Unified shape for workflow items displayed in the list (real workflow or derived from tender). */
interface WorkflowListItem {
  case_id: string;
  tender_id?: string;
  tender_reference?: string;
  tender_title?: string;
  current_phase: string;
  status: string;
  updated_at: string;
  [key: string]: unknown;
}

const PHASES = [
  "INGESTION",
  "EXTRACTION",
  "MATCHING",
  "RISK_ANALYSIS",
  "STRATEGY",
  "CALCULATION",
  "GENERATION",
  "VALIDATION",
  "PACKAGING",
  "COMPLETED",
];

function CompactStepper({ currentPhase, status }: { currentPhase: string; status: string }) {
  const currentIdx = PHASES.indexOf((currentPhase || "").toUpperCase());
  const isCompleted = (status || "").toLowerCase() === "completed";
  const isFailed = (status || "").toLowerCase() === "failed";

  return (
    <div className="flex items-center gap-0.5">
      {PHASES.map((phase, idx) => {
        const isDone = isCompleted || idx < currentIdx;
        const isCurrent = !isCompleted && idx === currentIdx;
        return (
          <div key={phase} className="flex items-center">
            <div
              title={phase.replace(/_/g, " ").toLowerCase()}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                isFailed && idx === currentIdx ? "bg-red-500" :
                isDone ? "bg-emerald-500" :
                isCurrent ? "bg-indigo-600 ring-2 ring-indigo-200" :
                "bg-zinc-200"
              )}
            />
            {idx < PHASES.length - 1 && <div className="h-px w-2 bg-zinc-200" />}
          </div>
        );
      })}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "waiting_hitl":
      return <Clock className="h-4 w-4 text-orange-600" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "paused":
      return <Pause className="h-4 w-4 text-amber-600" />;
    default:
      return <Play className="h-4 w-4 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    running: {
      label: "En cours",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    completed: {
      label: "Termine",
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    waiting_hitl: {
      label: "Attente decision",
      className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    },
    failed: {
      label: "Echoue",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    },
    paused: {
      label: "En pause",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    },
    cancelled: {
      label: "Annule",
      className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
  };
  const s = (status || "").toLowerCase();
  const c = config[s] || { label: status, className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
  return (
    <Badge className={cn("gap-1 font-medium", c.className)}>
      <StatusIcon status={s} />
      {c.label}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading,
  suffix,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  isLoading?: boolean;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-14 mt-1" />
            ) : (
              <p className="text-xl font-bold">
                {value}{suffix}
              </p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PHASE_LABELS: Record<string, string> = {
  INGESTION: "Ingestion",
  EXTRACTION: "Extraction",
  MATCHING: "Matching",
  RISK_ANALYSIS: "Analyse risque",
  STRATEGY: "Strategie",
  CALCULATION: "Calcul",
  GENERATION: "Generation",
  VALIDATION: "Validation",
  PACKAGING: "Packaging",
  COMPLETED: "Termine",
  ERROR: "Erreur",
  CREATED: "Cree",
};

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const {
    data: workflows,
    isLoading: isLoadingWf,
    refetch,
  } = useWorkflows({});
  const {
    data: processingTenders,
    isLoading: isLoadingTenders,
  } = useTenders({ status: "PROCESSING", limit: 50 });
  const { data: completedTenders } = useTenders({
    status: "COMPLETED",
    limit: 50,
  });
  const { data: stats, isLoading: isLoadingStats } = useWorkflowStats();

  // Merge tenders with workflows
  const tenderWorkflows = [
    ...(processingTenders || []),
    ...(completedTenders || []),
  ]
    .filter((t) => {
      const existingIds = new Set(
        (workflows || []).map((w: WorkflowState) => w.tender_id)
      );
      return !existingIds.has(t.id);
    })
    .map((t) => ({
      case_id: `case-${t.id}`,
      tender_id: t.id,
      tender_reference: t.reference,
      tender_title: t.title,
      current_phase: t.status === "COMPLETED" ? "COMPLETED" : "GENERATION",
      status: t.status === "COMPLETED" ? "completed" : "running",
      updated_at: t.deadline || new Date().toISOString(),
    }));

  const allWorkflows: WorkflowListItem[] = [
    ...(workflows || []).map((w) => ({
      ...w,
      case_id: w.case_id,
      tender_title: (w as unknown as Record<string, unknown>).tender_title as string | undefined
        || (w as unknown as Record<string, unknown>).reference as string | undefined
        || (w as unknown as Record<string, unknown>).tender_reference as string | undefined,
    })),
    ...tenderWorkflows,
  ];

  const isLoading = isLoadingWf && isLoadingTenders;

  const filteredWorkflows = allWorkflows.filter((wf) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      wf.case_id?.toLowerCase().includes(s) ||
      wf.tender_reference?.toLowerCase().includes(s) ||
      wf.tender_title?.toLowerCase().includes(s)
    );
  });

  // Separate active vs archived
  const activeWorkflows = filteredWorkflows.filter(
    (wf) => !["completed", "failed", "cancelled"].includes((wf.status || "").toLowerCase())
  );
  const archivedWorkflows = filteredWorkflows.filter(
    (wf) => ["completed", "failed", "cancelled"].includes((wf.status || "").toLowerCase())
  );

  // Taux de succes
  const completed = stats?.completed ?? 0;
  const failed = stats?.failed ?? 0;
  const successRate = completed + failed > 0
    ? Math.round((completed / (completed + failed)) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes Projets</h1>
          <p className="text-muted-foreground mt-1">
            Suivi des reponses aux appels d&apos;offres
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push("/opportunities")}
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
          <Button onClick={() => refetch()} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="En cours"
          value={(stats?.running ?? 0) + (processingTenders?.length ?? 0)}
          icon={Activity}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="En attente decision"
          value={stats?.waiting_hitl ?? 0}
          icon={Clock}
          color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Termines"
          value={(stats?.completed ?? 0) + (completedTenders?.length ?? 0)}
          icon={CheckCircle2}
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Taux de succes"
          value={successRate}
          suffix="%"
          icon={Target}
          color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          isLoading={isLoadingStats}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par titre ou reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Active Workflow Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeWorkflows.length === 0 && archivedWorkflows.length === 0 ? (
        <EmptyState
          illustration={search ? "no-results" : "no-workflows"}
          title={search ? "Aucun resultat" : "Aucun projet en cours"}
          description={
            search
              ? `Aucun resultat pour "${search}". Essayez avec d'autres termes.`
              : "Lancez votre premier workflow de reponse depuis la page Opportunites."
          }
          action={
            !search
              ? { label: "Voir les opportunites", onClick: () => router.push("/opportunities"), icon: FileText }
              : undefined
          }
        />
      ) : (
        <>
          {/* Active projects */}
          {activeWorkflows.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeWorkflows.map((workflow) => {
                const phaseLookup = (workflow.current_phase || "").toUpperCase();
                const phaseLabel = PHASE_LABELS[phaseLookup] || workflow.current_phase || "En cours";
                const title =
                  workflow.tender_title ||
                  workflow.tender_reference ||
                  `Projet ${workflow.case_id?.slice(0, 8)}`;

                return (
                  <Card
                    key={workflow.case_id}
                    className="cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => router.push(`/projects/${workflow.case_id}`)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1 mr-3">
                          <h3 className="font-semibold text-sm truncate">
                            {title}
                          </h3>
                          {workflow.tender_reference && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {workflow.tender_reference}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={workflow.status} />
                      </div>

                      {/* Compact Stepper */}
                      <div className="mb-3">
                        <CompactStepper
                          currentPhase={workflow.current_phase}
                          status={workflow.status}
                        />
                        <p className="text-xs text-zinc-500 mt-1">{phaseLabel}</p>
                      </div>

                      {/* HITL Alert Banner */}
                      {(workflow.status || "").toLowerCase() === "waiting_hitl" && (
                        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-xs font-medium text-amber-800">Action requise</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/projects/${workflow.case_id}`);
                            }}
                          >
                            Decider
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeDate(workflow.updated_at)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Voir
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Archived projects - collapsible */}
          {archivedWorkflows.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", showArchived && "rotate-180")} />
                Archives ({archivedWorkflows.length})
              </button>
              {showArchived && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {archivedWorkflows.map((workflow) => {
                    const phaseLookup = (workflow.current_phase || "").toUpperCase();
                    const phaseLabel = PHASE_LABELS[phaseLookup] || workflow.current_phase || "Termine";
                    const title =
                      workflow.tender_title ||
                      workflow.tender_reference ||
                      `Projet ${workflow.case_id?.slice(0, 8)}`;

                    return (
                      <Card
                        key={workflow.case_id}
                        className="cursor-pointer hover:shadow-md transition-shadow group opacity-75 hover:opacity-100"
                        onClick={() => router.push(`/projects/${workflow.case_id}`)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="min-w-0 flex-1 mr-3">
                              <h3 className="font-semibold text-sm truncate">
                                {title}
                              </h3>
                              {workflow.tender_reference && (
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                  {workflow.tender_reference}
                                </p>
                              )}
                            </div>
                            <StatusBadge status={workflow.status} />
                          </div>

                          {/* Compact Stepper */}
                          <div className="mb-3">
                            <CompactStepper
                              currentPhase={workflow.current_phase}
                              status={workflow.status}
                            />
                            <p className="text-xs text-zinc-500 mt-1">{phaseLabel}</p>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeDate(workflow.updated_at)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Voir
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
