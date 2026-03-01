/**
 * @file notification-center.tsx
 * @description Centre de notifications avec badge unread pour le dashboard
 * @module components/dashboard/notifications
 *
 * Gere les notifications utilisateur avec:
 * - Badge de compteur non lus
 * - Groupement par type/date
 * - Actions rapides (marquer lu, supprimer)
 * - Filtres et recherche
 * - Notifications en temps reel
 *
 * @example
 * <NotificationCenter
 *   notifications={notifications}
 *   onMarkAsRead={(id) => markAsRead(id)}
 *   onMarkAllAsRead={() => markAllAsRead()}
 * />
 */

"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Settings,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/** Type de notification */
export type NotificationType = "info" | "success" | "warning" | "error" | "action";

/** Structure d'une notification */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date | string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

/** Props du composant NotificationCenter */
export interface NotificationCenterProps {
  /** Liste des notifications */
  notifications: Notification[];
  /** Callback pour marquer comme lu */
  onMarkAsRead: (id: string) => void;
  /** Callback pour marquer tout comme lu */
  onMarkAllAsRead: () => void;
  /** Callback pour supprimer une notification */
  onDelete?: (id: string) => void;
  /** Callback pour supprimer tout */
  onDeleteAll?: () => void;
  /** Callback au clic sur une notification */
  onNotificationClick?: (notification: Notification) => void;
  /** Callback pour ouvrir les parametres */
  onSettingsClick?: () => void;
  /** Nombre maximum a afficher */
  maxDisplayed?: number;
  /** Classes CSS additionnelles */
  className?: string;
}

/** Configuration des types de notification */
const notificationTypeConfig: Record<NotificationType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  info: {
    icon: Info,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  success: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  action: {
    icon: Bell,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
};

/**
 * Centre de notifications
 */
export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  onNotificationClick,
  onSettingsClick,
  maxDisplayed = 50,
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  // Compteur non lus
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Notifications filtrees
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (activeTab === "unread") {
      filtered = filtered.filter((n) => !n.read);
    }

    return filtered.slice(0, maxDisplayed);
  }, [notifications, activeTab, maxDisplayed]);

  // Grouper par date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      today: [],
      yesterday: [],
      older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    filteredNotifications.forEach((notification) => {
      const date = new Date(notification.timestamp);
      const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (notifDate.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, [filteredNotifications]);

  // Formater le timestamp
  const formatTimestamp = (timestamp: Date | string): string => {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  // Rendu d'une notification
  const renderNotification = (notification: Notification) => {
    const config = notificationTypeConfig[notification.type];
    const Icon = config.icon;

    return (
      <div
        key={notification.id}
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
          "hover:bg-muted/50",
          !notification.read && "bg-primary/5"
        )}
        onClick={() => {
          if (!notification.read) {
            onMarkAsRead(notification.id);
          }
          onNotificationClick?.(notification);
        }}
      >
        {/* Icone */}
        <div className={cn("p-2 rounded-full shrink-0", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn(
                "text-sm font-medium leading-tight",
                !notification.read ? "text-foreground" : "text-muted-foreground"
              )}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </p>
            </div>

            {/* Indicateur non lu */}
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimestamp(notification.timestamp)}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Action button */}
          {notification.actionUrl && notification.actionLabel && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.open(notification.actionUrl, "_blank");
              }}
            >
              {notification.actionLabel}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={onMarkAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Tout marquer lu
              </Button>
            )}
            {onSettingsClick && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onSettingsClick}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread")}>
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="all" className="flex-1">
              Toutes
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Non lues
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <BellOff className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">
                    {activeTab === "unread"
                      ? "Aucune notification non lue"
                      : "Aucune notification"}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {/* Aujourd'hui */}
                  {groupedNotifications.today.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground px-3 py-1">
                        Aujourd'hui
                      </p>
                      {groupedNotifications.today.map(renderNotification)}
                    </div>
                  )}

                  {/* Hier */}
                  {groupedNotifications.yesterday.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground px-3 py-1">
                        Hier
                      </p>
                      {groupedNotifications.yesterday.map(renderNotification)}
                    </div>
                  )}

                  {/* Plus ancien */}
                  {groupedNotifications.older.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground px-3 py-1">
                        Plus ancien
                      </p>
                      {groupedNotifications.older.map(renderNotification)}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        {notifications.length > maxDisplayed && (
          <div className="border-t p-2">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Voir toutes les notifications ({notifications.length})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;
