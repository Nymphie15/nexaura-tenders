import { describe, it, expect, beforeEach } from "vitest";
import { useEvalHistoryStore } from "@/stores/eval-history-store";
import type { EvaluationReport } from "@/types/llm-eval";

function makeReport(overrides?: Partial<EvaluationReport>): EvaluationReport {
  return {
    id: crypto.randomUUID(),
    contentType: "tender_response",
    results: [],
    overallScore: 4.0,
    summary: "Test report",
    modelUsed: "test-model",
    executionTimeMs: 100,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("eval-history-store", () => {
  beforeEach(() => {
    useEvalHistoryStore.setState({ history: [] });
  });

  it("starts with empty history", () => {
    expect(useEvalHistoryStore.getState().history).toEqual([]);
  });

  it("adds a report to history", () => {
    const report = makeReport();
    useEvalHistoryStore.getState().addReport(report);
    expect(useEvalHistoryStore.getState().history.length).toBe(1);
    expect(useEvalHistoryStore.getState().history[0].id).toBe(report.id);
  });

  it("prepends new reports (newest first)", () => {
    const r1 = makeReport({ id: "r-1" });
    const r2 = makeReport({ id: "r-2" });
    useEvalHistoryStore.getState().addReport(r1);
    useEvalHistoryStore.getState().addReport(r2);
    expect(useEvalHistoryStore.getState().history[0].id).toBe("r-2");
    expect(useEvalHistoryStore.getState().history[1].id).toBe("r-1");
  });

  it("limits history to 50 reports", () => {
    for (let i = 0; i < 55; i++) {
      useEvalHistoryStore.getState().addReport(makeReport({ id: `r-${i}` }));
    }
    expect(useEvalHistoryStore.getState().history.length).toBe(50);
  });

  it("clearHistory empties the history", () => {
    useEvalHistoryStore.getState().addReport(makeReport());
    useEvalHistoryStore.getState().addReport(makeReport());
    useEvalHistoryStore.getState().clearHistory();
    expect(useEvalHistoryStore.getState().history).toEqual([]);
  });

  it("preserves report data after adding", () => {
    const report = makeReport({
      overallScore: 3.5,
      summary: "Custom summary",
      contentType: "technical_doc",
    });
    useEvalHistoryStore.getState().addReport(report);
    const stored = useEvalHistoryStore.getState().history[0];
    expect(stored.overallScore).toBe(3.5);
    expect(stored.summary).toBe("Custom summary");
    expect(stored.contentType).toBe("technical_doc");
  });
});
