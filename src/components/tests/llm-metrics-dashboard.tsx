"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  DollarSign,
  Zap,
  Database,
  RefreshCw,
  TrendingUp,
  Clock,
  Layers,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLLMMetrics } from "@/hooks/use-llm-testing";

// Tier colors
const TIER_COLORS: Record<string, string> = {
  tier_1: "bg-emerald-500",
  tier_2: "bg-blue-500",
  tier_3: "bg-purple-500",
};

const TIER_NAMES: Record<string, string> = {
  tier_1: "Tier 1 (Light)",
  tier_2: "Tier 2 (Medium)",
  tier_3: "Tier 3 (Heavy)",
};

const PROVIDER_COLORS: Record<string, string> = {
  ollama: "bg-orange-500",
  anthropic: "bg-amber-500",
  gemini: "bg-sky-500",
};

export function LLMMetricsDashboard() {
  const { data: metrics, isLoading, refetch, error } = useLLMMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Impossible de charger les metriques LLM
          </p>
          {metrics?.error && (
            <p className="text-xs text-red-500 mt-2">{metrics.error}</p>
          )}
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalTierCalls = Object.values(metrics.by_tier).reduce(
    (sum, tier) => sum + (tier?.calls || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Metriques LLM</h3>
          <p className="text-sm text-muted-foreground">
            Statistiques d&apos;utilisation des modeles
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Calls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.total_calls}</p>
                <p className="text-xs text-muted-foreground">Appels LLM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Tokens */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(metrics.total_tokens / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-muted-foreground">Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${metrics.total_cost_usd.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Cout total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Hit Rate */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(metrics.cache_stats.hit_rate * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Cache ({metrics.cache_stats.hits}/{metrics.cache_stats.hits + metrics.cache_stats.misses})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              Utilisation par Tier
            </CardTitle>
            <CardDescription>
              Répartition des appels par niveau de modèle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.by_tier).map(([tier, data]) => {
              const percentage = totalTierCalls > 0 ? ((data?.calls || 0) / totalTierCalls) * 100 : 0;
              return (
                <div key={tier} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{TIER_NAMES[tier] || tier}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{data?.calls || 0} appels</span>
                      <Badge variant="secondary" className="text-xs">
                        ${(data?.cost || 0).toFixed(3)}
                      </Badge>
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("absolute h-full rounded-full transition-all", TIER_COLORS[tier])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* By Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Utilisation par Provider
            </CardTitle>
            <CardDescription>
              Repartition des appels par fournisseur LLM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.by_provider).length > 0 ? (
              Object.entries(metrics.by_provider).map(([provider, data]) => {
                const percentage =
                  metrics.total_calls > 0 ? ((data?.calls || 0) / metrics.total_calls) * 100 : 0;
                return (
                  <div key={provider} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{provider}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{data?.calls || 0} appels</span>
                        <Badge variant="secondary" className="text-xs">
                          ${(data?.cost || 0).toFixed(3)}
                        </Badge>
                      </div>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "absolute h-full rounded-full transition-all",
                          PROVIDER_COLORS[provider] || "bg-gray-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune donnée par provider</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Appels recents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recent_calls.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {metrics.recent_calls.map((call, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {call.model}
                      </Badge>
                      {call.cached && (
                        <Badge
                          variant="outline"
                          className="text-xs text-emerald-600 border-emerald-200"
                        >
                          <Database className="h-3 w-3 mr-1" />
                          Cache
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{call.tokens} tokens</span>
                      <span>${call.cost.toFixed(4)}</span>
                      <span>{new Date(call.timestamp).toLocaleTimeString("fr-FR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun appel recent</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* By Model */}
      {Object.entries(metrics.by_model).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Utilisation par Modele
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(metrics.by_model).map(([model, data]) => (
                <div
                  key={model}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-sm font-medium truncate">{model}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {data?.calls || 0}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ${(data?.cost || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
