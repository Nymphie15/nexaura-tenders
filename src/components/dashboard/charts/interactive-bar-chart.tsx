/**
 * @file interactive-bar-chart.tsx
 * @description Bar chart interactif pour le dashboard
 * @module components/dashboard/charts
 *
 * Utilise recharts pour afficher des graphiques en barres avec:
 * - Support horizontal et vertical
 * - Barres groupees ou empilees
 * - Drill-down au clic
 * - Tooltips et animations
 *
 * @example
 * <InteractiveBarChart
 *   data={barData}
 *   categories={["won", "lost", "pending"]}
 *   index="month"
 *   layout="vertical"
 *   stacked
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Download,
  Maximize2,
  RefreshCw,
} from "lucide-react";

/** Point de donnees pour le chart */
export interface BarChartDataPoint {
  [key: string]: string | number;
}

/** Configuration d'une serie */
export interface BarSeriesConfig {
  key: string;
  name: string;
  color: string;
}

/** Props du composant InteractiveBarChart */
export interface InteractiveBarChartProps {
  /** Donnees du chart */
  data: BarChartDataPoint[];
  /** Cle d'index (axe X ou Y selon layout) */
  index: string;
  /** Categories a afficher (series) */
  categories: string[];
  /** Configuration des series (optionnel) */
  seriesConfig?: BarSeriesConfig[];
  /** Titre du chart */
  title?: string;
  /** Description */
  description?: string;
  /** Layout du chart */
  layout?: "horizontal" | "vertical";
  /** Barres empilees */
  stacked?: boolean;
  /** Callback au drill-down */
  onDrillDown?: (point: BarChartDataPoint, category: string) => void;
  /** Format de la valeur */
  valueFormatter?: (value: number) => string;
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
  /** Rayon des coins des barres */
  barRadius?: number;
  /** Taille des barres */
  barSize?: number;
}

/** Couleurs par defaut */
const defaultColors = [
  "#22c55e", // green
  "#ef4444", // red
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#06b6d4", // cyan
];

/**
 * Bar chart interactif
 */
export function InteractiveBarChart({
  data,
  index,
  categories,
  seriesConfig,
  title,
  description,
  layout = "horizontal",
  stacked = false,
  onDrillDown,
  valueFormatter = (v) => v.toLocaleString("fr-FR"),
  showGrid = true,
  showLegend = true,
  height = 350,
  loading = false,
  onRefresh,
  onExport,
  onFullscreen,
  className,
  barRadius = 4,
  barSize,
}: InteractiveBarChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Configuration des series
  const series = useMemo(() => {
    if (seriesConfig) return seriesConfig;

    return categories.map((cat, i) => ({
      key: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " "),
      color: defaultColors[i % defaultColors.length],
    }));
  }, [categories, seriesConfig]);

  // Filtrer les categories
  const visibleSeries = useMemo(() => {
    if (selectedCategory === "all") return series;
    return series.filter((s) => s.key === selectedCategory);
  }, [series, selectedCategory]);

  // Gerer le clic sur une barre
  const handleClick = (data: any, category: string) => {
    if (onDrillDown && data) {
      onDrillDown(data, category);
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
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium">{valueFormatter(entry.value)}</span>
          </div>
        ))}
        {stacked && payload.length > 1 && (
          <div className="mt-2 pt-2 border-t flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">
              {valueFormatter(payload.reduce((sum: number, p: any) => sum + p.value, 0))}
            </span>
          </div>
        )}
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
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
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
          <BarChart
            data={data}
            layout={layout === "vertical" ? "vertical" : "horizontal"}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            onMouseMove={(state: any) => {
              if (state?.activeTooltipIndex !== undefined) {
                setActiveIndex(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            )}

            {layout === "vertical" ? (
              <>
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={valueFormatter}
                  className="text-muted-foreground"
                />
                <YAxis
                  type="category"
                  dataKey={index}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  className="text-muted-foreground"
                />
              </>
            ) : (
              <>
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
              </>
            )}

            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />

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
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                stackId={stacked ? "stack" : undefined}
                radius={[barRadius, barRadius, 0, 0]}
                barSize={barSize}
                onClick={(data) => handleClick(data, s.key)}
                cursor={onDrillDown ? "pointer" : "default"}
              >
                {data.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fillOpacity={activeIndex === null || activeIndex === idx ? 1 : 0.6}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>

        {/* Indicateur drill-down */}
        {onDrillDown && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Cliquez sur une barre pour voir les details
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default InteractiveBarChart;
