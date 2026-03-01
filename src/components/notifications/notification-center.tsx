"use client";

/**
 * Centre de notifications intelligent
 *
 * Features:
 * - Dropdown avec liste des notifications
 * - Onglets par priorite (Urgentes, Toutes)
 * - Groupement par workflow/tender
 * - Actions HITL directes
 * - Preferences de notification
 * - Badge de comptage non-lus
 * - Animation et transitions
 *
 * @module notification-center
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Settings,
  Trash2,
  Volume2,
  VolumeX,
  Clock,
  Zap,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, NotificationGroup } from "@/hooks/use-notifications";
import { NotificationItem, NotificationItemSkeleton } from "./notification-item";
import { Notification } from "@/stores/notification-store";

// ============================================
// Types
// ============================================

export interface NotificationCenterProps {
  getToken: () => string | null;
  className?: string;
}

// ============================================
// Sub Components
// ============================================

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Bell className="h-10 w-10 text-muted-foreground/30" />
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function NotificationGroupSection({
  group,
  onMarkAsRead,
  onRemove,
  onApprove,
  onReject,
}: {
  group: NotificationGroup;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onApprove: (notification: Notification) => Promise<void>;
  onReject: (notification: Notification) => Promise<void>;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const unreadCount = group.notifications.filter((n) => !n.read).length;

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          {group.type === "workflow" && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
          {group.type === "tender" && (
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          )}
          {group.type === "general" && (
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
          )}
          {group.label}
          {unreadCount > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </span>
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1 px-1"
          >
            {group.notifications.slice(0, 5).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onRemove={onRemove}
                onApprove={onApprove}
                onReject={onReject}
                compact
              />
            ))}
            {group.notifications.length > 5 && (
              <p className="px-3 py-1 text-center text-[10px] text-muted-foreground">
                +{group.notifications.length - 5} autres notifications
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PreferencesPanel({
  preferences,
  onUpdate,
  isPushEnabled,
  isPushSupported,
  pushPermission,
  onEnablePush,
  onDisablePush,
}: {
  preferences: ReturnType<typeof useNotifications>["preferences"];
  onUpdate: ReturnType<typeof useNotifications>["updatePreferences"];
  isPushEnabled: boolean;
  isPushSupported: boolean;
  pushPermission: string;
  onEnablePush: () => Promise<boolean>;
  onDisablePush: () => Promise<boolean>;
}) {
  const [isEnabling, setIsEnabling] = useState(false);

  const handlePushToggle = async () => {
    setIsEnabling(true);
    try {
      if (isPushEnabled) {
        await onDisablePush();
      } else {
        await onEnablePush();
      }
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="space-y-4 p-3">
      <div className="text-sm font-medium">Preferences</div>

      {/* Push Notifications */}
      {isPushSupported && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPushEnabled ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs">Notifications push</span>
          </div>
          <Switch
            checked={isPushEnabled}
            onCheckedChange={handlePushToggle}
            disabled={isEnabling || pushPermission === "denied"}
          />
        </div>
      )}

      {pushPermission === "denied" && (
        <p className="text-[10px] text-muted-foreground">
          Les notifications sont bloquees dans votre navigateur.
          Modifiez les parametres du site pour les activer.
        </p>
      )}

      <Separator />

      {/* Sound */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {preferences.sound ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs">Son</span>
        </div>
        <Switch
          checked={preferences.sound}
          onCheckedChange={(checked) => onUpdate({ sound: checked })}
        />
      </div>

      <Separator />

      {/* Quiet Hours */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {preferences.quietHours.enabled ? (
              <Moon className="h-4 w-4 text-indigo-500" />
            ) : (
              <Sun className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs">Heures calmes</span>
          </div>
          <Switch
            checked={preferences.quietHours.enabled}
            onCheckedChange={(checked) =>
              onUpdate({ quietHours: { ...preferences.quietHours, enabled: checked } })
            }
          />
        </div>
        {preferences.quietHours.enabled && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {preferences.quietHours.start} - {preferences.quietHours.end}
          </div>
        )}
      </div>

      <Separator />

      {/* Priority Filters */}
      <div className="space-y-2">
        <span className="text-xs font-medium">Afficher les priorites</span>
        <div className="space-y-1">
          {(["urgent", "high", "medium", "low"] as const).map((priority) => (
            <div key={priority} className="flex items-center justify-between">
              <span className="text-xs capitalize">
                {priority === "urgent" && "Urgentes"}
                {priority === "high" && "Hautes"}
                {priority === "medium" && "Moyennes"}
                {priority === "low" && "Basses"}
              </span>
              <Switch
                checked={preferences.priorities[priority]}
                onCheckedChange={(checked) =>
                  onUpdate({
                    priorities: { ...preferences.priorities, [priority]: checked },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function NotificationCenter({
  getToken,
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "urgent" | "settings">("all");

  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    urgentNotifications,
    groupedByPriority,
    groupedByWorkflow,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    approveHITL,
    rejectHITL,
    preferences,
    updatePreferences,
    isPushSupported,
    isPushEnabled,
    pushPermission,
    enablePush,
    disablePush,
  } = useNotifications({ getToken });

  const handleApprove = useCallback(
    async (notification: Notification) => {
      await approveHITL(notification);
    },
    [approveHITL]
  );

  const handleReject = useCallback(
    async (notification: Notification) => {
      await rejectHITL(notification);
    },
    [rejectHITL]
  );

  const urgentCount = groupedByPriority.urgent.length + groupedByPriority.high.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 text-muted-foreground hover:text-foreground",
            className
          )}
          aria-label={`Notifications (${unreadCount} non lues)`}
        >
          <Bell className="h-4 w-4" />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 h-4 min-w-4 p-0 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}

          {/* Connection indicator */}
          <span
            className={cn(
              "absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background",
              isConnected ? "bg-emerald-500" : "bg-muted-foreground"
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[380px] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {urgentCount > 0 && (
              <Badge variant="destructive" className="h-5">
                <Zap className="mr-1 h-3 w-3" />
                {urgentCount} urgent{urgentCount > 1 ? "es" : "e"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={markAllAsRead}
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={clearAll}
                  title="Tout supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", activeTab === "settings" && "bg-accent")}
              onClick={() => setActiveTab(activeTab === "settings" ? "all" : "settings")}
              title="Paramètres"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "settings" ? (
          <PreferencesPanel
            preferences={preferences}
            onUpdate={updatePreferences}
            isPushEnabled={isPushEnabled}
            isPushSupported={isPushSupported}
            pushPermission={pushPermission}
            onEnablePush={enablePush}
            onDisablePush={disablePush}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "urgent")}>
            <TabsList className="w-full justify-start gap-2 rounded-none border-b bg-transparent px-4 py-0">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Toutes
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="urgent"
                className="rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Zap className="mr-1 h-3 w-3" />
                Urgentes
                {urgentCount > 0 && (
                  <Badge variant="destructive" className="ml-1.5 h-4 px-1.5 text-[10px]">
                    {urgentCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px]">
              <TabsContent value="all" className="m-0 p-2">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <NotificationItemSkeleton key={i} compact />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <EmptyState message="Aucune notification" />
                ) : (
                  <div className="space-y-1">
                    {/* Grouped by workflow */}
                    {groupedByWorkflow.map((group) => (
                      <NotificationGroupSection
                        key={group.key}
                        group={group}
                        onMarkAsRead={markAsRead}
                        onRemove={removeNotification}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="urgent" className="m-0 p-2">
                {urgentNotifications.length === 0 ? (
                  <EmptyState message="Aucune notification urgente" />
                ) : (
                  <div className="space-y-1">
                    <AnimatePresence>
                      {urgentNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onRemove={removeNotification}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          compact
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}

        {/* Footer */}
        {activeTab !== "settings" && notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full text-xs"
              onClick={() => {
                setIsOpen(false);
                // Navigate to full notifications page if needed
              }}
            >
              Voir toutes les notifications
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;
