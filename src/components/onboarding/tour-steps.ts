// Local type definitions since react-joyride is not installed (stubbed for React 19 compat)
type Placement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right" | "auto" | "center";

interface Step {
  target: string;
  content: string;
  title?: string;
  placement?: Placement;
  disableBeacon?: boolean;
  spotlightClicks?: boolean;
  [key: string]: unknown;
}

/**
 * Tour d'onboarding interactif - Definition des etapes
 *
 * 5 etapes principales:
 * 1. Import DCE - Comment importer un dossier de consultation
 * 2. Configuration profil - Configurer le profil entreprise
 * 3. Premier workflow - Lancer et suivre un workflow
 * 4. Validation HITL - Comprendre les decisions humaines
 * 5. Export - Exporter les reponses generees
 */

export interface OnboardingStep extends Step {
  id: string;
  badge?: {
    icon: string;
    title: string;
    description: string;
  };
}

export const TOUR_STEPS: OnboardingStep[] = [
  // Etape 1: Import DCE
  {
    id: "import-dce",
    target: '[data-tour="new-dce-button"]',
    content: `
      Bienvenue dans Nexaura Tenders !

      Commencez par importer votre DCE (Dossier de Consultation des Entreprises).

      Cliquez sur ce bouton pour télécharger vos documents PDF, ZIP ou DOCX.
      Notre IA analysera automatiquement le contenu pour extraire les exigences.
    `,
    title: "Importer un DCE",
    placement: "bottom" as Placement,
    disableBeacon: true,
    spotlightClicks: true,
    badge: {
      icon: "upload",
      title: "Premier Import",
      description: "Vous avez importé votre premier DCE",
    },
  },

  // Etape 2: Configuration profil entreprise
  {
    id: "company-profile",
    target: '[data-tour="company-nav"]',
    content: `
      Configurez votre profil entreprise pour personnaliser les réponses.

      Renseignez vos informations (SIRET, secteur, certifications) pour que
      l'IA adapte automatiquement les réponses à votre profil.

      Un profil complet = des réponses plus pertinentes !
    `,
    title: "Profil Entreprise",
    placement: "right" as Placement,
    disableBeacon: false,
    badge: {
      icon: "building",
      title: "Profil Configuré",
      description: "Votre profil entreprise est configuré",
    },
  },

  // Etape 3: Premier workflow
  {
    id: "first-workflow",
    target: '[data-tour="workflows-nav"]',
    content: `
      Suivez vos traitements en temps réel !

      Chaque appel d'offres passe par un workflow automatisé en 10 phases:
      - Ingestion et extraction des exigences
      - Matching avec votre profil
      - Analyse des risques et stratégie
      - Génération de la réponse

      Vous pouvez suivre chaque étape et intervenir si nécessaire.
    `,
    title: "Workflows",
    placement: "right" as Placement,
    disableBeacon: false,
    badge: {
      icon: "git-branch",
      title: "Workflow Maîtrisé",
      description: "Vous savez suivre un workflow",
    },
  },

  // Etape 4: Validation HITL
  {
    id: "hitl-validation",
    target: '[data-tour="hitl-nav"]',
    content: `
      Restez aux commandes avec les validations HITL !

      À 4 moments clés, le système vous demande de valider:
      - Go/No-Go: Décider de poursuivre
      - Stratégie: Valider l'approche proposée
      - Prix: Confirmer les tarifs
      - Technique: Vérifier les aspects techniques

      Votre expertise guide l'IA pour des réponses optimales.
    `,
    title: "Décisions HITL",
    placement: "right" as Placement,
    disableBeacon: false,
    badge: {
      icon: "check-circle",
      title: "Décideur Averti",
      description: "Vous maîtrisez les validations HITL",
    },
  },

  // Etape 5: Export
  {
    id: "export-response",
    target: '[data-tour="tenders-nav"]',
    content: `
      Exportez vos réponses finalisées !

      Une fois le workflow terminé, retrouvez votre appel d'offres
      dans les Opportunités et exportez:
      - Le dossier complet au format requis
      - Les documents annexes
      - Le mémoire technique

      Prêt pour la soumission !
    `,
    title: "Export & Soumission",
    placement: "right" as Placement,
    disableBeacon: false,
    badge: {
      icon: "package",
      title: "Expert Nexaura",
      description: "Vous maitrisez l'ensemble du processus",
    },
  },
];

// Types pour les badges et la gamification
export interface AchievementBadge {
  id: string;
  icon: string;
  title: string;
  description: string;
  earnedAt?: string;
  stepId: string;
}

export const ACHIEVEMENT_BADGES: AchievementBadge[] = TOUR_STEPS.map((step) => ({
  id: `badge-${step.id}`,
  icon: step.badge?.icon || "star",
  title: step.badge?.title || "Badge",
  description: step.badge?.description || "",
  stepId: step.id,
}));

// Configuration du tour
export const TOUR_CONFIG = {
  continuous: true,
  showSkipButton: true,
  showProgress: true,
  scrollToFirstStep: true,
  scrollOffset: 100,
  spotlightPadding: 8,
  disableOverlayClose: false,
  hideCloseButton: false,
  locale: {
    back: "Precedent",
    close: "Fermer",
    last: "Terminer",
    next: "Suivant",
    skip: "Passer le tour",
    open: "Ouvrir le dialogue",
  },
  styles: {
    options: {
      primaryColor: "hsl(var(--primary))",
      textColor: "hsl(var(--foreground))",
      backgroundColor: "hsl(var(--background))",
      arrowColor: "hsl(var(--background))",
      overlayColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 10000,
    },
    spotlight: {
      borderRadius: "12px",
    },
    tooltip: {
      borderRadius: "16px",
      padding: "20px",
    },
    tooltipContainer: {
      textAlign: "left" as const,
    },
    buttonNext: {
      backgroundColor: "hsl(var(--primary))",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "14px",
      fontWeight: 500,
    },
    buttonBack: {
      marginRight: "8px",
      color: "hsl(var(--muted-foreground))",
    },
    buttonSkip: {
      color: "hsl(var(--muted-foreground))",
      fontSize: "14px",
    },
  },
};

// Fonction utilitaire pour obtenir l'etape par ID
export function getStepById(stepId: string): OnboardingStep | undefined {
  return TOUR_STEPS.find((step) => step.id === stepId);
}

// Fonction pour obtenir le badge d'une etape
export function getBadgeForStep(stepId: string): AchievementBadge | undefined {
  return ACHIEVEMENT_BADGES.find((badge) => badge.stepId === stepId);
}
