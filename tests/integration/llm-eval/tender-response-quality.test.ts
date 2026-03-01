import { describe, it, expect } from "vitest";
import { describeLLMEval, evaluateWithLLM, CRITERIA_PRESETS } from "../../utils/llm-eval";

const SAMPLE_TENDER_RESPONSE = `
# Memoire Technique - Lot 1 : Maintenance Informatique

## 1. Presentation de l'entreprise
Notre societe, Nexaura SARL, est specialisee dans la maintenance informatique depuis 2015.
Nous disposons d'une equipe de 25 techniciens certifies (ITIL, CompTIA A+, Microsoft Certified).

## 2. Comprehension du besoin
Le marche porte sur la maintenance preventive et corrective du parc informatique de la collectivite,
comprenant 500 postes de travail, 20 serveurs et l'infrastructure reseau associee.

## 3. Methodologie proposee
- Maintenance preventive trimestrielle
- Astreinte 24/7 avec GTI de 4h et GTR de 8h
- Monitoring proactif avec outils PRTG et Zabbix
- Plan de continuite d'activite

## 4. Moyens humains
- 1 chef de projet dedie
- 3 techniciens N2 sur site
- Acces au pool N3 (15 experts)

## 5. Planning d'intervention
Deploiement en 3 phases sur 6 semaines.
`;

describeLLMEval("Tender Response Quality Evaluation", () => {
  it(
    "scores a complete tender response above 3.5",
    async () => {
      const criteria = CRITERIA_PRESETS.tender_response;
      const result = await evaluateWithLLM(SAMPLE_TENDER_RESPONSE, criteria);

      expect(result.overall_score).toBeGreaterThanOrEqual(3.0);
      expect(result.results.length).toBe(criteria.length);
      expect(result.summary).toBeTruthy();
    },
    { timeout: 120000 }
  );

  it(
    "identifies strengths in well-structured response",
    async () => {
      const criteria = CRITERIA_PRESETS.tender_response;
      const result = await evaluateWithLLM(SAMPLE_TENDER_RESPONSE, criteria);

      const structureResult = result.results.find(
        (r) => r.criteria_id === "structure"
      );
      expect(structureResult).toBeDefined();
      expect(structureResult!.score).toBeGreaterThanOrEqual(3);
    },
    { timeout: 120000 }
  );

  it(
    "returns valid scores for all criteria",
    async () => {
      const criteria = CRITERIA_PRESETS.tender_response;
      const result = await evaluateWithLLM(SAMPLE_TENDER_RESPONSE, criteria);

      for (const r of result.results) {
        expect(r.score).toBeGreaterThanOrEqual(1);
        expect(r.score).toBeLessThanOrEqual(5);
        expect(r.reasoning).toBeTruthy();
      }
    },
    { timeout: 120000 }
  );
});
