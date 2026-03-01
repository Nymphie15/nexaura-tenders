/**
 * Utilitaires pour l'accessibilité
 *
 * Ce module fournit des fonctions utilitaires pour améliorer
 * l'accessibilité de l'application.
 *
 * Conforme WCAG 2.1 AA
 */

// ============================================================================
// Live Announcements
// ============================================================================

/**
 * ID de la live region pour les annonces
 */
const LIVE_REGION_ID = "accessibility-live-region";

/**
 * Crée ou récupère la live region pour les annonces
 */
function getOrCreateLiveRegion(priority: "polite" | "assertive" = "polite"): HTMLElement {
  let liveRegion = document.getElementById(LIVE_REGION_ID);

  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.id = LIVE_REGION_ID;
    liveRegion.setAttribute("aria-live", priority);
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.setAttribute("role", "status");

    // Styles sr-only
    Object.assign(liveRegion.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: "0",
    });

    document.body.appendChild(liveRegion);
  }

  // Update priority if different
  if (liveRegion.getAttribute("aria-live") !== priority) {
    liveRegion.setAttribute("aria-live", priority);
  }

  return liveRegion;
}

/**
 * Annonce un message aux lecteurs d'écran
 *
 * @param message - Message à annoncer
 * @param priority - Niveau de priorité ("polite" ou "assertive")
 *
 * @example
 * ```ts
 * // Annonce normale (attend que l'utilisateur soit inactif)
 * announceToScreenReader("Formulaire soumis avec succès");
 *
 * // Annonce urgente (interrompt l'utilisateur)
 * announceToScreenReader("Erreur: champ requis", "assertive");
 * ```
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
): void {
  const liveRegion = getOrCreateLiveRegion(priority);

  // Clear first to ensure re-announcement of same message
  liveRegion.textContent = "";

  // Use setTimeout to allow DOM update
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
}

/**
 * Efface la live region
 */
export function clearAnnouncement(): void {
  const liveRegion = document.getElementById(LIVE_REGION_ID);
  if (liveRegion) {
    liveRegion.textContent = "";
  }
}

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Sélecteurs par défaut pour les éléments focusables
 */
export const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

/**
 * Récupère tous les éléments focusables dans un conteneur
 *
 * @param container - Élément conteneur
 * @param includeHidden - Inclure les éléments cachés
 */
export function getFocusableElements(
  container: HTMLElement,
  includeHidden: boolean = false
): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);

  if (includeHidden) {
    return Array.from(elements);
  }

  return Array.from(elements).filter((el) => {
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      !el.hasAttribute("hidden") &&
      el.offsetParent !== null
    );
  });
}

/**
 * Piège le focus dans un conteneur
 *
 * @param container - Élément conteneur
 * @returns Fonction de cleanup pour retirer le piège
 *
 * @example
 * ```ts
 * const modal = document.getElementById("modal");
 * const cleanup = trapFocus(modal);
 *
 * // Plus tard, pour libérer le piège:
 * cleanup();
 * ```
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;

    const activeElement = document.activeElement;

    if (event.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement || !container.contains(activeElement)) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (activeElement === lastElement || !container.contains(activeElement)) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Stocke et restaure le focus
 * Utile pour les modales et dialogs
 */
export function createFocusGuard(): {
  save: () => void;
  restore: () => void;
} {
  let savedElement: HTMLElement | null = null;

  return {
    save: () => {
      savedElement = document.activeElement as HTMLElement;
    },
    restore: () => {
      if (savedElement && typeof savedElement.focus === "function") {
        savedElement.focus();
      }
    },
  };
}

// ============================================================================
// ARIA Utilities
// ============================================================================

/**
 * Mapping des statuts vers les labels ARIA
 */
const STATUS_LABELS: Record<string, string> = {
  // Statuts généraux
  pending: "En attente",
  processing: "En cours de traitement",
  completed: "Terminé",
  failed: "Échoué",
  cancelled: "Annulé",

  // Statuts de document
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",

  // Statuts de validation
  valid: "Valide",
  invalid: "Invalide",
  warning: "Avertissement",

  // Statuts d'appel d'offres
  open: "Ouvert",
  closed: "Fermé",
  awarded: "Attribué",
  "in-progress": "En cours",

  // Statuts de connexion
  online: "En ligne",
  offline: "Hors ligne",
  connecting: "Connexion en cours",

  // Statuts de chargement
  loading: "Chargement",
  loaded: "Chargé",
  error: "Erreur",

  // Par défaut
  unknown: "Inconnu",
};

/**
 * Retourne le label ARIA pour un statut donné
 *
 * @param status - Statut à convertir
 * @returns Label ARIA approprié
 *
 * @example
 * ```ts
 * getAriaLabel("pending"); // "En attente"
 * getAriaLabel("in-progress"); // "En cours"
 * getAriaLabel("custom"); // "custom" (retourné tel quel si non trouvé)
 * ```
 */
