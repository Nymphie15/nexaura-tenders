/**
 * Skip Links pour navigation clavier
 * Permet aux utilisateurs de clavier de sauter directement au contenu
 */
import * as React from "react"

export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-[100] bg-indigo-600 text-white px-4 py-2 rounded-md 
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                   transform -translate-y-16 focus:translate-y-0 transition-transform"
      >
        Aller au contenu principal
      </a>
      <a
        href="#main-nav"
        className="fixed top-4 left-56 z-[100] bg-indigo-600 text-white px-4 py-2 rounded-md
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                   transform -translate-y-16 focus:translate-y-0 transition-transform"
      >
        Aller à la navigation
      </a>
    </div>
  )
}
