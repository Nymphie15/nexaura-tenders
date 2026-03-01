import { useMutation } from "@tanstack/react-query";
import { useEvalHistoryStore } from "@/stores/eval-history-store";
import { evaluateWithLLM, CRITERIA_PRESETS } from "../../tests/utils/llm-eval";
import type { EvaluationReport, CriteriaPreset } from "@/types/llm-eval";

export function useRunEvaluation() {
  const addReport = useEvalHistoryStore((s) => s.addReport);

  return useMutation({
    mutationFn: async ({
      content,
      preset,
    }: {
      content: string;
      preset: CriteriaPreset;
    }): Promise<EvaluationReport> => {
      const criteria = CRITERIA_PRESETS[preset];
      if (!criteria || criteria.length === 0) {
        throw new Error("Veuillez selectionner un preset avec des criteres definis.");
      }

      const start = Date.now();
      const result = await evaluateWithLLM(content, criteria);
      const executionTimeMs = Date.now() - start;

      const report: EvaluationReport = {
        id: crypto.randomUUID(),
        contentType: preset,
        results: result.results,
        overallScore: result.overall_score,
        summary: result.summary,
        modelUsed: "claude-sonnet-4-5-20250514",
        executionTimeMs,
        timestamp: new Date().toISOString(),
      };

      addReport(report);
      return report;
    },
  });
}

export function useEvaluationHistory() {
  return useEvalHistoryStore((s) => s.history);
}
