export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  rubric: {
    excellent: string;
    good: string;
    adequate: string;
    poor: string;
    failing: string;
  };
}

export interface EvaluationResult {
  criteria_id: string;
  score: number; // 1-5
  reasoning: string;
  evidence: string[];
}

export interface EvaluationReport {
  id: string;
  contentType: CriteriaPreset;
  results: EvaluationResult[];
  overallScore: number;
  summary: string;
  modelUsed: string;
  executionTimeMs: number;
  timestamp: string;
}

export type CriteriaPreset =
  | "tender_response"
  | "technical_doc"
  | "translation"
  | "custom";

export const PRESET_LABELS: Record<CriteriaPreset, string> = {
  tender_response: "Reponse appel d'offres",
  technical_doc: "Document technique",
  translation: "Traduction",
  custom: "Personnalise",
};
