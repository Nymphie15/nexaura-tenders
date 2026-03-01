"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Award,
  Trash2,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRunEvaluation, useEvaluationHistory } from "@/hooks/use-eval";
import { useEvalHistoryStore } from "@/stores/eval-history-store";
import type { CriteriaPreset, EvaluationReport } from "@/types/llm-eval";
import { PRESET_LABELS } from "@/types/llm-eval";

const PROGRESS_MESSAGES = [
  "Evaluation en cours...",
  "Analyse des criteres...",
  "Calcul du score global...",
  "Presque termine...",
];

function ScoreGauge({ score }: { score: number }) {
  const percentage = ((score - 1) / 4) * 100;
  const color =
    score >= 4
      ? "text-emerald-600"
      : score >= 3
        ? "text-blue-600"
        : score >= 2
          ? "text-amber-600"
          : "text-red-600";

  return (
    <div className="text-center space-y-1">
      <div className={cn("text-3xl font-bold tabular-nums", color)}>
        {score.toFixed(1)}
      </div>
      <div className="text-xs text-zinc-400">/ 5.0</div>
      <div className="w-full bg-zinc-100 rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all",
            score >= 4
              ? "bg-emerald-500"
              : score >= 3
                ? "bg-blue-500"
                : score >= 2
                  ? "bg-amber-500"
                  : "bg-red-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: EvaluationReport }) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {PRESET_LABELS[report.contentType]}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <Clock className="h-3 w-3" />
          {new Date(report.timestamp).toLocaleDateString("fr-FR")}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Score: {report.overallScore.toFixed(1)}/5
        </span>
        <span className="text-xs text-zinc-400">
          {report.executionTimeMs}ms
        </span>
      </div>
      <p className="text-xs text-zinc-600 line-clamp-2">{report.summary}</p>
    </div>
  );
}

export function LLMEvalDashboard() {
  const [content, setContent] = useState("");
  const [preset, setPreset] = useState<CriteriaPreset>("tender_response");
  const [progressMsg, setProgressMsg] = useState(PROGRESS_MESSAGES[0]);
  const progressRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const evalMutation = useRunEvaluation();
  const history = useEvaluationHistory();
  const clearHistory = useEvalHistoryStore((s) => s.clearHistory);

  // Progressive messages (#15)
  useEffect(() => {
    if (evalMutation.isPending) {
      let idx = 0;
      progressRef.current = setInterval(() => {
        idx = (idx + 1) % PROGRESS_MESSAGES.length;
        setProgressMsg(PROGRESS_MESSAGES[idx]);
      }, 5000);
    } else {
      if (progressRef.current) clearInterval(progressRef.current);
      setProgressMsg(PROGRESS_MESSAGES[0]);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [evalMutation.isPending]);

  const handleEvaluate = () => {
    if (!content.trim()) return;
    evalMutation.mutate({ content, preset });
  };

  const latestReport = evalMutation.data;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: Input form */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Evaluation LLM-as-Judge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Type de contenu
              </label>
              <Select
                value={preset}
                onValueChange={(v) => setPreset(v as CriteriaPreset)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(PRESET_LABELS) as [CriteriaPreset, string][]
                  )
                    .filter(([key]) => key !== "custom")
                    .map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Contenu a evaluer
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Collez le contenu a evaluer..."
                className="w-full h-[300px] rounded-md border bg-zinc-50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button
              onClick={handleEvaluate}
              disabled={evalMutation.isPending || !content.trim()}
              className="w-full gap-2"
            >
              {evalMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Award className="h-4 w-4" />
              )}
              Evaluer
            </Button>

            {evalMutation.isPending && (
              <p className="text-xs text-zinc-500 text-center animate-pulse">
                {progressMsg}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {latestReport && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Resultats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScoreGauge score={latestReport.overallScore} />

              <p className="text-sm text-zinc-600 text-center">
                {latestReport.summary}
              </p>

              <Separator />

              {/* Detail per criteria */}
              <div className="space-y-3">
                {latestReport.results.map((r) => (
                  <div
                    key={r.criteria_id}
                    className="rounded-md border p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {r.criteria_id.replace(/_/g, " ")}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          r.score >= 4
                            ? "text-emerald-600"
                            : r.score >= 3
                              ? "text-blue-600"
                              : r.score >= 2
                                ? "text-amber-600"
                                : "text-red-600"
                        )}
                      >
                        {r.score}/5
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-600">{r.reasoning}</p>
                    {r.evidence.length > 0 && (
                      <div className="text-xs text-zinc-400">
                        {r.evidence.length} extrait(s) cite(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {evalMutation.isError && (
          <Card className="border-red-200">
            <CardContent className="py-4 text-sm text-red-600 text-center">
              Erreur lors de l&apos;evaluation. Verifiez le contenu et reessayez.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: History */}
      <div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                Historique
              </CardTitle>
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={clearHistory}
                >
                  <Trash2 className="h-3 w-3" />
                  Effacer
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-4">
                Aucune evaluation
              </p>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {history.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
