/**
 * @file hitl-notifications-widget.tsx
 * @description Widget de notifications HITL (Human-In-The-Loop) pour le dashboard
 * @module components/dashboard/widgets
 *
 * Affiche les taches necessitant une intervention humaine:
 * - Validations requises
 * - Decisions a prendre
 * - Alertes critiques
 * - Actions en attente
 *
 * @example
 * <HITLNotificationsWidget
 *   notifications={hitlTasks}
 *   onAction={(task, action) => handleAction(task, action)}
 * />
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageSquare,
  ArrowRight,
  Loader2,
} from "lucide-react";

/** Priorite d'une tache HITL */
export type HITLPriority = "critical" | "high" | "medium" | "low";

/** Type de tache HITL */
export type HITLTaskType =
  | "validation"
  | "decision"
  | "review"
  | "approval"
  | "correction";

/** Structure d'une notification HITL */
export interface HITLNotification {
  id: string;
  type: HITLTaskType;
  title: string;
  description: string;
  priority: HITLPriority;
  createdAt: Date | string;
  dueAt?: Date | string;
  metadata?: {
    tenderId?: string;
    tenderTitle?: string;
    documentId?: string;
    [key: string]: unknown;
  };
  actions: HITLAction[];
}

/** Action disponible sur une tache HITL */
export interface HITLAction {
  id: string;
  label: string;
  variant: "default" | "destructive" | "outline";
  requiresComment?: boolean;
}

/** Props du composant HITLNotificationsWidget */
export interface HITLNotificationsWidgetProps {
  /** Liste des notifications HITL */
  notifications: HITLNotification[];
  /** Callback quand une action est executee */
  onAction: (notification: HITLNotification, actionId: string, comment?: string) => Promise<void>;
  /** Etat de chargement */
  loading?: boolean;
  /** Hauteur maximum du widget */
  maxHeight?: number;
  /** Classes CSS additionnelles */
  className?: string;
}

/** Configuration des priorites */
const priorityConfig: Record<HITLPriority, {
  color: string;
  bgColor: string;
  label: string;
}> = {
  critical: {
    color: "text-red-600",
    bgColor: "bg-red-500/10 border-red-500/20",
    label: "Critique",
  },
  high: {
    color: "text-orange-500",
    bgColor: "bg-orange-500/10 border-orange-500/20",
    label: "Haute",
  },
  medium: {
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    label: "Moyenne",
  },
  low: {
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    label: "Basse",
  },
};

/** Configuration des types de taches */
const taskTypeConfig: Record<HITLTaskType, {
  icon: React.ElementType;
  label: string;
}> = {
  validation: { icon: CheckCircle2, label: "Validation" },
  decision: { icon: MessageSquare, label: "Decision" },
  review: { icon: User, label: "Revision" },
  approval: { icon: CheckCircle2, label: "Approbation" },
  correction: { icon: AlertCircle, label: "Correction" },
};

/**
 * Widget de notifications HITL
 * Affiche les taches necessitant une intervention humaine
 */
export function HITLNotificationsWidget({
  notifications,
  onAction,
  loading = false,
  maxHeight = 500,
  className,
}: HITLNotificationsWidgetProps) {
  const [selectedNotification, setSelectedNotification] = useState<HITLNotification | null>(null);
  const [selectedAction, setSelectedAction] = useState<HITLAction | null>(null);
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Trier par priorite puis par date
  const sortedNotifications = [...notifications].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Compter par priorite
  const criticalCount = notifications.filter(n => n.priority === "critical").length;
  const highCount = notifications.filter(n => n.priority === "high").length;

  // Gerer l'action
  const handleAction = async () => {
    if (!selectedNotification || !selectedAction) return;

    setIsProcessing(true);
    try {
      await onAction(selectedNotification, selectedAction.id, comment || undefined);
      setSelectedNotification(null);
      setSelectedAction(null);
      setComment("");
    } finally {
      setIsProcessing(false);
    }
  };

  // Formater la date
  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("flex flex-col", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base font-medium">Actions requises</CardTitle>
            {notifications.length > 0 && (
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
                {notifications.length}
              </Badge>
            )}
          </div>

          {(criticalCount > 0 || highCount > 0) && (
            <div className="flex items-center gap-1">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalCount} critique{criticalCount > 1 ? "s" : ""}
                </Badge>
              )}
              {highCount > 0 && (
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 text-xs">
                  {highCount} haute{highCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <ScrollArea style={{ maxHeight }} className="px-6 pb-6">
            {sortedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mb-2 opacity-50 text-green-500" />
                <p className="text-sm">Aucune action requise</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedNotifications.map((notification) => {
                  const priorityCfg = priorityConfig[notification.priority];
                  const typeCfg = taskTypeConfig[notification.type];
                  const TypeIcon = typeCfg.icon;

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        priorityCfg.bgColor,
                        "hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-full bg-background/50")}>
                            <TypeIcon className={cn("h-4 w-4", priorityCfg.color)} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {typeCfg.label}
                              </Badge>
                              <Badge variant="outline" className={cn("text-xs", priorityCfg.color)}>
                                {priorityCfg.label}
                              </Badge>
                            </div>

                            <h4 className="font-medium text-sm mb-1">
                              {notification.title}
                            </h4>

                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {notification.description}
                            </p>

                            {notification.metadata?.tenderTitle && (
                              <p className="text-xs text-muted-foreground/70 mb-2">
                                Appel d'offres: {notification.metadata.tenderTitle}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(notification.createdAt)}
                              </span>
                              {notification.dueAt && (
                                <span className="flex items-center gap-1 text-orange-500">
                                  <AlertCircle className="h-3 w-3" />
                                  Echeance: {formatDate(notification.dueAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                        {notification.actions.map((action) => (
                          <Button
                            key={action.id}
                            variant={action.variant}
                            size="sm"
                            onClick={() => {
                              if (action.requiresComment) {
                                setSelectedNotification(notification);
                                setSelectedAction(action);
                              } else {
                                onAction(notification, action.id);
                              }
                            }}
                            className="text-xs"
                          >
                            {action.label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog pour les actions avec commentaire */}
      <Dialog
        open={!!selectedNotification && !!selectedAction}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNotification(null);
            setSelectedAction(null);
            setComment("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAction?.label}</DialogTitle>
            <DialogDescription>
              {selectedNotification?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Commentaire {selectedAction?.requiresComment ? "(requis)" : "(optionnel)"}
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajoutez un commentaire..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedNotification(null);
                setSelectedAction(null);
                setComment("");
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing || (selectedAction?.requiresComment && !comment.trim())}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  Confirmer
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default HITLNotificationsWidget;
