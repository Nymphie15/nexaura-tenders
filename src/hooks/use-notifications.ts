/**
 * Hook unifie pour la gestion des notifications
 *
 * Combine:
 * - Notifications WebSocket temps reel
 * - Notifications push browser
 * - Gestion des preferences
 * - Actions HITL directes
 *
 * @module use-notifications
 * @version 1.0.0
 */

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useNotificationStore, Notification, NotificationPriority, NotificationType } from '@/stores/notification-store';
import { useRealtimeNotifications, HITLDecisionRequiredEvent, WorkflowUpdateEvent } from './use-realtime-notifications';
import {
  pushNotificationService,
  NotificationPreferences,
  NotificationPermissionStatus,
} from '@/services/push-notification-service';
import { useSubmitDecision } from './use-hitl';

// ============================================
// Types
// ============================================

export interface GroupedNotifications {
  urgent: Notification[];
  high: Notification[];
  normal: Notification[]; // medium + low combined
}

export interface NotificationGroup {
  key: string;
  label: string;
  notifications: Notification[];
  caseId?: string;
  type: 'workflow' | 'tender' | 'general';
}

export interface UseNotificationsOptions {
  getToken: () => string | null;
  autoConnect?: boolean;
  enablePush?: boolean;
  enableSound?: boolean;
  onHITLRequired?: (event: HITLDecisionRequiredEvent) => void;
  onWorkflowUpdate?: (event: WorkflowUpdateEvent) => void;
}

export interface UseNotificationsReturn {
  // State
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;

  // Grouped & Filtered
  urgentNotifications: Notification[];
  groupedByPriority: GroupedNotifications;
  groupedByWorkflow: NotificationGroup[];

  // Actions
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;

  // HITL Actions
  approveHITL: (notification: Notification) => Promise<void>;
  rejectHITL: (notification: Notification) => Promise<void>;

  // Push Notifications
  pushPermission: NotificationPermissionStatus;
  isPushSupported: boolean;
  isPushEnabled: boolean;
  requestPushPermission: () => Promise<NotificationPermissionStatus>;
  enablePush: () => Promise<boolean>;
  disablePush: () => Promise<boolean>;

  // Preferences
  preferences: NotificationPreferences;
  updatePreferences: (updates: Partial<NotificationPreferences>) => void;

  // Filters
  filterByType: (type: NotificationType) => Notification[];
  filterByPriority: (priority: NotificationPriority) => Notification[];
  filterByWorkflow: (caseId: string) => Notification[];
}

// ============================================
// Hook Implementation
// ============================================

