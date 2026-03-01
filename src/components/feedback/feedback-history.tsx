"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  History,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Edit3,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCorrectionHistory, useFeedbackStats } from "@/hooks/use-feedback";

export interface FeedbackHistoryProps {
  /** Filter by section type */
  sectionType?: string;
  /** Maximum items to display initially */
  initialLimit?: number;
  /** Show stats summary */
  showStats?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Full correction history view with filtering and statistics.
 *
 * Features:
 * - Filterable by section type
 * - Shows correction statistics
 * - Expandable correction details
 * - Learning progress indicators
 *
 * Usage:
 * ```tsx
 * <FeedbackHistory showStats sectionType="methodologie" />
 * ```
 */
export function FeedbackHistory({
  sectionType: initialSectionType,
  initialLimit = 10,
  showStats = true,
  className,
}: FeedbackHistoryProps) {
  const [sectionFilter, setSectionFilter] = React.useState<string>(
    initialSectionType || "all"
  );
  const [limit, setLimit] = React.useState(initialLimit);
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const {
    data: history,
    isLoading: historyLoading,
    refetch: refetchHistory,
    isFetching,
  } = useCorrectionHistory({
    limit,
    section_type: sectionFilter === "all" ? undefined : sectionFilter,
  });

  const { data: stats, isLoading: statsLoading } = useFeedbackStats();

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getSectionTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      presentation: <BookOpen className="h-4 w-4" />,
      methodologie: <Edit3 className="h-4 w-4" />,
      references: <MessageSquare className="h-4 w-4" />,
    };
    return icons[type] || <Edit3 className="h-4 w-4" />;
  };

  const getCorrectionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      style: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      structure: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      terminology: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      addition: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      deletion: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      reformulation: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    };
    return colors[type] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  const getCorrectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      style: "Style",
      structure: "Structure",
      terminology: "Terminologie",
      addition: "Ajout",
      deletion: "Suppression",
      reformulation: "Reformulation",
    };
    return labels[type] || type;
  };

  const sectionTypes = [
    { value: "all", label: "Toutes les sections" },
    { value: "presentation", label: "Presentation" },
    { value: "methodologie", label: "Methodologie" },
    { value: "references", label: "References" },
    { value: "planning", label: "Planning" },
    { value: "moyens", label: "Moyens" },
    { value: "prix", label: "Prix" },
  ];

  return (
    <div className={cn("feedback-history space-y-6", className)}>
      {/* Stats Summary */}
      {showStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </>
          ) : stats ? (
            <>
              <StatCard
                title="Total corrections"
                value={stats.total_corrections}
                icon={<Edit3 className="h-5 w-5" />}
                trend={stats.corrections_processed > 0 ? "+12%" : undefined}
              />
              <StatCard
                title="Patterns detectes"
                value={stats.patterns_extracted}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <StatCard
                title="Preferences apprises"
                value={stats.preferences_learned}
                icon={<BookOpen className="h-5 w-5" />}
              />
              <StatCard
                title="Taux de modification"
                value={`${Math.round(stats.avg_change_ratio * 100)}%`}
                icon={<RefreshCw className="h-5 w-5" />}
              />
            </>
          ) : null}
        </div>
      )}

      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Historique des corrections</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Section filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par section" />
              </SelectTrigger>
              <SelectContent>
                {sectionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchHistory()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      {/* Correction list */}
      <div className="space-y-3">
        {historyLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </>
        ) : history && history.length > 0 ? (
          <>
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg border border-border bg-card shadow-sm"
              >
                {/* Header */}
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {getSectionTypeIcon(item.section_type)}
                    </div>
                    <div>
                      <p className="font-medium">{item.section_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Correction types */}
                    <div className="hidden flex-wrap gap-1 sm:flex">
                      {item.correction_types.slice(0, 2).map((type) => (
                        <Badge
                          key={type}
                          variant="secondary"
                          className={cn("text-xs", getCorrectionTypeColor(type))}
                        >
                          {getCorrectionTypeLabel(type)}
                        </Badge>
                      ))}
                      {item.correction_types.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.correction_types.length - 2}
                        </Badge>
                      )}
                    </div>

                    {/* Change ratio */}
                    <Badge variant="outline" className="text-xs">
                      {Math.round(item.change_ratio * 100)}% modifie
                    </Badge>

                    {/* Expand icon */}
                    {expandedItems.has(item.id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {expandedItems.has(item.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border px-4 pb-4"
                  >
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {/* Original */}
                      <div className="rounded-md border border-dashed border-destructive/30 bg-destructive/5 p-3">
                        <p className="mb-2 text-xs font-medium text-destructive">
                          Original
                        </p>
                        <p className="text-sm text-muted-foreground line-through">
                          {item.original_preview || "Contenu original non disponible"}
                        </p>
                      </div>

                      {/* Modified */}
                      <div className="rounded-md border border-dashed border-emerald-500/30 bg-emerald-500/5 p-3">
                        <p className="mb-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Corrige
                        </p>
                        <p className="text-sm text-foreground">
                          {item.modified_preview || "Contenu modifie non disponible"}
                        </p>
                      </div>
                    </div>

                    {/* All correction types (mobile) */}
                    <div className="mt-3 flex flex-wrap gap-1 sm:hidden">
                      {item.correction_types.map((type) => (
                        <Badge
                          key={type}
                          variant="secondary"
                          className={cn("text-xs", getCorrectionTypeColor(type))}
                        >
                          {getCorrectionTypeLabel(type)}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}

            {/* Load more */}
            {history.length >= limit && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setLimit((prev) => prev + 10)}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    "Voir plus"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <History className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">Aucune correction</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vos corrections apparaitront ici une fois que vous aurez modifie du
              contenu genere.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Statistics card component.
 */
function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {trend}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

export default FeedbackHistory;
