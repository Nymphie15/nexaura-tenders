"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyStateIllustration } from "./empty-state-illustrations";
import type { LucideIcon } from "lucide-react";

export type EmptyStateType =
  | "no-tenders"
  | "no-workflows"
  | "no-documents"
  | "no-decisions"
  | "no-results"
  | "first-time"
  | "no-templates";

export interface EmptyStateProps {
  illustration: EmptyStateType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: "default" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  illustration,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-16 px-8",
        className
      )}
    >
      <div className={cn("mb-6", compact ? "w-24 h-24" : "w-40 h-40")}>
        <EmptyStateIllustration type={illustration} />
      </div>
      <h3
        className={cn(
          "font-semibold text-foreground",
          compact ? "text-base" : "text-xl"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-muted-foreground mt-2 max-w-md",
          compact ? "text-sm" : "text-base"
        )}
      >
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || "default"}
          className="mt-6 gap-2"
        >
          {action.icon && <action.icon className="h-4 w-4" />}
          {action.label}
        </Button>
      )}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="mt-3 text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          {secondaryAction.label}
        </button>
      )}
    </motion.div>
  );
}
