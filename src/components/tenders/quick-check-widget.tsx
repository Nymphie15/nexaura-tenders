"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStartQuickCheck,
  useQuickCheckJob,
  useQuickCheckResult,
} from "@/hooks/use-quick-check";
import type { QuickCheckRecommendation } from "@/types/quick-check";

interface QuickCheckWidgetProps {
  tenderId: string;
}

const recommendationConfig: Record<
  QuickCheckRecommendation,
  { label: string; color: string; icon: React.ReactNode }
> = {
  GO: {
    label: "GO",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  NO_GO: {
    label: "NO GO",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle className="h-4 w-4" />,
  },
  REVIEW: {
    label: "A REVOIR",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

export function QuickCheckWidget({ tenderId }: QuickCheckWidgetProps) {
  const [jobId, setJobId] = useState<string | null>(null);

  const startMutation = useStartQuickCheck();
  const jobQuery = useQuickCheckJob(jobId || "", !!jobId);
  const resultQuery = useQuickCheckResult(
    jobId || "",
    jobQuery.data?.status === "completed"
  );

  const isLoading =
    startMutation.isPending ||
    (!!jobId &&
      jobQuery.data?.status !== "completed" &&
      jobQuery.data?.status !== "failed");

  const isFailed = jobQuery.data?.status === "failed";
  const result = resultQuery.data;

  const handleStart = async () => {
    try {
      const response = await startMutation.mutateAsync({
        tender_id: tenderId,
      });
      setJobId(response.job_id);
    } catch {
      // Error handled by mutation
    }
  };

  // Idle state
  if (!jobId && !result) {
    return (
      <Card className="border border-zinc-200 shadow-sm">
        <CardContent className="p-5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-3">
            Analyse IA
          </p>
          <Button
            onClick={handleStart}
            disabled={startMutation.isPending}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            {startMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Analyse rapide IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    const progress = jobQuery.data?.progress ?? 0;
    return (
      <Card className="border border-zinc-200 shadow-sm">
        <CardContent className="p-5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-3">
            Analyse IA
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyse en cours...
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Failed state
  if (isFailed) {
    return (
      <Card className="border border-red-200 shadow-sm">
        <CardContent className="p-5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-3">
            Analyse IA
          </p>
          <div className="text-sm text-red-600 mb-2">Analyse echouee</div>
          <Button
            onClick={handleStart}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Reessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Result state
  if (result) {
    const rec = recommendationConfig[result.recommendation];
    return (
      <Card className="border border-zinc-200 shadow-sm">
        <CardContent className="p-5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-3">
            Analyse IA
          </p>
          <div className="space-y-3">
            {/* Recommendation badge */}
            <Badge
              variant="outline"
              className={cn("gap-1.5 text-xs font-medium", rec.color)}
            >
              {rec.icon}
              {rec.label}
            </Badge>

            {/* Score */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Score</span>
              <span className="font-medium tabular-nums">
                {Math.round(result.matching_score)}%
              </span>
            </div>

            {/* Confidence */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Confiance</span>
              <span className="font-medium tabular-nums">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>

            {/* Blocking criteria count */}
            {result.blocking_criteria.length > 0 && (
              <div className="text-xs text-red-600">
                {result.blocking_criteria.length} critere(s) bloquant(s)
              </div>
            )}

            {/* Warnings */}
            {result.warning_criteria.length > 0 && (
              <div className="text-xs text-amber-600">
                {result.warning_criteria.length} avertissement(s)
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
