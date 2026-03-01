"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  ChevronDown,
  Plus,
  Settings,
  Check,
  Building2,
  Briefcase,
  Wrench,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { usePersonas, usePersonaTemplates } from "@/hooks/use-persona";
import { cn } from "@/lib/utils";
import type { CompanyPersona } from "@/types/persona";

const sectorIcons: Record<string, React.ReactNode> = {
  btp: <Building2 className="h-4 w-4" />,
  it: <Briefcase className="h-4 w-4" />,
  consulting: <User className="h-4 w-4" />,
  facilities: <Wrench className="h-4 w-4" />,
};

interface PersonaSelectorProps {
  selectedId?: string;
  onSelect: (persona: CompanyPersona) => void;
  onCreateNew?: () => void;
  onManage?: () => void;
  className?: string;
}

export function PersonaSelector({
  selectedId,
  onSelect,
  onCreateNew,
  onManage,
  className,
}: PersonaSelectorProps) {
  const { data: personas, isLoading } = usePersonas();
  const { data: templates } = usePersonaTemplates();
  const [open, setOpen] = useState(false);

  const selectedPersona = personas?.find((p) => p.id === selectedId);
  const defaultPersona = personas?.find((p) => p.is_default);

  if (isLoading) {
    return (
      <Button variant="outline" className={cn("w-[200px] justify-between", className)} disabled>
        <span className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Chargement...
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("w-[240px] justify-between", className)}>
          <span className="flex items-center gap-2 truncate">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedPersona?.name || defaultPersona?.name || "Sélectionner un persona"}
            </span>
          </span>
          {selectedPersona?.is_default && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 shrink-0">
              Défaut
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        {/* Existing personas */}
        {personas && personas.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Mes personas
            </div>
            {personas.map((persona) => (
              <DropdownMenuItem
                key={persona.id}
                onClick={() => {
                  onSelect(persona);
                  setOpen(false);
                }}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{persona.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {persona.voice_profile.tone} · {persona.voice_profile.verbosity}
                  </span>
                </div>
                {persona.id === selectedId && <Check className="h-4 w-4 text-primary" />}
                {persona.is_default && persona.id !== selectedId && (
                  <Badge variant="outline" className="text-[10px]">
                    Défaut
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Templates */}
        {templates && templates.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Templates par secteur
            </div>
            {templates.slice(0, 4).map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => {
                  // TODO: Create from template
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {sectorIcons[template.sector] || <Building2 className="h-4 w-4" />}
                  <span className="text-sm">{template.name}</span>
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Actions */}
        <DropdownMenuItem onClick={onCreateNew} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Créer un nouveau persona
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onManage} className="cursor-pointer">
          <Settings className="h-4 w-4 mr-2" />
          Gérer les personas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version showing just the active persona badge
export function PersonaBadge({ personaId, className }: { personaId?: string; className?: string }) {
  const { data: personas } = usePersonas();
  const persona = personas?.find((p) => p.id === personaId);

  if (!persona) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        "bg-primary/10 text-primary border border-primary/20",
        className
      )}
    >
      <User className="h-3 w-3" />
      {persona.name}
    </motion.div>
  );
}
