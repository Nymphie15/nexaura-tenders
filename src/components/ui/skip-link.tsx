/**
 * Skip link pour navigation clavier rapide
 *
 * Permet aux utilisateurs de clavier et lecteurs d'écran
 * de sauter directement au contenu principal.
 *
 * Conforme WCAG 2.1 AA - Critère 2.4.1 (Bypass Blocks)
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkipLinkProps {
  /**
   * ID de l'élément cible (sans le #)
   */
  targetId: string;
  /**
   * Texte du lien (par défaut: "Aller au contenu principal")
   */
  children?: React.ReactNode;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  /**
   * Callback appelé quand le lien est activé
   */
  onSkip?: () => void;
}

export function SkipLink({
  targetId,
  children = "Aller au contenu principal",
  className,
  onSkip,
}: SkipLinkProps) {
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      const target = document.getElementById(targetId);
      if (target) {
        // Make the target focusable if it isn't already
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }

        // Focus and scroll to target
        target.focus({ preventScroll: false });
        target.scrollIntoView({ behavior: "smooth", block: "start" });

        onSkip?.();
      }
    },
    [targetId, onSkip]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick(event as unknown as React.MouseEvent<HTMLAnchorElement>);
      }
    },
    [handleClick]
  );

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // Base styles - hidden by default
        "fixed left-4 z-[9999] -translate-y-full",
        // Visible on focus
        "focus:translate-y-4",
        // Visual styles
        "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
        "shadow-lg ring-2 ring-offset-2 ring-primary",
        // Animation
        "transition-transform duration-200 ease-in-out",
        // Focus styles
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        // Custom classes
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Composant pour plusieurs skip links
 */
export interface SkipLinksProps {
  links: Array<{
    targetId: string;
    label: string;
  }>;
  className?: string;
}

export function SkipLinks({ links, className }: SkipLinksProps) {
  return (
    <nav
      aria-label="Liens de navigation rapide"
      className={cn("skip-links-container", className)}
    >
      {links.map((link, index) => (
        <SkipLink
          key={link.targetId}
          targetId={link.targetId}
          className={cn(
            // Stack multiple skip links
            index > 0 && "focus:translate-y-16"
          )}
        >
          {link.label}
        </SkipLink>
      ))}
    </nav>
  );
}

/**
 * Hook pour créer un skip link target
 * Retourne les props à appliquer sur l'élément cible
 */
export function useSkipLinkTarget(id: string) {
  const ref = React.useRef<HTMLElement>(null);

  const props = React.useMemo(
    () => ({
      id,
      tabIndex: -1,
      ref,
      // Remove focus outline when focused via skip link
      className: "focus:outline-none",
      // Remove tabindex after blur to keep tab order clean
      onBlur: () => {
        if (ref.current) {
          ref.current.removeAttribute("tabindex");
        }
      },
    }),
    [id]
  );

  return props;
}

export default SkipLink;
