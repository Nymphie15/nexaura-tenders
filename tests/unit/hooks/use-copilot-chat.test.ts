import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useCopilotChat } from "@/hooks/use-copilot-chat";

// Mock useAssistantWebSocket
const mockSendMessage = vi.fn().mockResolvedValue({
  role: "assistant" as const,
  content: "WS response",
  timestamp: new Date().toISOString(),
});
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockClearMessages = vi.fn();

vi.mock("@/hooks/use-assistant-websocket", () => ({
  useAssistantWebSocket: vi.fn(() => ({
    isConnected: true,
    conversationId: "conv-1",
    messages: [],
    isTyping: false,
    sendMessage: mockSendMessage,
    updateContext: vi.fn(),
    connect: mockConnect,
    disconnect: mockDisconnect,
    clearMessages: mockClearMessages,
  })),
}));

// Mock llmTestsApi
const mockTestPrompt = vi.fn().mockResolvedValue({
  response: "REST response",
  model_used: "test",
  provider_used: "anthropic",
  tier_used: 1,
  execution_time_ms: 100,
  tokens_input: 10,
  tokens_output: 20,
  cost_estimate_usd: 0.01,
  cache_hit: false,
});

vi.mock("@/lib/api/endpoints", () => ({
  llmTestsApi: {
    testPrompt: (...args: unknown[]) => mockTestPrompt(...args),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useCopilotChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Mode WS (5 tests) ───

  describe("WS mode", () => {
    it("uses WS when caseId is provided", () => {
      const { result } = renderHook(
        () => useCopilotChat({ caseId: "case-123" }),
        { wrapper: createWrapper() }
      );
      expect(result.current.isConnected).toBe(true);
    });

    it("sends message via WS when caseId exists", async () => {
      const { result } = renderHook(
        () => useCopilotChat({ caseId: "case-123" }),
        { wrapper: createWrapper() }
      );
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(mockSendMessage).toHaveBeenCalledWith("hello");
    });

    it("returns WS typing state", () => {
      const { result } = renderHook(
        () => useCopilotChat({ caseId: "case-123" }),
        { wrapper: createWrapper() }
      );
      expect(result.current.isTyping).toBe(false);
    });

    it("calls WS clearMessages", () => {
      const { result } = renderHook(
        () => useCopilotChat({ caseId: "case-123" }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.clearMessages();
      });
      expect(mockClearMessages).toHaveBeenCalled();
    });

    it("calls WS connect on reconnect", () => {
      const { result } = renderHook(
        () => useCopilotChat({ caseId: "case-123" }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.reconnect();
      });
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  // ─── Mode REST (4 tests) ───

  describe("REST mode", () => {
    it("uses REST when no caseId", () => {
      const { result } = renderHook(
        () => useCopilotChat({ caseId: null }),
        { wrapper: createWrapper() }
      );
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionError).toBe(false);
    });

    it("sends message via REST API", async () => {
      const { result } = renderHook(
        () => useCopilotChat({ caseId: null }),
        { wrapper: createWrapper() }
      );
      await act(async () => {
        await result.current.sendMessage("bonjour");
      });
      await waitFor(() => {
        expect(result.current.messages.length).toBe(2);
      });
      expect(result.current.messages[0].role).toBe("user");
      expect(result.current.messages[1].role).toBe("assistant");
    });

    it("handles REST API error gracefully", async () => {
      mockTestPrompt.mockRejectedValueOnce(new Error("API error"));
      const { result } = renderHook(
        () => useCopilotChat({ caseId: null }),
        { wrapper: createWrapper() }
      );
      await act(async () => {
        await result.current.sendMessage("fail");
      });
      await waitFor(() => {
        expect(result.current.messages.length).toBe(2);
      });
      expect(result.current.messages[1].content).toContain("erreur");
    });

    it("clears REST messages", async () => {
      const { result } = renderHook(
        () => useCopilotChat({ caseId: null }),
        { wrapper: createWrapper() }
      );
      await act(async () => {
        await result.current.sendMessage("test");
      });
      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThan(0);
      });
      act(() => {
        result.current.clearMessages();
      });
      expect(result.current.messages.length).toBe(0);
    });
  });

  // ─── Transition (3 tests) ───

  describe("transitions", () => {
    it("handles caseId changing from null to a value", () => {
      const { result, rerender } = renderHook(
        ({ caseId }) => useCopilotChat({ caseId }),
        {
          wrapper: createWrapper(),
          initialProps: { caseId: null as string | null },
        }
      );
      expect(result.current.isConnected).toBe(true);
      rerender({ caseId: "case-new" });
      expect(result.current.isConnected).toBe(true);
    });

    it("handles caseId changing from value to null", () => {
      const { result, rerender } = renderHook(
        ({ caseId }) => useCopilotChat({ caseId }),
        {
          wrapper: createWrapper(),
          initialProps: { caseId: "case-old" as string | null },
        }
      );
      rerender({ caseId: null });
      expect(result.current.connectionError).toBe(false);
    });

    it("handles caseId changing between values", () => {
      const { result, rerender } = renderHook(
        ({ caseId }) => useCopilotChat({ caseId }),
        {
          wrapper: createWrapper(),
          initialProps: { caseId: "case-a" as string | null },
        }
      );
      rerender({ caseId: "case-b" });
      expect(result.current.messages.length).toBe(0);
    });
  });

  // ─── Edge cases (4 tests) ───

  describe("edge cases", () => {
    it("starts with empty messages", () => {
      const { result } = renderHook(
        () => useCopilotChat({ caseId: null }),
        { wrapper: createWrapper() }
      );
      expect(result.current.messages).toEqual([]);
    });

    it("defaults to no caseId when called without options", () => {
      const { result } = renderHook(
        () => useCopilotChat(),
        { wrapper: createWrapper() }
      );
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionError).toBe(false);
    });

    it("isTyping is false initially", () => {
      const { result } = renderHook(
        () => useCopilotChat({ caseId: null }),
        { wrapper: createWrapper() }
      );
      expect(result.current.isTyping).toBe(false);
    });

    it("connectionError is false in REST mode", () => {
      const { result } = renderHook(
        () => useCopilotChat({ caseId: null }),
        { wrapper: createWrapper() }
      );
      expect(result.current.connectionError).toBe(false);
    });
  });
});
