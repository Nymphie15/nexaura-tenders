/**
 * Tests unitaires pour useRealtimeNotifications
 *
 * Teste:
 * - Connexion/deconnexion WebSocket
 * - Gestion des messages entrants (tous les types)
 * - Reconnexion automatique avec backoff exponentiel
 * - Systeme de souscription aux evenements
 * - Integration avec le notification store
 * - Keepalive ping
 * - Gestion des erreurs
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import type {
  HITLDecisionRequiredEvent,
  HITLDecisionMadeEvent,
  WorkflowUpdateEvent,
  NotificationEvent,
  ExtensionSyncEvent,
} from '@/hooks/use-realtime-notifications';
import { useNotificationStore } from '@/stores/notification-store';

// ============================================
// Mock WebSocket
// ============================================

let mockInstances: MockWebSocket[] = [];

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  // When true, new instances will NOT auto-open (stays CONNECTING)
  static preventAutoOpen = false;

  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  private messageHandlers: Set<(event: MessageEvent) => void> = new Set();

  constructor(url: string) {
    this.url = url;
    mockInstances.push(this);

    // Simulate async connection (unless prevented)
    if (!MockWebSocket.preventAutoOpen) {
      setTimeout(() => {
        if (this.readyState === MockWebSocket.CONNECTING) {
          this.readyState = MockWebSocket.OPEN;
          this.onopen?.(new Event('open'));
        }
      }, 10);
    }
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
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
}

// ============================================
// Mock Store
// ============================================

vi.mock('@/stores/notification-store', () => ({
  useNotificationStore: vi.fn(() => ({
    addNotification: vi.fn(),
  })),
}));

// ============================================
// Mock Audio
// ============================================

// ============================================
// Mock Audio
// ============================================

let audioInstances: MockAudio[] = [];

class MockAudio {
  volume = 1;
  src = '';
  play = vi.fn(() => Promise.resolve());

  constructor(src?: string) {
    if (src) this.src = src;
    audioInstances.push(this);
  }
}

// ============================================
// Setup & Teardown
// ============================================

let addNotificationMock: ReturnType<typeof vi.fn>;

function getLatestMockWs(): MockWebSocket | null {
  return mockInstances.length > 0 ? mockInstances[mockInstances.length - 1] : null;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockInstances = [];
  audioInstances = [];

  // Assign MockWebSocket directly as global.WebSocket (class IS a constructor)
  global.WebSocket = MockWebSocket as any;

  // Assign MockAudio directly as global.Audio (class IS a constructor)
  global.Audio = MockAudio as any;

  // Mock notification store
  addNotificationMock = vi.fn();
  (useNotificationStore as any).mockReturnValue({
    addNotification: addNotificationMock,
  });

  // Mock console methods
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});

  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  mockInstances = [];
  audioInstances = [];
  MockWebSocket.preventAutoOpen = false;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ============================================
// Helper: advance timers for autoConnect (200ms delay) + WS open (10ms)
// ============================================

async function advanceToConnected() {
  await act(async () => {
    vi.advanceTimersByTime(220);
  });
}

// ============================================
// Tests
// ============================================

describe('useRealtimeNotifications - Connection Management', () => {
  it('should connect automatically when autoConnect is true', async () => {
    const getToken = vi.fn(() => 'test-token');

    const { result } = renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    expect(result.current.isConnected).toBe(false);

    await advanceToConnected();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(mockInstances.length).toBeGreaterThanOrEqual(1);
    expect(getLatestMockWs()?.url).toContain('token=test-token');
  });

  it('should NOT connect automatically when autoConnect is false', async () => {
    const getToken = vi.fn(() => 'test-token');

    renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: false })
    );

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(mockInstances).toHaveLength(0);
  });

  it('should connect manually with connect()', async () => {
    const getToken = vi.fn(() => 'test-token');

    const { result } = renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: false })
    );

    expect(result.current.isConnected).toBe(false);

    act(() => {
      result.current.connect();
    });

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should disconnect properly', async () => {
    const getToken = vi.fn(() => 'test-token');

    const { result } = renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    await advanceToConnected();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    act(() => {
      result.current.disconnect();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionId).toBeNull();
    });
  });

  it('should handle no token by failing silently', async () => {
    const getToken = vi.fn(() => null);

    renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    await advanceToConnected();

    // The hook's connect() catches the error from getWebSocketUrl() silently.
    // No WebSocket instances should have been created.
    expect(mockInstances).toHaveLength(0);
  });
});

describe('useRealtimeNotifications - Reconnection Logic', () => {
  it('should reconnect automatically after disconnect', async () => {
    const getToken = vi.fn(() => 'test-token');

    const { result } = renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    await advanceToConnected();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const ws = getLatestMockWs()!;

    // Simulate disconnection
    act(() => {
      ws.close(1006, 'Connection lost');
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    // Advance for first reconnect attempt (1s delay + 10ms WS open)
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should use exponential backoff for reconnection', async () => {
    const getToken = vi.fn(() => 'test-token');

    renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    await advanceToConnected();

    // First disconnection -> reconnect after 1s
    let ws = getLatestMockWs()!;
    act(() => {
      ws.close(1006);
    });

    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    // Second disconnection -> reconnect after 2s
    ws = getLatestMockWs()!;
    act(() => {
      ws.close(1006);
    });

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Third disconnection -> reconnect after 4s
    ws = getLatestMockWs()!;
    act(() => {
      ws.close(1006);
    });

    await act(async () => {
      vi.advanceTimersByTime(4100);
    });

    // Verify reconnections: initial + 3 reconnections = 4
    expect(mockInstances.length).toBe(4);
  });

  it('should stop reconnecting after MAX_RECONNECT_ATTEMPTS', async () => {
    const getToken = vi.fn(() => 'test-token');

    renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    // Let the initial connection succeed
    await advanceToConnected();

    // Now prevent all future WebSocket connections from auto-opening.
    // This simulates persistent network failure.
    MockWebSocket.preventAutoOpen = true;

    // Close the current connected WS to trigger reconnection attempts
    const ws = getLatestMockWs()!;
    act(() => {
      ws.close(1006);
    });

    // MAX_RECONNECT_ATTEMPTS = 3, backoff: 1s, 2s, 4s
    // Each reconnect: timer fires → counter++ → connect() → new WS (stays CONNECTING)
    // We must manually close each stuck WS to trigger the next onclose.
    // After 3 increments, connect() returns early (counter >= MAX), no new WS.
    for (let i = 0; i < 3; i++) {
      const delay = Math.min(1000 * Math.pow(2, i), 30000) + 100;
      await act(async () => {
        vi.advanceTimersByTime(delay);
      });

      // The new WS is stuck in CONNECTING. Close it to trigger onclose.
      const newWs = getLatestMockWs()!;
      if (newWs.readyState === MockWebSocket.CONNECTING) {
        act(() => {
          newWs.readyState = MockWebSocket.CLOSED;
          newWs.onclose?.(new CloseEvent('close', { code: 1006, reason: 'Connection failed' }));
        });
      }
    }

    // After 3 failed reconnects, the counter reaches MAX_RECONNECT_ATTEMPTS (3).
    // The last setTimeout fires counter++ → 3, then connect() returns early.
    // Record instance count, then wait to confirm no more reconnections happen.
    const instanceCountAfterExhaustion = mockInstances.length;

    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    // No new instances should have been created after exhaustion
    expect(mockInstances.length).toBe(instanceCountAfterExhaustion);
  });
});

describe('useRealtimeNotifications - Message Handling', () => {
  it('should handle "connected" event', async () => {
    const getToken = vi.fn(() => 'test-token');

    const { result } = renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'connected',
        timestamp: new Date().toISOString(),
        data: { connection_id: 'conn-123' }
      });
    });

    await waitFor(() => {
      expect(result.current.connectionId).toBe('conn-123');
    });
  });

  it('should handle "hitl_decision_required" event', async () => {
    const getToken = vi.fn(() => 'test-token');
    const onHITLRequired = vi.fn();

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        onHITLRequired,
        enableSound: false
      })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    const event: HITLDecisionRequiredEvent = {
      type: 'hitl_decision_required',
      timestamp: new Date().toISOString(),
      data: {
        case_id: 'case-123',
        checkpoint: 'GO_NOGO',
        tender_reference: 'REF-2024-001',
        urgency: 'high',
        deadline: '2024-12-31T23:59:59Z'
      }
    };

    act(() => {
      ws.simulateMessage(event);
    });

    await waitFor(() => {
      expect(onHITLRequired).toHaveBeenCalledWith(event);
      expect(addNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          priority: 'high',
          title: 'Décision requise',
          message: expect.stringContaining('case-123'),
          link: '/workflow/case-123/hitl/GO_NOGO'
        })
      );
    });
  });

  it('should handle "hitl_decision_made" event', async () => {
    const getToken = vi.fn(() => 'test-token');
    const onHITLDecided = vi.fn();

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        onHITLDecided
      })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    const event: HITLDecisionMadeEvent = {
      type: 'hitl_decision_made',
      timestamp: new Date().toISOString(),
      data: {
        case_id: 'case-123',
        checkpoint: 'GO_NOGO',
        decision: 'approved',
        decided_by: 'user@example.com'
      }
    };

    act(() => {
      ws.simulateMessage(event);
    });

    await waitFor(() => {
      expect(onHITLDecided).toHaveBeenCalledWith(event);
      expect(addNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          priority: 'medium',
          title: 'Décision HITL prise'
        })
      );
    });
  });

  it('should handle "workflow_update" event (completed)', async () => {
    const getToken = vi.fn(() => 'test-token');
    const onWorkflowUpdate = vi.fn();

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        onWorkflowUpdate,
        enableSound: false
      })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    const event: WorkflowUpdateEvent = {
      type: 'workflow_update',
      timestamp: new Date().toISOString(),
      data: {
        case_id: 'case-123',
        phase: 'GENERATION',
        status: 'completed',
        progress: 100,
        message: 'Document genere avec succes'
      }
    };

    act(() => {
      ws.simulateMessage(event);
    });

    await waitFor(() => {
      expect(onWorkflowUpdate).toHaveBeenCalledWith(event);
      expect(addNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          priority: 'low',
        })
      );
    });
  });

  it('should handle "workflow_update" event (failed)', async () => {
    const getToken = vi.fn(() => 'test-token');

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        enableSound: false
      })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    const event: WorkflowUpdateEvent = {
      type: 'workflow_update',
      timestamp: new Date().toISOString(),
      data: {
        case_id: 'case-123',
        phase: 'EXTRACTION',
        status: 'failed',
        message: "Erreur lors de l'extraction"
      }
    };

    act(() => {
      ws.simulateMessage(event);
    });

    await waitFor(() => {
      expect(addNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          priority: 'high',
        })
      );
    });
  });

  it('should NOT notify for workflow_update in progress', async () => {
    const getToken = vi.fn(() => 'test-token');
    const onWorkflowUpdate = vi.fn();

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        onWorkflowUpdate
      })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    const event: WorkflowUpdateEvent = {
      type: 'workflow_update',
      timestamp: new Date().toISOString(),
      data: {
        case_id: 'case-123',
        phase: 'EXTRACTION',
        status: 'started',
        progress: 25
      }
    };

    act(() => {
      ws.simulateMessage(event);
    });

    await waitFor(() => {
      expect(onWorkflowUpdate).toHaveBeenCalledWith(event);
    });

    expect(addNotificationMock).not.toHaveBeenCalled();
  });

  it('should handle "notification" event', async () => {
    const getToken = vi.fn(() => 'test-token');

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        enableSound: false
      })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    const event: NotificationEvent = {
      type: 'notification',
      timestamp: new Date().toISOString(),
      data: {
        title: 'Test Notification',
        message: 'This is a test',
        priority: 'medium',
        notification_type: 'info',
        link: '/dashboard'
      }
    };

    act(() => {
      ws.simulateMessage(event);
    });

    await waitFor(() => {
      expect(addNotificationMock).toHaveBeenCalledWith({
        type: 'info',
        priority: 'medium',
        title: 'Test Notification',
        message: 'This is a test',
        link: '/dashboard',
        metadata: undefined
      });
    });
  });

  it('should handle "extension_sync" event', async () => {
    const getToken = vi.fn(() => 'test-token');
    const onExtensionSync = vi.fn();

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        onExtensionSync
      })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    const event: ExtensionSyncEvent = {
      type: 'extension_sync',
      timestamp: new Date().toISOString(),
      data: {
        action: 'tender_detected',
        url: 'https://example.com/tender/123',
        tender_data: { reference: 'REF-123' }
      }
    };

    act(() => {
      ws.simulateMessage(event);
    });

    await waitFor(() => {
      expect(onExtensionSync).toHaveBeenCalledWith(event);
      expect(addNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          priority: 'medium',
          title: "Appel d'offre détecté"
        })
      );
    });
  });

  it('should handle "error" event', async () => {
    const getToken = vi.fn(() => 'test-token');
    const onError = vi.fn();

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        onError
      })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'error',
        timestamp: new Date().toISOString(),
        data: { message: 'Server error occurred' }
      });
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Server error occurred');
    });
  });

  it('should ignore "pong" messages', async () => {
    const getToken = vi.fn(() => 'test-token');

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true
      })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'pong',
        timestamp: new Date().toISOString(),
        data: {}
      });
    });

    expect(addNotificationMock).not.toHaveBeenCalled();
  });

  it('should warn on unknown message type', async () => {
    const getToken = vi.fn(() => 'test-token');

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true
      })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'unknown_type',
        timestamp: new Date().toISOString(),
        data: {}
      });
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unknown message type'),
      'unknown_type'
    );
  });
});

describe('useRealtimeNotifications - Event Subscription', () => {
  it('should allow subscribing to specific event types', async () => {
    const getToken = vi.fn(() => 'test-token');
    const customHandler = vi.fn();

    const { result } = renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    let unsubscribe: (() => void) | undefined;
    act(() => {
      unsubscribe = result.current.subscribe('hitl_decision_required', customHandler);
    });

    const event: HITLDecisionRequiredEvent = {
      type: 'hitl_decision_required',
      timestamp: new Date().toISOString(),
      data: {
        case_id: 'case-123',
        checkpoint: 'GO_NOGO',
        urgency: 'medium'
      }
    };

    act(() => {
      ws.simulateMessage(event);
    });

    await waitFor(() => {
      expect(customHandler).toHaveBeenCalledWith(event);
    });

    // Unsubscribe
    act(() => {
      unsubscribe?.();
    });

    customHandler.mockClear();
    act(() => {
      ws.simulateMessage(event);
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(customHandler).not.toHaveBeenCalled();
  });

  it('should support multiple handlers for same event type', async () => {
    const getToken = vi.fn(() => 'test-token');
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { result } = renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    act(() => {
      result.current.subscribe('hitl_decision_required', handler1);
      result.current.subscribe('hitl_decision_required', handler2);
    });

    const event: HITLDecisionRequiredEvent = {
      type: 'hitl_decision_required',
      timestamp: new Date().toISOString(),
      data: {
        case_id: 'case-123',
        checkpoint: 'GO_NOGO',
        urgency: 'medium'
      }
    };

    act(() => {
      ws.simulateMessage(event);
    });

    await waitFor(() => {
      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });
  });
});

describe('useRealtimeNotifications - Keepalive', () => {
  it('should send ping every 30 seconds when connected', async () => {
    const getToken = vi.fn(() => 'test-token');
    const sendSpy = vi.fn();

    renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;
    expect(ws.readyState).toBe(MockWebSocket.OPEN);

    ws.send = sendSpy;

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(sendSpy).toHaveBeenCalledWith(
      JSON.stringify({ type: 'ping' })
    );

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(sendSpy).toHaveBeenCalledTimes(2);
  });

  it('should NOT send ping when disconnected', async () => {
    const getToken = vi.fn(() => 'test-token');
    const sendSpy = vi.fn();

    const { result } = renderHook(() =>
      useRealtimeNotifications({ getToken, autoConnect: true })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;
    ws.send = sendSpy;

    act(() => {
      result.current.disconnect();
    });

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(sendSpy).not.toHaveBeenCalled();
  });
});

describe('useRealtimeNotifications - Sound Notifications', () => {
  it('should play sound for urgent HITL notifications when enabled', async () => {
    const getToken = vi.fn(() => 'test-token');

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        enableSound: true
      })
    );

    await advanceToConnected();

    await waitFor(() => {
      expect(getLatestMockWs()?.readyState).toBe(MockWebSocket.OPEN);
    });

    const ws = getLatestMockWs()!;

    const event: HITLDecisionRequiredEvent = {
      type: 'hitl_decision_required',
      timestamp: new Date().toISOString(),
      data: {
        case_id: 'case-123',
        checkpoint: 'GO_NOGO',
        urgency: 'critical'
      }
    };

    act(() => {
      ws.simulateMessage(event);
    });

    await waitFor(() => {
      // First verify the notification was added (happens before sound)
      expect(addNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          title: 'Décision requise'
        })
      );
    });

    // Audio was instantiated and play() was called
    expect(audioInstances.length).toBeGreaterThanOrEqual(1);
    expect(audioInstances[0].play).toHaveBeenCalled();
  });

  it('should NOT play sound when enableSound is false', async () => {
    const getToken = vi.fn(() => 'test-token');

    renderHook(() =>
      useRealtimeNotifications({
        getToken,
        autoConnect: true,
        enableSound: false
      })
    );

    await advanceToConnected();

    const ws = getLatestMockWs()!;

    const event: HITLDecisionRequiredEvent = {
      type: 'hitl_decision_required',
      timestamp: new Date().toISOString(),
      data: {
        case_id: 'case-123',
        checkpoint: 'GO_NOGO',
        urgency: 'critical'
      }
    };

    act(() => {
      ws.simulateMessage(event);
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // No Audio instances should have been created (sound disabled)
    expect(audioInstances).toHaveLength(0);
  });
});
