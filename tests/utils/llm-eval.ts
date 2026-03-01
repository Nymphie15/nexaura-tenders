import { llmTestsApi } from "@/lib/api/endpoints";
import { parseLLMJson, evaluationReportSchema } from "@/lib/llm-utils";
import type { EvaluationCriteria, EvaluationResult, CriteriaPreset } from "@/types/llm-eval";

// ============================================
// Criteria Presets
// ============================================

const tenderResponseCriteria: EvaluationCriteria[] = [
  {
    id: "completeness",
    name: "Completude",
    description: "Toutes les exigences du cahier des charges sont adressees",
    weight: 0.25,
    rubric: {
      excellent: "100% des exigences couvertes avec details",
      good: "90%+ couvertes",
      adequate: "75%+ couvertes",
      poor: "50-75% couvertes",
      failing: "Moins de 50% couvertes",
    },
  },
  {
    id: "technical_quality",
    name: "Qualite technique",
    description: "Precision, rigueur et pertinence des reponses techniques",
    weight: 0.25,
    rubric: {
      excellent: "Reponses precises, chiffrees et argumentees",
      good: "Reponses precises avec quelques details manquants",
      adequate: "Reponses globalement correctes",
      poor: "Reponses vagues ou imprecises",
      failing: "Reponses incorrectes ou hors sujet",
    },
  },
  {
    id: "structure",
    name: "Structure et presentation",
    description: "Organisation logique, mise en forme professionnelle",
    weight: 0.2,
    rubric: {
      excellent: "Structure claire, hierarchisee, presentation soignee",
      good: "Bonne structure, quelques ameliorations possibles",
      adequate: "Structure acceptable",
      poor: "Structure confuse",
      failing: "Pas de structure visible",
    },
  },
  {
    id: "compliance",
    name: "Conformite reglementaire",
    description: "Respect des regles de la commande publique",
    weight: 0.15,
    rubric: {
      excellent: "Parfaite conformite, toutes les mentions obligatoires",
      good: "Bonne conformite, mentions mineures manquantes",
      adequate: "Conformite acceptable",
      poor: "Plusieurs non-conformites",
      failing: "Non-conformite majeure",
    },
  },
  {
    id: "persuasion",
    name: "Force de conviction",
    description: "Capacite a convaincre le jury / evaluateur",
    weight: 0.15,
    rubric: {
      excellent: "Tres convaincant, arguments solides et differenciants",
      good: "Convaincant, bons arguments",
      adequate: "Moyennement convaincant",
      poor: "Peu convaincant",
      failing: "Pas du tout convaincant",
    },
  },
];

const technicalDocCriteria: EvaluationCriteria[] = [
  {
    id: "accuracy",
    name: "Exactitude",
    description: "Precision et veracite des informations techniques",
    weight: 0.3,
    rubric: {
      excellent: "100% exact, references verifiables",
      good: "Globalement exact, erreurs mineures",
      adequate: "Quelques inexactitudes",
      poor: "Erreurs significatives",
      failing: "Informations incorrectes",
    },
  },
  {
    id: "clarity",
    name: "Clarte",
    description: "Facilite de comprehension pour le public cible",
    weight: 0.25,
    rubric: {
      excellent: "Tres clair, accessible meme pour un non-expert",
      good: "Clair pour le public cible",
      adequate: "Comprehensible avec effort",
      poor: "Difficile a comprendre",
      failing: "Incomprehensible",
    },
  },
  {
    id: "completeness",
    name: "Completude",
    description: "Couverture exhaustive du sujet",
    weight: 0.25,
    rubric: {
      excellent: "Exhaustif, tous les aspects couverts",
      good: "Bonne couverture, quelques aspects mineurs manquants",
      adequate: "Couverture adequate",
      poor: "Lacunes significatives",
      failing: "Tres incomplet",
    },
  },
  {
    id: "structure",
    name: "Structure",
    description: "Organisation logique du contenu",
    weight: 0.2,
    rubric: {
      excellent: "Organisation exemplaire",
      good: "Bonne organisation",
      adequate: "Organisation acceptable",
      poor: "Organisation confuse",
      failing: "Pas de structure",
    },
  },
];

