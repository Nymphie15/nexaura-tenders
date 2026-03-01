"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkflowStats } from "@/hooks/use-workflows";
import { useHITLPending } from "@/hooks/use-hitl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Clock, AlertTriangle, CheckCircle2, Activity,
  RefreshCw, Target, TrendingUp, Calculator, FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HITLCheckpoint } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";

const CHECKPOINT_CONFIG: Record<HITLCheckpoint, { label: string; description: string; icon: React.ElementType; color: string; bgColor: string }> = {
  go_nogo: { label: "Décision Go/No-Go", description: "Décidez si l'AO mérite une réponse", icon: Target, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  strategy_review: { label: "Validation Stratégie", description: "Validez les arguments de vente", icon: TrendingUp, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  price_review: { label: "Validation Prix", description: "Vérifiez et ajustez les prix", icon: Calculator, color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  tech_review: { label: "Révision Technique", description: "Révisez le mémoire technique", icon: FileCheck, color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
};

function getWaitingTime(createdAt: string): { label: string; isUrgent: boolean } {
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const isUrgent = hours >= 24;
  if (hours < 1) return { label: "Depuis moins d'1h", isUrgent: false };
  if (hours < 24) return { label: `Depuis ${Math.round(hours)}h`, isUrgent: false };
  return { label: `Depuis ${Math.floor(hours / 24)}j ${Math.round(hours % 24)}h`, isUrgent: true };
}

const URGENCY_ORDER: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };

export default function DecisionsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const { data: pending, isLoading: isLoadingHitl, refetch: refetchHitl } = useHITLPending(filter !== "all" ? filter : undefined);
  const { data: stats, isLoading: isLoadingStats } = useWorkflowStats();

  const totalPending = pending?.length || 0;

  // Sort by urgency (critical > high > normal > low), then by oldest first
  const sortedPending = [...(pending || [])].sort((a, b) => {
    const urgA = URGENCY_ORDER[a.urgency || "normal"] ?? 2;
    const urgB = URGENCY_ORDER[b.urgency || "normal"] ?? 2;
    if (urgA !== urgB) return urgA - urgB;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Split into urgent (>24h) and waiting
  const urgentItems = sortedPending.filter(item => getWaitingTime(item.created_at).isUrgent);
  const waitingItems = sortedPending.filter(item => !getWaitingTime(item.created_at).isUrgent);

  // KPI calculations
  const urgentCount = urgentItems.length;
  const completedThisMonth = stats?.completed ?? 0;
  const approvalRate = stats && (stats.completed || 0) + (stats.failed || 0) > 0
    ? Math.round(((stats.completed || 0) / ((stats.completed || 0) + (stats.failed || 0))) * 100)
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Décisions</h1>
          <p className="text-muted-foreground mt-1">Actions requises en attente de votre validation</p>
        </div>
        <Button onClick={() => refetchHitl()} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                {isLoadingHitl ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold tabular-nums">{urgentCount}</p>
                )}
                <p className="text-xs text-muted-foreground">Urgentes (&gt;24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                {isLoadingHitl ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold tabular-nums">{totalPending}</p>
                )}
                <p className="text-xs text-muted-foreground">Total en attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                {isLoadingStats ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold tabular-nums">{completedThisMonth}</p>
                )}
                <p className="text-xs text-muted-foreground">Décidées ce mois</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                {isLoadingStats ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold tabular-nums">{approvalRate !== null ? `${approvalRate}%` : "—"}</p>
                )}
                <p className="text-xs text-muted-foreground">Taux d'approbation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les décisions</SelectItem>
            {Object.entries(CHECKPOINT_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoadingHitl && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoadingHitl && totalPending === 0 && (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              illustration="no-decisions"
              title="Tout est à jour !"
              description="Aucune décision en attente. Vos workflows progressent sans blocage."
              action={{ label: "Voir les projets", onClick: () => router.push("/projects"), icon: Activity, variant: "outline" }}
            />
          </CardContent>
        </Card>
      )}

      {/* Urgent section (>24h) */}
      {!isLoadingHitl && urgentItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-semibold text-red-600">Urgent (&gt;24h)</h2>
            <Badge variant="destructive" className="text-xs">{urgentItems.length}</Badge>
          </div>
          {urgentItems.map((item) => {
            const config = CHECKPOINT_CONFIG[item.checkpoint as HITLCheckpoint];
            if (!config) return null;
            const Icon = config.icon;
            const waitInfo = getWaitingTime(item.created_at);
            return (
              <div
                key={`${item.case_id}-${item.checkpoint}`}
                className="flex items-center gap-4 rounded-xl border border-red-200 bg-white px-4 py-3 hover:bg-red-50 transition-colors"
              >
                <div className={cn("p-2 rounded-lg flex-shrink-0", config.bgColor)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.tender_title || "Appel d'offres"}</span>
                    <Badge className={cn("text-xs", config.bgColor, config.color)}>{config.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-zinc-500 font-mono">{item.tender_reference}</span>
                    <span className="text-xs font-medium text-red-600">{waitInfo.label}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 h-8"
                  onClick={() => router.push(`/projects/${item.case_id}`)}
                >
                  Décider →
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Waiting section (normal) */}
      {!isLoadingHitl && waitingItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-600">En attente</h2>
            <Badge variant="secondary" className="text-xs">{waitingItems.length}</Badge>
          </div>
          {waitingItems.map((item) => {
            const config = CHECKPOINT_CONFIG[item.checkpoint as HITLCheckpoint];
            if (!config) return null;
            const Icon = config.icon;
            const waitInfo = getWaitingTime(item.created_at);
            return (
              <div
                key={`${item.case_id}-${item.checkpoint}`}
                className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50 transition-colors"
              >
                <div className={cn("p-2 rounded-lg flex-shrink-0", config.bgColor)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.tender_title || "Appel d'offres"}</span>
                    <Badge className={cn("text-xs", config.bgColor, config.color)}>{config.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-zinc-500 font-mono">{item.tender_reference}</span>
                    <span className="text-xs font-medium text-zinc-500">{waitInfo.label}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 h-8"
                  onClick={() => router.push(`/projects/${item.case_id}`)}
                >
                  Décider →
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
