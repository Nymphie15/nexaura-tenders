/**
 * Onboarding Module
 *
 * Tour d'onboarding interactif avec gamification pour les nouveaux utilisateurs.
 *
 * Composants:
 * - OnboardingTour: Composant principal du tour
 * - OnboardingProvider: Provider a integrer dans le layout
 * - AchievementBadge: Affichage d'un badge individuel
 * - BadgeCollection: Collection de tous les badges
 * - BadgeCelebration: Modal de celebration lors d'un badge gagne
 * - BadgeIndicator: Indicateur de progression pour header/sidebar
 * - BadgeNotification: Notification toast lors d'un badge gagne
 *
 * Hooks:
 * - useOnboarding: Hook principal pour la gestion du tour
 * - useBadgeCelebration: Hook pour les celebrations
 * - useIsNewUser: Hook pour detecter les nouveaux utilisateurs
 * - useTourTrigger: Hook pour declencher manuellement le tour
 *
 * Configuration:
 * - TOUR_STEPS: Definition des 5 etapes du tour
 * - TOUR_CONFIG: Configuration globale (styles, locale, etc.)
 * - ACHIEVEMENT_BADGES: Definition des badges disponibles
 */

// Main components
export {
  OnboardingTour,
  OnboardingProvider,
  BadgeIndicator,
  useTourTrigger,
} from "./onboarding-tour";

// Badge components
export {
  AchievementBadge,
  BadgeCollection,
  BadgeCelebration,
  BadgeNotification,
} from "./achievement-badge";

// Steps and configuration
export {
  TOUR_STEPS,
  TOUR_CONFIG,
  ACHIEVEMENT_BADGES,
  getStepById,
  getBadgeForStep,
  type OnboardingStep,
  type AchievementBadge as AchievementBadgeType,
} from "./tour-steps";
