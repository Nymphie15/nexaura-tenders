/**
 * Tests unitaires pour useAssistantWebSocket
 *
 * Teste:
 * - Connexion/deconnexion WebSocket
 * - Creation de conversation
 * - Envoi et reception de messages
 * - Gestion du typing indicator
 * - Mise a jour du contexte
 * - Reconnexion automatique
 * - Gestion des erreurs
 * - Keepalive ping
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAssistantWebSocket } from '@/hooks/use-assistant-websocket';
import type { AssistantMessage } from '@/hooks/use-assistant-websocket';

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
  private sentMessages: string[] = [];

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
    this.sentMessages.push(data);
  }

  getSentMessages(): unknown[] {
    return this.sentMessages.map(msg => JSON.parse(msg));
  }

  clearSentMessages(): void {
    this.sentMessages = [];
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
// Setup & Teardown
// ============================================

function getLatestMockWs(): MockWebSocket | null {
  return mockInstances.length > 0 ? mockInstances[mockInstances.length - 1] : null;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockInstances = [];

  // Assign MockWebSocket as global.WebSocket directly (class IS a constructor)
  global.WebSocket = MockWebSocket as any;

  // Mock console methods
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  mockInstances = [];
  MockWebSocket.preventAutoOpen = false;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ============================================
// Tests
// ============================================

describe('useAssistantWebSocket - Connection Management', () => {
  it('should connect automatically on mount', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    expect(result.current.isConnected).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(mockInstances.length).toBeGreaterThanOrEqual(1);
    expect(getLatestMockWs()?.url).toContain('token=test-token');
  });

  it('should create conversation after connection', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    // Simulate the "connected" response
    act(() => {
      ws.simulateMessage({
        type: 'connected',
        connection_id: 'conn-456'
      });
    });

    await waitFor(() => {
      const messages = ws.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          type: 'create_conversation',
          case_id: 'case-123'
        })
      );
    });
  });

  it('should set conversationId when conversation is created', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'connected',
        connection_id: 'conn-456'
      });
    });

    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-789');
    });
  });

  it('should disconnect properly on unmount', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result, unmount } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const ws = getLatestMockWs()!;

    unmount();

    expect(ws.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('should handle manual disconnect', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    act(() => {
      result.current.disconnect();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.conversationId).toBeNull();
    });
  });

  it('should skip connection when no auth token', async () => {
    const getToken = vi.fn(() => null);
    const caseId = 'case-123';

    renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    // The hook logs a warning and skips connection when no token
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('No auth token')
    );
    // No WebSocket instances should have been created
    expect(mockInstances).toHaveLength(0);
  });
});

describe('useAssistantWebSocket - Reconnection Logic', () => {
  it('should reconnect automatically after disconnect', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

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

    // Advance for reconnection (3s delay + 10ms for WS open)
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should reset conversation state on reconnect', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-789');
    });

    // Simulate disconnection
    act(() => {
      ws.close(1006);
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBeNull();
    });
  });

  it('should call onError when max reconnect attempts exhausted', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';
    const onError = vi.fn();

    renderHook(() =>
      useAssistantWebSocket({ caseId, getToken, onError })
    );

    // Let the initial connection succeed
    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    // Now prevent all future WebSocket connections from auto-opening.
    // This simulates persistent network failure: new WS instances stay
    // in CONNECTING state, so onopen never fires and the counter never resets.
    MockWebSocket.preventAutoOpen = true;

    // Close the current connected WS to trigger reconnection attempts
    const ws = getLatestMockWs()!;
    act(() => {
      ws.close(1006);
    });

    // MAX_RECONNECT_ATTEMPTS = 5, RECONNECT_DELAY = 3000ms.
    // The hook's onclose callback: if counter < 5, schedules reconnect
    // after 3000ms. The setTimeout callback increments counter then calls
    // doConnect(). doConnect() creates a new WS that stays CONNECTING
    // (never opens), and the hook checks readyState===OPEN||CONNECTING
    // to skip duplicate connects. But on the NEXT close from a failed
    // connection, the loop continues.
    //
    // However, since preventAutoOpen means the new WS never opens and
    // never closes by itself, we need to manually close each new WS
    // to trigger the next reconnection attempt.
    for (let i = 0; i < 6; i++) {
      // Advance past the reconnect delay to trigger reconnection
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });

      if (onError.mock.calls.length > 0) break;

      // The new WS is stuck in CONNECTING. Close it to trigger onclose.
      const newWs = getLatestMockWs()!;
      if (newWs.readyState === MockWebSocket.CONNECTING) {
        act(() => {
          newWs.readyState = MockWebSocket.CLOSED;
          newWs.onclose?.(new CloseEvent('close', { code: 1006, reason: 'Connection failed' }));
        });
      }
    }

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('multiple attempts')
    );
  });
});

describe('useAssistantWebSocket - Message Handling', () => {
  it('should send user message and add to messages array', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-789');
    });

    ws.clearSentMessages();

    // Send a message (catch the eventual timeout rejection)
    let messagePromise: Promise<AssistantMessage> | undefined;
    act(() => {
      messagePromise = result.current.sendMessage('Hello, assistant!');
      messagePromise.catch(() => {}); // Prevent unhandled rejection
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        role: 'user',
        content: 'Hello, assistant!'
      });
    });

    const messages = ws.getSentMessages();
    expect(messages).toContainEqual(
      expect.objectContaining({
        type: 'message',
        conversation_id: 'conv-789',
        content: 'Hello, assistant!'
      })
    );
  });

  it('should handle typing indicator', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    expect(result.current.isTyping).toBe(false);

    act(() => {
      ws.simulateMessage({ type: 'typing' });
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true);
    });
  });

  it('should receive assistant response', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    act(() => {
      ws.simulateMessage({ type: 'typing' });
    });

    const responseData = {
      type: 'response',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Hello! How can I help you?',
        confidence: 0.95,
        suggested_actions: [
          {
            label: 'Continue workflow',
            description: 'Approve and continue',
            type: 'primary'
          }
        ]
      }
    };

    act(() => {
      ws.simulateMessage(responseData);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        role: 'assistant',
        content: 'Hello! How can I help you?',
        confidence: 0.95
      });
      expect(result.current.messages[0].suggestions).toHaveLength(1);
    });
  });

  it('should handle full conversation flow', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-789');
    });

    // User sends message
    let messagePromise: Promise<AssistantMessage> | undefined;
    act(() => {
      messagePromise = result.current.sendMessage('What is my next step?');
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true);
      expect(result.current.messages).toHaveLength(1);
    });

    // Assistant responds
    act(() => {
      ws.simulateMessage({
        type: 'response',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Your next step is to review the document.',
          confidence: 0.9
        }
      });
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[1].role).toBe('assistant');
    });

    // Wait for promise to resolve
    const response = await messagePromise;
    expect(response!.content).toBe('Your next step is to review the document.');
  });

  it('should reject sendMessage when not connected', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    // Don't advance timers, so WS is not yet OPEN
    await expect(
      result.current.sendMessage('Hello')
    ).rejects.toThrow('WebSocket not connected');
  });

  it('should reject sendMessage when conversation not created', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // WS is open but no conversation_created message yet
    await expect(
      result.current.sendMessage('Hello')
    ).rejects.toThrow('Conversation not created yet');
  });

  it('should handle error response', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken, onError })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    act(() => {
      ws.simulateMessage({
        type: 'error',
        message: 'Something went wrong'
      });
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Something went wrong');
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toContain('Erreur');
    });
  });

  it('should timeout sendMessage after 30 seconds', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-789');
    });

    // Create promise and store rejection
    let rejectedError: Error | null = null;
    const messagePromise = result.current.sendMessage('Test message');
    // Attach catch immediately to prevent unhandled rejection warning
    messagePromise.catch((err) => {
      rejectedError = err;
    });

    await act(async () => {
      vi.advanceTimersByTime(30100);
    });

    // Wait for the rejection to be processed
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    expect(rejectedError).toBeInstanceOf(Error);
    expect(rejectedError?.message).toBe('Response timeout');
  });

  it('should ignore pong messages', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({ type: 'pong' });
    });

    expect(result.current.messages).toHaveLength(0);
  });
});

describe('useAssistantWebSocket - Context Management', () => {
  it('should send context update', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-789');
    });

    ws.clearSentMessages();

    const newContext = {
      checkpoint: 'GO_NOGO',
      tender_reference: 'REF-2024-001'
    };

    act(() => {
      result.current.updateContext(newContext);
    });

    await waitFor(() => {
      const messages = ws.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          type: 'context_update',
          conversation_id: 'conv-789',
          context: newContext
        })
      );
    });
  });

  it('should silently skip context update without connection', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    // Don't advance timers -- WS not yet OPEN
    act(() => {
      result.current.updateContext({ test: 'data' });
    });

    // No exception thrown -- that is the expected behavior
    expect(mockInstances.length).toBe(1);
    expect(getLatestMockWs()?.readyState).toBe(MockWebSocket.CONNECTING);
  });

  it('should silently skip context update without conversation', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const ws = getLatestMockWs()!;
    ws.clearSentMessages();

    // WS is open but no conversationId yet
    act(() => {
      result.current.updateContext({ test: 'data' });
    });

    const messages = ws.getSentMessages();
    expect(messages).toHaveLength(0);
  });
});

describe('useAssistantWebSocket - Keepalive', () => {
  it('should send ping every 30 seconds when connected', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;
    expect(ws.readyState).toBe(MockWebSocket.OPEN);

    ws.clearSentMessages();

    // Advance 30 seconds
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    const messages = ws.getSentMessages();
    expect(messages).toContainEqual({ type: 'ping' });
  });

  it('should NOT send ping when disconnected', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    // Disconnect
    act(() => {
      result.current.disconnect();
    });

    ws.clearSentMessages();

    // Advance 30 seconds
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    const messages = ws.getSentMessages();
    expect(messages).toHaveLength(0);
  });
});

describe('useAssistantWebSocket - Utilities', () => {
  it('should clear messages', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-789');
    });

    // Send a message (catch the eventual timeout rejection)
    act(() => {
      result.current.sendMessage('Test message').catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toHaveLength(0);
  });

  it('should handle manual reconnect', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    act(() => {
      result.current.disconnect();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

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
});

describe('useAssistantWebSocket - Edge Cases', () => {
  it('should handle malformed JSON message', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    const event = new MessageEvent('message', {
      data: 'invalid json {{'
    });

    act(() => {
      ws.onmessage?.(event);
    });

    // The hook catches JSON parse errors and logs them
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse message'),
      expect.any(Error)
    );
  });

  it('should not create conversation twice', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    // First "connected" event triggers create_conversation
    act(() => {
      ws.simulateMessage({
        type: 'connected',
        connection_id: 'conn-456'
      });
    });

    await waitFor(() => {
      const messages = ws.getSentMessages();
      const createConvMessages = messages.filter(
        (m: any) => m.type === 'create_conversation'
      );
      expect(createConvMessages).toHaveLength(1);
    });

    // Simulate conversation_created so conversationCreatedRef becomes true
    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    // Another "connected" event should NOT trigger another create_conversation
    act(() => {
      ws.simulateMessage({
        type: 'connected',
        connection_id: 'conn-456'
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const messages = ws.getSentMessages();
    const createConvMessages = messages.filter(
      (m: any) => m.type === 'create_conversation'
    );
    expect(createConvMessages).toHaveLength(1);
  });

  it('should handle sendMessage with additional context', async () => {
    const getToken = vi.fn(() => 'test-token');
    const caseId = 'case-123';

    const { result } = renderHook(() =>
      useAssistantWebSocket({ caseId, getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    const ws = getLatestMockWs()!;

    act(() => {
      ws.simulateMessage({
        type: 'conversation_created',
        conversation_id: 'conv-789'
      });
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-789');
    });

    ws.clearSentMessages();

    const additionalContext = {
      checkpoint: 'GO_NOGO',
      urgent: true
    };

    act(() => {
      result.current.sendMessage('What should I do?', additionalContext).catch(() => {});
    });

    await waitFor(() => {
      const messages = ws.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          type: 'message',
          content: 'What should I do?',
          additional_data: additionalContext
        })
      );
    });
  });
});
