/**
 * Hook pour les notifications temps réel via WebSocket
 *
 * Événements supportés:
 * - hitl_decision_required: Nouvelle décision HITL requise
 * - hitl_decision_made: Décision HITL prise
 * - workflow_update: Mise à jour workflow
 * - notification: Notification générale
 * - extension_sync: Sync avec extension Chrome
 *
 * @module use-realtime-notifications
 * @version 1.0.0
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useNotificationStore, NotificationPriority, NotificationType } from '@/stores/notification-store';

// ============================================
// Types
// ============================================

export interface WebSocketEvent {
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface HITLDecisionRequiredEvent extends WebSocketEvent {
  type: 'hitl_decision_required';
  data: {
    case_id: string;
    checkpoint: string;
    tender_reference?: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    deadline?: string;
    context?: Record<string, unknown>;
  };
}

export interface HITLDecisionMadeEvent extends WebSocketEvent {
  type: 'hitl_decision_made';
  data: {
    case_id: string;
    checkpoint: string;
    decision: 'approved' | 'rejected' | 'modified';
    decided_by: string;
  };
}

export interface WorkflowUpdateEvent extends WebSocketEvent {
  type: 'workflow_update';
  data: {
    case_id: string;
    phase: string;
    status: 'started' | 'completed' | 'failed' | 'paused';
    progress?: number;
    message?: string;
  };
}

export interface NotificationEvent extends WebSocketEvent {
  type: 'notification';
  data: {
    title: string;
    message: string;
    priority: NotificationPriority;
    notification_type: NotificationType;
    link?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface ExtensionSyncEvent extends WebSocketEvent {
  type: 'extension_sync';
  data: {
    action: 'tender_detected' | 'page_analyzed' | 'extraction_complete';
    url?: string;
    tender_data?: Record<string, unknown>;
  };
}

export type RealtimeEvent =
  | HITLDecisionRequiredEvent
  | HITLDecisionMadeEvent
  | WorkflowUpdateEvent
  | NotificationEvent
  | ExtensionSyncEvent;

export interface UseRealtimeNotificationsOptions {
  getToken: () => string | null;
  onHITLRequired?: (event: HITLDecisionRequiredEvent) => void;
  onHITLDecided?: (event: HITLDecisionMadeEvent) => void;
  onWorkflowUpdate?: (event: WorkflowUpdateEvent) => void;
  onExtensionSync?: (event: ExtensionSyncEvent) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
  enableSound?: boolean;
}

export interface UseRealtimeNotificationsReturn {
  isConnected: boolean;
  connectionId: string | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (eventType: string, handler: (event: WebSocketEvent) => void) => () => void;
}

// ============================================
// Sound Utilities
// ============================================

const NOTIFICATION_SOUNDS = {
  urgent: '/sounds/notification-urgent.mp3',
  high: '/sounds/notification-high.mp3',
  default: '/sounds/notification.mp3',
} as const;

const playNotificationSound = (priority: NotificationPriority): void => {
  if (typeof window === 'undefined') return;

  try {
    const soundPath = priority === 'urgent'
      ? NOTIFICATION_SOUNDS.urgent
      : priority === 'high'
        ? NOTIFICATION_SOUNDS.high
        : NOTIFICATION_SOUNDS.default;

    const audio = new Audio(soundPath);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Silently fail if audio can't play (e.g., no user interaction)
    });
  } catch {
    // Ignore sound errors
  }
};

// ============================================
// Hook Implementation
// ============================================

export function useRealtimeNotifications({
  getToken,
  onHITLRequired,
  onHITLDecided,
  onWorkflowUpdate,
  onExtensionSync,
  onError,
  autoConnect = true,
  enableSound = true,
}: UseRealtimeNotificationsOptions): UseRealtimeNotificationsReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const eventHandlersRef = useRef<Map<string, Set<(event: WebSocketEvent) => void>>>(new Map());

  const { addNotification } = useNotificationStore();

  const MAX_RECONNECT_ATTEMPTS = 3;
  const INITIAL_RECONNECT_DELAY = 1000;
  const MAX_RECONNECT_DELAY = 30000;

  // Get WebSocket URL for notifications
  const getWebSocketUrl = useCallback(() => {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    return `${baseUrl}/notifications?token=${encodeURIComponent(token)}`;
  }, [getToken]);

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback(() => {
    const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
    return Math.min(delay, MAX_RECONNECT_DELAY);
  }, []);

  // Handle incoming WebSocket message
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as WebSocketEvent;

      // Dispatch to registered handlers
      const handlers = eventHandlersRef.current.get(data.type);
      if (handlers) {
        handlers.forEach(handler => handler(data));
      }

      // Handle specific event types
      switch (data.type) {
        case 'connected':
          setConnectionId((data.data as { connection_id?: string }).connection_id || null);
          break;

        case 'hitl_decision_required': {
          const hitlEvent = data as HITLDecisionRequiredEvent;

          // Add to notification store
          const urgencyToPriority: Record<string, NotificationPriority> = {
            critical: 'urgent',
            high: 'high',
            medium: 'medium',
            low: 'low',
          };

          addNotification({
            type: 'warning',
            priority: urgencyToPriority[hitlEvent.data.urgency] || 'medium',
            title: 'Décision requise',
            message: `Checkpoint ${hitlEvent.data.checkpoint} pour le cas ${hitlEvent.data.case_id}`,
            link: `/workflow/${hitlEvent.data.case_id}/hitl/${hitlEvent.data.checkpoint}`,
            metadata: hitlEvent.data,
          });

          // Play sound for urgent notifications
          if (enableSound && ['critical', 'high'].includes(hitlEvent.data.urgency)) {
            playNotificationSound(urgencyToPriority[hitlEvent.data.urgency]);
          }

          onHITLRequired?.(hitlEvent);
          break;
        }

        case 'hitl_decision_made': {
          const decisionEvent = data as HITLDecisionMadeEvent;

          addNotification({
            type: decisionEvent.data.decision === 'rejected' ? 'error' : 'success',
            priority: 'medium',
            title: 'Décision HITL prise',
            message: `${decisionEvent.data.decision} par ${decisionEvent.data.decided_by}`,
            link: `/workflow/${decisionEvent.data.case_id}`,
            metadata: decisionEvent.data,
          });

          onHITLDecided?.(decisionEvent);
          break;
        }

        case 'workflow_update': {
          const workflowEvent = data as WorkflowUpdateEvent;

          // Only notify for significant events
          if (['completed', 'failed'].includes(workflowEvent.data.status)) {
            addNotification({
              type: workflowEvent.data.status === 'failed' ? 'error' : 'success',
              priority: workflowEvent.data.status === 'failed' ? 'high' : 'low',
              title: `Workflow ${workflowEvent.data.status === 'failed' ? 'échoué' : 'terminé'}`,
              message: workflowEvent.data.message || `Phase ${workflowEvent.data.phase}`,
              link: `/workflow/${workflowEvent.data.case_id}`,
              metadata: workflowEvent.data,
            });

            if (enableSound && workflowEvent.data.status === 'failed') {
              playNotificationSound('high');
            }
          }

          onWorkflowUpdate?.(workflowEvent);
          break;
        }

        case 'notification': {
          const notifEvent = data as NotificationEvent;

          addNotification({
            type: notifEvent.data.notification_type,
            priority: notifEvent.data.priority,
            title: notifEvent.data.title,
            message: notifEvent.data.message,
            link: notifEvent.data.link,
            metadata: notifEvent.data.metadata,
          });

          if (enableSound && ['urgent', 'high'].includes(notifEvent.data.priority)) {
            playNotificationSound(notifEvent.data.priority);
          }
          break;
        }

        case 'extension_sync': {
          const syncEvent = data as ExtensionSyncEvent;

          if (syncEvent.data.action === 'tender_detected') {
            addNotification({
              type: 'info',
              priority: 'medium',
              title: "Appel d'offre détecté",
              message: `Nouveau tender détecté sur ${syncEvent.data.url}`,
              metadata: syncEvent.data,
            });
          }

          onExtensionSync?.(syncEvent);
          break;
        }

        case 'pong':
          // Keepalive response - ignore
          break;

        case 'error':
          console.error('[Notifications WS] Server error:', (data.data as { message?: string }).message);
          onError?.((data.data as { message?: string }).message || 'Unknown error');
          break;

        default:
          console.warn('[Notifications WS] Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('[Notifications WS] Failed to parse message:', error);
    }
  }, [addNotification, enableSound, onHITLRequired, onHITLDecided, onWorkflowUpdate, onExtensionSync, onError]);

  // Connect to WebSocket (with pre-check and silent failure)
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Don't retry if already exceeded max attempts
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      return;
    }

    try {
      const url = getWebSocketUrl();
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setConnectionId(null);
        wsRef.current = null;

        // Auto-reconnect with exponential backoff (silently)
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = getReconnectDelay();
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current === MAX_RECONNECT_ATTEMPTS) {
          console.info('[Notifications WS] Temps r\u00e9el indisponible - les notifications fonctionnent en mode polling');
        }
      };

      ws.onerror = () => {
        // Silent - onclose will handle reconnection
      };

      ws.onmessage = handleMessage;

      wsRef.current = ws;
    } catch {
      // Silent failure - WS endpoint not available
      if (reconnectAttemptsRef.current === 0) {
        console.info('[Notifications WS] Temps r\u00e9el indisponible');
      }
      reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS;
    }
  }, [getWebSocketUrl, getReconnectDelay, handleMessage, onError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionId(null);
  }, []);

  // Subscribe to specific event types
  const subscribe = useCallback((eventType: string, handler: (event: WebSocketEvent) => void) => {
    if (!eventHandlersRef.current.has(eventType)) {
      eventHandlersRef.current.set(eventType, new Set());
    }

    eventHandlersRef.current.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      eventHandlersRef.current.get(eventType)?.delete(handler);
    };
  }, []);

  // Send ping for keepalive
  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  // Auto-connect on mount if enabled
  // Use refs to avoid re-triggering effect when callbacks change
  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);
  const isMountedRef = useRef(false);
  connectRef.current = connect;
  disconnectRef.current = disconnect;

  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect) {
      // Connect directly - WebSocket error handling and reconnection logic
      // in connect() will gracefully handle unavailable endpoints
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          connectRef.current();
        }
      }, 200);

      return () => {
        clearTimeout(timeoutId);
        isMountedRef.current = false;
        if (wsRef.current?.readyState === WebSocket.OPEN ||
            wsRef.current?.readyState === WebSocket.CONNECTING) {
          disconnectRef.current();
        }
      };
    }

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  // Keepalive ping every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(sendPing, 30000);
    return () => clearInterval(interval);
  }, [isConnected, sendPing]);

  return {
    isConnected,
    connectionId,
    connect,
    disconnect,
    subscribe,
  };
}

// ============================================
// Convenience Hooks
// ============================================

/**
 * Hook simplifié pour écouter les événements HITL uniquement
 */
export function useHITLNotifications(options: Omit<UseRealtimeNotificationsOptions, 'onWorkflowUpdate' | 'onExtensionSync'>) {
  return useRealtimeNotifications({
    ...options,
    enableSound: options.enableSound ?? true,
  });
}

/**
 * Hook simplifié pour écouter les mises à jour workflow uniquement
 */
export function useWorkflowNotifications(options: Omit<UseRealtimeNotificationsOptions, 'onHITLRequired' | 'onHITLDecided' | 'onExtensionSync'>) {
  return useRealtimeNotifications({
    ...options,
    enableSound: options.enableSound ?? false,
  });
}
