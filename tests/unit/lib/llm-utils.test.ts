import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  extractJsonBlock,
  parseLLMJson,
  testEvalResponseSchema,
  evaluationReportSchema,
} from "@/lib/llm-utils";

describe("extractJsonBlock", () => {
  it("extracts JSON from ```json block", () => {
    const raw = 'Some text\n```json\n{"key": "value"}\n```\nMore text';
    expect(extractJsonBlock(raw)).toBe('{"key": "value"}');
  });

  it("extracts JSON from ``` block", () => {
    const raw = '```\n{"key": "value"}\n```';
    expect(extractJsonBlock(raw)).toBe('{"key": "value"}');
  });

  it("extracts raw JSON object", () => {
    const raw = 'Here is the result: {"key": "value"}';
    expect(extractJsonBlock(raw)).toBe('{"key": "value"}');
  });

  it("extracts raw JSON array", () => {
    const raw = '[{"a": 1}, {"b": 2}]';
    expect(extractJsonBlock(raw)).toBe('[{"a": 1}, {"b": 2}]');
  });

  it("returns trimmed input when no JSON found", () => {
    const raw = "  just plain text  ";
    expect(extractJsonBlock(raw)).toBe("just plain text");
  });
});

describe("parseLLMJson", () => {
  const simpleSchema = z.object({
    name: z.string(),
    value: z.number(),
  });

  it("parses valid JSON matching schema", () => {
    const result = parseLLMJson('{"name": "test", "value": 42}', simpleSchema);
    expect(result).toEqual({ name: "test", value: 42 });
  });

  it("parses JSON from markdown code block", () => {
    const raw = '```json\n{"name": "hello", "value": 1}\n```';
    const result = parseLLMJson(raw, simpleSchema);
    expect(result).toEqual({ name: "hello", value: 1 });
  });

  it("throws on invalid JSON", () => {
    expect(() => parseLLMJson("no json here whatsoever", simpleSchema)).toThrow(
      "Impossible de parser"
    );
  });

  it("throws on schema validation failure", () => {
    expect(() =>
      parseLLMJson('{"name": 123, "value": "text"}', simpleSchema)
    ).toThrow("Validation du schema");
  });

  it("parses JSON surrounded by extra text", () => {
    const raw =
      'Voici le resultat:\n```json\n{"name": "x", "value": 99}\n```\nBonne analyse!';
    const result = parseLLMJson(raw, simpleSchema);
    expect(result).toEqual({ name: "x", value: 99 });
  });
});

describe("testEvalResponseSchema", () => {
  it("validates a correct test evaluation response", () => {
    const valid = {
      score: 85,
      summary: "Good test coverage",
      strengths: ["Covers happy path"],
      weaknesses: ["Missing edge cases"],
      suggestions: ["Add error tests"],
      criteria: [{ name: "Coverage", score: 80, comment: "OK" }],
    };
    expect(testEvalResponseSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects score out of range", () => {
    const invalid = {
      score: 150,
      summary: "x",
      strengths: [],
      weaknesses: [],
      suggestions: [],
      criteria: [],
    };
    expect(testEvalResponseSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("evaluationReportSchema", () => {
  it("validates a correct evaluation report", () => {
    const valid = {
      results: [
        {
          criteria_id: "quality",
          score: 4,
          reasoning: "Good quality",
          evidence: ["excerpt 1"],
        },
      ],
      overall_score: 4.0,
      summary: "Good overall",
    };
    expect(evaluationReportSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects score outside 1-5 range", () => {
    const invalid = {
      results: [
        {
          criteria_id: "quality",
          score: 6,
          reasoning: "x",
          evidence: [],
        },
      ],
      overall_score: 6,
      summary: "x",
    };
    expect(evaluationReportSchema.safeParse(invalid).success).toBe(false);
  });
});
