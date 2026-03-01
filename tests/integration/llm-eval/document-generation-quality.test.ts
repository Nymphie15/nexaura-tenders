import { describe, it, expect } from "vitest";
import { describeLLMEval, evaluateWithLLM, CRITERIA_PRESETS } from "../../utils/llm-eval";

const SAMPLE_TECHNICAL_DOC = `
# Guide d'Architecture - Systeme de Gestion des Appels d'Offres

## 1. Vue d'ensemble
Le systeme utilise une architecture microservices orchestree par LangGraph.
Chaque agent specialise traite une phase du workflow de reponse aux appels d'offres.

## 2. Composants principaux

### 2.1 API Gateway (Kong)
- Routage intelligent vers les services backend
- Rate limiting et authentification JWT
- Port 8443 (HTTPS)

### 2.2 Moteur de Workflow (LangGraph)
- 10 phases de traitement sequentielles
- 2 checkpoints HITL (go/no-go, review finale)
- State machine avec PostgreSQL checkpointer

### 2.3 Agents IA
- 6 agents consolides : Parser, Analyst, Strategist, Pricer, Writer, Sourcer
- Orchestrateur LLM avec cache hierarchique L1/L2/L3

## 3. Flux de donnees
1. Upload DCE → Ingestion → Parsing
2. Extraction → Matching → Analyse de risques
3. HITL Go/No-Go → Strategie → Calcul → Generation
4. HITL Review → Packaging → ZIP final

## 4. Securite
- JWT avec rotation automatique
- Chiffrement Fernet des documents generes
- Isolation multi-tenant par SIRET
`;

describeLLMEval("Document Generation Quality", () => {
  it(
    "evaluates a technical document with appropriate scores",
    async () => {
      const criteria = CRITERIA_PRESETS.technical_doc;
      const result = await evaluateWithLLM(SAMPLE_TECHNICAL_DOC, criteria);

      expect(result.overall_score).toBeGreaterThanOrEqual(3.0);
      expect(result.results.length).toBe(criteria.length);
    },
    { timeout: 120000 }
  );

  it(
    "provides reasoning for each criterion",
    async () => {
      const criteria = CRITERIA_PRESETS.technical_doc;
      const result = await evaluateWithLLM(SAMPLE_TECHNICAL_DOC, criteria);

      for (const r of result.results) {
        expect(r.reasoning.length).toBeGreaterThan(10);
      }
    },
    { timeout: 120000 }
  );

  it(
    "scores clarity highly for well-structured document",
    async () => {
      const criteria = CRITERIA_PRESETS.technical_doc;
      const result = await evaluateWithLLM(SAMPLE_TECHNICAL_DOC, criteria);

      const clarityResult = result.results.find(
        (r) => r.criteria_id === "clarity"
      );
      expect(clarityResult).toBeDefined();
      expect(clarityResult!.score).toBeGreaterThanOrEqual(3);
    },
    { timeout: 120000 }
  );
});
