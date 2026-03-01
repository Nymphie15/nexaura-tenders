"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Euro,
  Target,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStartQuickCheck, useQuickCheckJob, useQuickCheckResult } from "@/hooks/use-quick-check";
import type { QuickCheckResult, QuickCheckRecommendation } from "@/types/quick-check";

interface QuickCheckCardProps {
  tenderId: string;
  onProceed?: () => void;
  onViewDetails?: () => void;
}

export function QuickCheckCard({ tenderId, onProceed, onViewDetails }: QuickCheckCardProps) {
  const [jobId, setJobId] = useState<string | null>(null);
  const startQuickCheck = useStartQuickCheck();

  const { data: job } = useQuickCheckJob(jobId || "", !!jobId);
  const { data: result } = useQuickCheckResult(jobId || "", job?.status === "completed");

  const handleStart = async () => {
    const response = await startQuickCheck.mutateAsync({ tender_id: tenderId });
    setJobId(response.job_id);
  };

  const getRecommendationConfig = (rec: QuickCheckRecommendation) => {
    switch (rec) {
      case "GO":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
          label: "GO - Répondre",
          description: "Forte adéquation avec votre expertise",
        };
      case "NO_GO":
        return {
          icon: XCircle,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          label: "NO-GO",
          description: "Critères bloquants détectés",
        };
      case "REVIEW":
        return {
          icon: AlertTriangle,
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/20",
          label: "REVIEW - À analyser",
          description: "Nécessite une analyse approfondie",
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  // Initial state - no analysis started
  if (!jobId) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            Analyse Rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Analysez ce DCE en 10 secondes pour savoir si vous devez répondre.
          </p>
          <Button 
            onClick={handleStart} 
            disabled={startQuickCheck.isPending}
            className="w-full"
          >
            {startQuickCheck.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Démarrage...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Lancer l&apos;analyse
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (job?.status === "pending" || job?.status === "processing") {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            Analyse en cours...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium">{Math.round((job?.progress || 0) * 100)}%</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Analyse du matching, des critères et des risques...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (job?.status === "failed") {
    return (
      <Card className="w-full border-red-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-red-500">
            <AlertCircle className="h-5 w-5" />
            Erreur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {job.error || "Une erreur s'est produite lors de l'analyse."}
          </p>
          <Button onClick={handleStart} variant="outline" className="w-full">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Result state
  if (result) {
    const config = getRecommendationConfig(result.recommendation);
    const Icon = config.icon;

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-yellow-500" />
              Analyse Rapide
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {result.processing_time_ms < 1000 
                ? "< 1s" 
                : `${Math.round(result.processing_time_ms / 1000)}s`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recommendation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full bg-white/50 ${config.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${config.color}`}>
                  {Math.round(result.confidence * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">confiance</div>
              </div>
            </div>
          </motion.div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className={`text-xl font-bold ${getScoreColor(result.matching_score)}`}>
                {Math.round(result.matching_score)}%
              </div>
              <div className="text-xs text-muted-foreground">Matching</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className={`text-xl font-bold ${getScoreColor(result.eligibility_score)}`}>
                {Math.round(result.eligibility_score)}%
              </div>
              <div className="text-xs text-muted-foreground">Éligibilité</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className={`text-xl font-bold ${getScoreColor(100 - result.risk_score)}`}>
                {Math.round(100 - result.risk_score)}%
              </div>
              <div className="text-xs text-muted-foreground">Sûreté</div>
            </div>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {result.blocking_criteria.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-medium flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  Critères bloquants ({result.blocking_criteria.length})
                </h4>
                <div className="space-y-1">
                  {result.blocking_criteria.map((criterion, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm p-2 rounded bg-red-500/10">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span>{criterion.message}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {result.warning_criteria.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-medium flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  Avertissements ({result.warning_criteria.length})
                </h4>
                <div className="space-y-1">
                  {result.warning_criteria.slice(0, 2).map((criterion, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm p-2 rounded bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{criterion.message}</span>
                    </div>
                  ))}
                  {result.warning_criteria.length > 2 && (
                    <p className="text-xs text-muted-foreground pl-2">
                      +{result.warning_criteria.length - 2} autres...
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Estimates */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Temps estimé:</span>
              <span className="font-medium">{result.estimated_effort_hours}h</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Coût estimé:</span>
              <span className="font-medium">{result.estimated_cost_euros.toFixed(0)}€</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {result.can_proceed && (
              <Button onClick={onProceed} className="flex-1">
                <Zap className="mr-2 h-4 w-4" />
                Lancer le workflow
              </Button>
            )}
            <Button variant="outline" onClick={onViewDetails} className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              Voir les détails
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
