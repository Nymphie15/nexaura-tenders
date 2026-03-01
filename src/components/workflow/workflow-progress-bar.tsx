"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export interface WorkflowPhaseDetail {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

interface WorkflowProgressBarProps {
  phases: WorkflowPhaseDetail[];
  currentPhase?: string;
  showLabels?: boolean;
  className?: string;
}

export function WorkflowProgressBar({
  phases,
  currentPhase,
  showLabels = true,
  className,
}: WorkflowProgressBarProps) {
  const completedCount = phases.filter(
    (p) => p.status === "completed" || p.status === "skipped"
  ).length;
  const totalPhases = phases.length;
  const progressPercentage =
    totalPhases > 0 ? (completedCount / totalPhases) * 100 : 0;

  const getPhaseIcon = (phase: WorkflowPhaseDetail) => {
    switch (phase.status) {
      case "completed":
        return (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        );
      case "running":
        return (
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
        );
      case "failed":
        return (
          <Circle className="h-4 w-4 text-red-600 fill-red-600" />
        );
      case "skipped":
        return (
          <Circle className="h-4 w-4 text-muted-foreground" />
        );
      default:
        return (
          <Circle className="h-4 w-4 text-muted-foreground/60" />
        );
    }
  };

  const getPhaseColor = (phase: WorkflowPhaseDetail) => {
    switch (phase.status) {
      case "completed":
        return "text-green-700";
      case "running":
        return "text-blue-700 font-medium";
      case "failed":
        return "text-red-700";
      case "skipped":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progression</span>
          <span>
            {completedCount} / {totalPhases} phases
          </span>
        </div>
        <Progress
          value={progressPercentage}
          className="h-2"
        />
      </div>

      {/* Phase Labels */}
      {showLabels && phases.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-colors",
                getPhaseColor(phase),
                currentPhase === phase.id && "ring-2 ring-blue-200 rounded px-1"
              )}
            >
              {getPhaseIcon(phase)}
              <span>{phase.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
