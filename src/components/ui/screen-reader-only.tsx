/**
 * Composant pour texte visible uniquement par lecteurs d'écran
 * Conforme WCAG 2.1 AA
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ScreenReaderOnlyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  focusable?: boolean;
}

const srOnlyStyles: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: "0",
};

export function ScreenReaderOnly({
  children,
  as: Component = "span",
  focusable = false,
  className,
  ...props
}: ScreenReaderOnlyProps) {
  const ElementComponent = Component as React.ElementType;

  if (focusable) {
    return (
      <ElementComponent
        className={cn("sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-background focus:text-foreground focus:z-50", className)}
        {...props}
      >
        {children}
      </ElementComponent>
    );
  }

  return (
    <ElementComponent style={srOnlyStyles} className={className} {...props}>
      {children}
    </ElementComponent>
  );
}

export const VisuallyHidden = ScreenReaderOnly;
export const SrOnly = ScreenReaderOnly;

export default ScreenReaderOnly;
