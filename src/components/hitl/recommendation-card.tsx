"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";

interface RecommendationCardProps {
  action: string;
  reasoning: string;
  confidence: number;
}

export function RecommendationCard({ action, reasoning, confidence }: RecommendationCardProps) {
  const normalizedConfidence = Math.min(100, Math.max(0, confidence > 1 ? confidence : confidence * 100));
  const actionConfig: Record<string, { label: string; variant: "default" | "destructive" | "secondary"; icon: React.ReactNode }> = {
    approve: { label: "Approuver", variant: "default", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
    reject: { label: "Rejeter", variant: "destructive", icon: <ThumbsDown className="h-3.5 w-3.5" /> },
    modify: { label: "Modifier", variant: "secondary", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    review: { label: "A revoir", variant: "secondary", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  };

  const config = actionConfig[action.toLowerCase()] || actionConfig.review;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Recommandation IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{reasoning || "Aucune justification disponible."}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confiance</span>
            <span className="font-medium">{normalizedConfidence.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${normalizedConfidence}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
