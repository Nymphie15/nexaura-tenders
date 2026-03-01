"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Hand,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";

export type WorkflowStatus =
  | "pending"
  | "running"
  | "paused"
  | "waiting_hitl"
  | "completed"
  | "failed"
  | "cancelled";

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  WorkflowStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "En attente",
    variant: "secondary",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock,
  },
  running: {
    label: "En cours",
    variant: "default",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Loader2,
  },
  paused: {
    label: "En pause",
    variant: "secondary",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Pause,
  },
  waiting_hitl: {
    label: "Action requise",
    variant: "default",
    className: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Hand,
  },
  completed: {
    label: "Terminé",
    variant: "default",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  failed: {
    label: "Échoué",
    variant: "destructive",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  cancelled: {
    label: "Annulé",
    variant: "outline",
    className: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600",
    icon: XCircle,
  },
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-base px-3 py-1.5",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function WorkflowStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: WorkflowStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimated = status === "running";

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border",
        config.className,
        sizeStyles[size],
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizes[size],
            isAnimated && "animate-spin"
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}
