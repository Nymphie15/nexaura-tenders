"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownNarrowWide,
  AlignJustify,
  Cpu,
  TrendingUp,
  GraduationCap,
  ShieldCheck,
  Zap,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWritingModes, useApplyMode } from "@/hooks/use-writing-modes";
import { cn } from "@/lib/utils";
import type { WritingModeKey } from "@/types/writing-modes";

const iconMap = {
  "arrow-down-narrow-wide": ArrowDownNarrowWide,
  "align-justify": AlignJustify,
  cpu: Cpu,
  "trending-up": TrendingUp,
  "graduation-cap": GraduationCap,
  "shield-check": ShieldCheck,
  zap: Zap,
};

interface WritingModeToggleProps {
  content: string;
  personaId?: string;
  onApply?: (content: string, mode: WritingModeKey) => void;
  className?: string;
}

export function WritingModeToggle({ content, personaId, onApply, className }: WritingModeToggleProps) {
  const [selectedMode, setSelectedMode] = useState<WritingModeKey | null>(null);
  const { data: modes, isLoading } = useWritingModes();
  const applyMode = useApplyMode();

  const handleModeSelect = async (mode: WritingModeKey) => {
    setSelectedMode(mode);
    
    try {
      const result = await applyMode.mutateAsync({
        content,
        mode,
        persona_id: personaId,
      });
      
      onApply?.(result.content, mode);
    } catch (error) {
      console.error("Failed to apply mode:", error);
    } finally {
      setSelectedMode(null);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (!modes || modes.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-wrap gap-1", className)}>
        {modes.map((mode) => {
          const Icon = iconMap[mode.icon as keyof typeof iconMap] || Zap;
          const isSelected = selectedMode === mode.key;
          const isApplying = applyMode.isPending && isSelected;

          return (
            <Tooltip key={mode.key}>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleModeSelect(mode.key)}
                    disabled={applyMode.isPending}
                    className={cn(
                      "h-8 px-2 text-xs font-medium transition-all",
                      isSelected && "ring-2 ring-primary",
                      applyMode.isPending && !isSelected && "opacity-50"
                    )}
                    style={{
                      borderColor: mode.color,
                      color: isSelected ? "white" : mode.color,
                      backgroundColor: isSelected ? mode.color : undefined,
                    }}
                  >
                    {isApplying ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Icon className="h-3.5 w-3.5 mr-1" />
                    )}
                    {mode.name}
                    {mode.shortcut && (
                      <span className="ml-1 text-[10px] opacity-60">
                        {mode.shortcut.replace("Ctrl+", "⌘")}
                      </span>
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">{mode.name}</p>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// Compact version for inline use
export function WritingModeSelect({
  value,
  onChange,
  className,
}: {
  value?: WritingModeKey;
  onChange: (mode: WritingModeKey) => void;
  className?: string;
}) {
  const { data: modes, isLoading } = useWritingModes();

  if (isLoading || !modes) {
    return (
      <div className={cn("h-9 w-32 bg-muted animate-pulse rounded", className)} />
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {modes.slice(0, 4).map((mode) => {
        const Icon = iconMap[mode.icon as keyof typeof iconMap] || Zap;
        const isActive = value === mode.key;

        return (
          <Button
            key={mode.key}
            variant={isActive ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange(mode.key)}
            style={isActive ? { backgroundColor: mode.color } : undefined}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
