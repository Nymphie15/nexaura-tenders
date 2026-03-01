"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const defaultDimensions = [
  { criterion: "Conformite administrative", score: 75 },
  { criterion: "Capacite technique", score: 82 },
  { criterion: "Solidite financiere", score: 68 },
  { criterion: "References", score: 90 },
  { criterion: "Delais", score: 60 },
];

interface ComplianceRadarProps {
  data?: Array<{
    criterion: string;
    score: number;
    fullMark?: number;
  }>;
  dimensions?: Array<{
    dimension: string;
    score: number;
  }>;
}

export function ComplianceRadar({ data, dimensions }: ComplianceRadarProps) {
  const resolvedData = dimensions
    ? dimensions.map(d => ({ criterion: d.dimension, score: d.score }))
    : data ?? defaultDimensions;

  const chartData = resolvedData.map(d => ({
    ...d,
    fullMark: ("fullMark" in d && d.fullMark) || 100,
  }));

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Conformite</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Aucune donnee de conformite</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Radar de Conformite</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="criterion"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
