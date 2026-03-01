/**
 * Objectifs de mots par section du memoire technique
 * Compteur intelligent avec progress bars
 */

export interface SectionWordCount {
  title: string;
  wordCount: number;
  target: { min: number; max: number };
  status: "ok" | "short" | "long";
  percentage: number;
}

const SECTION_TARGETS: Record<string, { min: number; max: number }> = {
  "presentation": { min: 300, max: 500 },
  "objet": { min: 200, max: 400 },
  "methodologie": { min: 500, max: 800 },
  "moyens": { min: 200, max: 400 },
  "moyens humains": { min: 200, max: 400 },
  "qualite": { min: 200, max: 400 },
  "securite": { min: 150, max: 300 },
  "planning": { min: 150, max: 300 },
  "references": { min: 150, max: 300 },
  "delais": { min: 100, max: 200 },
  "prix": { min: 100, max: 200 },
  "engagement": { min: 100, max: 200 },
};

function findTarget(title: string): { min: number; max: number } {
  const lower = title.toLowerCase();
  for (const [key, target] of Object.entries(SECTION_TARGETS)) {
    if (lower.includes(key)) return target;
  }
  return { min: 150, max: 400 }; // default
}

export function analyzeSections(content: string): SectionWordCount[] {
  const lines = content.split("\n");
  const sections: { title: string; startLine: number }[] = [];

  // Find markdown headers (## level)
  lines.forEach((line, idx) => {
    const match = line.match(/^#{1,3}\s+(.+)/);
    if (match) {
      sections.push({ title: match[1].trim(), startLine: idx });
    }
  });

  if (sections.length === 0) return [];

  const result: SectionWordCount[] = [];

  for (let i = 0; i < sections.length; i++) {
    const start = sections[i].startLine + 1;
    const end = i + 1 < sections.length ? sections[i + 1].startLine : lines.length;
    const sectionText = lines.slice(start, end).join(" ");
    const wordCount = sectionText.split(/\s+/).filter(Boolean).length;
    const target = findTarget(sections[i].title);

    let status: "ok" | "short" | "long" = "ok";
    if (wordCount < target.min) status = "short";
    else if (wordCount > target.max) status = "long";

    const percentage = Math.min(100, Math.round((wordCount / target.max) * 100));

    result.push({
      title: sections[i].title,
      wordCount,
      target,
      status,
      percentage,
    });
  }

  return result;
}

export const SECTOR_TEMPLATES: Record<string, string[]> = {
  btp: [
    "## 1. Presentation de l'entreprise",
    "## 2. Comprehension du besoin",
    "## 3. Methodologie de realisation",
    "## 4. Moyens humains et materiels",
    "## 5. PPSPS - Securite",
    "## 6. PAQ - Qualite",
    "## 7. Planning d'execution",
    "## 8. DOE - Dossier des Ouvrages Executes",
    "## 9. References similaires",
  ],
  it: [
    "## 1. Presentation de l'entreprise",
    "## 2. Comprehension du besoin",
    "## 3. Architecture technique proposee",
    "## 4. Plan de migration / deploiement",
    "## 5. SLA et engagements de service",
    "## 6. PRA/PCA - Continuite",
    "## 7. Securite et RGPD",
    "## 8. MCO - Maintenance",
    "## 9. Equipe projet",
    "## 10. References similaires",
  ],
  services: [
    "## 1. Presentation de l'entreprise",
    "## 2. Comprehension du besoin",
    "## 3. Gouvernance du projet",
    "## 4. Equipe projet et CV",
    "## 5. Methodologie d'intervention",
    "## 6. Livrables",
    "## 7. Planning et jalons",
    "## 8. KPI et indicateurs",
    "## 9. References similaires",
  ],
  medical: [
    "## 1. Presentation de l'entreprise",
    "## 2. Conformite reglementaire",
    "## 3. Description technique du produit",
    "## 4. Tracabilite et suivi",
    "## 5. Formation du personnel",
    "## 6. SAV et maintenance",
    "## 7. Conditions de livraison",
    "## 8. References similaires",
  ],
};
