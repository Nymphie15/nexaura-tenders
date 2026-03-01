/**
 * Composant pour piéger le focus dans les modales
 * Conforme WCAG 2.1 AA
 *
 * Fonctionnalités:
 * - Piège le focus à l'intérieur du conteneur
 * - Retourne le focus à l'élément précédent à la fermeture
 * - Supporte la navigation Tab et Shift+Tab
 * - Gère les éléments focusables dynamiques
 */
"use client";

import * as React from "react";

export interface FocusTrapProps {
  children: React.ReactNode;
  /**
   * Active ou désactive le piège de focus
   */
  active?: boolean;
  /**
   * Retourne le focus à l'élément précédent à la désactivation
   */
  returnFocus?: boolean;
  /**
   * Focus automatiquement le premier élément focusable à l'activation
   */
  autoFocus?: boolean;
  /**
   * Sélecteur CSS pour les éléments focusables supplémentaires
   */
  additionalFocusableSelectors?: string[];
  /**
   * Callback appelé quand l'utilisateur tente de sortir du piège
   */
  onEscapeAttempt?: () => void;
  /**
   * Élément initial à focus (sélecteur CSS ou ref)
   */
  initialFocus?: string | React.RefObject<HTMLElement>;
  /**
   * Classe CSS pour le conteneur
   */
  className?: string;
}

// Sélecteurs par défaut pour les éléments focusables
const DEFAULT_FOCUSABLE_SELECTORS = [
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
];

export function FocusTrap({
  children,
  active = true,
  returnFocus = true,
  autoFocus = true,
  additionalFocusableSelectors = [],
  onEscapeAttempt,
  initialFocus,
  className,
}: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = React.useRef<HTMLElement | null>(null);

  // Combine default and additional selectors
  const focusableSelectors = React.useMemo(
    () => [...DEFAULT_FOCUSABLE_SELECTORS, ...additionalFocusableSelectors],
    [additionalFocusableSelectors]
  );

  // Get all focusable elements within the container
  const getFocusableElements = React.useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const selector = focusableSelectors.join(", ");
    const elements = containerRef.current.querySelectorAll<HTMLElement>(selector);

    // Filter out elements that are not visible
    return Array.from(elements).filter((el) => {
      const style = window.getComputedStyle(el);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !el.hasAttribute("hidden") &&
        el.offsetParent !== null
      );
    });
  }, [focusableSelectors]);

  // Focus the initial element or first focusable
  const focusInitialElement = React.useCallback(() => {
    if (!containerRef.current) return;

    let elementToFocus: HTMLElement | null = null;

    if (initialFocus) {
      if (typeof initialFocus === "string") {
        elementToFocus = containerRef.current.querySelector<HTMLElement>(initialFocus);
      } else if (initialFocus.current) {
        elementToFocus = initialFocus.current;
      }
    }

    if (!elementToFocus) {
      const focusableElements = getFocusableElements();
      elementToFocus = focusableElements[0] || containerRef.current;
    }

    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      elementToFocus?.focus();
    }, 0);
  }, [initialFocus, getFocusableElements]);

  // Handle focus trapping
  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (!active) return;

      if (event.key === "Tab") {
        const focusableElements = getFocusableElements();

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        if (event.shiftKey) {
          // Shift + Tab: go to last element if on first
          if (activeElement === firstElement || !containerRef.current?.contains(activeElement)) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: go to first element if on last
          if (activeElement === lastElement || !containerRef.current?.contains(activeElement)) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }

      // Handle Escape key
      if (event.key === "Escape" && onEscapeAttempt) {
        onEscapeAttempt();
      }
    },
    [active, getFocusableElements, onEscapeAttempt]
  );

  // Handle focus leaving the container
  const handleFocusOut = React.useCallback(
    (event: FocusEvent) => {
      if (!active || !containerRef.current) return;

      const relatedTarget = event.relatedTarget as HTMLElement | null;

      // If focus is moving outside the container, bring it back
      if (relatedTarget && !containerRef.current.contains(relatedTarget)) {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          // Determine which end to focus based on direction
          // This is a simplified approach - focus the first element
          focusableElements[0]?.focus();
        }
      }
    },
    [active, getFocusableElements]
  );

  // Setup and cleanup
  React.useEffect(() => {
    if (!active) {
      // Return focus when deactivated
      if (returnFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
        previouslyFocusedElement.current = null;
      }
      return;
    }

    // Store the currently focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Auto focus the initial element
    if (autoFocus) {
      focusInitialElement();
    }

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    containerRef.current?.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      containerRef.current?.removeEventListener("focusout", handleFocusOut);
    };
  }, [active, autoFocus, returnFocus, focusInitialElement, handleKeyDown, handleFocusOut]);

  // Re-focus when active changes to true
  React.useEffect(() => {
    if (active && autoFocus) {
      focusInitialElement();
    }
  }, [active, autoFocus, focusInitialElement]);

  return (
    <div
      ref={containerRef}
      className={className}
      // Make container focusable as fallback
      tabIndex={-1}
      role="presentation"
    >
      {children}
    </div>
  );
}

/**
 * Hook pour utiliser le focus trap programmatiquement
 */
export function useFocusTrap(active: boolean = true) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store current focus
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      DEFAULT_FOCUSABLE_SELECTORS.join(", ")
    );
    const firstFocusable = Array.from(focusableElements).find((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });

    firstFocusable?.focus();

    return () => {
      // Return focus on cleanup
      previouslyFocusedElement.current?.focus();
    };
  }, [active]);

  return containerRef;
}

export default FocusTrap;