export function getAriaLabel(status: string): string {
  const normalizedStatus = status.toLowerCase().trim();
  return STATUS_LABELS[normalizedStatus] || status;
}

/**
 * Génère des propriétés ARIA pour un élément interactif
 */
export function getInteractiveAriaProps(options: {
  label: string;
  description?: string;
  expanded?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  hasPopup?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
  controls?: string;
}): Record<string, string | boolean | undefined> {
  return {
    "aria-label": options.label,
    "aria-describedby": options.description,
    "aria-expanded": options.expanded,
    "aria-pressed": options.pressed,
    "aria-disabled": options.disabled,
    "aria-haspopup": options.hasPopup,
    "aria-controls": options.controls,
  };
}

// ============================================================================
// Color Contrast
// ============================================================================

/**
 * Calcule la luminance relative d'une couleur
 * Formule WCAG 2.1
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse une couleur hexadécimale
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

/**
 * Calcule le ratio de contraste entre deux couleurs
 * Conforme WCAG 2.1
 *
 * @param color1 - Première couleur (hex)
 * @param color2 - Deuxième couleur (hex)
 * @returns Ratio de contraste (1 à 21)
 *
 * @example
 * ```ts
 * getContrastRatio("#000000", "#ffffff"); // 21 (contraste maximum)
 * getContrastRatio("#767676", "#ffffff"); // ~4.54 (AA pour texte large)
 * ```
 */
export function getContrastRatio(color1: string, color2: string): number {
  const c1 = parseHexColor(color1);
  const c2 = parseHexColor(color2);

  if (!c1 || !c2) return 1;

  const l1 = getLuminance(c1.r, c1.g, c1.b);
  const l2 = getLuminance(c2.r, c2.g, c2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Vérifie si le contraste est conforme WCAG AA
 *
 * @param ratio - Ratio de contraste
 * @param isLargeText - True si le texte est large (18pt+ ou 14pt+ bold)
 */
export function meetsWCAGAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Vérifie si le contraste est conforme WCAG AAA
 *
 * @param ratio - Ratio de contraste
 * @param isLargeText - True si le texte est large
 */
export function meetsWCAGAAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

// ============================================================================
// Keyboard Navigation Helpers
// ============================================================================

/**
 * Crée un gestionnaire de navigation par flèches pour les listes
 */
export function createArrowNavigation(
  items: HTMLElement[],
  options: {
    orientation?: "horizontal" | "vertical" | "both";
    loop?: boolean;
    onSelect?: (item: HTMLElement, index: number) => void;
  } = {}
) {
  const { orientation = "vertical", loop = true, onSelect } = options;

  let currentIndex = 0;

  const focusItem = (index: number) => {
    const item = items[index];
    if (item) {
      item.focus();
      currentIndex = index;
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    let newIndex = currentIndex;
    let handled = false;

    const isVertical = orientation === "vertical" || orientation === "both";
    const isHorizontal = orientation === "horizontal" || orientation === "both";

    switch (event.key) {
      case "ArrowUp":
        if (isVertical) {
          newIndex = currentIndex - 1;
          handled = true;
        }
        break;
      case "ArrowDown":
        if (isVertical) {
          newIndex = currentIndex + 1;
          handled = true;
        }
        break;
      case "ArrowLeft":
        if (isHorizontal) {
          newIndex = currentIndex - 1;
          handled = true;
        }
        break;
      case "ArrowRight":
        if (isHorizontal) {
          newIndex = currentIndex + 1;
          handled = true;
        }
        break;
      case "Home":
        newIndex = 0;
        handled = true;
        break;
      case "End":
        newIndex = items.length - 1;
        handled = true;
        break;
      case "Enter":
      case " ":
        onSelect?.(items[currentIndex], currentIndex);
        handled = true;
        break;
    }

    if (handled) {
      event.preventDefault();

      // Handle looping
      if (loop) {
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
      }

      focusItem(newIndex);
    }
  };

  return {
    handleKeyDown,
    focusItem,
    getCurrentIndex: () => currentIndex,
    setCurrentIndex: (index: number) => {
      currentIndex = index;
    },
  };
}

// ============================================================================
// Reduced Motion
// ============================================================================

/**
 * Vérifie si l'utilisateur préfère les animations réduites
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hook-like function pour écouter les changements de préférence
 */
export function onReducedMotionChange(callback: (prefersReduced: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches);
  };

  mediaQuery.addEventListener("change", handler);

  return () => {
    mediaQuery.removeEventListener("change", handler);
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  announceToScreenReader,
  clearAnnouncement,
  getFocusableElements,
  trapFocus,
  createFocusGuard,
  getAriaLabel,
  getInteractiveAriaProps,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  createArrowNavigation,
  prefersReducedMotion,
  onReducedMotionChange,
  FOCUSABLE_SELECTORS,
};
