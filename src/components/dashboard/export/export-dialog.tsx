/**
 * @file export-dialog.tsx
 * @description Dialog d'export de donnees (CSV, Excel, PDF) pour le dashboard
 * @module components/dashboard/export
 *
 * Permet d'exporter les donnees du dashboard dans differents formats:
 * - CSV pour traitement de donnees
 * - Excel pour analyses spreadsheet
 * - PDF pour rapports imprimables
 *
 * @example
 * <ExportDialog
 *   open={isExportOpen}
 *   onOpenChange={setIsExportOpen}
 *   data={dashboardData}
 *   filename="rapport-appels-offres"
 * />
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Download,
  FileSpreadsheet,
  FileText,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/** Format d'export disponible */
export type ExportFormat = "csv" | "xlsx" | "pdf";

/** Colonne exportable */
export interface ExportColumn {
  key: string;
  label: string;
  selected?: boolean;
}

/** Options d'export */
export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  columns: string[];
  includeHeaders: boolean;
  dateFormat: string;
  encoding?: string;
}

/** Props du composant ExportDialog */
export interface ExportDialogProps {
  /** Etat ouvert/ferme */
  open: boolean;
  /** Callback changement d'etat */
  onOpenChange: (open: boolean) => void;
  /** Donnees a exporter */
  data: Record<string, unknown>[];
  /** Colonnes disponibles */
  columns: ExportColumn[];
  /** Nom de fichier par defaut */
  filename?: string;
  /** Titre du dialog */
  title?: string;
  /** Description */
  description?: string;
  /** Callback d'export */
  onExport: (options: ExportOptions) => Promise<void>;
  /** Classes CSS additionnelles */
  className?: string;
}

/** Configuration des formats */
const formatConfig: Record<ExportFormat, {
  label: string;
  icon: React.ElementType;
  extension: string;
  description: string;
}> = {
  csv: {
    label: "CSV",
    icon: FileText,
    extension: ".csv",
    description: "Format texte avec separateur virgule",
  },
  xlsx: {
    label: "Excel",
    icon: FileSpreadsheet,
    extension: ".xlsx",
    description: "Classeur Microsoft Excel",
  },
  pdf: {
    label: "PDF",
    icon: File,
    extension: ".pdf",
    description: "Document portable formaté",
  },
};

/** Formats de date disponibles */
const dateFormats = [
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
  { value: "dd MMM yyyy", label: "DD MMM YYYY" },
];

/**
 * Dialog d'export de donnees
 */
export function ExportDialog({
  open,
  onOpenChange,
  data,
  columns,
  filename = "export",
  title = "Exporter les donnees",
  description = "Choisissez le format et les options d'export",
  onExport,
  className,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [customFilename, setCustomFilename] = useState(filename);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.filter((c) => c.selected !== false).map((c) => c.key)
  );
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [dateFormat, setDateFormat] = useState("dd/MM/yyyy");
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");

  // Toggle colonne
  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Select/deselect all
  const toggleAllColumns = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(columns.map((c) => c.key));
    }
  };

  // Lancer l'export
  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus("idle");

    try {
      await onExport({
        format,
        filename: `${customFilename}${formatConfig[format].extension}`,
        columns: selectedColumns,
        includeHeaders,
        dateFormat,
      });

      setExportStatus("success");

      // Fermer apres succes
      setTimeout(() => {
        onOpenChange(false);
        setExportStatus("idle");
      }, 1500);
    } catch (error) {
      setExportStatus("error");
    } finally {
      setIsExporting(false);
    }
  };

  // Reset au fermeture
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setExportStatus("idle");
      setCustomFilename(filename);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("sm:max-w-[500px]", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selection du format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format d'export</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
              className="grid grid-cols-3 gap-3"
            >
              {(Object.keys(formatConfig) as ExportFormat[]).map((fmt) => {
                const config = formatConfig[fmt];
                const Icon = config.icon;

                return (
                  <Label
                    key={fmt}
                    htmlFor={fmt}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      format === fmt
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/25"
                    )}
                  >
                    <RadioGroupItem value={fmt} id={fmt} className="sr-only" />
                    <Icon className={cn(
                      "h-8 w-8",
                      format === fmt ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="text-sm font-medium">{config.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {formatConfig[format].description}
            </p>
          </div>

          <Separator />

          {/* Nom du fichier */}
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-sm font-medium">
              Nom du fichier
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="filename"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder="Nom du fichier"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatConfig[format].extension}
              </span>
            </div>
          </div>

          {/* Selection des colonnes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Colonnes a exporter</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={toggleAllColumns}
              >
                {selectedColumns.length === columns.length
                  ? "Deselectionner tout"
                  : "Selectionner tout"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-lg">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${column.key}`}
                    checked={selectedColumns.includes(column.key)}
                    onCheckedChange={() => toggleColumn(column.key)}
                  />
                  <Label
                    htmlFor={`col-${column.key}`}
                    className="text-sm cursor-pointer"
                  >
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedColumns.length} colonne(s) selectionnee(s) sur {columns.length}
            </p>
          </div>

          <Separator />

          {/* Options supplementaires */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Options</Label>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="headers"
                checked={includeHeaders}
                onCheckedChange={(checked) => setIncludeHeaders(!!checked)}
              />
              <Label htmlFor="headers" className="text-sm cursor-pointer">
                Inclure les en-tetes de colonnes
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat" className="text-sm">
                Format des dates
              </Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger id="dateFormat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((df) => (
                    <SelectItem key={df.value} value={df.value}>
                      {df.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Apercu */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Apercu:</strong> Export de {data.length} ligne(s) avec{" "}
              {selectedColumns.length} colonne(s) au format {formatConfig[format].label}
            </p>
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2">
          {exportStatus === "success" && (
            <div className="flex items-center gap-2 text-green-600 mr-auto">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Export réussi!</span>
            </div>
          )}

          {exportStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600 mr-auto">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Erreur lors de l'export</span>
            </div>
          )}

          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>

          <Button
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0 || !customFilename}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