export function useNotifications({
  getToken,
  autoConnect = true,
  enablePush = true,
  enableSound = true,
  onHITLRequired,
  onWorkflowUpdate,
}: UseNotificationsOptions): UseNotificationsReturn {
  // State
  const [pushPermission, setPushPermission] = useState<NotificationPermissionStatus>('default');
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    pushNotificationService.getPreferences()
  );

  // Zustand store
  const {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getFilteredNotifications,
    getNotificationsByType,
    getNotificationsByPriority,
  } = useNotificationStore();

  // HITL mutation
  const submitDecision = useSubmitDecision();

  // Realtime WebSocket
  const {
    isConnected,
    connect,
    disconnect,
  } = useRealtimeNotifications({
    getToken,
    autoConnect,
    enableSound,
    onHITLRequired: (event) => {
      // Montrer une notification push si enablePush
      if (enablePush && pushPermission === 'granted') {
        pushNotificationService.showHITLNotification({
          caseId: event.data.case_id,
          checkpoint: event.data.checkpoint,
          tenderReference: event.data.tender_reference,
          urgency: event.data.urgency,
        });
      }
      onHITLRequired?.(event);
    },
    onWorkflowUpdate: (event) => {
      // Montrer une notification push pour les events importants
      if (
        enablePush &&
        pushPermission === 'granted' &&
        ['completed', 'failed'].includes(event.data.status)
      ) {
        pushNotificationService.showWorkflowNotification({
          caseId: event.data.case_id,
          phase: event.data.phase,
          status: event.data.status as 'completed' | 'failed',
          message: event.data.message,
        });
      }
      onWorkflowUpdate?.(event);
    },
  });

  // ============================================
  // Push Notification Setup
  // ============================================

  useEffect(() => {
    if (!enablePush) return;

    const initPush = async () => {
      try {
        // Initialiser le service
        await pushNotificationService.initialize();

        // Verifier la permission
        const permission = pushNotificationService.getPermissionStatus();
        setPushPermission(permission);

        // Verifier l'abonnement
        setIsPushEnabled(pushNotificationService.isSubscribed());
      } catch (error) {
        console.error('[useNotifications] Push notification init failed:', error);
      }
    };

    initPush();
  }, [enablePush]);

  // ============================================
  // Computed Values
  // ============================================

  const urgentNotifications = useMemo(() => {
    return notifications.filter(
      (n) => !n.read && (n.priority === 'urgent' || n.priority === 'high')
    );
  }, [notifications]);

  const groupedByPriority = useMemo((): GroupedNotifications => {
    const unread = notifications.filter((n) => !n.read);
    return {
      urgent: unread.filter((n) => n.priority === 'urgent'),
      high: unread.filter((n) => n.priority === 'high'),
      normal: unread.filter((n) => n.priority === 'medium' || n.priority === 'low'),
    };
  }, [notifications]);

  const groupedByWorkflow = useMemo((): NotificationGroup[] => {
    const groups: Map<string, NotificationGroup> = new Map();

    notifications.forEach((n) => {
      const caseId = (n.metadata?.case_id as string) || (n.metadata?.caseId as string);

      if (caseId) {
        const key = `workflow-${caseId}`;
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            label: `Workflow ${caseId.slice(0, 8)}...`,
            notifications: [],
            caseId,
            type: 'workflow',
          });
        }
        groups.get(key)!.notifications.push(n);
      } else if (n.type === 'info' && n.metadata?.type === 'extension_sync') {
        const key = 'tender-detection';
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            label: 'Opportunités détectées',
            notifications: [],
            type: 'tender',
          });
        }
        groups.get(key)!.notifications.push(n);
      } else {
        const key = 'general';
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            label: 'General',
            notifications: [],
            type: 'general',
          });
        }
        groups.get(key)!.notifications.push(n);
      }
    });

    // Trier par date de notification la plus recente
    return Array.from(groups.values()).sort((a, b) => {
      const aLatest = a.notifications[0]?.createdAt || new Date(0);
      const bLatest = b.notifications[0]?.createdAt || new Date(0);
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });
  }, [notifications]);

  // ============================================
  // Actions
  // ============================================

  const approveHITL = useCallback(async (notification: Notification) => {
    const caseId = notification.metadata?.case_id as string;
    const checkpoint = notification.metadata?.checkpoint as string;

    if (!caseId || !checkpoint) {
      console.error('[useNotifications] Missing case_id or checkpoint for HITL approval');
      return;
    }

    try {
      await submitDecision.mutateAsync({
        caseId,
        checkpoint,
        decision: {
          action: 'approve',
          comments: 'Approved via notification center',
        },
      });

      // Marquer comme lu apres l'approbation
      markAsRead(notification.id);
    } catch (error) {
      console.error('[useNotifications] HITL approval failed:', error);
      throw error;
    }
  }, [submitDecision, markAsRead]);

  const rejectHITL = useCallback(async (notification: Notification) => {
    const caseId = notification.metadata?.case_id as string;
    const checkpoint = notification.metadata?.checkpoint as string;

    if (!caseId || !checkpoint) {
      console.error('[useNotifications] Missing case_id or checkpoint for HITL rejection');
      return;
    }

    try {
      await submitDecision.mutateAsync({
        caseId,
        checkpoint,
        decision: {
          action: 'reject',
          comments: 'Rejected via notification center',
        },
      });

      markAsRead(notification.id);
    } catch (error) {
      console.error('[useNotifications] HITL rejection failed:', error);
      throw error;
    }
  }, [submitDecision, markAsRead]);

  const requestPushPermission = useCallback(async () => {
    const permission = await pushNotificationService.requestPermission();
    setPushPermission(permission);
    return permission;
  }, []);

  const enablePushNotifications = useCallback(async () => {
    const subscription = await pushNotificationService.subscribe();
    const enabled = subscription !== null;
    setIsPushEnabled(enabled);
    return enabled;
  }, []);

  const disablePushNotifications = useCallback(async () => {
    const success = await pushNotificationService.unsubscribe();
    if (success) {
      setIsPushEnabled(false);
    }
    return success;
  }, []);

  const updateNotificationPreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    const newPrefs = pushNotificationService.updatePreferences(updates);
    setPreferences(newPrefs);
  }, []);

  const filterByType = useCallback(
    (type: NotificationType) => getNotificationsByType(type),
    [getNotificationsByType]
  );

  const filterByPriority = useCallback(
    (priority: NotificationPriority) => getNotificationsByPriority(priority),
    [getNotificationsByPriority]
  );

  const filterByWorkflow = useCallback(
    (caseId: string) =>
      notifications.filter(
        (n) =>
          (n.metadata?.case_id as string) === caseId ||
          (n.metadata?.caseId as string) === caseId
      ),
    [notifications]
  );

  // ============================================
  // Return
  // ============================================

  return {
    // State
    notifications,
    unreadCount,
    isConnected,
    isLoading,

    // Grouped & Filtered
    urgentNotifications,
    groupedByPriority,
    groupedByWorkflow,

    // Actions
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,

    // HITL Actions
    approveHITL,
    rejectHITL,

    // Push Notifications
    pushPermission,
    isPushSupported: pushNotificationService.isSupported(),
    isPushEnabled,
    requestPushPermission,
    enablePush: enablePushNotifications,
    disablePush: disablePushNotifications,

    // Preferences
    preferences,
    updatePreferences: updateNotificationPreferences,

    // Filters
    filterByType,
    filterByPriority,
    filterByWorkflow,
  };
}

