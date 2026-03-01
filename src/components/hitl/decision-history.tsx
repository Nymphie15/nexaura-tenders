"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Edit3, RotateCcw } from "lucide-react";

interface Decision {
  checkpoint: string;
  decision?: string;
  action?: string;
  decided_at?: string;
  comments?: string;
}

interface DecisionHistoryProps {
  decisions: Decision[];
}

const decisionIcons: Record<string, React.ReactNode> = {
  approve: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  reject: <XCircle className="h-4 w-4 text-red-500" />,
  modify: <Edit3 className="h-4 w-4 text-amber-500" />,
  retry: <RotateCcw className="h-4 w-4 text-blue-500" />,
};

const checkpointLabels: Record<string, string> = {
  go_nogo: "Go/No-Go",
  GO_NOGO: "Go/No-Go",
  strategy_review: "Strategie",
  STRATEGY_REVIEW: "Strategie",
  price_review: "Prix",
  PRICE_REVIEW: "Prix",
  tech_review: "Technique",
  TECH_REVIEW: "Technique",
};

export function DecisionHistory({ decisions }: DecisionHistoryProps) {
  if (!decisions.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-2">Premiere decision sur ce cas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Historique des decisions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {decisions.map((d, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {decisionIcons[(d.decision || d.action || "approve").toLowerCase()] || decisionIcons.approve}
                </div>
                {i < decisions.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {checkpointLabels[d.checkpoint] || d.checkpoint}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">{d.decision || d.action}</span>
                </div>
                {d.decided_at && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(d.decided_at).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                )}
                {d.comments && (
                  <p className="text-xs text-muted-foreground mt-1 italic">&quot;{d.comments}&quot;</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
