/**
 * Tests d'integration WebSocket
 *
 * Teste les scenarios d'integration entre les differents hooks WebSocket
 * et leur interaction avec le reste de l'application.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { useAssistantWebSocket } from '@/hooks/use-assistant-websocket';
import { useNotificationStore } from '@/stores/notification-store';

// ============================================
// Mock WebSocket (inline to avoid shared mock issues)
// ============================================

let allInstances: IntegrationMockWebSocket[] = [];

class IntegrationMockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;

  readyState: number = IntegrationMockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  private messageHandlers: Set<(event: MessageEvent) => void> = new Set();
  private sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    allInstances.push(this);

    setTimeout(() => {
      if (this.readyState === IntegrationMockWebSocket.CONNECTING) {
        this.readyState = IntegrationMockWebSocket.OPEN;
        this.onopen?.(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== IntegrationMockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = IntegrationMockWebSocket.CLOSED;
    const event = new CloseEvent('close', { code: code || 1000, reason: reason || '' });
    this.onclose?.(event);
  }

  addEventListener(type: string, handler: (event: MessageEvent) => void): void {
    if (type === 'message') {
      this.messageHandlers.add(handler);
    }
  }

  removeEventListener(type: string, handler: (event: MessageEvent) => void): void {
    if (type === 'message') {
      this.messageHandlers.delete(handler);
    }
  }

  simulateMessage(data: unknown): void {
    const event = new MessageEvent('message', {
      data: JSON.stringify(data)
    });
    this.onmessage?.(event);
    this.messageHandlers.forEach(handler => handler(event));
  }

  simulateError(): void {
    this.onerror?.(new Event('error'));
  }

  getSentMessages(): unknown[] {
    return this.sentMessages.map(msg => JSON.parse(msg));
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }
}

// ============================================
// Mock Setup
// ============================================

// Track specific WS connections by URL pattern
function getNotificationWs(): IntegrationMockWebSocket | null {
  const list = allInstances.filter(ws => ws.url.includes('/notifications'));
  return list.length > 0 ? list[list.length - 1] : null;
}

function getAssistantWs(): IntegrationMockWebSocket | null {
  const list = allInstances.filter(ws => ws.url.includes('/assistant'));
  return list.length > 0 ? list[list.length - 1] : null;
}

vi.mock('@/stores/notification-store', () => ({
  useNotificationStore: vi.fn(() => ({
    addNotification: vi.fn(),
    notifications: [],
    markAsRead: vi.fn(),
    clearAll: vi.fn(),
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  allInstances = [];

  // Assign class directly as global.WebSocket (works with `new`)
  global.WebSocket = IntegrationMockWebSocket as any;

  // Mock console methods
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});

  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  allInstances = [];
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// Helper: advance past both hooks' connection delays
// useRealtimeNotifications autoConnect = 200ms + 10ms WS
// useAssistantWebSocket = immediate + 10ms WS
async function advanceToAllConnected() {
  await act(async () => {
    vi.advanceTimersByTime(220);
  });
}

// ============================================
// Tests d'Integration
// ============================================

describe('WebSocket Integration - Multiple Connections', () => {
  it('should support multiple WebSocket connections simultaneously', async () => {
    const getToken = vi.fn(() => 'test-token');

    const { result: notificationResult } = renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    const { result: assistantResult } = renderHook(() =>
      useAssistantWebSocket({
        caseId: 'case-123',
        getToken
      })
    );

    await advanceToAllConnected();

    await waitFor(() => {
      expect(notificationResult.current.isConnected).toBe(true);
      expect(assistantResult.current.isConnected).toBe(true);
    });

    const notifWs = getNotificationWs();
    const assistWs = getAssistantWs();

    expect(notifWs).not.toBe(assistWs);
    expect(notifWs?.url).toContain('/notifications');
    expect(assistWs?.url).toContain('/assistant');
  });

  it('should handle independent disconnections', async () => {
    const getToken = vi.fn(() => 'test-token');

    const { result: notificationResult } = renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    const { result: assistantResult } = renderHook(() =>
      useAssistantWebSocket({
        caseId: 'case-123',
        getToken
      })
    );

    await advanceToAllConnected();

    await waitFor(() => {
      expect(notificationResult.current.isConnected).toBe(true);
      expect(assistantResult.current.isConnected).toBe(true);
    });

    // Disconnect only notifications
    act(() => {
      notificationResult.current.disconnect();
    });

    await waitFor(() => {
      expect(notificationResult.current.isConnected).toBe(false);
      expect(assistantResult.current.isConnected).toBe(true);
    });

    // Disconnect assistant
    act(() => {
      assistantResult.current.disconnect();
    });

    await waitFor(() => {
      expect(assistantResult.current.isConnected).toBe(false);
    });
  });

  it('should handle independent reconnections', async () => {
    const getToken = vi.fn(() => 'test-token');

    renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    renderHook(() =>
      useAssistantWebSocket({
        caseId: 'case-123',
        getToken
      })
    );

    await advanceToAllConnected();

    const origAssistWs = getAssistantWs()!;
    expect(origAssistWs.readyState).toBe(IntegrationMockWebSocket.OPEN);

    // Disconnect notifications only
    const notifWs = getNotificationWs()!;
    act(() => {
      notifWs.close(1006, 'Network error');
    });

    // Wait for notification reconnection (1s delay + 10ms WS open)
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    // Notifications should have reconnected (new instance)
    const newNotifWs = getNotificationWs()!;
    expect(newNotifWs.readyState).toBe(IntegrationMockWebSocket.OPEN);

    // Assistant should still be the original connected instance
    expect(origAssistWs.readyState).toBe(IntegrationMockWebSocket.OPEN);
  });
});

describe('WebSocket Integration - Cross-Hook Communication', () => {
  it('should notify assistant when HITL decision is made', async () => {
    const getToken = vi.fn(() => 'test-token');
    const addNotificationMock = vi.fn();

    (useNotificationStore as any).mockReturnValue({
      addNotification: addNotificationMock,
    });

    const onHITLDecided = vi.fn();

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        onHITLDecided
      })
    );

    const { result: assistantResult } = renderHook(() =>
      useAssistantWebSocket({
        caseId: 'case-123',
        getToken
      })
    );

    await advanceToAllConnected();

    const assistWs = getAssistantWs()!;

    act(() => {
      assistWs.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    await waitFor(() => {
      expect(assistantResult.current.conversationId).toBe('conv-789');
    });

    // Simulate HITL decision via notifications WS
    const notifWs = getNotificationWs()!;
    act(() => {
      notifWs.simulateMessage({
        type: 'hitl_decision_made',
        timestamp: new Date().toISOString(),
        data: {
          case_id: 'case-123',
          checkpoint: 'GO_NOGO',
          decision: 'approved',
          decided_by: 'user@example.com'
        }
      });
    });

    await waitFor(() => {
      expect(onHITLDecided).toHaveBeenCalled();
      expect(addNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Décision HITL prise'
        })
      );
    });

    // Assistant can now update context with this info
    assistWs.clearSentMessages();

    act(() => {
      assistantResult.current.updateContext({
        last_decision: 'approved',
        checkpoint: 'GO_NOGO'
      });
    });

    await waitFor(() => {
      const messages = assistWs.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          type: 'context_update',
          context: expect.objectContaining({
            last_decision: 'approved'
          })
        })
      );
    });
  });

  it('should handle workflow update and ask assistant for next steps', async () => {
    const getToken = vi.fn(() => 'test-token');

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true
      })
    );

    const { result: assistantResult } = renderHook(() =>
      useAssistantWebSocket({
        caseId: 'case-123',
        getToken
      })
    );

    await advanceToAllConnected();

    const assistWs = getAssistantWs()!;

    act(() => {
      assistWs.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    await waitFor(() => {
      expect(assistantResult.current.conversationId).toBe('conv-789');
    });

    // Workflow completed
    const notifWs = getNotificationWs()!;
    act(() => {
      notifWs.simulateMessage({
        type: 'workflow_update',
        timestamp: new Date().toISOString(),
        data: {
          case_id: 'case-123',
          phase: 'EXTRACTION',
          status: 'completed',
          progress: 100
        }
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Ask assistant what to do next
    assistWs.clearSentMessages();

    act(() => {
      assistantResult.current.sendMessage(
        "L'extraction est terminée, que dois-je faire ?",
        { current_phase: 'EXTRACTION', status: 'completed' }
      ).catch(() => {}); // Catch eventual timeout rejection
    });

    await waitFor(() => {
      const messages = assistWs.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          type: 'message',
          content: expect.stringContaining('extraction'),
          additional_data: expect.objectContaining({
            current_phase: 'EXTRACTION'
          })
        })
      );
    });
  });
});

describe('WebSocket Integration - Error Handling', () => {
  it('should handle network failure gracefully', async () => {
    const getToken = vi.fn(() => 'test-token');
    const onError = vi.fn();

    const { result: notificationResult } = renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        onError
      })
    );

    const { result: assistantResult } = renderHook(() =>
      useAssistantWebSocket({
        caseId: 'case-123',
        getToken,
        onError
      })
    );

    await advanceToAllConnected();

    await waitFor(() => {
      expect(notificationResult.current.isConnected).toBe(true);
      expect(assistantResult.current.isConnected).toBe(true);
    });

    // Simulate complete network failure
    const notifWs = getNotificationWs()!;
    const assistWs = getAssistantWs()!;

    act(() => {
      notifWs.close(1006, 'Network error');
      assistWs.close(1006, 'Network error');
    });

    await waitFor(() => {
      expect(notificationResult.current.isConnected).toBe(false);
      expect(assistantResult.current.isConnected).toBe(false);
    });

    // Both should attempt to reconnect
    // Notification: 1s delay, Assistant: 3s delay
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });

    await waitFor(() => {
      expect(notificationResult.current.isConnected).toBe(true);
      expect(assistantResult.current.isConnected).toBe(true);
    });
  });

  it('should handle token expiration', async () => {
    let tokenValid = true;
    const getToken = vi.fn(() => tokenValid ? 'valid-token' : null);
    const onError = vi.fn();

    const { result: notificationResult } = renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        onError
      })
    );

    const { result: assistantResult } = renderHook(() =>
      useAssistantWebSocket({
        caseId: 'case-123',
        getToken,
        onError
      })
    );

    await advanceToAllConnected();

    await waitFor(() => {
      expect(notificationResult.current.isConnected).toBe(true);
      expect(assistantResult.current.isConnected).toBe(true);
    });

    // Simulate token expiration
    tokenValid = false;

    // Force disconnection
    act(() => {
      notificationResult.current.disconnect();
      assistantResult.current.disconnect();
    });

    await waitFor(() => {
      expect(notificationResult.current.isConnected).toBe(false);
      expect(assistantResult.current.isConnected).toBe(false);
    });

    // Try to reconnect with expired token
    act(() => {
      notificationResult.current.connect();
      assistantResult.current.connect();
    });

    await act(async () => {
      vi.advanceTimersByTime(220);
    });

    // Assistant hook warns when no token
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('No auth token')
    );
  });
});

describe('WebSocket Integration - Performance', () => {
  it('should handle high-frequency messages efficiently', async () => {
    const getToken = vi.fn(() => 'test-token');
    const addNotificationMock = vi.fn();

    (useNotificationStore as any).mockReturnValue({
      addNotification: addNotificationMock,
    });

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true
      })
    );

    await advanceToAllConnected();

    const notifWs = getNotificationWs()!;

    // Send 50 workflow events rapidly
    const startTime = performance.now();

    for (let i = 0; i < 50; i++) {
      act(() => {
        notifWs.simulateMessage({
          type: 'workflow_update',
          timestamp: new Date().toISOString(),
          data: {
            case_id: `case-${i}`,
            phase: 'EXTRACTION',
            status: 'started',
            progress: i * 2
          }
        });
      });
    }

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Should process quickly (< 500ms for 50 messages)
    expect(processingTime).toBeLessThan(500);

    // Should NOT create notifications for "started" updates
    expect(addNotificationMock).not.toHaveBeenCalled();
  });

  it('should handle multiple subscriptions without memory leaks', async () => {
    const getToken = vi.fn(() => 'test-token');

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true
      })
    );

    await advanceToAllConnected();

    const notifWs = getNotificationWs()!;

    // Create and remove 100 subscriptions
    const unsubscribers: Array<() => void> = [];

    for (let i = 0; i < 100; i++) {
      const handler = vi.fn();
      const unsubscribe = result.current.subscribe('workflow_update', handler);
      unsubscribers.push(unsubscribe);
    }

    // All subscriptions are active
    act(() => {
      notifWs.simulateMessage({
        type: 'workflow_update',
        timestamp: new Date().toISOString(),
        data: {
          case_id: 'case-123',
          phase: 'EXTRACTION',
          status: 'started'
        }
      });
    });

    // Clean up all subscriptions
    unsubscribers.forEach(unsub => unsub());

    // A new event should no longer trigger old handlers
    const handler = vi.fn();
    result.current.subscribe('workflow_update', handler);

    act(() => {
      notifWs.simulateMessage({
        type: 'workflow_update',
        timestamp: new Date().toISOString(),
        data: {
          case_id: 'case-456',
          phase: 'MATCHING',
          status: 'started'
        }
      });
    });

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle rapid connect/disconnect cycles', async () => {
    const getToken = vi.fn(() => 'test-token');

    const { result, unmount } = renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: false
      })
    );

    // 10 rapid connect/disconnect cycles
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.connect();
      });

      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      act(() => {
        result.current.disconnect();
      });

      await act(async () => {
        vi.advanceTimersByTime(50);
      });
    }

    // Should be in a stable state (disconnected)
    expect(result.current.isConnected).toBe(false);

    // After disconnect(), the hook sets reconnectAttempts to MAX to prevent
    // auto-reconnect. A fresh mount is needed to reconnect.
    unmount();

    // Re-render with autoConnect to verify stable reconnection
    const { result: result2 } = renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(220);
    });

    await waitFor(() => {
      expect(result2.current.isConnected).toBe(true);
    });
  });
});

describe('WebSocket Integration - Real-World Scenarios', () => {
  it('should handle complete HITL workflow with assistant guidance', async () => {
    const getToken = vi.fn(() => 'test-token');
    const addNotificationMock = vi.fn();

    (useNotificationStore as any).mockReturnValue({
      addNotification: addNotificationMock,
    });

    const onHITLRequired = vi.fn();

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        onHITLRequired
      })
    );

    const { result: assistantResult } = renderHook(() =>
      useAssistantWebSocket({
        caseId: 'case-123',
        getToken
      })
    );

    await advanceToAllConnected();

    const assistWs = getAssistantWs()!;
    const notifWs = getNotificationWs()!;

    act(() => {
      assistWs.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    await waitFor(() => {
      expect(assistantResult.current.conversationId).toBe('conv-789');
    });

    // 1. HITL decision required
    act(() => {
      notifWs.simulateMessage({
        type: 'hitl_decision_required',
        timestamp: new Date().toISOString(),
        data: {
          case_id: 'case-123',
          checkpoint: 'GO_NOGO',
          urgency: 'high',
          tender_reference: 'REF-2024-001'
        }
      });
    });

    await waitFor(() => {
      expect(onHITLRequired).toHaveBeenCalled();
      expect(addNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'high'
        })
      );
    });

    // 2. User asks assistant for help
    assistWs.clearSentMessages();

    let responsePromise: Promise<any> | undefined;
    act(() => {
      responsePromise = assistantResult.current.sendMessage(
        'Que dois-je verifier pour cette decision GO/NO-GO ?',
        { checkpoint: 'GO_NOGO', tender_reference: 'REF-2024-001' }
      );
    });

    // 3. Assistant responds with suggestions
    act(() => {
      assistWs.simulateMessage({
        type: 'response',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Pour la decision GO/NO-GO, verifiez les criteres suivants...',
          confidence: 0.92,
          suggested_actions: [
            {
              label: 'Approuver',
              description: 'Tous les criteres sont remplis',
              type: 'primary'
            },
            {
              label: 'Rejeter',
              description: 'Des criteres manquent',
              type: 'warning'
            }
          ]
        }
      });
    });

    const response = await responsePromise;
    expect(response.suggestions).toHaveLength(2);

    // 4. Decision taken
    act(() => {
      notifWs.simulateMessage({
        type: 'hitl_decision_made',
        timestamp: new Date().toISOString(),
        data: {
          case_id: 'case-123',
          checkpoint: 'GO_NOGO',
          decision: 'approved',
          decided_by: 'user@example.com'
        }
      });
    });

    await waitFor(() => {
      expect(addNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success'
        })
      );
    });

    // 5. Workflow continues
    act(() => {
      notifWs.simulateMessage({
        type: 'workflow_update',
        timestamp: new Date().toISOString(),
        data: {
          case_id: 'case-123',
          phase: 'STRATEGY',
          status: 'started',
          progress: 0
        }
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Only HITL required + decision made = 2 notifications
    expect(addNotificationMock).toHaveBeenCalledTimes(2);
  });
});
