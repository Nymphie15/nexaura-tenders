/**
 * Table accessible avec:
 * - Navigation clavier (flèches, Tab, Enter)
 * - ARIA labels pour lecteurs d'écran
 * - Focus visible
 * - Annonces de tri
 *
 * Conformité WCAG 2.1 AA
 */
"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { announceToScreenReader } from "@/lib/accessibility";

export interface AccessibleTableColumn<T> {
  id: string;
  header: string;
  accessorKey: keyof T;
  sortable?: boolean;
  ariaLabel?: string;
  cellRenderer?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface AccessibleTableProps<T> {
  data: T[];
  columns: AccessibleTableColumn<T>[];
  caption?: string;
  ariaLabel?: string;
  onRowClick?: (row: T, index: number) => void;
  onSort?: (columnId: string, direction: "asc" | "desc") => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  className?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  emptyMessage?: string;
  selectable?: boolean;
  selectedRows?: number[];
  onSelectionChange?: (selectedIndices: number[]) => void;
}

interface SortState {
  columnId: string | null;
  direction: "asc" | "desc";
}

export function AccessibleTable<T extends Record<string, unknown>>({
  data,
  columns,
  caption,
  ariaLabel,
  onRowClick,
  onSort,
  sortColumn,
  sortDirection = "asc",
  className,
  rowClassName,
  emptyMessage = "Aucune donnée disponible",
  selectable = false,
  selectedRows = [],
  onSelectionChange,
}: AccessibleTableProps<T>) {
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [focusedCell, setFocusedCell] = React.useState<{
    row: number;
    col: number;
  } | null>(null);
  const [internalSort, setInternalSort] = React.useState<SortState>({
    columnId: sortColumn || null,
    direction: sortDirection,
  });

  // Sync external sort state
  React.useEffect(() => {
    if (sortColumn !== undefined) {
      setInternalSort({
        columnId: sortColumn,
        direction: sortDirection,
      });
    }
  }, [sortColumn, sortDirection]);

  // Get cell element by coordinates
  const getCellElement = React.useCallback(
    (row: number, col: number): HTMLElement | null => {
      if (!tableRef.current) return null;

      const rows = tableRef.current.querySelectorAll("tr");
      const targetRow = rows[row];
      if (!targetRow) return null;

      const cells = targetRow.querySelectorAll("th, td");
      return cells[col] as HTMLElement | null;
    },
    []
  );

  // Focus a specific cell
  const focusCell = React.useCallback(
    (row: number, col: number) => {
      const cell = getCellElement(row, col);
      if (cell) {
        cell.focus();
        setFocusedCell({ row, col });
      }
    },
    [getCellElement]
  );

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTableElement>) => {
      if (!focusedCell) return;

      const { row, col } = focusedCell;
      const totalRows = data.length + 1; // +1 for header
      const totalCols = columns.length;

      let newRow = row;
      let newCol = col;
      let handled = false;

      switch (event.key) {
        case "ArrowUp":
          newRow = Math.max(0, row - 1);
          handled = true;
          break;
        case "ArrowDown":
          newRow = Math.min(totalRows - 1, row + 1);
          handled = true;
          break;
        case "ArrowLeft":
          newCol = Math.max(0, col - 1);
          handled = true;
          break;
        case "ArrowRight":
          newCol = Math.min(totalCols - 1, col + 1);
          handled = true;
          break;
        case "Home":
          if (event.ctrlKey) {
            newRow = 0;
            newCol = 0;
          } else {
            newCol = 0;
          }
          handled = true;
          break;
        case "End":
          if (event.ctrlKey) {
            newRow = totalRows - 1;
            newCol = totalCols - 1;
          } else {
            newCol = totalCols - 1;
          }
          handled = true;
          break;
        case "Enter":
        case " ":
          // Handle header sorting
          if (row === 0) {
            const column = columns[col];
            if (column?.sortable) {
              handleSort(column.id);
              handled = true;
            }
          }
          // Handle row click
          else if (onRowClick && row > 0) {
            onRowClick(data[row - 1], row - 1);
            handled = true;
          }
          // Handle selection
          if (selectable && row > 0) {
            handleRowSelection(row - 1, event);
            handled = true;
          }
          break;
        case "Escape":
          // Clear focus
          const cell = getCellElement(row, col);
          cell?.blur();
          setFocusedCell(null);
          handled = true;
          break;
      }

      if (handled) {
        event.preventDefault();
        if (newRow !== row || newCol !== col) {
          focusCell(newRow, newCol);
        }
      }
    },
    [focusedCell, data.length, columns, getCellElement, focusCell, onRowClick, selectable]
  );

  // Handle sort
  const handleSort = React.useCallback(
    (columnId: string) => {
      const column = columns.find((c) => c.id === columnId);
      if (!column?.sortable) return;

      const newDirection =
        internalSort.columnId === columnId && internalSort.direction === "asc"
          ? "desc"
          : "asc";

      setInternalSort({ columnId, direction: newDirection });

      // Announce sort change to screen readers
      const directionText = newDirection === "asc" ? "croissant" : "décroissant";
      announceToScreenReader(
        `Tableau trié par ${column.header}, ordre ${directionText}`
      );

      onSort?.(columnId, newDirection);
    },
    [columns, internalSort, onSort]
  );

  // Handle row selection
  const handleRowSelection = React.useCallback(
    (index: number, event: React.KeyboardEvent | React.MouseEvent) => {
      if (!selectable || !onSelectionChange) return;

      let newSelection: number[];

      if (event.ctrlKey || event.metaKey) {
        // Toggle selection
        if (selectedRows.includes(index)) {
          newSelection = selectedRows.filter((i) => i !== index);
        } else {
          newSelection = [...selectedRows, index];
        }
      } else if (event.shiftKey && selectedRows.length > 0) {
        // Range selection
        const lastSelected = selectedRows[selectedRows.length - 1];
        const start = Math.min(lastSelected, index);
        const end = Math.max(lastSelected, index);
        newSelection = Array.from(
          { length: end - start + 1 },
          (_, i) => start + i
        );
      } else {
        // Single selection
        newSelection = [index];
      }

      onSelectionChange(newSelection);
    },
    [selectable, selectedRows, onSelectionChange]
  );

  // Handle cell focus
  const handleCellFocus = React.useCallback((row: number, col: number) => {
    setFocusedCell({ row, col });
  }, []);

  // Get sort aria-sort value
  const getAriaSortValue = (
    columnId: string
  ): "ascending" | "descending" | "none" | undefined => {
    if (internalSort.columnId !== columnId) return "none";
    return internalSort.direction === "asc" ? "ascending" : "descending";
  };

  // Get row class name
  const getRowClassName = (row: T, index: number): string => {
    if (typeof rowClassName === "function") {
      return rowClassName(row, index);
    }
    return rowClassName || "";
  };

  return (
    <div className="relative overflow-auto" role="region" aria-label={ariaLabel}>
      <Table
        ref={tableRef}
        className={cn("border-collapse", className)}
        onKeyDown={handleKeyDown}
        role="grid"
        aria-rowcount={data.length + 1}
        aria-colcount={columns.length}
      >
        {caption && (
          <caption className="sr-only text-sm text-muted-foreground mb-2">
            {caption}
          </caption>
        )}

        <TableHeader>
          <TableRow role="row" aria-rowindex={1}>
            {columns.map((column, colIndex) => (
              <TableHead
                key={column.id}
                role="columnheader"
                aria-colindex={colIndex + 1}
                aria-sort={column.sortable ? getAriaSortValue(column.id) : undefined}
                aria-label={column.ariaLabel || column.header}
                tabIndex={focusedCell?.row === 0 && focusedCell?.col === colIndex ? 0 : -1}
                onFocus={() => handleCellFocus(0, colIndex)}
                onClick={() => column.sortable && handleSort(column.id)}
                className={cn(
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  column.sortable && "cursor-pointer hover:bg-muted/50 select-none"
                )}
              >
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <span
                      className="text-muted-foreground"
                      aria-hidden="true"
                    >
                      {internalSort.columnId === column.id ? (
                        internalSort.direction === "asc" ? (
                          <SortAscIcon />
                        ) : (
                          <SortDescIcon />
                        )
                      ) : (
                        <SortNeutralIcon />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground py-8"
                role="gridcell"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => {
              const isSelected = selectedRows.includes(rowIndex);
              const rowNum = rowIndex + 2; // +1 for 1-based index, +1 for header

              return (
                <TableRow
                  key={rowIndex}
                  role="row"
                  aria-rowindex={rowNum}
                  aria-selected={selectable ? isSelected : undefined}
                  className={cn(
                    getRowClassName(row, rowIndex),
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    isSelected && "bg-primary/10"
                  )}
                  onClick={(e) => {
                    onRowClick?.(row, rowIndex);
                    if (selectable) {
                      handleRowSelection(rowIndex, e);
                    }
                  }}
                >
                  {columns.map((column, colIndex) => {
                    const cellValue = row[column.accessorKey];
                    const isFocused =
                      focusedCell?.row === rowNum - 1 &&
                      focusedCell?.col === colIndex;

                    return (
                      <TableCell
                        key={column.id}
                        role="gridcell"
                        aria-colindex={colIndex + 1}
                        tabIndex={isFocused ? 0 : -1}
                        onFocus={() => handleCellFocus(rowNum - 1, colIndex)}
                        className={cn(
                          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        )}
                      >
                        {column.cellRenderer
                          ? column.cellRenderer(cellValue, row)
                          : String(cellValue ?? "")}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Sort icons
function SortAscIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 8 4-4 4 4" />
      <path d="M7 4v16" />
    </svg>
  );
}

function SortDescIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 16 4 4 4-4" />
      <path d="M7 20V4" />
    </svg>
  );
}

function SortNeutralIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="opacity-30"
    >
      <path d="m3 8 4-4 4 4" />
      <path d="m3 16 4 4 4-4" />
    </svg>
  );
}

export default AccessibleTable;
