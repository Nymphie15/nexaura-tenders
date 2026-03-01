/**
 * Sidebar responsive avec support mobile
 */
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"

interface ResponsiveSidebarProps {
  children: React.ReactNode
}

export function ResponsiveSidebar({ children }: ResponsiveSidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Fermer avec Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  // Bloquer le scroll quand ouvert sur mobile
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <>
      {/* Bouton hamburger mobile */}
      <button
        type="button"
        className={cn(
          "lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg",
          "bg-white dark:bg-gray-800 shadow-md",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav"
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="mobile-nav"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72",
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700",
          "transform transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Navigation principale"
      >
        <nav id="main-nav" className="h-full overflow-y-auto p-4">
          {children}
        </nav>
      </aside>
    </>
  )
}
