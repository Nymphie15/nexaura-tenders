/**
 * @file stats-widget.tsx
 * @description Widget de statistiques en temps réel pour le dashboard
 * @module components/dashboard/widgets
 * 
 * Ce composant affiche des métriques clés avec indicateurs de tendance,
 * support pour le rafraîchissement automatique et animations de transition.
 * 
 * @example
 * <StatsWidget
 *   title="Appels d'offres"
 *   value={156}
 *   previousValue={142}
 *   icon={<FileText />}
 *   trend="up"
 * />
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Info,
} from "lucide-react";

/** Props pour le composant StatsWidget */
export interface StatsWidgetProps {
  /** Titre du widget */
  title: string;
  /** Valeur actuelle à afficher */
  value: number | string;
  /** Valeur précédente pour calcul de tendance */
  previousValue?: number;
  /** Icône à afficher (ReactNode) */
  icon?: React.ReactNode;
  /** Description/tooltip du widget */
  description?: string;
  /** Tendance forcée (sinon calculée automatiquement) */
  trend?: "up" | "down" | "neutral";
  /** Format de la valeur (number, currency, percentage) */
  format?: "number" | "currency" | "percentage";
  /** Devise pour format currency */
  currency?: string;
  /** État de chargement */
  loading?: boolean;
  /** Intervalle de rafraîchissement en ms (0 = désactivé) */
  refreshInterval?: number;
  /** Callback pour rafraîchir les données */
  onRefresh?: () => Promise<void>;
  /** Classes CSS additionnelles */
  className?: string;
  /** Couleur personnalisée pour l'icône */
  iconColor?: string;
  /** Afficher le pourcentage de changement */
  showChangePercentage?: boolean;
}

/**
 * Widget de statistiques temps réel
 * Affiche une métrique avec tendance et possibilité de rafraîchissement
 */
export function StatsWidget({
  title,
  value,
  previousValue,
  icon,
  description,
  trend,
  format = "number",
  currency = "EUR",
  loading = false,
  refreshInterval = 0,
  onRefresh,
  className,
  iconColor = "text-primary",
  showChangePercentage = true,
}: StatsWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  // Animation de transition pour les valeurs
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Rafraîchissement automatique
  useEffect(() => {
    if (refreshInterval > 0 && onRefresh) {
      const interval = setInterval(async () => {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, onRefresh]);

  // Calcul de la tendance
  const calculatedTrend = trend ?? (
    typeof value === "number" && previousValue !== undefined
      ? value > previousValue
        ? "up"
        : value < previousValue
        ? "down"
        : "neutral"
      : "neutral"
  );

  // Calcul du pourcentage de changement
  const changePercentage =
    typeof value === "number" && previousValue !== undefined && previousValue !== 0
      ? (((value - previousValue) / previousValue) * 100).toFixed(1)
      : null;

  // Formatage de la valeur
  const formatValue = (val: number | string): string => {
    if (typeof val === "string") return val;
    
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "number":
      default:
        return new Intl.NumberFormat("fr-FR").format(val);
    }
  };

  // Icône de tendance
  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  }[calculatedTrend];

  const trendColor = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-muted-foreground",
  }[calculatedTrend];

  const trendBgColor = {
    up: "bg-green-500/10",
    down: "bg-red-500/10",
    neutral: "bg-muted",
  }[calculatedTrend];

  if (loading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden transition-all hover:shadow-md", className)}>
      {/* Indicateur de rafraîchissement */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20">
          <div className="h-full bg-primary animate-pulse" style={{ width: "100%" }} />
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className={cn("p-2 rounded-full bg-primary/10", iconColor)}>
          {icon}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold tracking-tight">
              {formatValue(displayValue)}
            </p>
            
            {showChangePercentage && changePercentage !== null && (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="secondary" className={cn("text-xs", trendBgColor, trendColor)}>
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {Math.abs(parseFloat(changePercentage))}%
                </Badge>
                <span className="text-xs text-muted-foreground">
                  vs période précédente
                </span>
              </div>
            )}
          </div>

          {onRefresh && (
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await onRefresh();
                setIsRefreshing(false);
              }}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isRefreshing && "animate-spin")} />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatsWidget;
