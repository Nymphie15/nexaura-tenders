/**
 * @file period-filter.tsx
 * @description Composant de filtre de periode pour le dashboard
 * @module components/dashboard/filters
 *
 * Permet de filtrer les donnees par periode:
 * - Presets (aujourd'hui, 7 jours, 30 jours, etc.)
 * - Plage de dates personnalisee
 * - Comparaison avec periode precedente
 *
 * @example
 * <PeriodFilter
 *   value={period}
 *   onChange={(period) => setPeriod(period)}
 *   showComparison
 * />
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";

/** Presets de periode disponibles */
export type PeriodPreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "custom";

/** Structure de la periode selectionnee */
export interface PeriodValue {
  preset: PeriodPreset;
  startDate: Date;
  endDate: Date;
  compareEnabled?: boolean;
  compareStartDate?: Date;
  compareEndDate?: Date;
}

/** Props du composant PeriodFilter */
export interface PeriodFilterProps {
  /** Valeur actuelle */
  value: PeriodValue;
  /** Callback au changement */
  onChange: (value: PeriodValue) => void;
  /** Afficher l'option de comparaison */
  showComparison?: boolean;
  /** Presets a afficher (tous par defaut) */
  presets?: PeriodPreset[];
  /** Classes CSS additionnelles */
  className?: string;
  /** Variant du bouton */
  variant?: "default" | "outline" | "ghost";
  /** Taille */
  size?: "default" | "sm" | "lg";
}

/** Configuration des presets */
const presetConfig: Record<PeriodPreset, {
  label: string;
  getRange: () => { start: Date; end: Date };
}> = {
  today: {
    label: "Aujourd'hui",
    getRange: () => ({
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
    }),
  },
  yesterday: {
    label: "Hier",
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 1)),
      end: endOfDay(subDays(new Date(), 1)),
    }),
  },
  last_7_days: {
    label: "7 derniers jours",
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 6)),
      end: endOfDay(new Date()),
    }),
  },
  last_30_days: {
    label: "30 derniers jours",
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 29)),
      end: endOfDay(new Date()),
    }),
  },
  this_week: {
    label: "Cette semaine",
    getRange: () => ({
      start: startOfWeek(new Date(), { locale: fr }),
      end: endOfWeek(new Date(), { locale: fr }),
    }),
  },
  last_week: {
    label: "Semaine derniere",
    getRange: () => ({
      start: startOfWeek(subDays(new Date(), 7), { locale: fr }),
      end: endOfWeek(subDays(new Date(), 7), { locale: fr }),
    }),
  },
  this_month: {
    label: "Ce mois",
    getRange: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }),
  },
  last_month: {
    label: "Mois dernier",
    getRange: () => ({
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  this_quarter: {
    label: "Ce trimestre",
    getRange: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      return { start: startOfDay(start), end: endOfDay(end) };
    },
  },
  last_quarter: {
    label: "Trimestre dernier",
    getRange: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3) - 1;
      const year = quarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const q = quarter < 0 ? 3 : quarter;
      const start = new Date(year, q * 3, 1);
      const end = new Date(year, q * 3 + 3, 0);
      return { start: startOfDay(start), end: endOfDay(end) };
    },
  },
  this_year: {
    label: "Cette annee",
    getRange: () => ({
      start: startOfYear(new Date()),
      end: endOfYear(new Date()),
    }),
  },
  last_year: {
    label: "Annee derniere",
    getRange: () => ({
      start: startOfYear(subYears(new Date(), 1)),
      end: endOfYear(subYears(new Date(), 1)),
    }),
  },
  custom: {
    label: "Personnalise",
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 29)),
      end: endOfDay(new Date()),
    }),
  },
};

/** Tous les presets par defaut */
const defaultPresets: PeriodPreset[] = [
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "this_year",
  "custom",
];

/**
 * Composant de filtre de periode
 */
export function PeriodFilter({
  value,
  onChange,
  showComparison = false,
  presets = defaultPresets,
  className,
  variant = "outline",
  size = "default",
}: PeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: value.startDate,
    to: value.endDate,
  });

  // Calculer la periode de comparaison
  const calculateComparisonPeriod = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - diff - 86400000), // -1 jour
      end: new Date(start.getTime() - 86400000),
    };
  };

  // Gerer le changement de preset
  const handlePresetChange = (preset: PeriodPreset) => {
    if (preset === "custom") {
      onChange({
        ...value,
        preset,
      });
      return;
    }

    const { start, end } = presetConfig[preset].getRange();
    const comparison = value.compareEnabled
      ? calculateComparisonPeriod(start, end)
      : undefined;

    onChange({
      preset,
      startDate: start,
      endDate: end,
      compareEnabled: value.compareEnabled,
      compareStartDate: comparison?.start,
      compareEndDate: comparison?.end,
    });

    setDateRange({ from: start, to: end });
    if (true) { // Preset is never custom here after early return
      setIsOpen(false);
    }
  };

  // Gerer le changement de plage personnalisee
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);

    if (range?.from && range?.to) {
      const comparison = value.compareEnabled
        ? calculateComparisonPeriod(range.from, range.to)
        : undefined;

      onChange({
        preset: "custom",
        startDate: startOfDay(range.from),
        endDate: endOfDay(range.to),
        compareEnabled: value.compareEnabled,
        compareStartDate: comparison?.start,
        compareEndDate: comparison?.end,
      });
    }
  };

  // Gerer le toggle de comparaison
  const handleComparisonToggle = (enabled: boolean) => {
    const comparison = enabled
      ? calculateComparisonPeriod(value.startDate, value.endDate)
      : undefined;

    onChange({
      ...value,
      compareEnabled: enabled,
      compareStartDate: comparison?.start,
      compareEndDate: comparison?.end,
    });
  };

  // Formater la date
  const formatDateRange = () => {
    if (value.preset !== "custom") {
      return presetConfig[value.preset].label;
    }

    const startStr = format(value.startDate, "d MMM", { locale: fr });
    const endStr = format(value.endDate, "d MMM yyyy", { locale: fr });
    return `${startStr} - ${endStr}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "justify-between font-normal",
            size === "sm" && "h-8 text-xs",
            size === "lg" && "h-11",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{formatDateRange()}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="border-r p-2 space-y-1">
            {presets.map((preset) => (
              <Button
                key={preset}
                variant={value.preset === preset ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => handlePresetChange(preset)}
              >
                {presetConfig[preset].label}
              </Button>
            ))}
          </div>

          {/* Calendrier pour custom */}
          {value.preset === "custom" && (
            <div className="p-3">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                locale={fr}
                disabled={{ after: new Date() }}
              />
            </div>
          )}
        </div>

        {/* Option de comparaison */}
        {showComparison && (
          <div className="border-t p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compare" className="text-sm font-medium">
                  Comparer a la periode precedente
                </Label>
                {value.compareEnabled && value.compareStartDate && value.compareEndDate && (
                  <p className="text-xs text-muted-foreground">
                    {format(value.compareStartDate, "d MMM", { locale: fr })} -{" "}
                    {format(value.compareEndDate, "d MMM yyyy", { locale: fr })}
                  </p>
                )}
              </div>
              <Switch
                id="compare"
                checked={value.compareEnabled || false}
                onCheckedChange={handleComparisonToggle}
              />
            </div>
          </div>
        )}

        {/* Bouton appliquer pour custom */}
        {value.preset === "custom" && (
          <div className="border-t p-3">
            <Button
              className="w-full"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={!dateRange?.from || !dateRange?.to}
            >
              Appliquer
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default PeriodFilter;
