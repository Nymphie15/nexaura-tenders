"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, BarChart3 } from "lucide-react";

interface CompetitiveSummaryProps {
  totalCompetitors?: number;
  hhi?: number;
  winRate?: number;
  topCompetitors?: Array<{ name: string; wins: number }>;
}

export function CompetitiveSummary({
  totalCompetitors = 0,
  hhi = 0,
  winRate = 0,
  topCompetitors = [],
}: CompetitiveSummaryProps) {
  const concentration = hhi > 2500 ? "Concentre" : hhi > 1500 ? "Modere" : "Disperse";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Environnement Concurrentiel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold">{totalCompetitors}</span>
            <span className="text-[10px] text-muted-foreground">Concurrents</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold">{hhi}</span>
            <span className="text-[10px] text-muted-foreground">{concentration}</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold">{winRate}%</span>
            <span className="text-[10px] text-muted-foreground">Win Rate</span>
          </div>
        </div>
        {topCompetitors.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Top concurrents</p>
            {topCompetitors.slice(0, 3).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="truncate">{c.name}</span>
                <span className="text-muted-foreground">{c.wins} gains</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
