"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTemplates, useDeleteTemplate, useTemplateStats } from "@/hooks/use-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Library,
  Search,
  Plus,
  RefreshCw,
  Star,
  Repeat,
  FileText,
  MoreVertical,
  Trash2,
  Copy,
  BarChart3,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatRelativeDate } from "@/lib/utils";

const SECTION_LABELS: Record<string, string> = {
  approche_technique: "Approche Technique",
  moyens_humains: "Moyens Humains",
  moyens_materiels: "Moyens Materiels",
  qualite_securite: "Qualite & Securite",
  planning_execution: "Planning Execution",
  references: "References",
};

const SECTOR_LABELS: Record<string, string> = {
  fournitures: "Fournitures",
  btp: "BTP",
  it: "IT & Services",
  services: "Services",
};

interface TemplateStatsData {
  total_templates?: number;
  total?: number;
  avg_quality_score?: number;
  by_section?: Record<string, number>;
  by_sector?: Record<string, number>;
}

function StatsBar({ isLoading, stats }: { isLoading: boolean; stats: TemplateStatsData | undefined }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Library className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total_templates ?? stats?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">Templates</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.avg_quality_score?.toFixed(1) ?? "-"}</p>
              <p className="text-xs text-muted-foreground">Score moyen</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.by_section ? Object.keys(stats.by_section).length : 0}</p>
              <p className="text-xs text-muted-foreground">Sections</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Repeat className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.by_sector ? Object.keys(stats.by_sector).length : 0}</p>
              <p className="text-xs text-muted-foreground">Secteurs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  const { data: templates, isLoading, refetch } = useTemplates({
    sector: sectorFilter !== "all" ? sectorFilter : undefined,
    section_name: sectionFilter !== "all" ? sectionFilter : undefined,
    limit: 50,
  });
  const { data: stats, isLoading: isLoadingStats } = useTemplateStats();
  const deleteTemplate = useDeleteTemplate();

  const filtered = templates?.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.section_name?.toLowerCase().includes(s) ||
      t.sector?.toLowerCase().includes(s) ||
      t.content?.toLowerCase().includes(s) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bibliotheque de Templates</h1>
          <p className="text-muted-foreground mt-1">
            Sections reutilisables pour vos memoires techniques
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar isLoading={isLoadingStats} stats={stats} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par contenu, section, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Secteur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous secteurs</SelectItem>
            {Object.entries(SECTOR_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes sections</SelectItem>
            {Object.entries(SECTION_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-20 w-full mb-3" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <EmptyState
          illustration={search ? "no-results" : "no-templates"}
          title={search ? "Aucun resultat" : "Aucun template"}
          description={
            search
              ? `Aucun template pour "${search}". Essayez d'autres termes.`
              : "Les templates valides par HITL apparaitront ici automatiquement. Vous pouvez aussi en creer manuellement."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered?.map((template) => (
            <Card key={template.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-2">
                    <h3 className="font-semibold text-sm">
                      {SECTION_LABELS[template.section_name] || template.section_name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {SECTOR_LABELS[template.sector] || template.sector}
                      {template.source_tender_reference && ` • ${template.source_tender_reference}`}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(template.content)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copier le contenu
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteTemplate.mutate(template.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Content preview */}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {template.summary || template.content?.slice(0, 150)}
                </p>

                {/* Tags */}
                {template.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{template.tags.length - 3}</Badge>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {template.quality_score?.toFixed(1) ?? "-"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat className="h-3 w-3" />
                      {template.reuse_count ?? 0}x
                    </span>
                    <span>{template.word_count} mots</span>
                  </div>
                  <span>{formatRelativeDate(template.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