// ============================================
// Utility Hooks
// ============================================

/**
 * Hook simplifie pour les notifications HITL uniquement
 */
export function useHITLNotifications(getToken: () => string | null) {
  const {
    notifications,
    unreadCount,
    urgentNotifications,
    approveHITL,
    rejectHITL,
    markAsRead,
    isConnected,
  } = useNotifications({ getToken });

  const hitlNotifications = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.type === 'warning' &&
          (n.metadata?.type === 'hitl_decision_required' ||
            n.metadata?.checkpoint)
      ),
    [notifications]
  );

  return {
    notifications: hitlNotifications,
    unreadCount: hitlNotifications.filter((n) => !n.read).length,
    urgentNotifications: urgentNotifications.filter(
      (n) => n.metadata?.type === 'hitl_decision_required'
    ),
    approveHITL,
    rejectHITL,
    markAsRead,
    isConnected,
  };
}

/**
 * Hook pour les notifications d'un workflow specifique
 */
export function useWorkflowNotifications(caseId: string, getToken: () => string | null) {
  const { filterByWorkflow, markAsRead, markAllAsRead } = useNotifications({
    getToken,
    autoConnect: false,
  });

  const notifications = filterByWorkflow(caseId);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllWorkflowAsRead = useCallback(() => {
    notifications.forEach((n) => {
      if (!n.read) {
        markAsRead(n.id);
      }
    });
  }, [notifications, markAsRead]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead: markAllWorkflowAsRead,
  };
}

export default useNotifications;
