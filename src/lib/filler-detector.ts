/**
 * Detection de phrases creuses / filler phrases
 * Unique sur le marche - aucun concurrent ne propose ca
 */

export interface FillerMatch {
  text: string;
  index: number;
  length: number;
  suggestion: string;
}

const FILLER_PATTERNS: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /Il est important de noter que/gi, suggestion: "Supprimer - aller droit au fait" },
  { pattern: /Dans le cadre de/gi, suggestion: "Simplifier : 'Pour'" },
  { pattern: /Force est de constater que/gi, suggestion: "Supprimer - enoncer le constat directement" },
  { pattern: /Il convient de souligner que/gi, suggestion: "Supprimer" },
  { pattern: /Nous mettons tout en oeuvre pour/gi, suggestion: "Remplacer par un engagement concret et mesurable" },
  { pattern: /Nous nous engageons a mettre en place/gi, suggestion: "Preciser quoi exactement" },
  { pattern: /Notre expertise nous permet de/gi, suggestion: "Donner un chiffre ou une reference" },
  { pattern: /Fort de notre experience/gi, suggestion: "Preciser combien d'annees, combien de projets" },
  { pattern: /Nous proposons une solution adaptee/gi, suggestion: "Decrire la solution concretement" },
  { pattern: /Notre equipe qualifiee/gi, suggestion: "Preciser qualifications et certifications" },
  { pattern: /Dans une demarche d'amelioration continue/gi, suggestion: "Donner un exemple concret" },
  { pattern: /Nous disposons des moyens necessaires/gi, suggestion: "Lister les moyens" },
  { pattern: /Notre savoir-faire reconnu/gi, suggestion: "Citer une reference client" },
  { pattern: /En effet/gi, suggestion: "Supprimer - souvent inutile" },
  { pattern: /Il va sans dire que/gi, suggestion: "Supprimer" },
  { pattern: /Comme mentionne precedemment/gi, suggestion: "Supprimer ou referencer la section" },
  { pattern: /A cet egard/gi, suggestion: "Supprimer" },
  { pattern: /Il est a noter que/gi, suggestion: "Supprimer" },
  { pattern: /Nous avons l'honneur de/gi, suggestion: "Supprimer - style trop formel" },
  { pattern: /Nous tenons a preciser que/gi, suggestion: "Supprimer - preciser directement" },
];

export function detectFillers(text: string): FillerMatch[] {
  const matches: FillerMatch[] = [];

  for (const { pattern, suggestion } of FILLER_PATTERNS) {
    // Reset regex lastIndex
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        text: match[0],
        index: match.index,
        length: match[0].length,
        suggestion,
      });
    }
  }

  // Sort by position
  matches.sort((a, b) => a.index - b.index);
  return matches;
}

export function getFillerCount(text: string): number {
  return detectFillers(text).length;
}

export function buildCleanPrompt(fillers: FillerMatch[]): string {
  const list = fillers.map((f) => `- "${f.text}" -> ${f.suggestion}`).join("\n");
  return `Nettoie ce texte en eliminant ou remplacant les phrases creuses suivantes:\n${list}\n\nPour chaque phrase creuse, soit la supprimer, soit la remplacer par un engagement concret, un chiffre, ou une reference. Ne change rien d'autre.`;
}
