import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildJudgeSystemPrompt, CRITERIA_PRESETS } from "../../utils/llm-eval";
import type { EvaluationCriteria } from "@/types/llm-eval";

describe("buildJudgeSystemPrompt", () => {
  it("includes all criteria names", () => {
    const criteria = CRITERIA_PRESETS.tender_response;
    const prompt = buildJudgeSystemPrompt(criteria);

    for (const c of criteria) {
      expect(prompt).toContain(c.name);
    }
  });

  it("includes criteria IDs", () => {
    const criteria = CRITERIA_PRESETS.tender_response;
    const prompt = buildJudgeSystemPrompt(criteria);

    for (const c of criteria) {
      expect(prompt).toContain(c.id);
    }
  });

  it("includes rubric descriptions", () => {
    const criteria = CRITERIA_PRESETS.tender_response;
    const prompt = buildJudgeSystemPrompt(criteria);

    // Rubric values are in the format "5=<excellent desc>, 4=<good desc>, ..."
    expect(prompt).toContain("5=");
    expect(prompt).toContain("1=");
    // Check actual rubric content
    expect(prompt).toContain("100% des exigences couvertes");
    expect(prompt).toContain("Moins de 50% couvertes");
  });

  it("includes JSON structure instruction", () => {
    const prompt = buildJudgeSystemPrompt(CRITERIA_PRESETS.technical_doc);
    expect(prompt).toContain("results");
    expect(prompt).toContain("overall_score");
    expect(prompt).toContain("summary");
  });

  it("includes weights", () => {
    const criteria = CRITERIA_PRESETS.tender_response;
    const prompt = buildJudgeSystemPrompt(criteria);

    for (const c of criteria) {
      expect(prompt).toContain(String(c.weight));
    }
  });

  it("handles empty criteria array", () => {
    const prompt = buildJudgeSystemPrompt([]);
    expect(prompt).toContain("evaluateur expert");
    expect(prompt).toContain("results");
  });

  it("includes criteria descriptions", () => {
    const criteria = CRITERIA_PRESETS.translation;
    const prompt = buildJudgeSystemPrompt(criteria);

    for (const c of criteria) {
      expect(prompt).toContain(c.description);
    }
  });
});

describe("CRITERIA_PRESETS", () => {
  it("has tender_response preset with 5 criteria", () => {
    expect(CRITERIA_PRESETS.tender_response.length).toBe(5);
  });

  it("has technical_doc preset with 4 criteria", () => {
    expect(CRITERIA_PRESETS.technical_doc.length).toBe(4);
  });

  it("has translation preset with 3 criteria", () => {
    expect(CRITERIA_PRESETS.translation.length).toBe(3);
  });

  it("has custom preset as empty array", () => {
    expect(CRITERIA_PRESETS.custom).toEqual([]);
  });

  it("tender_response weights sum to 1.0", () => {
    const sum = CRITERIA_PRESETS.tender_response.reduce(
      (acc, c) => acc + c.weight,
      0
    );
    expect(sum).toBeCloseTo(1.0);
  });

  it("technical_doc weights sum to 1.0", () => {
    const sum = CRITERIA_PRESETS.technical_doc.reduce(
      (acc, c) => acc + c.weight,
      0
    );
    expect(sum).toBeCloseTo(1.0);
  });

  it("translation weights sum to 1.0", () => {
    const sum = CRITERIA_PRESETS.translation.reduce(
      (acc, c) => acc + c.weight,
      0
    );
    expect(sum).toBeCloseTo(1.0);
  });
});
