import { useEffect, useRef, useState, useCallback } from "react";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: AssistantSuggestion[];
  confidence?: number;
  timestamp: string;
}

export interface AssistantSuggestion {
  label: string;
  description: string;
  type: "primary" | "secondary" | "warning";
  data?: Record<string, any>;
}

export interface AssistantContext {
  case_id?: string;
  checkpoint?: string;
  tender_reference?: string;
  [key: string]: any;
}

export interface UseAssistantWebSocketOptions {
  caseId: string;
  getToken: () => string | null;
  onError?: (error: string) => void;
}

export function useAssistantWebSocket({
  caseId,
  getToken,
  onError,
}: UseAssistantWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const conversationCreatedRef = useRef(false);
  const mountedRef = useRef(false);
  const caseIdRef = useRef(caseId);
  const getTokenRef = useRef(getToken);
  const onErrorRef = useRef(onError);

  // Keep refs in sync
  caseIdRef.current = caseId;
  getTokenRef.current = getToken;
  onErrorRef.current = onError;

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  const doDisconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConversationId(null);
    conversationCreatedRef.current = false;
    reconnectAttemptsRef.current = 0;
  }, []);

  const doConnect = useCallback(() => {
    const currentCaseId = caseIdRef.current;
    if (!currentCaseId || !mountedRef.current) return;

    // Don't connect if already connected or connecting
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const token = getTokenRef.current();
    if (!token) {
      console.warn("[WebSocket] No auth token, skipping connect");
      return;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    const url = `${baseUrl}/assistant?token=${encodeURIComponent(token)}`;
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        conversationCreatedRef.current = false;
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        setIsConnected(false);
        setConversationId(null);
        conversationCreatedRef.current = false;

        // Auto-reconnect only if still mounted and caseId valid
        if (
          mountedRef.current &&
          caseIdRef.current &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            doConnect();
          }, RECONNECT_DELAY);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          onErrorRef.current?.("WebSocket connection failed after multiple attempts");
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "connected":
              // Auto-create conversation
              if (
                wsRef.current?.readyState === WebSocket.OPEN &&
                !conversationCreatedRef.current
              ) {
                wsRef.current.send(
                  JSON.stringify({
                    type: "create_conversation",
                    case_id: caseIdRef.current,
                    initial_context: { case_id: caseIdRef.current },
                  })
                );
              }
              break;

            case "conversation_created":
              setConversationId(data.conversation_id);
              conversationCreatedRef.current = true;
              break;

            case "typing":
              setIsTyping(true);
              break;

            case "response":
              setIsTyping(false);
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: data.data.message,
                  suggestions: data.data.suggested_actions?.map(
                    (action: any) => ({
                      label: action.label || action.action,
                      description: action.description || "",
                      type: action.type || "secondary",
                      data: action.data,
                    })
                  ),
                  confidence: data.data.confidence,
                  timestamp: data.timestamp || new Date().toISOString(),
                },
              ]);
              break;

            case "error":
              setIsTyping(false);
              console.error("[WebSocket] Server error:", data.message);
              onErrorRef.current?.(data.message);
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: `Erreur: ${data.message}`,
                  timestamp: new Date().toISOString(),
                },
              ]);
              break;

            case "pong":
              break;

            default:
              console.warn("[WebSocket] Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("[WebSocket] Connection failed:", error);
      onErrorRef.current?.(
        error instanceof Error ? error.message : "Connection failed"
      );
    }
  }, []);

  // Single effect for connection lifecycle - only depends on caseId
  useEffect(() => {
    mountedRef.current = true;

    if (caseId) {
      doConnect();
    }

    return () => {
      mountedRef.current = false;
      doDisconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // Keepalive ping every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Send message
  const sendMessage = useCallback(
    async (
      content: string,
      context?: AssistantContext
    ): Promise<AssistantMessage> => {
      return new Promise((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reject(new Error("WebSocket not connected"));
          return;
        }

        if (!conversationId) {
          reject(new Error("Conversation not created yet"));
          return;
        }

        const userMessage: AssistantMessage = {
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);

        const payload = {
          type: "message",
          conversation_id: conversationId,
          content,
          additional_data: context || {},
        };

        wsRef.current.send(JSON.stringify(payload));
        setIsTyping(true);

        const messageHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "response") {
              wsRef.current?.removeEventListener("message", messageHandler);
              const assistantMessage: AssistantMessage = {
                role: "assistant",
                content: data.data.message,
                suggestions: data.data.suggested_actions?.map(
                  (action: any) => ({
                    label: action.label || action.action,
                    description: action.description || "",
                    type: action.type || "secondary",
                    data: action.data,
                  })
                ),
                confidence: data.data.confidence,
                timestamp: data.timestamp || new Date().toISOString(),
              };
              resolve(assistantMessage);
            }
          } catch (error) {
            wsRef.current?.removeEventListener("message", messageHandler);
            reject(error);
          }
        };

        wsRef.current.addEventListener("message", messageHandler);

        setTimeout(() => {
          wsRef.current?.removeEventListener("message", messageHandler);
          reject(new Error("Response timeout"));
        }, 30000);
      });
    },
    [conversationId]
  );

  // Update context
  const updateContext = useCallback(
    (context: AssistantContext) => {
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !conversationId
      ) {
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type: "context_update",
          conversation_id: conversationId,
          context,
        })
      );
    },
    [conversationId]
  );

  return {
    isConnected,
    conversationId,
    messages,
    isTyping,
    sendMessage,
    updateContext,
    connect: doConnect,
    disconnect: doDisconnect,
    clearMessages: () => setMessages([]),
  };
}
