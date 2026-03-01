import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useEvaluateTest, useGenerateTest } from "@/hooks/use-test-eval";

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

describe("useEvaluateTest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls testPrompt with evaluation system prompt", async () => {
    mockTestPrompt.mockResolvedValueOnce({
      response: JSON.stringify({
        score: 85,
        summary: "Good tests",
        strengths: ["Covers edge cases"],
        weaknesses: [],
        suggestions: [],
        criteria: [{ name: "Coverage", score: 90, comment: "OK" }],
      }),
    });

    const { result } = renderHook(() => useEvaluateTest(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync("const x = 1;");
    });

    expect(mockTestPrompt).toHaveBeenCalledTimes(1);
    const callArgs = mockTestPrompt.mock.calls[0][0];
    expect(callArgs.system_prompt).toContain("evaluateur expert");
    expect(callArgs.prompt).toBe("const x = 1;");
  });

  it("parses valid JSON response", async () => {
    const evalResponse = {
      score: 75,
      summary: "Decent",
      strengths: ["A"],
      weaknesses: ["B"],
      suggestions: ["C"],
      criteria: [{ name: "Quality", score: 70, comment: "Fair" }],
    };
    mockTestPrompt.mockResolvedValueOnce({
      response: "```json\n" + JSON.stringify(evalResponse) + "\n```",
    });

    const { result } = renderHook(() => useEvaluateTest(), {
      wrapper: createWrapper(),
    });

    let data;
    await act(async () => {
      data = await result.current.mutateAsync("test code");
    });

    expect(data).toEqual(evalResponse);
  });

  it("throws on invalid JSON response", async () => {
    mockTestPrompt.mockResolvedValueOnce({ response: "not json" });

    const { result } = renderHook(() => useEvaluateTest(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync("test code"))
    ).rejects.toThrow();
  });

  it("throws on invalid schema", async () => {
    mockTestPrompt.mockResolvedValueOnce({
      response: JSON.stringify({ score: "invalid" }),
    });

    const { result } = renderHook(() => useEvaluateTest(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync("test code"))
    ).rejects.toThrow();
  });
});

describe("useGenerateTest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls testPrompt with generation system prompt", async () => {
    mockTestPrompt.mockResolvedValueOnce({
      response: "describe('test', () => { it('works', () => {}) })",
    });

    const { result } = renderHook(() => useGenerateTest(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync("function add(a, b) { return a + b; }");
    });

    const callArgs = mockTestPrompt.mock.calls[0][0];
    expect(callArgs.system_prompt).toContain("generateur expert");
  });

  it("returns raw response string", async () => {
    const generatedCode = "describe('test', () => {})";
    mockTestPrompt.mockResolvedValueOnce({ response: generatedCode });

    const { result } = renderHook(() => useGenerateTest(), {
      wrapper: createWrapper(),
    });

    let data;
    await act(async () => {
      data = await result.current.mutateAsync("source code");
    });

    expect(data).toBe(generatedCode);
  });

  it("handles API error", async () => {
    mockTestPrompt.mockRejectedValueOnce(new Error("timeout"));

    const { result } = renderHook(() => useGenerateTest(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync("source"))
    ).rejects.toThrow("timeout");
  });

  it("uses correct temperature for generation", async () => {
    mockTestPrompt.mockResolvedValueOnce({ response: "code" });

    const { result } = renderHook(() => useGenerateTest(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync("source");
    });

    expect(mockTestPrompt.mock.calls[0][0].temperature).toBe(0.3);
  });
});