const translationCriteria: EvaluationCriteria[] = [
  {
    id: "fidelity",
    name: "Fidelite",
    description: "Respect du sens original",
    weight: 0.35,
    rubric: {
      excellent: "Sens parfaitement preserve",
      good: "Sens globalement preserve",
      adequate: "Quelques ecarts de sens",
      poor: "Ecarts significatifs",
      failing: "Sens altere",
    },
  },
  {
    id: "fluency",
    name: "Fluidite",
    description: "Naturalite de la langue cible",
    weight: 0.35,
    rubric: {
      excellent: "Lit comme un texte original",
      good: "Fluide avec rares maladresses",
      adequate: "Comprehensible mais artificiel",
      poor: "Nombreuses maladresses",
      failing: "Incomprehensible",
    },
  },
  {
    id: "terminology",
    name: "Terminologie",
    description: "Usage correct du vocabulaire specialise",
    weight: 0.3,
    rubric: {
      excellent: "Terminologie parfaite et coherente",
      good: "Bonne terminologie",
      adequate: "Quelques erreurs terminologiques",
      poor: "Nombreuses erreurs",
      failing: "Terminologie incorrecte",
    },
  },
];

export const CRITERIA_PRESETS: Record<CriteriaPreset, EvaluationCriteria[]> = {
  tender_response: tenderResponseCriteria,
  technical_doc: technicalDocCriteria,
  translation: translationCriteria,
  custom: [],
};

// ============================================
// Judge System Prompt Builder
// ============================================

export function buildJudgeSystemPrompt(criteria: EvaluationCriteria[]): string {
  const criteriaDesc = criteria
    .map(
      (c) =>
        `- ${c.name} (id: "${c.id}", poids: ${c.weight}): ${c.description}\n` +
        `  Grille: 5=${c.rubric.excellent}, 4=${c.rubric.good}, 3=${c.rubric.adequate}, 2=${c.rubric.poor}, 1=${c.rubric.failing}`
    )
    .join("\n");

  return `Tu es un evaluateur expert LLM-as-Judge. Evalue le contenu fourni selon ces criteres:

${criteriaDesc}

Retourne UNIQUEMENT un JSON avec cette structure exacte:
{
  "results": [
    {
      "criteria_id": "<id du critere>",
      "score": <1-5>,
      "reasoning": "<justification detaillee>",
      "evidence": ["<extrait pertinent 1>", ...]
    }
  ],
  "overall_score": <1.0-5.0 moyenne ponderee>,
  "summary": "<resume global de l'evaluation>"
}`;
}

// ============================================
// Evaluate with LLM
// ============================================

export async function evaluateWithLLM(
  content: string,
  criteria: EvaluationCriteria[],
  options?: { temperature?: number; model?: string }
) {
  const systemPrompt = buildJudgeSystemPrompt(criteria);
  const response = await llmTestsApi.testPrompt({
    provider: "anthropic",
    model: options?.model ?? "claude-sonnet-4-5-20250514",
    prompt: content,
    system_prompt: systemPrompt,
    temperature: options?.temperature ?? 0.1,
    max_tokens: 4096,
  });

  return parseLLMJson(response.response, evaluationReportSchema);
}

// ============================================
// Test helpers
// ============================================

/**
 * Wrapper for describe/skip based on ENABLE_LLM_EVAL env var.
 * Use in integration tests that require real LLM calls.
 * Import `describe` from vitest in the test file and pass it, or use this in .test.ts files only.
 */
export function describeLLMEval(
  name: string,
  fn: () => void,
  describeFn?: { (name: string, fn: () => void): void; skip: (name: string, fn: () => void) => void }
): void {
  // When called from a test file, vitest globals are available
  const d = describeFn ?? (globalThis as Record<string, unknown>).describe as typeof describeFn;
  if (!d) return;
  const enabled = typeof process !== "undefined" && process.env?.ENABLE_LLM_EVAL === "true";
  if (enabled) {
    d(name, fn);
  } else {
    d.skip(name, fn);
  }
}
