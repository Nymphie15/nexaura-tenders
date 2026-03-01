import { useMutation } from "@tanstack/react-query";
import { llmTestsApi } from "@/lib/api/endpoints";
import { parseLLMJson, testEvalResponseSchema } from "@/lib/llm-utils";
import type { TestEvalResponse } from "@/lib/llm-utils";

export const testEvalKeys = {
  all: ["test-eval"] as const,
  evaluation: (fileName: string) =>
    [...testEvalKeys.all, "eval", fileName] as const,
  generation: (fileName: string) =>
    [...testEvalKeys.all, "gen", fileName] as const,
};

const EVAL_SYSTEM_PROMPT = `Tu es un evaluateur expert de tests logiciels. Analyse le code de test fourni et retourne un JSON avec cette structure exacte:
{
  "score": <number 0-100>,
  "summary": "<resume de l'evaluation>",
  "strengths": ["<point fort 1>", ...],
  "weaknesses": ["<faiblesse 1>", ...],
  "suggestions": ["<suggestion 1>", ...],
  "criteria": [
    { "name": "<nom du critere>", "score": <0-100>, "comment": "<commentaire>" }
  ]
}
Criteres: couverture, lisibilite, assertions, edge cases, maintenabilite.
Reponds UNIQUEMENT avec le JSON, sans texte supplementaire.`;

const GEN_SYSTEM_PROMPT = `Tu es un generateur expert de tests logiciels.
A partir du code source fourni, genere des tests unitaires complets en TypeScript/Vitest.
Inclus: happy path, edge cases, error cases. Utilise describe/it/expect.
Reponds UNIQUEMENT avec le code de test, sans explication.`;

export function useEvaluateTest() {
  return useMutation({
    mutationFn: async (code: string): Promise<TestEvalResponse> => {
      const response = await llmTestsApi.testPrompt({
        provider: "anthropic",
        model: "claude-sonnet-4-5-20250514",
        prompt: code,
        system_prompt: EVAL_SYSTEM_PROMPT,
        temperature: 0.2,
        max_tokens: 4096,
      });
      return parseLLMJson(response.response, testEvalResponseSchema);
    },
  });
}

export function useGenerateTest() {
  return useMutation({
    mutationFn: async (code: string): Promise<string> => {
      const response = await llmTestsApi.testPrompt({
        provider: "anthropic",
        model: "claude-sonnet-4-5-20250514",
        prompt: code,
        system_prompt: GEN_SYSTEM_PROMPT,
        temperature: 0.3,
        max_tokens: 8192,
      });
      return response.response;
    },
  });
}
