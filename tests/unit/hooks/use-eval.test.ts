import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useRunEvaluation, useEvaluationHistory } from "@/hooks/use-eval";
import { useEvalHistoryStore } from "@/stores/eval-history-store";

const mockTestPrompt = vi.fn();

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

describe("useRunEvaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEvalHistoryStore.setState({ history: [] });
  });

  it("calls LLM API with correct params", async () => {
    mockTestPrompt.mockResolvedValueOnce({
      response: JSON.stringify({
        results: [
          { criteria_id: "completeness", score: 4, reasoning: "Good", evidence: ["e1"] },
        ],
        overall_score: 4.0,
        summary: "Solid",
      }),
    });

    const { result } = renderHook(() => useRunEvaluation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        content: "test content",
        preset: "tender_response",
      });
    });

    expect(mockTestPrompt).toHaveBeenCalledTimes(1);
    const args = mockTestPrompt.mock.calls[0][0];
    expect(args.temperature).toBe(0.1);
    expect(args.system_prompt).toContain("evaluateur expert");
  });

  it("adds report to history store", async () => {
    mockTestPrompt.mockResolvedValueOnce({
      response: JSON.stringify({
        results: [
          { criteria_id: "accuracy", score: 3, reasoning: "OK", evidence: [] },
        ],
        overall_score: 3.0,
        summary: "Average",
      }),
    });

    const { result } = renderHook(() => useRunEvaluation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        content: "content",
        preset: "technical_doc",
      });
    });

    const history = useEvalHistoryStore.getState().history;
    expect(history.length).toBe(1);
    expect(history[0].contentType).toBe("technical_doc");
  });

  it("throws on empty preset criteria", async () => {
    const { result } = renderHook(() => useRunEvaluation(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() =>
        result.current.mutateAsync({ content: "test", preset: "custom" })
      )
    ).rejects.toThrow("criteres");
  });

  it("returns report with timing info", async () => {
    mockTestPrompt.mockResolvedValueOnce({
      response: JSON.stringify({
        results: [
          { criteria_id: "fidelity", score: 5, reasoning: "Perfect", evidence: ["e"] },
        ],
        overall_score: 5.0,
        summary: "Excellent",
      }),
    });

    const { result } = renderHook(() => useRunEvaluation(), {
      wrapper: createWrapper(),
    });

    let report;
    await act(async () => {
      report = await result.current.mutateAsync({
        content: "text",
        preset: "translation",
      });
    });

    expect(report).toBeDefined();
    expect(report!.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(report!.timestamp).toBeTruthy();
  });

  it("handles API error", async () => {
    mockTestPrompt.mockRejectedValueOnce(new Error("LLM unavailable"));

    const { result } = renderHook(() => useRunEvaluation(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() =>
        result.current.mutateAsync({
          content: "test",
          preset: "tender_response",
        })
      )
    ).rejects.toThrow("LLM unavailable");
  });

  it("handles invalid JSON from LLM", async () => {
    mockTestPrompt.mockResolvedValueOnce({
      response: "I cannot evaluate this content properly.",
    });

    const { result } = renderHook(() => useRunEvaluation(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() =>
        result.current.mutateAsync({
          content: "test",
          preset: "tender_response",
        })
      )
    ).rejects.toThrow();
  });
});

describe("useEvaluationHistory", () => {
  beforeEach(() => {
    useEvalHistoryStore.setState({ history: [] });
  });

  it("returns empty array initially", () => {
    const { result } = renderHook(() => useEvaluationHistory(), {
      wrapper: createWrapper(),
    });
    expect(result.current).toEqual([]);
  });

  it("reflects store changes", () => {
    useEvalHistoryStore.getState().addReport({
      id: "r-1",
      contentType: "tender_response",
      results: [],
      overallScore: 4.0,
      summary: "Good",
      modelUsed: "test",
      executionTimeMs: 100,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useEvaluationHistory(), {
      wrapper: createWrapper(),
    });

    expect(result.current.length).toBe(1);
  });
});
