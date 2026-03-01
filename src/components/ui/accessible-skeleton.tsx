/**
 * Skeleton accessible avec annonces screen reader
 * Conformité WCAG 2.2
 */
import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label pour les lecteurs d'écran */
  label?: string
  /** Variante visuelle */
  variant?: "text" | "card" | "avatar" | "button" | "table-row"
}

export function AccessibleSkeleton({
  className,
  label = "Chargement en cours",
  variant = "text",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 w-full",
    card: "h-32 w-full",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24",
    "table-row": "h-12 w-full",
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  )
}

/** Skeleton pour tableau avec plusieurs lignes */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  label = "Chargement du tableau"
}: { 
  rows?: number
  columns?: number
  label?: string
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex gap-4 border-b pb-2">
          {Array.from({ length: columns }).map((_, i) => (
            <AccessibleSkeleton 
              key={`header-${i}`} 
              variant="text" 
              className="h-4 flex-1"
              label=""
            />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`row-${i}`} className="flex gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <AccessibleSkeleton 
                key={`cell-${i}-${j}`} 
                variant="text" 
                className="h-4 flex-1"
                label=""
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton pour dashboard cards */
export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Chargement du tableau de bord" aria-busy="true">
      <span className="sr-only">Chargement du tableau de bord...</span>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <AccessibleSkeleton 
            key={i} 
            variant="card" 
            className="h-28"
            label=""
          />
        ))}
      </div>
      <div className="mt-6">
        <TableSkeleton rows={5} columns={5} label="" />
      </div>
    </div>
  )
}
