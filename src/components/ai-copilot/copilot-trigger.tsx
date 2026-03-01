"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCopilotStore } from "@/stores/copilot-store";

export function CopilotTrigger() {
  const { toggle, isOpen } = useCopilotStore();

  return (
    <Button
      onClick={toggle}
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "transition-all duration-200",
        isOpen && "scale-0 opacity-0 pointer-events-none"
      )}
      aria-label="Ouvrir l'assistant IA"
    >
      <Bot className="h-5 w-5" />
    </Button>
  );
}
