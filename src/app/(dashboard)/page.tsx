"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Euro,
  Target,
  ChevronRight,
  ArrowUpRight,
  Clock,
  Bot,
  Upload,
  Activity,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { AreaChart, BarChart, DonutChart, BarList } from "@/components/charts/client-charts";
import {
  useDashboardOverview,
  useConsultationTimeline,
  useRecentActivity,
  useRecentTenders,
  useSourceDistribution,
  usePipelineValue,
  monthNumberToFrench,
  formatRelativeTime,
} from "@/hooks/use-dashboard-queries";
import { useHITLPending } from "@/hooks/use-hitl";
import type { Tender, ApiRecentActivityItem } from "@/types";

interface KPIItem {
  title: string;
  value: number;
  format: string;
  change: number | null | undefined;
  icon: LucideIcon;
  description: string;
  color: string;
}

function formatValue(value: number, format: string) {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return `${value}%`;
    default:
      return value.toString();
  }
}

const colorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const decisionTypeLabels: Record<string, { label: string; color: string }> = {
  go_nogo: { label: "Go/No-Go", color: "bg-purple-500/10 text-purple-600" },
  strategy_review: { label: "Strategie", color: "bg-blue-500/10 text-blue-600" },
  price_review: { label: "Tarification", color: "bg-amber-500/10 text-amber-600" },
  tech_review: { label: "Technique", color: "bg-emerald-500/10 text-emerald-600" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  NEW: { label: "Nouveau", color: "bg-blue-500/10 text-blue-600" },
  DOWNLOADED: { label: "Telecharge", color: "bg-cyan-500/10 text-cyan-600" },
  PROCESSING: { label: "En cours", color: "bg-amber-500/10 text-amber-600" },
  COMPLETED: { label: "Termine", color: "bg-emerald-500/10 text-emerald-600" },
  FAILED: { label: "Echec", color: "bg-rose-500/10 text-rose-600" },
  REJECTED: { label: "Rejete", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
};

function getTierBadge(score: number | undefined | null) {
  if (!score) return null;
  if (score >= 80) return { label: "Excellent", className: "bg-emerald-500/10 text-emerald-600" };
  if (score >= 60) return { label: "Bon", className: "bg-blue-500/10 text-blue-600" };
  if (score >= 40) return { label: "Moyen", className: "bg-amber-500/10 text-amber-600" };
  return { label: "Faible", className: "bg-zinc-500/10 text-zinc-600" };
}

function isDeadlineUrgent(deadline: string | undefined | null): boolean {
  if (!deadline) return false;
  const daysLeft = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysLeft >= 0 && daysLeft < 7;
}

function KPICardSkeleton() {
  return (
    <Card className="border-0 shadow-elegant">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </CardContent>
    </Card>
  );
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  tender_created: FileText,
  workflow_completed: CheckCircle2,
  hitl_required: AlertTriangle,
  document_uploaded: Upload,
  alert: AlertTriangle,
  system: Bot,
};

const ACTIVITY_COLORS: Record<string, string> = {
  tender_created: "text-blue-500 bg-blue-500/10",
  workflow_completed: "text-emerald-500 bg-emerald-500/10",
  hitl_required: "text-purple-500 bg-purple-500/10",
  document_uploaded: "text-cyan-500 bg-cyan-500/10",
  alert: "text-amber-500 bg-amber-500/10",
  system: "text-gray-500 bg-gray-500/10",
};

export default function DashboardPage() {
  // Dashboard hooks (consolidated)
  const { data: overview, isLoading: isLoadingOverview, isError: isOverviewError } = useDashboardOverview();
  const { data: timeline, isLoading: isLoadingTimeline } = useConsultationTimeline();
  const { data: recentActivityData } = useRecentActivity(5);
  const { data: recentTenders, isLoading: isLoadingTenders, isError: isTendersError } = useRecentTenders(3);
  const { data: pendingDecisions, isLoading: isLoadingHitl, isError: isHitlError } = useHITLPending();
  const { data: sourceDistribution, isLoading: isLoadingSource } = useSourceDistribution();
  const { data: pipelineValue } = usePipelineValue();

  const isPartialFailure = (isOverviewError || isTendersError || isHitlError) && !isLoadingOverview;

  // Build KPI data from overview + pipeline value
  const kpiData = useMemo<KPIItem[]>(() => [
    {
      title: "Pipeline Estime",
      value: pipelineValue ?? 0,
      format: "currency",
      change: overview?.period_change?.total_workflows ?? null,
      icon: Euro,
      description: "Valeur totale des AO en cours",
      color: "primary",
    },
    {
      title: "Taux de Succes",
      value: overview ? Math.round(overview.success_rate * 100) : 0,
      format: "percent",
      change: overview?.period_change?.success_rate ?? null,
      icon: Target,
      description: "Sur les 30 derniers jours",
      color: "success",
    },
    {
      title: "AO Actifs",
      value: overview?.active_workflows ?? 0,
      format: "number",
      change: overview?.period_change?.active_workflows ?? null,
      icon: FileText,
      description: "En cours de traitement",
      color: "info",
    },
    {
      title: "Décisions",
      value: overview?.pending_hitl ?? 0,
      format: "number",
      change: null,
      icon: AlertTriangle,
      description: "En attente de validation",
      color: "warning",
    },
  ], [overview, pipelineValue]);

  // Chart data from source distribution
  const sourceData = useMemo(() =>
    sourceDistribution?.map((s) => ({
      name: s.source,
      value: s.percentage,
    })) || [],
  [sourceDistribution]);

  // Timeline chart data
  const chartData = useMemo(() =>
    timeline
      ? timeline.map((entry) => ({
          date: monthNumberToFrench(entry.month),
          Consultations: entry.count,
        }))
      : [],
  [timeline]);

  // Decisions bar chart data from overview
  const decisionsData = useMemo(() =>
    overview?.decisions
      ? [
          { decision: "Go", count: overview.decisions.go },
          { decision: "Review", count: overview.decisions.review },
          { decision: "No-Go", count: overview.decisions.nogo },
        ]
      : [],
  [overview]);

  // Categories computed from recent tenders
  const topCategories = useMemo(() =>
    recentTenders && recentTenders.length > 0
      ? Object.entries(
          recentTenders.reduce<Record<string, number>>((acc, t) => {
            const tender = t as Tender & { category?: string; sector?: string };
            const cat = tender.category || tender.sector || "Non classe";
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {})
        )
          .map(([name, count]) => ({
            name,
            value: Math.round((count / recentTenders.length) * 100),
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 4)
      : [],
  [recentTenders]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {isPartialFailure && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-[hsl(48_96%_95%)] px-4 py-3 text-sm text-[hsl(32_95%_35%)]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Certaines donnees sont indisponibles
        </div>
      )}

      {/* Actions urgentes */}
      {pendingDecisions && pendingDecisions.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">
              {pendingDecisions.length} action{pendingDecisions.length > 1 ? "s" : ""} requise{pendingDecisions.length > 1 ? "s" : ""}
            </h3>
          </div>
          <div className="space-y-2">
            {pendingDecisions.slice(0, 5).map((decision) => (
              <Link
                key={decision.case_id}
                href={`/projects/${decision.case_id}`}
                className="flex items-center justify-between rounded-lg bg-white border border-amber-100 px-3 py-2 hover:bg-amber-50 transition-colors"
              >
                <div>
                  <span className="text-sm font-medium">{decision.tender_title || "Appel d'offres"}</span>
                  <span className={cn(
                    "ml-2 text-xs px-1.5 py-0.5 rounded",
                    (decision.checkpoint && decisionTypeLabels[decision.checkpoint]?.color) || "bg-gray-500/10 text-gray-600"
                  )}>
                    {(decision.checkpoint && decisionTypeLabels[decision.checkpoint]?.label) || decision.checkpoint}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-amber-500" />
              </Link>
            ))}
          </div>
          {pendingDecisions.length > 5 && (
            <Link href="/decisions" className="mt-2 text-xs text-amber-700 hover:underline block text-center">
              Voir les {pendingDecisions.length - 5} autres →
            </Link>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingOverview ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          kpiData.map((kpi, index) => {
            const changeValue = kpi.change;
            const hasChange = changeValue !== null && changeValue !== undefined;
            const isPositive = hasChange && changeValue >= 0;

            return (
              <Card
                key={kpi.title}
                variant="elevated"
                className={cn(
                  "relative overflow-hidden",
                  `animate-fade-up stagger-${index + 1}`
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        colorMap[kpi.color]
                      )}
                    >
                      <kpi.icon className="h-5 w-5" />
                    </div>
                    {hasChange && changeValue !== null ? (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="tabular-nums">{Math.abs(changeValue)}%</span>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">-</div>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                      {formatValue(kpi.value, kpi.format)}
                    </p>
                    <p className="text-sm font-medium text-foreground/80">
                      {kpi.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {kpi.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart - Consultations Timeline */}
        <Card className="border-0 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Consultations mensuelles
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Activite sur les 6 derniers mois
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Voir details
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingTimeline ? (
              <Skeleton className="h-72 w-full rounded-lg" />
            ) : (
              <AreaChart
                className="h-72"
                data={chartData}
                index="date"
                categories={["Consultations"]}
                colors={["indigo"]}
                valueFormatter={(value) => `${value} AO`}
                showLegend={true}
                showGridLines={false}
                curveType="monotone"
              />
            )}
          </CardContent>
        </Card>

        {/* Sources Distribution */}
        <Card className="border-0 shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Sources d&apos;opportunités
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Repartition par plateforme
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingSource ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ) : (
              <>
                <DonutChart
                  className="h-48"
                  data={sourceData}
                  category="value"
                  index="name"
                  colors={["indigo", "cyan", "violet", "amber"]}
                  valueFormatter={(value) => `${value}%`}
                  showLabel={true}
                />
                <div className="mt-4">
                  <BarList
                    data={topCategories}
                    valueFormatter={(value: number) => `${value}%`}
                    color="indigo"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Decisions */}
        <Card className="border-0 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                </div>
                Décisions en attente
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Actions requises de votre part
              </p>
            </div>
            <Badge variant="secondary" className="font-semibold tabular-nums">
              {pendingDecisions?.length || 0}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingHitl ? (
              <>
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </>
            ) : pendingDecisions && pendingDecisions.length > 0 ? (
              pendingDecisions.slice(0, 3).map((decision) => (
                <Link
                  key={decision.case_id}
                  href={`/projects/${decision.case_id}`}
                  className="block"
                >
                  <div className="group flex items-center gap-4 rounded-xl border border-transparent bg-muted/30 p-3 transition-all hover:border-border hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {decision.reference}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            (decision.checkpoint && decisionTypeLabels[decision.checkpoint]?.color) || "bg-gray-500/10"
                          )}
                        >
                          {(decision.checkpoint && decisionTypeLabels[decision.checkpoint]?.label) || decision.checkpoint_type || "Checkpoint"}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">
                        {decision.tender_title || "Appel d'offres"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {decision.tender_reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          decision.urgency === "critical"
                            ? "border-rose-500 text-rose-500"
                            : decision.urgency === "high"
                            ? "border-amber-500 text-amber-500"
                            : ""
                        )}
                      >
                        {decision.urgency || "normal"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <p>Aucune decision en attente</p>
              </div>
            )}
            <Link href="/decisions">
              <Button variant="outline" className="w-full mt-2">
                Voir toutes les decisions
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Tenders / Opportunités récentes */}
        <Card className="border-0 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                </div>
                Opportunités récentes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Derniers appels d&apos;offres traites
              </p>
            </div>
            <Link href="/opportunities">
              <Button variant="ghost" size="sm" className="text-xs">
                Voir tout
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingTenders ? (
              <>
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </>
            ) : recentTenders && recentTenders.length > 0 ? (
              recentTenders.map((tender) => {
                const tier = getTierBadge(tender.score);
                const deadlineUrgent = isDeadlineUrgent(tender.deadline);
                return (
                  <Link
                    key={tender.id}
                    href={`/opportunities/${tender.id}`}
                    className="block"
                  >
                    <div className="group flex items-center gap-4 rounded-xl border border-transparent bg-muted/30 p-3 transition-all hover:border-border hover:bg-muted/50">
                      <Avatar className="h-10 w-10 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10">
                        <AvatarFallback className="rounded-xl text-xs font-semibold text-primary">
                          {tender.client?.slice(0, 2).toUpperCase() || "AO"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {tender.reference}
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px]",
                              (statusLabels[tender.status] || statusLabels[tender.status?.toUpperCase()])?.color || "bg-gray-500/10"
                            )}
                          >
                            {(statusLabels[tender.status] || statusLabels[tender.status?.toUpperCase()])?.label || tender.status}
                          </Badge>
                          {tier && (
                            <Badge variant="secondary" className={cn("text-[10px]", tier.className)}>
                              {tier.label}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm font-medium">
                          {tender.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {tender.client}
                          </p>
                          {tender.deadline && (
                            <span className={cn("text-xs", deadlineUrgent ? "text-red-600 font-medium" : "text-muted-foreground")}>
                              {new Date(tender.deadline).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Score</span>
                          <span className="font-medium tabular-nums">{tender.score ? `${tender.score}%` : "—"}</span>
                        </div>
                        <Progress value={tender.score || 0} className="h-1.5" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>Aucune opportunite recente</p>
              </div>
            )}
            <Link href="/opportunities">
              <Button variant="outline" className="w-full mt-2">
                Voir toutes les opportunités
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Decisions Chart + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Decisions Distribution */}
        <Card className="border-0 shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Repartition des decisions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Go, Review et No-Go
            </p>
          </CardHeader>
          <CardContent>
            {decisionsData.length > 0 ? (
              <BarChart
                className="h-64"
                data={decisionsData}
                index="decision"
                categories={["count"]}
                colors={["emerald"]}
                valueFormatter={(value) => `${value}`}
                showLegend={false}
                showGridLines={false}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                  <Activity className="h-3.5 w-3.5 text-blue-500" />
                </div>
                Activite recente
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Derniers evenements du systeme
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivityData && recentActivityData.length > 0 ? (
              recentActivityData.map((item: ApiRecentActivityItem) => {
                const Icon = ACTIVITY_ICONS[item.event_type] || Bot;
                const colorClass = ACTIVITY_COLORS[item.event_type] || "text-gray-500 bg-gray-500/10";
                const [textColor, bgColor] = colorClass.split(" ");
                return (
                  <Link
                    key={item.id}
                    href={`/projects/${item.case_id}`}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn("p-1.5 rounded-full shrink-0", bgColor)}>
                      <Icon className={cn("h-3.5 w-3.5", textColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-muted-foreground">{item.reference}</span>
                        <span className="text-muted-foreground/40">-</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground/70" />
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
