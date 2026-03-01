"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RiskGauge } from "./risk-gauge";
import { ComplianceRadar } from "./compliance-radar";
import { CompetitiveSummary } from "./competitive-summary";
import { RecommendationCard } from "./recommendation-card";
import { DecisionTimer } from "./decision-timer";
import { DecisionHistory } from "./decision-history";
import { CheckpointContext } from "./checkpoint-context";
import { CheckCircle2, XCircle, Edit3, RotateCcw, Loader2, FileText } from "lucide-react";

interface HITLEnrichedContext {
  checkpoint: string;
  case_id: string;
  tender_title?: string;
  tender_ref?: string;
  buyer_name?: string;
  deadline?: string;
  budget_estimate?: number;
  risk_score?: number;
  matching_rate?: number;
  compliance_score?: number;
  confidence_level?: number;
  recommended_action?: string;
  recommendation_reasoning?: string;
  checkpoint_data?: Record<string, unknown>;
  previous_decisions?: Array<{
    checkpoint: string;
    decision: string;
    decided_at?: string;
    comments?: string;
  }>;
  competitive_summary?: {
    total_competitors?: number;
    hhi?: number;
    win_rate?: number;
    top_competitors?: Array<{ name: string; wins: number }>;
  };
}

interface HITLDecisionPageProps {
  context: HITLEnrichedContext;
  onSubmit: (action: string, comments: string) => Promise<void>;
  isSubmitting?: boolean;
}

const checkpointTitles: Record<string, string> = {
  go_nogo: "Decision Go / No-Go",
  GO_NOGO: "Decision Go / No-Go",
  strategy_review: "Validation Strategie",
  STRATEGY_REVIEW: "Validation Strategie",
  price_review: "Validation Prix",
  PRICE_REVIEW: "Validation Prix",
  tech_review: "Revue Technique",
  TECH_REVIEW: "Revue Technique",
};

export function HITLDecisionPage({ context, onSubmit, isSubmitting = false }: HITLDecisionPageProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [comments, setComments] = useState("");

  const handleSubmit = async () => {
    if (!selectedAction) return;
    await onSubmit(selectedAction, comments);
  };

  const actions = [
    { key: "approve", label: "Approuver", icon: CheckCircle2, variant: "default" as const, color: "text-green-600" },
    { key: "reject", label: "Rejeter", icon: XCircle, variant: "destructive" as const, color: "text-red-600" },
    { key: "modify", label: "Modifier", icon: Edit3, variant: "secondary" as const, color: "text-amber-600" },
    { key: "retry", label: "Retenter", icon: RotateCcw, variant: "outline" as const, color: "text-blue-600" },
  ];

  // Build compliance radar data from context
  const complianceData = [];
  if (context.compliance_score != null) complianceData.push({ criterion: "Conformite", score: context.compliance_score });
  if (context.matching_rate != null) complianceData.push({ criterion: "Correspondance", score: context.matching_rate });
  if (context.risk_score != null) complianceData.push({ criterion: "Securite", score: 100 - context.risk_score });
  if (context.confidence_level != null) complianceData.push({ criterion: "Confiance IA", score: context.confidence_level * 100 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: Context (2/3) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{context.tender_ref || context.case_id}</Badge>
                    <Badge>{checkpointTitles[context.checkpoint] || context.checkpoint}</Badge>
                  </div>
                  <h2 className="text-lg font-semibold">{context.tender_title || "Appel d'offres"}</h2>
                  {context.buyer_name && (
                    <p className="text-sm text-muted-foreground">{context.buyer_name}</p>
                  )}
                </div>
                {context.budget_estimate != null && context.budget_estimate > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Budget estime</p>
                    <p className="font-semibold">{context.budget_estimate.toLocaleString("fr-FR")} EUR</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timer */}
        <DecisionTimer deadline={context.deadline} />

        {/* Scores row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-around">
                {context.risk_score != null && <RiskGauge score={context.risk_score} size={100} />}
                {context.matching_rate != null && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-bold text-primary">{context.matching_rate.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground">Correspondance</span>
                  </div>
                )}
                {context.compliance_score != null && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-bold text-primary">{context.compliance_score.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground">Conformite</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar + Competition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complianceData.length > 0 && <ComplianceRadar data={complianceData} />}
          {context.competitive_summary && (
            <CompetitiveSummary
              totalCompetitors={context.competitive_summary.total_competitors}
              hhi={context.competitive_summary.hhi}
              winRate={context.competitive_summary.win_rate}
              topCompetitors={context.competitive_summary.top_competitors}
            />
          )}
        </div>

        {/* Checkpoint-specific context */}
        {context.checkpoint_data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <CheckpointContext checkpoint={context.checkpoint} data={context.checkpoint_data} />
          </motion.div>
        )}
      </div>

      {/* Right column: Decision (1/3) */}
      <div className="space-y-4">
        {/* AI Recommendation */}
        {context.recommended_action && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <RecommendationCard
              action={context.recommended_action}
              reasoning={context.recommendation_reasoning || ""}
              confidence={context.confidence_level || 0}
            />
          </motion.div>
        )}

        {/* Decision History */}
        <DecisionHistory decisions={context.previous_decisions || []} />

        {/* Decision Form */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" /> Votre Decision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {actions.map((a) => (
                  <Button
                    key={a.key}
                    variant={selectedAction === a.key ? a.variant : "outline"}
                    size="sm"
                    className={`gap-1.5 ${selectedAction === a.key ? "" : "opacity-70"}`}
                    onClick={() => setSelectedAction(a.key)}
                  >
                    <a.icon className={`h-3.5 w-3.5 ${selectedAction === a.key ? "" : a.color}`} />
                    {a.label}
                  </Button>
                ))}
              </div>

              <Textarea
                placeholder="Commentaires (optionnel)..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="resize-none"
              />

              <Button
                className="w-full"
                disabled={!selectedAction || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  "Soumettre la decision"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
