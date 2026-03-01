/**
 * @file activity-widget.tsx
 * @description Widget d'activite recente pour le dashboard
 * @module components/dashboard/widgets
 *
 * Affiche un fil d'activite temps reel avec support pour:
 * - Differents types d'evenements (creation, mise a jour, alerte, etc.)
 * - Timestamps relatifs
 * - Actions rapides sur chaque element
 * - Pagination ou scroll infini
 *
 * @example
 * <ActivityWidget
 *   activities={activities}
 *   onActivityClick={(activity) => handleClick(activity)}
 *   maxItems={10}
 * />
 */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreVertical,
  Eye,
  ExternalLink,
  Bell,
  User,
  Settings,
  RefreshCw,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/** Types d'activite supportes */
export type ActivityType =
  | "tender_created"
  | "tender_updated"
  | "tender_submitted"
  | "tender_won"
  | "tender_lost"
  | "alert"
  | "hitl_required"
  | "user_action"
  | "system";

/** Structure d'une activite */
export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date | string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
  read?: boolean;
  actionUrl?: string;
}

/** Props du composant ActivityWidget */
export interface ActivityWidgetProps {
  /** Liste des activites a afficher */
  activities: ActivityItem[];
  /** Callback au clic sur une activite */
  onActivityClick?: (activity: ActivityItem) => void;
  /** Nombre maximum d'elements a afficher */
  maxItems?: number;
  /** Hauteur du widget */
  height?: string | number;
  /** Etat de chargement */
  loading?: boolean;
  /** Callback pour charger plus d'activites */
  onLoadMore?: () => Promise<void>;
  /** Indique s'il y a plus d'activites a charger */
  hasMore?: boolean;
  /** Callback pour rafraichir */
  onRefresh?: () => Promise<void>;
  /** Filtrer par type */
  filterTypes?: ActivityType[];
  /** Classes CSS additionnelles */
  className?: string;
}

/** Configuration des types d'activite */
const activityConfig: Record<ActivityType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  tender_created: {
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Nouvel appel d'offres",
  },
  tender_updated: {
    icon: RefreshCw,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    label: "Mise a jour",
  },
  tender_submitted: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Soumission",
  },
  tender_won: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    label: "Gagne",
  },
  tender_lost: {
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Perdu",
  },
  alert: {
    icon: Bell,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    label: "Alerte",
  },
  hitl_required: {
    icon: User,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    label: "Action requise",
  },
  user_action: {
    icon: User,
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    label: "Action utilisateur",
  },
  system: {
    icon: Settings,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    label: "Systeme",
  },
};

/**
 * Widget d'activite recente
 * Affiche un fil d'activite avec filtres et actions
 */
export function ActivityWidget({
  activities,
  onActivityClick,
  maxItems = 10,
  height = 400,
  loading = false,
  onLoadMore,
  hasMore = false,
  onRefresh,
  filterTypes,
  className,
}: ActivityWidgetProps) {
  const [selectedFilter, setSelectedFilter] = useState<ActivityType | "all">("all");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filtrer les activites
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (filterTypes && filterTypes.length > 0) {
      filtered = filtered.filter(a => filterTypes.includes(a.type));
    }

    if (selectedFilter !== "all") {
      filtered = filtered.filter(a => a.type === selectedFilter);
    }

    return filtered.slice(0, maxItems);
  }, [activities, filterTypes, selectedFilter, maxItems]);

  // Formater le timestamp
  const formatTimestamp = (timestamp: Date | string): string => {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  // Charger plus d'activites
  const handleLoadMore = async () => {
    if (onLoadMore) {
      setIsLoadingMore(true);
      await onLoadMore();
      setIsLoadingMore(false);
    }
  };

  // Types uniques pour le filtre
  const uniqueTypes = useMemo(() => {
    const types = new Set(activities.map(a => a.type));
    return Array.from(types);
  }, [activities]);

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base font-medium">Activite recente</CardTitle>
          {activities.filter(a => !a.read).length > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {activities.filter(a => !a.read).length} nouveau(x)
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-3.5 w-3.5 mr-1" />
                {selectedFilter === "all" ? "Tous" : activityConfig[selectedFilter]?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedFilter("all")}>
                Tous les types
              </DropdownMenuItem>
              {uniqueTypes.map((type) => (
                <DropdownMenuItem key={type} onClick={() => setSelectedFilter(type)}>
                  {activityConfig[type]?.label || type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {onRefresh && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea style={{ height }} className="px-6">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Aucune activite recente</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredActivities.map((activity) => {
                const config = activityConfig[activity.type];
                const Icon = config?.icon || Activity;

                return (
                  <div
                    key={activity.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-colors",
                      "hover:bg-muted/50 cursor-pointer",
                      !activity.read && "bg-primary/5"
                    )}
                    onClick={() => onActivityClick?.(activity)}
                  >
                    <div className={cn("p-2 rounded-full shrink-0", config?.bgColor)}>
                      <Icon className={cn("h-4 w-4", config?.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn(
                            "text-sm font-medium leading-tight",
                            !activity.read && "text-foreground",
                            activity.read && "text-muted-foreground"
                          )}>
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {activity.description}
                            </p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir details
                            </DropdownMenuItem>
                            {activity.actionUrl && (
                              <DropdownMenuItem>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ouvrir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground/70" />
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                        {activity.user && (
                          <>
                            <span className="text-muted-foreground/50">-</span>
                            <span className="text-xs text-muted-foreground">
                              {activity.user.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div className="py-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      "Voir plus"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ActivityWidget;
