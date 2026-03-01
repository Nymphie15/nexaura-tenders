"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHITLPending, useSubmitDecision } from "@/hooks/use-hitl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  Calculator,
  FileCheck,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import type { HITLCheckpoint, HITLAction, RiskDecision } from "@/types";

const CHECKPOINT_CONFIG: Record<
  HITLCheckpoint,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }
> = {
  go_nogo: {
    label: "Go/No-Go",
    icon: Target,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  strategy_review: {
    label: "Stratégie",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  price_review: {
    label: "Prix",
    icon: Calculator,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  tech_review: {
    label: "Technique",
    icon: FileCheck,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
  },
};

type UrgencyLevel = "critical" | "high" | "normal" | "low";

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string; textColor: string }> = {
  critical: { label: "Critique", color: "bg-red-500", textColor: "text-red-500" },
  high: { label: "Élevée", color: "bg-orange-500", textColor: "text-orange-500" },
  normal: { label: "Normale", color: "bg-blue-500", textColor: "text-blue-500" },
  low: { label: "Basse", color: "bg-slate-500", textColor: "text-slate-500" },
};

export default function MobileHITLPage() {
  const router = useRouter();
  const { data: decisions, isLoading } = useHITLPending();
  const submitMutation = useSubmitDecision();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [decision, setDecision] = useState<RiskDecision | null>(null);
  const [comment, setComment] = useState("");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const pendingDecisions = decisions || [];
  const currentDecision = pendingDecisions[currentIndex];
  const hasNext = currentIndex < pendingDecisions.length - 1;
  const hasPrevious = currentIndex > 0;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasNext) {
      setCurrentIndex((prev) => prev + 1);
      setDecision(null);
      setComment("");
    }

    if (isRightSwipe && hasPrevious) {
      setCurrentIndex((prev) => prev - 1);
      setDecision(null);
      setComment("");
    }
  }, [touchStart, touchEnd, hasNext, hasPrevious, minSwipeDistance]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex((prev) => prev + 1);
      setDecision(null);
      setComment("");
    }
  }, [hasNext]);

  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      setCurrentIndex((prev) => prev - 1);
      setDecision(null);
      setComment("");
    }
  }, [hasPrevious]);

  const handleSubmit = useCallback(
    async (action: HITLAction) => {
      if (!currentDecision) return;

      try {
        await submitMutation.mutateAsync({
          caseId: currentDecision.case_id,
          checkpoint: currentDecision.checkpoint || currentDecision.checkpoint_type,
          decision: {
            action,
            data:
              currentDecision.checkpoint === "go_nogo"
                ? { risk_decision: decision, reason: comment }
                : { comment },
            decided_at: new Date().toISOString(),
          },
        });

        toast.success("Décision enregistrée");

        // Move to next decision or go back to list
        if (hasNext) {
          handleNext();
        } else {
          router.push("/hitl");
        }
      } catch {
        toast.error("Erreur lors de l'enregistrement");
      }
    },
    [currentDecision, decision, comment, submitMutation, hasNext, handleNext, router]
  );

  // Reset when switching decisions
  useEffect(() => {
    setDecision(null);
    setComment("");
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!pendingDecisions.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h2 className="text-xl font-semibold text-center">Tout est à jour</h2>
            <p className="text-center text-muted-foreground">
              Aucune décision en attente pour le moment
            </p>
            <Button onClick={() => router.push("/")}>Retour au dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = currentDecision.checkpoint ? CHECKPOINT_CONFIG[currentDecision.checkpoint] : undefined;
  const Icon = config?.icon || Target;
  const urgency = (currentDecision.urgency || "normal") as UrgencyLevel;
  const urgencyConfig = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.normal;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Fixed */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/hitl")}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour
            </Button>
            <Badge variant="outline" className="font-mono">
              {currentIndex + 1} / {pendingDecisions.length}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config?.bgColor}`}>
              <Icon className={`h-5 w-5 ${config?.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold truncate">{config?.label}</h1>
              <p className="text-sm text-muted-foreground truncate">
                {currentDecision.tender_title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeDate(currentDecision.created_at)}
            </Badge>
            <div
              className={`h-2 w-2 rounded-full ${urgencyConfig.color} animate-pulse`}
            />
            <span className={`text-xs font-medium ${urgencyConfig.textColor}`}>
              {urgencyConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content - Swipeable */}
      <div
        className="p-4 space-y-4 pb-32"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Context Cards */}
        {currentDecision.checkpoint === "go_nogo" && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Risque</div>
                <div className="text-2xl font-bold">
                  {(currentDecision.context?.risk_score as number | string) ?? "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Opportunité</div>
                <div className="text-2xl font-bold">
                  {(currentDecision.context?.opportunity_score as number | string) ?? "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentDecision.checkpoint === "price_review" && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total HT</span>
                <span className="font-bold">
                  {formatCurrency(currentDecision.context?.total_ht as number)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Marge</span>
                <Badge variant="secondary">
                  {(currentDecision.context?.margin_percent as number) ?? 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendation */}
        {currentDecision.ai_recommendation && (
          <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-indigo-900 dark:text-indigo-100">
                <AlertCircle className="h-4 w-4" />
                Recommandation IA
                <Badge
                  variant="secondary"
                  className="ml-auto bg-indigo-100 text-indigo-900"
                >
                  {Math.round(currentDecision.ai_recommendation.confidence * 100)}%
                </Badge>
              </div>
              <p className="text-sm text-indigo-800 dark:text-indigo-200">
                {currentDecision.ai_recommendation.reasoning}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Decision Buttons - GO/NO-GO specific */}
        {currentDecision.checkpoint === "go_nogo" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Votre décision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={decision === "GO" ? "default" : "outline"}
                  className={`h-20 flex flex-col gap-2 ${
                    decision === "GO"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : ""
                  }`}
                  onClick={() => setDecision("GO")}
                >
                  <ThumbsUp className="h-5 w-5" />
                  <span className="text-sm font-semibold">GO</span>
                </Button>
                <Button
                  variant={decision === "REVIEW" ? "default" : "outline"}
                  className={`h-20 flex flex-col gap-2 ${
                    decision === "REVIEW"
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : ""
                  }`}
                  onClick={() => setDecision("REVIEW")}
                >
                  <Edit3 className="h-5 w-5" />
                  <span className="text-sm font-semibold">Revoir</span>
                </Button>
                <Button
                  variant={decision === "NO_GO" ? "default" : "outline"}
                  className={`h-20 flex flex-col gap-2 ${
                    decision === "NO_GO"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : ""
                  }`}
                  onClick={() => setDecision("NO_GO")}
                >
                  <ThumbsDown className="h-5 w-5" />
                  <span className="text-sm font-semibold">NO GO</span>
                </Button>
              </div>

              <Textarea
                placeholder="Commentaire optionnel..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>
        )}

        {/* Comment for other checkpoints */}
        {currentDecision.checkpoint !== "go_nogo" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Votre commentaire</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ajoutez vos observations..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </CardContent>
          </Card>
        )}

        {/* Swipe hint */}
        {pendingDecisions.length > 1 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {hasPrevious && <ChevronLeft className="h-4 w-4" />}
            <span>Glissez pour naviguer</span>
            {hasNext && <ChevronRight className="h-4 w-4" />}
          </div>
        )}
      </div>

      {/* Bottom Actions - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 space-y-3">
        {currentDecision.checkpoint === "go_nogo" ? (
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={() =>
              handleSubmit(
                decision === "GO"
                  ? "approve"
                  : decision === "NO_GO"
                    ? "reject"
                    : "modify"
              )
            }
            disabled={!decision || submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Confirmer
              </>
            )}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12"
              onClick={() => handleSubmit("reject")}
              disabled={submitMutation.isPending}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Rejeter
            </Button>
            <Button
              className="h-12"
              onClick={() => handleSubmit("approve")}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5 mr-2" />
              )}
              Valider
            </Button>
          </div>
        )}

        {/* Navigation buttons */}
        {pendingDecisions.length > 1 && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNext} disabled={!hasNext}>
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
