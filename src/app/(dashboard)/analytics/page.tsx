"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserKPIs, useActivityTimeline, useRecommendations } from "@/hooks/use-analytics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, TrendingUp, Clock, Zap, Target, Lightbulb, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";

const PERIOD_OPTIONS = [
  { label: "7j", value: 7 },
  { label: "30j", value: 30 },
  { label: "90j", value: 90 },
] as const;

function KPICardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-64">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-1">
              <Skeleton
                className="w-full"
                style={{ height: `${Math.random() * 60 + 20}%` }}
              />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<number>(30);

  const { data: kpis, isLoading: kpisLoading, isError: kpisError } = useUserKPIs(period);
  const { data: timeline, isLoading: timelineLoading, isError: timelineError } = useActivityTimeline(6);
  const { data: recommendations, isLoading: recsLoading, isError: recsError } = useRecommendations(5);

  const hasError = kpisError || timelineError || recsError;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord analytique</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de vos performances et indicateurs.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={period === opt.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(opt.value)}
              className="px-3"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Impossible de charger certaines donnees analytiques. Verifiez votre connexion ou reessayez.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      {kpisLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Workflows totaux
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis?.total_workflows ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sur les {period} derniers jours
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taux de completion
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(142_76%_95%)]">
                <TrendingUp className="h-4 w-4 text-[hsl(142_72%_25%)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {kpis?.completion_rate ?? 0}%
                </span>
                {(kpis?.completion_rate ?? 0) >= 70 ? (
                  <ArrowUpRight className="h-4 w-4 text-[hsl(142_72%_29%)]" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis?.completed_workflows ?? 0} termines / {kpis?.failed_workflows ?? 0} en erreur
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Workflows actifs
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(48_96%_95%)]">
                <Zap className="h-4 w-4 text-[hsl(32_95%_35%)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis?.active_workflows ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                En cours de traitement
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Temps moyen
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(210_100%_95%)]">
                <Clock className="h-4 w-4 text-[hsl(210_60%_35%)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis?.avg_completion_hours ?? 0}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Duree moyenne de completion
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline Chart + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Timeline */}
        <div className="lg:col-span-2">
          {timelineLoading ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Activit&eacute; mensuelle
                </CardTitle>
                <CardDescription>
                  Workflows d&eacute;marr&eacute;s et termin&eacute;s par mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeline && timeline.length > 0 ? (
                  <div className="space-y-3">
                    {timeline.map((point: { month: string; workflows_started: number; workflows_completed: number }) => {
                      const maxVal = Math.max(
                        ...timeline.map((p: { workflows_started: number; workflows_completed: number }) =>
                          Math.max(p.workflows_started, p.workflows_completed)
                        ),
                        1
                      );
                      const startedPct = (point.workflows_started / maxVal) * 100;
                      const completedPct = (point.workflows_completed / maxVal) * 100;
                      const monthLabel = new Date(point.month).toLocaleDateString("fr-FR", {
                        month: "short",
                        year: "numeric",
                      });

                      return (
                        <div key={point.month} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium w-24">{monthLabel}</span>
                            <span className="text-muted-foreground text-xs">
                              {point.workflows_started} lanc&eacute;s / {point.workflows_completed} termin&eacute;s
                            </span>
                          </div>
                          <div className="flex gap-1 h-6">
                            <div
                              className="bg-primary rounded-sm transition-all"
                              style={{ width: `${startedPct}%`, minWidth: startedPct > 0 ? "4px" : "0" }}
                              title={`${point.workflows_started} lanc&eacute;s`}
                            />
                            <div
                              className="bg-[hsl(142_72%_29%)] rounded-sm transition-all"
                              style={{ width: `${completedPct}%`, minWidth: completedPct > 0 ? "4px" : "0" }}
                              title={`${point.workflows_completed} termin&eacute;s`}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-primary" />
                        <span>Lanc&eacute;s</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[hsl(142_72%_29%)]" />
                        <span>Termin&eacute;s</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                    <p>Aucune donn&eacute;e disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommendations */}
        <div>
          {recsLoading ? (
            <RecommendationsSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Recommandations
                </CardTitle>
                <CardDescription>
                  Suggestions pour am&eacute;liorer vos r&eacute;sultats
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations && recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((rec: { id: string; title: string; description: string; priority: string; category: string }) => (
                      <div
                        key={rec.id}
                        className="p-3 rounded-lg border space-y-1.5 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium leading-tight">
                            {rec.title}
                          </span>
                          <Badge
                            variant={getPriorityColor(rec.priority) as "destructive" | "default" | "secondary" | "outline"}
                            className="text-xs shrink-0"
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {rec.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {rec.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Lightbulb className="h-10 w-10 mb-3 opacity-50" />
                    <p className="text-sm">Aucune recommandation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
