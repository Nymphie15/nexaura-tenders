"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  useAssistantWebSocket,
  type AssistantMessage,
} from "@/hooks/use-assistant-websocket";
import { llmTestsApi } from "@/lib/api/endpoints";
import type { ChatMessage } from "@/components/ai-copilot/chat-interface";

export interface UseCopilotChatOptions {
  caseId?: string | null;
}

export interface UseCopilotChatReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  isConnected: boolean;
  connectionError: boolean;
  sendMessage: (content: string) => Promise<void>;
  reconnect: () => void;
  clearMessages: () => void;
}

const SYSTEM_PROMPT =
  "Tu es un assistant IA pour la plateforme d'appels d'offres Nexaura. " +
  "Tu aides les utilisateurs a analyser des appels d'offres, rediger des memoires techniques, " +
  "et naviguer dans la plateforme. Reponds en francais.";

let messageIdCounter = 0;
function nextMessageId(): string {
  return `msg-${Date.now()}-${++messageIdCounter}`;
}

function assistantToChatMessage(msg: AssistantMessage): ChatMessage {
  return {
    id: nextMessageId(),
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp),
  };
}

export function useCopilotChat({
  caseId,
}: UseCopilotChatOptions = {}): UseCopilotChatReturn {
  const isWSMode = !!caseId;

  // ─── WS Mode state ───
  const wsConnectionErrorRef = useRef(false);
  const [wsConnectionError, setWsConnectionError] = useState(false);
  const prevMessagesRef = useRef<ChatMessage[]>([]);
  const prevWsLengthRef = useRef(0);

  const getToken = useCallback(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null,
    []
  );

  const ws = useAssistantWebSocket({
    caseId: caseId || "",
    getToken,
    onError: () => {
      wsConnectionErrorRef.current = true;
      setWsConnectionError(true);
    },
  });

  // Incremental transform: O(1) per new WS message (#13)
  const wsMessages = (() => {
    if (!isWSMode) return [];
    const wsLen = ws.messages.length;
    if (wsLen === prevWsLengthRef.current) {
      return prevMessagesRef.current;
    }
    const newMsgs = ws.messages
      .slice(prevWsLengthRef.current)
      .map(assistantToChatMessage);
    const combined = [...prevMessagesRef.current, ...newMsgs];
    prevMessagesRef.current = combined;
    prevWsLengthRef.current = wsLen;
    return combined;
  })();

  // Reset on caseId change
  useEffect(() => {
    prevMessagesRef.current = [];
    prevWsLengthRef.current = 0;
    wsConnectionErrorRef.current = false;
    setWsConnectionError(false);
  }, [caseId]);

  // ─── REST Mode state ───
  const [restMessages, setRestMessages] = useState<ChatMessage[]>([]);
  const [restTyping, setRestTyping] = useState(false);

  const restMutation = useMutation({
    mutationFn: (prompt: string) =>
      llmTestsApi.testPrompt({
        provider: "anthropic",
        model: "claude-sonnet-4-5-20250514",
        prompt,
        system_prompt: SYSTEM_PROMPT,
        temperature: 0.7,
        max_tokens: 2048,
      }),
  });

  // ─── Unified API ───
  const sendMessage = useCallback(
    async (content: string) => {
      if (isWSMode) {
        await ws.sendMessage(content);
      } else {
        const userMsg: ChatMessage = {
          id: nextMessageId(),
          role: "user",
          content,
          timestamp: new Date(),
        };
        setRestMessages((prev) => [...prev, userMsg]);
        setRestTyping(true);
        try {
          const response = await restMutation.mutateAsync(content);
          const assistantMsg: ChatMessage = {
            id: nextMessageId(),
            role: "assistant",
            content: response.response,
            timestamp: new Date(),
          };
          setRestMessages((prev) => [...prev, assistantMsg]);
        } catch {
          const errorMsg: ChatMessage = {
            id: nextMessageId(),
            role: "assistant",
            content:
              "Desole, une erreur est survenue. Veuillez reessayer.",
            timestamp: new Date(),
          };
          setRestMessages((prev) => [...prev, errorMsg]);
        } finally {
          setRestTyping(false);
        }
      }
    },
    [isWSMode, ws, restMutation]
  );

  const reconnect = useCallback(() => {
    wsConnectionErrorRef.current = false;
    setWsConnectionError(false);
    ws.connect();
  }, [ws]);

  const clearMessages = useCallback(() => {
    if (isWSMode) {
      ws.clearMessages();
      prevMessagesRef.current = [];
      prevWsLengthRef.current = 0;
    } else {
      setRestMessages([]);
    }
  }, [isWSMode, ws]);

  return {
    messages: isWSMode ? wsMessages : restMessages,
    isTyping: isWSMode ? ws.isTyping : restTyping,
    isConnected: isWSMode ? ws.isConnected : true,
    connectionError: isWSMode ? wsConnectionError : false,
    sendMessage,
    reconnect,
    clearMessages,
  };
}
