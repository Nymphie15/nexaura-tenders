/**
 * @file interactive-line-chart.tsx
 * @description Chart ligne interactif avec drill-down pour le dashboard
 * @module components/dashboard/charts
 *
 * Utilise @tremor/react pour afficher des graphiques en ligne avec:
 * - Support multi-series
 * - Drill-down au clic sur un point
 * - Tooltips personnalises
 * - Animations fluides
 * - Export des donnees
 *
 * @example
 * <InteractiveLineChart
 *   data={chartData}
 *   categories={["submissions", "wins"]}
 *   index="date"
 *   onDrillDown={(point) => handleDrillDown(point)}
 * />
 */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Download,
  Maximize2,
  RefreshCw,
} from "lucide-react";

/** Point de donnees pour le chart */
export interface ChartDataPoint {
  [key: string]: string | number;
}

/** Configuration d'une serie */
export interface SeriesConfig {
  key: string;
  name: string;
  color: string;
  fillOpacity?: number;
}

/** Props du composant InteractiveLineChart */
export interface InteractiveLineChartProps {
  /** Donnees du chart */
  data: ChartDataPoint[];
  /** Cle d'index (axe X) */
  index: string;
  /** Categories a afficher (series) */
  categories: string[];
  /** Configuration des series (optionnel) */
  seriesConfig?: SeriesConfig[];
  /** Titre du chart */
  title?: string;
  /** Description */
  description?: string;
  /** Callback au drill-down */
  onDrillDown?: (point: ChartDataPoint, category: string) => void;
  /** Format de la valeur Y */
  valueFormatter?: (value: number) => string;
  /** Type de chart (line ou area) */
  chartType?: "line" | "area";
  /** Afficher la grille */
  showGrid?: boolean;
  /** Afficher la legende */
  showLegend?: boolean;
  /** Hauteur du chart */
  height?: number;
  /** Etat de chargement */
  loading?: boolean;
  /** Callback pour rafraichir */
  onRefresh?: () => Promise<void>;
  /** Callback pour exporter */
  onExport?: () => void;
  /** Callback pour plein ecran */
  onFullscreen?: () => void;
  /** Classes CSS additionnelles */
  className?: string;
}

/** Couleurs par defaut pour les series */
const defaultColors = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
];

/**
 * Chart ligne interactif avec drill-down
 */
export function InteractiveLineChart({
  data,
  index,
  categories,
  seriesConfig,
  title,
  description,
  onDrillDown,
  valueFormatter = (v) => v.toLocaleString("fr-FR"),
  chartType = "area",
  showGrid = true,
  showLegend = true,
  height = 350,
  loading = false,
  onRefresh,
  onExport,
  onFullscreen,
  className,
}: InteractiveLineChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Configuration des series
  const series = useMemo(() => {
    if (seriesConfig) return seriesConfig;

    return categories.map((cat, i) => ({
      key: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " "),
      color: defaultColors[i % defaultColors.length],
      fillOpacity: 0.3,
    }));
  }, [categories, seriesConfig]);

  // Filtrer les categories
  const visibleSeries = useMemo(() => {
    if (selectedCategory === "all") return series;
    return series.filter((s) => s.key === selectedCategory);
  }, [series, selectedCategory]);

  // Gerer le clic sur un point
  const handleClick = (data: any) => {
    if (onDrillDown && data?.activePayload?.[0]) {
      const payload = data.activePayload[0].payload;
      const category = data.activePayload[0].dataKey;
      onDrillDown(payload, category);
    }
  };

  // Rafraichir
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  // Tooltip personnalise
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[150px]">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium">{valueFormatter(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div
            style={{ height }}
            className="bg-muted/50 rounded animate-pulse"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          {title && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-medium">{title}</CardTitle>
            </div>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filtre de serie */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les series</SelectItem>
              {series.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actions */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          )}

          {onExport && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onExport}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {onFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            onClick={handleClick}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            )}

            <XAxis
              dataKey={index}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />

            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={valueFormatter}
              className="text-muted-foreground"
            />

            <Tooltip content={<CustomTooltip />} />

            {showLegend && (
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            )}

            {visibleSeries.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={chartType === "area" ? (s.fillOpacity ?? 0.3) : 0}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: "hsl(var(--background))",
                  cursor: onDrillDown ? "pointer" : "default",
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>

        {/* Indicateur drill-down */}
        {onDrillDown && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Cliquez sur un point pour voir les details
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default InteractiveLineChart;
