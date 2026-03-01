"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { documentEditionApi } from "@/lib/api/endpoints";
import { ChatInterface, type ChatMessage } from "@/components/ai-copilot/chat-interface";

interface DocumentChatProps {
  documentId: string;
  className?: string;
}

const PROGRESS_MESSAGES = [
  "Analyse du document...",
  "Recherche dans le contenu...",
  "Preparation de la reponse...",
];

const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

let chatMsgId = 0;
function nextId(): string {
  return `doc-chat-${Date.now()}-${++chatMsgId}`;
}

export function DocumentChat({ documentId, className }: DocumentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [progressMsg, setProgressMsg] = useState(PROGRESS_MESSAGES[0]);
  const progressRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      documentEditionApi.chat(documentId, {
        content: message,
        message,
        conversation_history: [...conversationHistory],
      }),
  });

  // Progressive messages during pending (#15)
  useEffect(() => {
    if (chatMutation.isPending) {
      let idx = 0;
      progressRef.current = setInterval(() => {
        idx = (idx + 1) % PROGRESS_MESSAGES.length;
        setProgressMsg(PROGRESS_MESSAGES[idx]);
      }, 5000);
    } else {
      if (progressRef.current) clearInterval(progressRef.current);
      setProgressMsg(PROGRESS_MESSAGES[0]);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [chatMutation.isPending]);

  const handleSend = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: nextId(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const response = await chatMutation.mutateAsync(content);
        conversationHistory.push({ role: "user", content });
        const reply = response.response || "Pas de reponse.";
        conversationHistory.push({ role: "assistant", content: reply });
        const assistantMsg: ChatMessage = {
          id: nextId(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: nextId(),
          role: "assistant",
          content: "Erreur lors de l'analyse du document. Veuillez reessayer.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    },
    [chatMutation]
  );

  return (
    <div className={className}>
      {chatMutation.isPending && (
        <div className="px-4 py-2 text-xs text-zinc-500 animate-pulse">
          {progressMsg}
        </div>
      )}
      <ChatInterface
        messages={messages}
        onSendMessage={handleSend}
        isLoading={chatMutation.isPending}
        placeholder="Posez une question sur ce document..."
      />
    </div>
  );
}
