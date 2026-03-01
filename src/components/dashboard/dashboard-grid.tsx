"use client";

/**
 * @file dashboard-grid.tsx
 * @description Grid layout component for dashboard widgets
 * @module components/dashboard
 *
 * Provides a responsive grid layout for dashboard widgets with:
 * - Responsive breakpoints
 * - Optional drag-and-drop support (future enhancement)
 * - Consistent spacing and sizing
 *
 * @example
 * <DashboardGrid>
 *   <DashboardGrid.Item span={2}>
 *     <ChartWidget />
 *   </DashboardGrid.Item>
 *   <DashboardGrid.Item>
 *     <StatsWidget />
 *   </DashboardGrid.Item>
 * </DashboardGrid>
 */

import { ReactNode, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

// Grid context for nested components
interface GridContextValue {
  columns: number;
  gap: number;
}

const GridContext = createContext<GridContextValue>({
  columns: 4,
  gap: 6,
});

export interface DashboardGridProps {
  /** Child elements (typically DashboardGridItem) */
  children: ReactNode;
  /** Number of columns at lg breakpoint */
  columns?: 1 | 2 | 3 | 4 | 6;
  /** Gap size (tailwind spacing scale) */
  gap?: 2 | 4 | 6 | 8;
  /** Additional CSS classes */
  className?: string;
}

export interface DashboardGridItemProps {
  /** Child content */
  children: ReactNode;
  /** Number of columns to span (1-4) */
  span?: 1 | 2 | 3 | 4;
  /** Number of rows to span */
  rowSpan?: 1 | 2;
  /** Additional CSS classes */
  className?: string;
}

const columnClasses: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6",
};

const gapClasses: Record<number, string> = {
  2: "gap-2",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
};

const spanClasses: Record<number, string> = {
  1: "col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
};

const rowSpanClasses: Record<number, string> = {
  1: "row-span-1",
  2: "row-span-2",
};

/**
 * Dashboard Grid Container
 */
function DashboardGridRoot({
  children,
  columns = 4,
  gap = 6,
  className,
}: DashboardGridProps) {
  return (
    <GridContext.Provider value={{ columns, gap }}>
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2",
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
      >
        {children}
      </div>
    </GridContext.Provider>
  );
}

/**
 * Dashboard Grid Item
 */
function DashboardGridItem({
  children,
  span = 1,
  rowSpan = 1,
  className,
}: DashboardGridItemProps) {
  return (
    <div
      className={cn(
        spanClasses[span],
        rowSpanClasses[rowSpan],
        className
      )}
    >
      {children}
    </div>
  );
}

// Hook to access grid context
export function useGridContext() {
  return useContext(GridContext);
}

// Compound component pattern
export const DashboardGrid = Object.assign(DashboardGridRoot, {
  Item: DashboardGridItem,
});

export default DashboardGrid;
