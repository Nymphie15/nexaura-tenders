"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Calendar,
  Euro,
  Target,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterValues {
  date_from?: string;
  date_to?: string;
  budget_min?: number;
  budget_max?: number;
  score_min?: number;
  score_max?: number;
  statuses?: string[];
  sources?: string[];
}

const STATUS_OPTIONS = [
  { value: "NEW", label: "Nouveau" },
  { value: "ANALYZING", label: "En analyse" },
  { value: "PROCESSING", label: "En cours" },
  { value: "COMPLETED", label: "Termine" },
  { value: "ERROR", label: "Erreur" },
];

const SOURCE_OPTIONS = [
  { value: "BOAMP", label: "BOAMP" },
  { value: "TED", label: "TED" },
  { value: "UPLOAD", label: "Upload" },
  { value: "PLACE", label: "PLACE" },
];

const STORAGE_KEY = "saved-filters-tenders";

interface AdvancedFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
}

export function AdvancedFilters({ filters, onChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters
  const activeCount = [
    filters.date_from,
    filters.date_to,
    filters.budget_min,
    filters.budget_max,
    filters.score_min && filters.score_min > 0,
    filters.statuses?.length,
    filters.sources?.length,
  ].filter(Boolean).length;

  // Save to localStorage
  useEffect(() => {
    if (activeCount > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    }
  }, [filters, activeCount]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).some((k) => parsed[k] != null && parsed[k] !== "")) {
          onChange(parsed);
        }
      } catch {}
    }
  }, []);

  const reset = () => {
    onChange({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const toggleStatus = (status: string) => {
    const current = filters.statuses || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onChange({ ...filters, statuses: updated.length ? updated : undefined });
  };

  const toggleSource = (source: string) => {
    const current = filters.sources || [];
    const updated = current.includes(source)
      ? current.filter((s) => s !== source)
      : [...current, source];
    onChange({ ...filters, sources: updated.length ? updated : undefined });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtres avances
            {activeCount > 0 && (
              <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-xs">
                {activeCount}
              </Badge>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>

        {/* Quick filter pills */}
        {activeCount > 0 && (
          <>
            {filters.statuses?.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleStatus(s)}>
                {STATUS_OPTIONS.find((o) => o.value === s)?.label || s}
                <X className="h-3 w-3" />
              </Badge>
            ))}
            {filters.sources?.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleSource(s)}>
                {s}
                <X className="h-3 w-3" />
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs gap-1 text-muted-foreground">
              <RotateCcw className="h-3 w-3" />
              Reinitialiser
            </Button>
          </>
        )}
      </div>

      <CollapsibleContent className="mt-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-4 border rounded-lg bg-muted/30">
          {/* Date range */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Date limite
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.date_from || ""}
                onChange={(e) => onChange({ ...filters, date_from: e.target.value || undefined })}
                className="h-8 text-xs"
                placeholder="Du"
              />
              <Input
                type="date"
                value={filters.date_to || ""}
                onChange={(e) => onChange({ ...filters, date_to: e.target.value || undefined })}
                className="h-8 text-xs"
                placeholder="Au"
              />
            </div>
          </div>

          {/* Budget range */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Euro className="h-3.5 w-3.5" />
              Budget (EUR)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={filters.budget_min ?? ""}
                onChange={(e) => onChange({ ...filters, budget_min: e.target.value ? Number(e.target.value) : undefined })}
                className="h-8 text-xs"
                placeholder="Min"
              />
              <Input
                type="number"
                value={filters.budget_max ?? ""}
                onChange={(e) => onChange({ ...filters, budget_max: e.target.value ? Number(e.target.value) : undefined })}
                className="h-8 text-xs"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Score range */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Score min: {filters.score_min ?? 0}%
            </label>
            <Slider
              value={[filters.score_min ?? 0]}
              onValueChange={([v]) => onChange({ ...filters, score_min: v > 0 ? v : undefined })}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>

          {/* Status multi-select */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Statut</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <Badge
                  key={opt.value}
                  variant={filters.statuses?.includes(opt.value) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleStatus(opt.value)}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Source multi-select */}
          <div className="space-y-2 md:col-span-2 lg:col-span-4">
            <label className="text-sm font-medium">Source</label>
            <div className="flex flex-wrap gap-1.5">
              {SOURCE_OPTIONS.map((opt) => (
                <Badge
                  key={opt.value}
                  variant={filters.sources?.includes(opt.value) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleSource(opt.value)}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
