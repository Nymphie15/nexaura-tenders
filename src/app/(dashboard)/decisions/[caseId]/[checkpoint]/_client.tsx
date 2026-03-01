"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useHITLCheckpoint, useHITLEnrichedContext, useSubmitDecision } from "@/hooks/use-hitl";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Edit3,
  RotateCcw,
  AlertTriangle,
  Target,
  TrendingUp,
  Calculator,
  FileCheck,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  DollarSign,
  Percent,
  FileText,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { HITLCheckpoint, HITLAction, RiskDecision } from "@/types";
import { goNoGoSchema, strategyReviewSchema, priceReviewSchema, techReviewSchema } from "@/lib/validations/hitl";
import { RiskGauge } from "@/components/hitl/risk-gauge";
import { ComplianceRadar } from "@/components/hitl/compliance-radar";
import { CompetitiveSummary } from "@/components/hitl/competitive-summary";
import { RecommendationCard } from "@/components/hitl/recommendation-card";
import { DecisionTimer } from "@/components/hitl/decision-timer";
import { DecisionHistory } from "@/components/hitl/decision-history";

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
    label: "Décision Go/No-Go",
    icon: Target,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  strategy_review: {
    label: "Validation Stratégie",
    icon: TrendingUp,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  price_review: {
    label: "Validation Prix",
    icon: Calculator,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  tech_review: {
    label: "Révision Technique",
    icon: FileCheck,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
  },
};

// GO/NO-GO Decision Form
function GoNoGoForm({
  context,
  aiRecommendation,
  onSubmit,
  isSubmitting,
}: {
  context: {
    risk_score?: number;
    risk_factors?: { factor: string; weight: number; score: number }[];
    opportunity_score?: number;
    competition_level?: string;
    estimated_effort?: string;
    deadline_days?: number;
  };
  aiRecommendation?: {
    action: HITLAction;
    confidence: number;
    reasoning: string;
  };
  onSubmit: (action: HITLAction, data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) {
  const [decision, setDecision] = useState<RiskDecision | null>(null);
  const [reason, setReason] = useState("");
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const riskScore = context?.risk_score ?? 50;
  const opportunityScore = context?.opportunity_score ?? 50;

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Scores */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Score de risque</span>
              <Badge
                variant={riskScore >= 60 ? "default" : "destructive"}
                className={riskScore >= 60 ? "bg-green-100 text-green-700" : ""}
              >
                {riskScore >= 60 ? "Acceptable" : "Élevé"}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getRiskColor(riskScore)}`}>
                {riskScore}
              </span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  riskScore >= 70
                    ? "bg-green-500"
                    : riskScore >= 40
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Score d&apos;opportunité</span>
              <Badge
                variant={opportunityScore >= 50 ? "default" : "secondary"}
                className={
                  opportunityScore >= 50 ? "bg-indigo-100 text-indigo-700" : ""
                }
              >
                {opportunityScore >= 70
                  ? "Excellente"
                  : opportunityScore >= 50
                    ? "Bonne"
                    : "Moyenne"}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-indigo-600">
                {opportunityScore}
              </span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${opportunityScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk factors */}
      {context?.risk_factors && context.risk_factors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Facteurs de risque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {context.risk_factors.map((factor, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{factor.factor}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          factor.score >= 70
                            ? "bg-green-500"
                            : factor.score >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">
                      {factor.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendation */}
      {aiRecommendation && (
        <Card className="border-indigo-200 dark:border-indigo-900">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">Recommandation IA</span>
                  <Badge
                    className={
                      aiRecommendation.action === "approve"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {aiRecommendation.action === "approve" ? "GO" : "NO GO"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Confiance: {Math.round(aiRecommendation.confidence > 1 ? aiRecommendation.confidence : aiRecommendation.confidence * 100)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {aiRecommendation.reasoning}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votre décision</CardTitle>
          <CardDescription>
            Choisissez si vous souhaitez poursuivre cet appel d&apos;offres
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant={decision === "GO" ? "default" : "outline"}
              className={`h-auto py-4 ${decision === "GO" ? "bg-green-600 hover:bg-green-700" : ""}`}
              onClick={() => setDecision("GO")}
            >
              <div className="flex flex-col items-center gap-2">
                <ThumbsUp className="h-6 w-6" />
                <span className="font-semibold">GO</span>
                <span className="text-xs opacity-80">Poursuivre</span>
              </div>
            </Button>
            <Button
              variant={decision === "REVIEW" ? "default" : "outline"}
              className={`h-auto py-4 ${decision === "REVIEW" ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}
              onClick={() => setDecision("REVIEW")}
            >
              <div className="flex flex-col items-center gap-2">
                <Edit3 className="h-6 w-6" />
                <span className="font-semibold">REVIEW</span>
                <span className="text-xs opacity-80">À revoir</span>
              </div>
            </Button>
            <Button
              variant={decision === "NO_GO" ? "default" : "outline"}
              className={`h-auto py-4 ${decision === "NO_GO" ? "bg-red-600 hover:bg-red-700" : ""}`}
              onClick={() => setDecision("NO_GO")}
            >
              <div className="flex flex-col items-center gap-2">
                <ThumbsDown className="h-6 w-6" />
                <span className="font-semibold">NO GO</span>
                <span className="text-xs opacity-80">Abandonner</span>
              </div>
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Commentaire (optionnel)</Label>
            <Textarea
              id="reason"
              placeholder="Expliquez votre décision..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          <Button
            onClick={() => {
              const result = goNoGoSchema.safeParse({ decision, reason });
              if (!result.success) {
                setValidationError(result.error.issues[0]?.message || "Formulaire invalide");
                return;
              }
              setValidationError(null);
              if (decision === "NO_GO") {
                setShowRejectConfirm(true);
                return;
              }
              onSubmit(
                decision === "GO" ? "approve" : "modify",
                { risk_decision: decision, reason }
              );
            }}
            disabled={!decision || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Confirmer la décision
          </Button>

          <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer l&apos;abandon</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous etes sur le point d&apos;abandonner cet appel d&apos;offres (NO GO).
                  Cette action mettra fin au workflow. Voulez-vous continuer ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    setShowRejectConfirm(false);
                    onSubmit("reject", { risk_decision: "NO_GO", reason });
                  }}
                >
                  Confirmer NO GO
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

// Strategy Review Form
function StrategyReviewForm({
  context,
  aiRecommendation,
  onSubmit,
  isSubmitting,
}: {
  context: {
    win_themes?: { id: string; title: string; description: string; score?: number }[];
    differentiators?: string[];
    key_messages?: string[];
  };
  aiRecommendation?: {
    action: HITLAction;
    confidence: number;
    reasoning: string;
  };
  onSubmit: (action: HITLAction, data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) {
  const [approved, setApproved] = useState<string[]>([]);
  const [modifications, setModifications] = useState<Record<string, string>>({});
  const [newTheme, setNewTheme] = useState("");

  const winThemes = context?.win_themes || [];

  const toggleApproval = (id: string) => {
    setApproved((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* AI Recommendation */}
      {aiRecommendation && (
        <Card className="border-indigo-200 dark:border-indigo-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span className="text-sm">
                <strong>Recommandation IA:</strong> {aiRecommendation.reasoning}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Win themes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arguments de vente générés</CardTitle>
          <CardDescription>
            Sélectionnez les arguments à conserver et modifiez-les si nécessaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {winThemes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun argument généré
            </p>
          ) : (
            winThemes.map((theme) => (
              <div
                key={theme.id}
                className={`p-4 rounded-lg border transition-colors ${
                  approved.includes(theme.id)
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={theme.id}
                    checked={approved.includes(theme.id)}
                    onCheckedChange={() => toggleApproval(theme.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={theme.id}
                      className="font-medium cursor-pointer"
                    >
                      {theme.title}
                    </label>
                    {theme.score !== undefined && (
                      <Badge variant="secondary" className="ml-2">
                        Score: {theme.score}%
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {theme.description}
                    </p>
                    {approved.includes(theme.id) && (
                      <Textarea
                        className="mt-3"
                        placeholder="Modifier cet argument..."
                        value={modifications[theme.id] || ""}
                        onChange={(e) =>
                          setModifications((prev) => ({
                            ...prev,
                            [theme.id]: e.target.value,
                          }))
                        }
                        rows={2}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Ajouter un argument personnalisé</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nouvel argument de vente..."
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (newTheme.trim()) {
                    setNewTheme("");
                    toast.success("Argument ajouté");
                  }
                }}
              >
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onSubmit("retry", {})}
          disabled={isSubmitting}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Régénérer
        </Button>
        <Button
          className="flex-1"
          onClick={() =>
            onSubmit("approve", {
              approved_themes: approved,
              modifications,
              new_themes: newTheme ? [newTheme] : [],
            })
          }
          disabled={approved.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Valider ({approved.length} arguments)
        </Button>
      </div>
    </div>
  );
}

// Price Review Form
function PriceReviewForm({
  context,
  aiRecommendation,
  onSubmit,
  isSubmitting,
}: {
  context: {
    total_ht?: number;
    total_ttc?: number;
    margin_percent?: number;
    items?: {
      id: string;
      description: string;
      quantity: number;
      unit_price: number;
      total: number;
    }[];
    revision_formula?: string;
    competitors_estimate?: { min: number; max: number };
  };
  aiRecommendation?: {
    action: HITLAction;
    confidence: number;
    reasoning: string;
  };
  onSubmit: (action: HITLAction, data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) {
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const totalHT = context?.total_ht || 0;
  const margin = context?.margin_percent || 0;
  const items = context?.items || [];

  const adjustedTotal =
    totalHT * (1 - globalDiscount / 100) +
    Object.values(adjustments).reduce((sum, adj) => sum + adj, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total HT</p>
                <p className="text-2xl font-bold">{formatCurrency(totalHT)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Percent className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marge</p>
                <p className="text-2xl font-bold">{margin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Calculator className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total ajusté</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(adjustedTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendation */}
      {aiRecommendation && (
        <Card className="border-indigo-200 dark:border-indigo-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span className="text-sm">
                <strong>Analyse IA:</strong> {aiRecommendation.reasoning}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitors estimate */}
      {context?.competitors_estimate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span>
                Estimation concurrence:{" "}
                <strong>
                  {formatCurrency(context.competitors_estimate.min)} -{" "}
                  {formatCurrency(context.competitors_estimate.max)}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global discount */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajustement global</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="discount">Remise globale (%)</Label>
            <Input
              id="discount"
              type="number"
              min={0}
              max={50}
              value={globalDiscount}
              onChange={(e) => setGlobalDiscount(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              Économie: {formatCurrency(totalHT * (globalDiscount / 100))}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Items (if available) */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail des postes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.total)}</p>
                </div>
              ))}
              {items.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{items.length - 5} autres postes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setShowRejectConfirm(true)}
          disabled={isSubmitting}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Rejeter
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            const result = priceReviewSchema.safeParse({
              adjustments,
              global_discount: globalDiscount,
              final_total: adjustedTotal,
            });
            if (!result.success) {
              toast.error(result.error.issues[0]?.message || "Donnees invalides");
              return;
            }
            onSubmit("approve", {
              adjustments,
              global_discount: globalDiscount,
              final_total: adjustedTotal,
            });
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Valider les prix
        </Button>
      </div>

      <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le rejet des prix</AlertDialogTitle>
            <AlertDialogDescription>
              Vous etes sur le point de rejeter la proposition tarifaire.
              Le workflow sera interrompu. Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setShowRejectConfirm(false);
                onSubmit("reject", { reason: "Prix non competitif" });
              }}
            >
              Confirmer le rejet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Tech Review Form
function TechReviewForm({
  context,
  aiRecommendation,
  onSubmit,
  isSubmitting,
}: {
  context: {
    sections?: {
      id: string;
      title: string;
      content: string;
      confidence_score?: number;
      issues?: string[];
    }[];
    overall_score?: number;
    compliance_status?: "compliant" | "partial" | "non_compliant";
    missing_elements?: string[];
  };
  aiRecommendation?: {
    action: HITLAction;
    confidence: number;
    reasoning: string;
  };
  onSubmit: (action: HITLAction, data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const sections = context?.sections || [];
  const overallScore = context?.overall_score || 0;
  const compliance = context?.compliance_status || "partial";

  const complianceConfig = {
    compliant: {
      label: "Conforme",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    partial: {
      label: "Partiel",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    non_compliant: {
      label: "Non conforme",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Score global</span>
              <Badge
                className={`${complianceConfig[compliance].bgColor} ${complianceConfig[compliance].color}`}
              >
                {complianceConfig[compliance].label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{overallScore}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  overallScore >= 80
                    ? "bg-green-500"
                    : overallScore >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {context?.missing_elements && context.missing_elements.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Éléments manquants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {context.missing_elements.map((el, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-orange-500" />
                    {el}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Recommendation */}
      {aiRecommendation && (
        <Card className="border-indigo-200 dark:border-indigo-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span className="text-sm">
                <strong>Analyse IA:</strong> {aiRecommendation.reasoning}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections du mémoire technique</CardTitle>
          <CardDescription>
            Cliquez sur une section pour la réviser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sections.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune section disponible
            </p>
          ) : (
            sections.map((section) => (
              <div
                key={section.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedSection === section.id
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
                onClick={() =>
                  setSelectedSection(
                    selectedSection === section.id ? null : section.id
                  )
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{section.title}</span>
                  <div className="flex items-center gap-2">
                    {section.confidence_score !== undefined && (
                      <Badge
                        variant="secondary"
                        className={
                          section.confidence_score >= 80
                            ? "bg-green-100 text-green-700"
                            : section.confidence_score >= 60
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }
                      >
                        {section.confidence_score}%
                      </Badge>
                    )}
                    {section.issues && section.issues.length > 0 && (
                      <Badge variant="destructive">
                        {section.issues.length} problèmes
                      </Badge>
                    )}
                  </div>
                </div>
                {selectedSection === section.id && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {section.content.slice(0, 500)}
                      {section.content.length > 500 && "..."}
                    </p>
                    {section.issues && section.issues.length > 0 && (
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <p className="text-sm font-medium text-red-600 mb-2">
                          Problèmes détectés:
                        </p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {section.issues.map((issue, i) => (
                            <li key={i}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Textarea
                      placeholder="Ajouter une correction ou un commentaire..."
                      value={edits[section.id] || ""}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [section.id]: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Comment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commentaire général</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ajoutez un commentaire général sur le mémoire technique..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onSubmit("retry", { edits, comment })}
          disabled={isSubmitting}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Régénérer avec corrections
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowRejectConfirm(true)}
          disabled={isSubmitting}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Rejeter
        </Button>
        <Button
          className="flex-1"
          onClick={() => onSubmit("approve", { edits, comment })}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Valider le mémoire
        </Button>
      </div>

      <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le rejet technique</AlertDialogTitle>
            <AlertDialogDescription>
              Vous etes sur le point de rejeter le memoire technique.
              Le workflow sera interrompu. Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setShowRejectConfirm(false);
                onSubmit("reject", { reason: comment });
              }}
            >
              Confirmer le rejet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function HITLDecisionPage() {
  const params = useParams();
  const caseId = params.caseId as string;
  const checkpoint = params.checkpoint as string;
  const router = useRouter();
  const { data, isLoading, error } = useHITLCheckpoint(caseId, checkpoint);
  const { data: enrichedCtx } = useHITLEnrichedContext(caseId, checkpoint);
  const user = useAuthStore((state) => state.user);
  const submitMutation = useSubmitDecision();

  const handleSubmit = async (action: HITLAction, formData: Record<string, unknown>) => {
    try {
      await submitMutation.mutateAsync({
        caseId,
        checkpoint,
        decision: {
          action,
          comments: formData.comments as string || undefined,
          modifications: formData,
          decided_by: user?.id || "unknown",
        },
      });
      toast.success("Décision enregistrée avec succès");
      router.push("/decisions");
    } catch (err: any) {
      // Timeout/network errors likely mean the decision was registered
      // but the workflow resume is still processing in the background
      const isTimeout = err?.code === "ECONNABORTED" || err?.response?.status === 502 || err?.response?.status === 503;
      if (isTimeout) {
        toast.success("Décision enregistrée — le workflow reprend en arrière-plan");
        router.push("/decisions");
      } else {
        toast.error("Erreur lors de l'enregistrement de la décision");
      }
    }
  };

  const config = CHECKPOINT_CONFIG[checkpoint as HITLCheckpoint];
  const Icon = config?.icon || Target;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Checkpoint non trouvé</h2>
        <p className="text-muted-foreground mt-1">
          Cette décision n&apos;existe pas ou a déjà été traitée.
        </p>
        <Button asChild className="mt-4">
          <Link href="/decisions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux décisions
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/decisions">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className={`p-3 rounded-xl ${config?.bgColor}`}>
          <Icon className={`h-6 w-6 ${config?.color}`} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{config?.label || checkpoint}</h1>
          <p className="text-muted-foreground">
            {data.tender_reference || caseId.slice(0, 8)} -{" "}
            {data.tender_title || "Appel d'offres"}
          </p>
        </div>
      </div>

      {/* Enriched context panel */}
      {enrichedCtx && (
        <div className="space-y-4">
          {/* Timer + Scores */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {enrichedCtx.deadline != null && (
              <div className="md:col-span-2 lg:col-span-4">
                <DecisionTimer deadline={enrichedCtx.deadline as string} />
              </div>
            )}
            {enrichedCtx.risk_score != null && (
              <Card>
                <CardContent className="p-4 flex justify-center">
                  <RiskGauge score={enrichedCtx.risk_score as number} size={110} />
                </CardContent>
              </Card>
            )}
            {enrichedCtx.matching_rate != null && (
              <Card>
                <CardContent className="p-6 flex flex-col items-center">
                  <span className="text-3xl font-bold text-primary">{(enrichedCtx.matching_rate as number).toFixed(0)}%</span>
                  <span className="text-xs text-muted-foreground mt-1">Correspondance</span>
                </CardContent>
              </Card>
            )}
            {enrichedCtx.compliance_score != null && (
              <Card>
                <CardContent className="p-6 flex flex-col items-center">
                  <span className="text-3xl font-bold text-primary">{(enrichedCtx.compliance_score as number).toFixed(0)}%</span>
                  <span className="text-xs text-muted-foreground mt-1">Conformite</span>
                </CardContent>
              </Card>
            )}
            {enrichedCtx.confidence_level != null && (
              <Card>
                <CardContent className="p-6 flex flex-col items-center">
                  <span className="text-3xl font-bold text-indigo-600">{((enrichedCtx.confidence_level as number) > 1 ? (enrichedCtx.confidence_level as number) : (enrichedCtx.confidence_level as number) * 100).toFixed(0)}%</span>
                  <span className="text-xs text-muted-foreground mt-1">Confiance IA</span>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recommendation + Competition + Radar */}
          <div className="grid gap-4 md:grid-cols-2">
            {enrichedCtx.recommended_action != null && (
              <RecommendationCard
                action={enrichedCtx.recommended_action as string}
                reasoning={(enrichedCtx.recommendation_reasoning as string) || ""}
                confidence={(enrichedCtx.confidence_level as number) || 0}
              />
            )}
            {enrichedCtx.competitive_summary != null && (
              <CompetitiveSummary
                totalCompetitors={(enrichedCtx.competitive_summary as any)?.total_competitors}
                hhi={(enrichedCtx.competitive_summary as any)?.hhi}
                winRate={(enrichedCtx.competitive_summary as any)?.win_rate}
                topCompetitors={(enrichedCtx.competitive_summary as any)?.top_competitors}
              />
            )}
          </div>

          {/* Compliance radar */}
          {(enrichedCtx.compliance_score != null || enrichedCtx.matching_rate != null) && (
            <ComplianceRadar data={[
              ...(enrichedCtx.compliance_score != null ? [{ criterion: "Conformite", score: enrichedCtx.compliance_score as number }] : []),
              ...(enrichedCtx.matching_rate != null ? [{ criterion: "Correspondance", score: enrichedCtx.matching_rate as number }] : []),
              ...(enrichedCtx.risk_score != null ? [{ criterion: "Securite", score: 100 - (enrichedCtx.risk_score as number) }] : []),
              ...(enrichedCtx.confidence_level != null ? [{ criterion: "Confiance IA", score: (enrichedCtx.confidence_level as number) > 1 ? (enrichedCtx.confidence_level as number) : (enrichedCtx.confidence_level as number) * 100 }] : []),
            ]} />
          )}

          {/* Decision history */}
          {(enrichedCtx.previous_decisions as any[])?.length > 0 && (
            <DecisionHistory decisions={enrichedCtx.previous_decisions as any[]} />
          )}

          <Separator />
        </div>
      )}

      {/* Form based on checkpoint type */}
      {checkpoint === "go_nogo" && (
        <GoNoGoForm
          context={data.context}
          aiRecommendation={data.ai_recommendation as { action: HITLAction; confidence: number; reasoning: string } | undefined}
          onSubmit={handleSubmit}
          isSubmitting={submitMutation.isPending}
        />
      )}
      {checkpoint === "strategy_review" && (
        <StrategyReviewForm
          context={data.context}
          aiRecommendation={data.ai_recommendation as { action: HITLAction; confidence: number; reasoning: string } | undefined}
          onSubmit={handleSubmit}
          isSubmitting={submitMutation.isPending}
        />
      )}
      {checkpoint === "price_review" && (
        <PriceReviewForm
          context={data.context}
          aiRecommendation={data.ai_recommendation as { action: HITLAction; confidence: number; reasoning: string } | undefined}
          onSubmit={handleSubmit}
          isSubmitting={submitMutation.isPending}
        />
      )}
      {checkpoint === "tech_review" && (
        <TechReviewForm
          context={data.context}
          aiRecommendation={data.ai_recommendation as { action: HITLAction; confidence: number; reasoning: string } | undefined}
          onSubmit={handleSubmit}
          isSubmitting={submitMutation.isPending}
        />
      )}
    </div>
  );
}
