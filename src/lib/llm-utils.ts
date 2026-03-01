import { z } from "zod";

/**
 * Extract a JSON block from an LLM response that may contain markdown formatting.
 * Handles ```json ... ```, ``` ... ```, or raw JSON.
 */
export function extractJsonBlock(raw: string): string {
  // Try ```json ... ``` first
  const jsonBlockMatch = raw.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);
  if (jsonBlockMatch) return jsonBlockMatch[1].trim();

  // Try ``` ... ```
  const codeBlockMatch = raw.match(/```\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Try to find raw JSON object or array
  const jsonMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1].trim();

  return raw.trim();
}

/**
 * Parse and validate JSON from an LLM response using a Zod schema.
 * Handles markdown code blocks, raw JSON, and validation.
 */
export function parseLLMJson<T>(raw: string, schema: z.ZodSchema<T>): T {
  const jsonStr = extractJsonBlock(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(
      `Impossible de parser le JSON de la reponse LLM: ${jsonStr.slice(0, 200)}...`
    );
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`Validation du schema echouee: ${issues}`);
  }

  return result.data;
}

// ============================================
// Shared Zod Schemas
// ============================================

export const testEvalResponseSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  criteria: z.array(
    z.object({
      name: z.string(),
      score: z.number().min(0).max(100),
      comment: z.string(),
    })
  ),
});

export type TestEvalResponse = z.infer<typeof testEvalResponseSchema>;

export const evaluationResultSchema = z.object({
  criteria_id: z.string(),
  score: z.number().min(1).max(5),
  reasoning: z.string(),
  evidence: z.array(z.string()),
});

export const evaluationReportSchema = z.object({
  results: z.array(evaluationResultSchema),
  overall_score: z.number().min(1).max(5),
  summary: z.string(),
});

export type EvaluationReportResponse = z.infer<typeof evaluationReportSchema>;
