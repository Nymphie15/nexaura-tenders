"use client";

/**
 * Composant d'affichage d'une notification individuelle
 *
 * Features:
 * - Affichage des differents types de notifications
 * - Actions HITL directes (approuver/rejeter)
 * - Animation d'apparition/disparition
 * - Navigation vers le lien associe
 * - Indicateur de priorite
 *
 * @module notification-item
 * @version 1.0.0
 */

import React, { useCallback, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Check,
  XCircle,
  ExternalLink,
  Clock,
  Workflow,
  FileText,
  Zap,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Notification,
  NotificationPriority,
  NotificationType,
} from "@/stores/notification-store";

// ============================================
// Types
// ============================================

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onRemove?: (id: string) => void;
  onApprove?: (notification: Notification) => Promise<void>;
  onReject?: (notification: Notification) => Promise<void>;
  compact?: boolean;
  showActions?: boolean;
  className?: string;
}

// ============================================
// Helpers
// ============================================

const getTypeIcon = (type: NotificationType) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "info":
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getTypeStyles = (type: NotificationType) => {
  switch (type) {
    case "success":
      return "border-l-emerald-500 bg-emerald-500/5";
    case "error":
      return "border-l-red-500 bg-red-500/5";
    case "warning":
      return "border-l-amber-500 bg-amber-500/5";
    case "info":
    default:
      return "border-l-blue-500 bg-blue-500/5";
  }
};

const getPriorityBadge = (priority: NotificationPriority) => {
  switch (priority) {
    case "urgent":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
          <Zap className="h-3 w-3" />
          Urgent
        </span>
      );
    case "high":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
          Haute priorité
        </span>
      );
    default:
      return null;
  }
};

const getContextIcon = (notification: Notification) => {
  const metaType = notification.metadata?.type as string;

  if (metaType === "hitl_decision_required" || notification.metadata?.checkpoint) {
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  if (metaType === "workflow_update" || notification.metadata?.case_id) {
    return <Workflow className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  if (metaType === "extension_sync") {
    return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  return null;
};

const isHITLNotification = (notification: Notification): boolean => {
  return (
    notification.type === "warning" &&
    (notification.metadata?.type === "hitl_decision_required" ||
      !!notification.metadata?.checkpoint)
  );
};

// ============================================
// Component
// ============================================

export function NotificationItem({
  notification,
  onMarkAsRead,
  onRemove,
  onApprove,
  onReject,
  compact = false,
  showActions = true,
  className,
}: NotificationItemProps) {
  const [isActioning, setIsActioning] = useState<"approve" | "reject" | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const isHITL = isHITLNotification(notification);
  const hasLink = !!notification.link;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  const handleClick = useCallback(() => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  }, [notification.id, notification.read, onMarkAsRead]);

  const handleApprove = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!onApprove || isActioning) return;

      setIsActioning("approve");
      try {
        await onApprove(notification);
      } catch (error) {
        console.error("Approval failed:", error);
      } finally {
        setIsActioning(null);
      }
    },
    [notification, onApprove, isActioning]
  );

  const handleReject = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!onReject || isActioning) return;

      setIsActioning("reject");
      try {
        await onReject(notification);
      } catch (error) {
        console.error("Rejection failed:", error);
      } finally {
        setIsActioning(null);
      }
    },
    [notification, onReject, isActioning]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onRemove?.(notification.id);
    },
    [notification.id, onRemove]
  );

  const Content = (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex gap-3 rounded-lg border-l-4 p-3 transition-all duration-200",
        getTypeStyles(notification.type),
        !notification.read && "bg-opacity-100",
        notification.read && "opacity-70",
        hasLink && "cursor-pointer hover:bg-accent/50",
        compact && "p-2",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0 pt-0.5", compact && "pt-0")}>
        {getTypeIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-medium text-foreground",
                compact ? "text-xs" : "text-sm"
              )}
            >
              {notification.title}
            </span>
            {getPriorityBadge(notification.priority)}
          </div>

          {/* Actions when hovered or on mobile */}
          <div
            className={cn(
              "flex items-center gap-1 transition-opacity",
              isHovered || compact ? "opacity-100" : "opacity-0"
            )}
          >
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={handleRemove}
                aria-label="Supprimer la notification"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Message */}
        <p
          className={cn(
            "mt-0.5 text-muted-foreground",
            compact ? "text-[11px] line-clamp-1" : "text-xs line-clamp-2"
          )}
        >
          {notification.message}
        </p>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between">
          {/* Meta info */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {getContextIcon(notification)}
            <span>{timeAgo}</span>
            {hasLink && (
              <span className="flex items-center gap-1">
                <ExternalLink className="h-2.5 w-2.5" />
                Voir
              </span>
            )}
          </div>

          {/* HITL Actions */}
          {showActions && isHITL && !notification.read && (onApprove || onReject) && (
            <div className="flex items-center gap-1">
              {onApprove && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                  onClick={handleApprove}
                  disabled={!!isActioning}
                >
                  {isActioning === "approve" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">Approuver</span>
                </Button>
              )}
              {onReject && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs text-red-600 hover:bg-red-500/10 hover:text-red-700"
                  onClick={handleReject}
                  disabled={!!isActioning}
                >
                  {isActioning === "reject" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">Rejeter</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Unread indicator */}
        {!notification.read && (
          <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        )}
      </div>
    </motion.div>
  );

  // Wrap in Link if there's a link
  if (hasLink) {
    return (
      <Link href={notification.link!} className="block">
        {Content}
      </Link>
    );
  }

  return Content;
}

// ============================================
// Skeleton
// ============================================

export function NotificationItemSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border-l-4 border-l-muted bg-muted/30 p-3",
        compact && "p-2"
      )}
    >
      <div className="h-4 w-4 animate-pulse rounded bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

// ============================================
// Export
// ============================================

export default NotificationItem;
