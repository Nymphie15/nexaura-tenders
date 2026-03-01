"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  Zap,
  Layers,
  Building2,
  RefreshCw,
  Download,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCostReport,
  useBudgetStatus,
  useCostsByModel,
  useCostsByPhase,
  useCostsByCompany,
} from "@/hooks/use-cost-analytics";
import type {
  CostReportResponse as CostReport,
  BudgetStatusResponse as BudgetStatus,
  CostsByModelResponse as CostsByModel,
  CostsByPhaseResponse as CostsByPhase,
  CostsByCompanyResponse as CostsByCompany,
} from "@/lib/api/endpoints";

// ============================================
// Components
// ============================================

const TIER_COLORS: Record<number, string> = {
  1: "bg-emerald-500",
  2: "bg-blue-500",
  3: "bg-purple-500",
};

const TIER_NAMES: Record<number, string> = {
  1: "Tier 1 (Light)",
  2: "Tier 2 (Medium)",
  3: "Tier 3 (Heavy)",
};

const PHASE_COLORS: Record<string, string> = {
  extraction: "bg-sky-500",
  matching: "bg-amber-500",
  generation: "bg-rose-500",
  validation: "bg-emerald-500",
  risk_analysis: "bg-purple-500",
  strategy: "bg-indigo-500",
  unknown: "bg-gray-500",
};

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`;
  } else if (cost < 1) {
    return `$${cost.toFixed(4)}`;
  } else {
    return `$${cost.toFixed(2)}`;
  }
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

// Budget Status Card
function BudgetStatusCard() {
  const { data, isLoading, error, refetch } = useBudgetStatus();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Erreur chargement budget
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}
          >
            Reessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const alertLevel = data.alert?.level;
  const isOverBudget = data.projected_month_end_usd > data.monthly_budget_usd;

  return (
    <Card
      className={cn(
        alertLevel === "critical" && "border-red-500 bg-red-50 dark:bg-red-950/20",
        alertLevel === "warning" && "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget Mensuel
          </CardTitle>
          {alertLevel && (
            <Badge
              variant={alertLevel === "critical" ? "destructive" : "secondary"}
              className={cn(
                alertLevel === "warning" && "bg-amber-500 text-white"
              )}
            >
              {alertLevel === "critical" ? (
                <AlertCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {alertLevel === "critical" ? "Critique" : "Attention"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main cost display */}
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold">
            ${data.current_month_cost_usd.toFixed(2)}
          </span>
          <span className="text-muted-foreground mb-1">
            / ${data.monthly_budget_usd.toFixed(0)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.usage_percent.toFixed(1)}% utilisé</span>
            <span>Reste ${data.remaining_usd.toFixed(2)}</span>
          </div>
          <Progress
            value={Math.min(data.usage_percent, 100)}
            className={cn(
              "h-2",
              alertLevel === "critical" && "[&>div]:bg-red-500",
              alertLevel === "warning" && "[&>div]:bg-amber-500"
            )}
          />
        </div>

        {/* Projection */}
        <div className="flex items-center gap-2 text-sm">
          {isOverBudget ? (
            <TrendingUp className="h-4 w-4 text-red-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-emerald-500" />
          )}
          <span className={isOverBudget ? "text-red-600" : "text-emerald-600"}>
            Projection fin de mois: ${data.projected_month_end_usd.toFixed(2)}
          </span>
        </div>

        {/* Alert recommendations */}
        {data.alert && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-1">Recommandations:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {data.alert.recommendations.slice(0, 2).map((rec, i) => (
                <li key={i}>- {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Cost by Model Card
function CostByModelCard({ periodDays }: { periodDays: number }) {
  const { data, isLoading } = useCostsByModel(periodDays);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Coûts par Modèle
        </CardTitle>
        <CardDescription>
          Répartition des coûts par modèle LLM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tier summary */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((tier) => (
            <div
              key={tier}
              className="p-2 rounded-lg bg-muted/50 text-center"
            >
              <div
                className={cn(
                  "h-2 w-8 mx-auto rounded-full mb-1",
                  TIER_COLORS[tier]
                )}
              />
              <p className="text-xs text-muted-foreground">{TIER_NAMES[tier]}</p>
              <p className="font-semibold">
                ${(data.by_tier[tier] || 0).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Model list */}
        <div className="space-y-2">
          {data.models.slice(0, 5).map((model) => (
            <div key={model.model} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      TIER_COLORS[model.tier]
                    )}
                  />
                  <span className="font-medium truncate max-w-[150px]">
                    {model.model}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {formatTokens(model.tokens)} tokens
                  </span>
                  <Badge variant="secondary">{formatCost(model.cost_usd)}</Badge>
                </div>
              </div>
              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "absolute h-full rounded-full transition-all",
                    TIER_COLORS[model.tier]
                  )}
                  style={{ width: `${model.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Cost by Phase Card
function CostByPhaseCard({ periodDays }: { periodDays: number }) {
  const { data, isLoading } = useCostsByPhase(periodDays);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Couts par Phase
        </CardTitle>
        <CardDescription>
          Couts par phase du workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.phases.slice(0, 6).map((phase) => (
          <div key={phase.phase} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="capitalize font-medium">{phase.phase}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  {phase.calls} appels
                </span>
                <Badge variant="secondary">{formatCost(phase.cost_usd)}</Badge>
              </div>
            </div>
            <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "absolute h-full rounded-full transition-all",
                  PHASE_COLORS[phase.phase] || PHASE_COLORS.unknown
                )}
                style={{ width: `${phase.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Cost by Company Card (Multi-tenant)
function CostByCompanyCard({ periodDays }: { periodDays: number }) {
  const { data, isLoading } = useCostsByCompany(periodDays);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.companies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Coûts par Client
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucune donnée client disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Coûts par Client
        </CardTitle>
        <CardDescription>
          Attribution multi-tenant ({data.total_companies} clients)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Appels</TableHead>
              <TableHead className="text-right">Coût</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.companies.slice(0, 8).map((company) => (
              <TableRow key={company.company_id}>
                <TableCell className="font-medium">
                  {company.company_id === "unknown"
                    ? "Non attribué"
                    : company.company_id}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatTokens(company.tokens)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {company.calls}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">
                    {formatCost(company.cost)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Summary Stats
function SummaryStats({ periodDays }: { periodDays: number }) {
  const { data, isLoading } = useCostReport(periodDays);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: "Cout Total",
      value: formatCost(data.total_cost_usd),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/50",
    },
    {
      label: "Tokens Utilises",
      value: formatTokens(data.total_tokens),
      icon: Zap,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/50",
    },
    {
      label: "Appels LLM",
      value: data.total_calls.toLocaleString(),
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/50",
    },
    {
      label: "Cout Moyen/Appel",
      value: formatCost(data.avg_cost_per_call),
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// Main Dashboard Component
// ============================================

export function CostDashboard() {
  const [periodDays, setPeriodDays] = useState(30);
  const { refetch: refetchReport } = useCostReport(periodDays);
  const { refetch: refetchBudget } = useBudgetStatus();

  const handleRefresh = () => {
    refetchReport();
    refetchBudget();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attribution des Couts LLM</h2>
          <p className="text-muted-foreground">
            Tracking granulaire par client, workflow et phase
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={periodDays.toString()}
            onValueChange={(v) => setPeriodDays(parseInt(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
              <SelectItem value="365">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <SummaryStats periodDays={periodDays} />

      {/* Budget + Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <BudgetStatusCard />
        <CostByModelCard periodDays={periodDays} />
        <CostByPhaseCard periodDays={periodDays} />
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Par Client</TabsTrigger>
          <TabsTrigger value="workflows">Top Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CostByCompanyCard periodDays={periodDays} />
        </TabsContent>

        <TabsContent value="workflows">
          <TopWorkflowsCard periodDays={periodDays} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Top Workflows Card
function TopWorkflowsCard({ periodDays }: { periodDays: number }) {
  const { data, isLoading } = useCostReport(periodDays);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.top_workflows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Workflows par Coût</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucun workflow enregistré
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Workflows par Coût</CardTitle>
        <CardDescription>
          Les workflows les plus couteux sur la periode
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workflow ID</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Appels</TableHead>
              <TableHead className="text-right">Coût</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.top_workflows.map((wf) => (
              <TableRow key={wf.workflow_id}>
                <TableCell className="font-mono text-sm">
                  {wf.workflow_id}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatTokens(wf.tokens)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {wf.calls}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{formatCost(wf.cost_usd)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default CostDashboard;
