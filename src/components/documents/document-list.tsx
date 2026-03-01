"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LayoutGrid,
  List,
  Search,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  FileArchive,
  FileCode,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentCard, TenderDocument } from "./document-card";

type ViewMode = "grid" | "list";
type SortOption = "name" | "date" | "size" | "type";

interface DocumentListProps {
  documents: TenderDocument[];
  view?: ViewMode;
  onSelect?: (document: TenderDocument) => void;
  onView?: (document: TenderDocument) => void;
  onDownload?: (document: TenderDocument) => void;
  onDelete?: (documentIds: string[]) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  className?: string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  zip: FileArchive,
  rar: FileArchive,
  json: FileCode,
  xml: FileCode,
};

const FILE_COLORS: Record<string, string> = {
  pdf: "text-red-500",
  doc: "text-blue-500",
  docx: "text-blue-500",
  xls: "text-green-500",
  xlsx: "text-green-500",
  csv: "text-green-500",
  png: "text-purple-500",
  jpg: "text-purple-500",
  jpeg: "text-purple-500",
  zip: "text-yellow-600",
  json: "text-amber-500",
  xml: "text-amber-500",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function DocumentList({
  documents,
  view: initialView = "grid",
  onSelect,
  onView,
  onDownload,
  onDelete,
  selectedIds = [],
  onSelectionChange,
  className,
}: DocumentListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);

  const effectiveSelectedIds = onSelectionChange ? selectedIds : internalSelectedIds;
  const setEffectiveSelectedIds = onSelectionChange || setInternalSelectedIds;

  const filteredAndSortedDocuments = useMemo(() => {
    let result = [...documents];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.type.toLowerCase().includes(query) ||
          doc.category?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "size":
          return b.size - a.size;
        case "type":
          return getFileExtension(a.name).localeCompare(getFileExtension(b.name));
        default:
          return 0;
      }
    });

    return result;
  }, [documents, searchQuery, sortBy]);

  const handleToggleSelect = (document: TenderDocument) => {
    const newSelection = effectiveSelectedIds.includes(document.id)
      ? effectiveSelectedIds.filter((id) => id !== document.id)
      : [...effectiveSelectedIds, document.id];
    setEffectiveSelectedIds(newSelection);
  };

  const handleSelectAll = () => {
    if (effectiveSelectedIds.length === filteredAndSortedDocuments.length) {
      setEffectiveSelectedIds([]);
    } else {
      setEffectiveSelectedIds(filteredAndSortedDocuments.map((d) => d.id));
    }
  };

  const handleBatchDownload = () => {
    if (onDownload) {
      effectiveSelectedIds.forEach((id) => {
        const doc = documents.find((d) => d.id === id);
        if (doc) onDownload(doc);
      });
    }
  };

  const handleBatchDelete = () => {
    if (onDelete && effectiveSelectedIds.length > 0) {
      onDelete(effectiveSelectedIds);
      setEffectiveSelectedIds([]);
    }
  };

  const isAllSelected =
    filteredAndSortedDocuments.length > 0 &&
    effectiveSelectedIds.length === filteredAndSortedDocuments.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="size">Taille</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex rounded-md border">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Batch Actions */}
      {effectiveSelectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {effectiveSelectedIds.length} document(s) selectionne(s)
          </span>
          <div className="ml-auto flex gap-2">
            {onDownload && (
              <Button variant="outline" size="sm" onClick={handleBatchDownload}>
                <Download className="mr-2 h-4 w-4" />
                Telecharger
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Select All (when no selection) */}
      {effectiveSelectedIds.length === 0 && filteredAndSortedDocuments.length > 0 && (
        <div className="flex items-center gap-3">
          <Checkbox
            checked={false}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            Tout selectionner ({filteredAndSortedDocuments.length})
          </span>
        </div>
      )}

      {/* Documents Grid/List */}
      {filteredAndSortedDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            {searchQuery
              ? "Aucun document ne correspond a votre recherche"
              : "Aucun document"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              selected={effectiveSelectedIds.includes(document.id)}
              onSelect={handleToggleSelect}
              onView={onView}
              onDownload={onDownload}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {filteredAndSortedDocuments.map((document) => {
            const extension = getFileExtension(document.name);
            const IconComponent = FILE_ICONS[extension] || File;
            const iconColor = FILE_COLORS[extension] || "text-muted-foreground";

            return (
              <div
                key={document.id}
                className={cn(
                  "flex items-center gap-4 p-3 transition-colors hover:bg-muted/50",
                  effectiveSelectedIds.includes(document.id) && "bg-muted"
                )}
              >
                <Checkbox
                  checked={effectiveSelectedIds.includes(document.id)}
                  onCheckedChange={() => handleToggleSelect(document)}
                />
                <div className={cn("shrink-0", iconColor)}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{document.name}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatFileSize(document.size)}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(document.createdAt)}
                </span>
                <div className="flex shrink-0 gap-1">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onView(document)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onDownload && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDownload(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DocumentList;
