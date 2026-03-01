"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  Upload,
  MoreHorizontal,
  Eye,
  FileEdit,
  Calendar,
  Building2,
  Euro,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useTenders, useTendersCount, useProcessTender, useRelevantTenders } from "@/hooks/use-tenders";
import { UploadDCEDialog } from "@/components/upload-dce-dialog";
import type { TenderStatus, TenderSource } from "@/types";
import { toast } from "sonner";
import { TenderWithRelevance } from "@/lib/api/endpoints";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, Target, MapPin, Briefcase, Award } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  NEW: {
    label: "Nouveau",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  new: {
    label: "Nouveau",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  DOWNLOADED: {
    label: "Telecharge",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  downloaded: {
    label: "Telecharge",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  ANALYZING: {
    label: "Analyse",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  SCORED: {
    label: "Evalue",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  PROCESSING: {
    label: "En cours",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  processing: {
    label: "En cours",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  COMPLETED: {
    label: "Termine",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  completed: {
    label: "Termine",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  FAILED: {
    label: "Echoue",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
  },
  failed: {
    label: "Echoue",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
  },
  REJECTED: {
    label: "Rejete",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10",
  },
  rejected: {
    label: "Rejete",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10",
  },
  TIMEOUT: {
    label: "Expire (timeout)",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  timeout: {
    label: "Expire (timeout)",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  EXPIRED: {
    label: "Expire",
    color: "text-zinc-600 dark:text-zinc-400",
    bgColor: "bg-zinc-500/10",
  },
};

const sourceConfig: Record<string, { label: string; pill: string }> = {
  BOAMP: { label: "BOAMP", pill: "bg-blue-100 text-blue-700" },
  TED: { label: "TED", pill: "bg-indigo-100 text-indigo-700" },
  UPLOAD: { label: "Upload", pill: "bg-zinc-100 text-zinc-600" },
  PLACE: { label: "PLACE", pill: "bg-violet-100 text-violet-700" },
  MEGALIS: { label: "MEGALIS", pill: "bg-violet-100 text-violet-700" },
  MAXIMILIEN: { label: "MAX", pill: "bg-violet-100 text-violet-700" },
};

const ITEMS_PER_PAGE = 10;

function getScoreTier(score: number): { label: string; className: string } {
  if (score >= 80) return { label: "Excellent", className: "bg-emerald-100 text-emerald-700" };
  if (score >= 60) return { label: "Bon", className: "bg-blue-100 text-blue-700" };
  if (score >= 40) return { label: "Moyen", className: "bg-amber-100 text-amber-700" };
  return { label: "Faible", className: "bg-zinc-100 text-zinc-600" };
}

function getDeadlineInfo(deadline?: string): { text: string; className: string } {
  if (!deadline) return { text: "-", className: "text-zinc-400" };
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "Expire", className: "text-zinc-400" };
  if (diffDays < 7) return { text: `J-${diffDays}`, className: "text-red-600 font-bold" };
  if (diffDays <= 14) return { text: `J-${diffDays}`, className: "text-amber-600" };
  return { text: `J-${diffDays}`, className: "text-emerald-600" };
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  );
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [drawerTender, setDrawerTender] = useState<any | null>(null);

  // Source tab: "relevant" | "all" | "BOAMP" | "TED" | "UPLOAD"
  const [sourceTab, setSourceTab] = useState<string>("relevant");

  // Detect ?upload=true from URL
  useEffect(() => {
    if (searchParams.get("upload") === "true") {
      setIsUploadOpen(true);
      router.replace("/opportunities", { scroll: false });
    }
  }, [searchParams, router]);

  const processTender = useProcessTender();

  // Fetch all tenders (used when sourceTab !== "relevant")
  const { data: tenders, isLoading: isLoadingAll } = useTenders({
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
    status: statusFilter !== "all" ? statusFilter : undefined,
    source: (sourceTab !== "relevant" && sourceTab !== "all") ? sourceTab : undefined,
  });

  // Fetch relevant tenders with relevance scores
  const { data: relevantTenders, isLoading: isLoadingRelevant } = useRelevantTenders({
    limit: 100,
    min_score: 0,
  });

  const isRelevantMode = sourceTab === "relevant";
  const isLoading = isRelevantMode ? isLoadingRelevant : isLoadingAll;

  // Fetch total count
  const { data: countData } = useTendersCount({
    status: statusFilter !== "all" ? statusFilter : undefined,
    source: (sourceTab !== "relevant" && sourceTab !== "all") ? sourceTab : undefined,
  });

  const totalCount = isRelevantMode
    ? (relevantTenders?.length || 0)
    : (countData?.count || 0);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Get the current data source
  const currentTenders = isRelevantMode ? relevantTenders : tenders;

  // Client-side search and status filtering
  const filteredTenders = (currentTenders || []).filter((tender) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        tender.title?.toLowerCase().includes(query) ||
        tender.reference?.toLowerCase().includes(query) ||
        tender.client?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (isRelevantMode) {
      if (statusFilter !== "all" && tender.status !== statusFilter) return false;
    }

    return true;
  });

  // Paginate
  const paginatedTenders = isRelevantMode
    ? filteredTenders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
    : filteredTenders;

  const displayTotalPages = isRelevantMode
    ? Math.ceil(filteredTenders.length / ITEMS_PER_PAGE)
    : totalPages;

  // Stats
  const relevantCount = relevantTenders?.filter(t =>
    (t as any).relevance_score >= 60
  ).length || 0;

  const handleRespond = async (tenderId: string) => {
    try {
      const result = await processTender.mutateAsync({ id: tenderId });
      toast.success("Reponse lancee", {
        description: "Le workflow a demarre. Redirection vers votre reponse...",
      });
      const caseId = result?.case_id || (result as Record<string, unknown>)?.workflow_id || tenderId;
      router.push(`/projects/${caseId}`);
    } catch {
      toast.error("Erreur", {
        description: "Impossible de lancer le traitement",
      });
    }
  };

  return (
    <div className="space-y-6 bg-zinc-50/50 min-h-screen -m-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Veille marche</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} opportunite{totalCount !== 1 ? "s" : ""} detectee{totalCount !== 1 ? "s" : ""}
            {relevantCount > 0 && (
              <span> dont <span className="font-medium text-emerald-600">{relevantCount} pertinentes</span></span>
            )}
          </p>
        </div>
        <Button
          data-tour="new-dce-button"
          className="gap-2 rounded-xl bg-primary shadow-lg shadow-primary/20"
          onClick={() => setIsUploadOpen(true)}
        >
          <Upload className="h-4 w-4" />
          Importer DCE
        </Button>
      </div>

      {/* Main Content */}
      <Card className="border border-zinc-200 shadow-sm">
        <CardContent className="p-0">
          {/* Source Tabs */}
          <div className="border-b border-zinc-200 px-4 pt-3">
            <Tabs
              value={sourceTab}
              onValueChange={(v) => {
                setSourceTab(v);
                setPage(1);
              }}
              className="w-fit"
            >
              <TabsList className="h-9 rounded-none bg-transparent p-0 gap-0">
                {[
                  { value: "relevant", label: "Pertinentes", icon: Target },
                  { value: "all", label: "Toutes", icon: FileText },
                  { value: "BOAMP", label: "BOAMP", icon: null },
                  { value: "TED", label: "TED", icon: null },
                  { value: "UPLOAD", label: "Upload", icon: null },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="gap-1.5 rounded-none border-b-2 border-transparent px-3 pb-2.5 pt-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary"
                  >
                    {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Filters */}
          <div className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par reference, titre ou client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-xl border-zinc-200 bg-white pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: "all", label: "Tous" },
                { value: "NEW", label: "Nouveau" },
                { value: "ANALYZING", label: "Analyse" },
                { value: "SCORED", label: "Evalue" },
                { value: "PROCESSING", label: "En cours" },
                { value: "COMPLETED", label: "Termine" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setStatusFilter(s.value); setPage(1); }}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    statusFilter === s.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border-t border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-500 w-[80px]">Source</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-500">Titre / Acheteur</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-500 hidden md:table-cell">Budget</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-500 hidden md:table-cell">Date limite</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-zinc-500">Score</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </>
                ) : paginatedTenders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        compact
                        illustration={searchQuery ? "no-results" : "no-tenders"}
                        title={searchQuery ? "Aucun resultat" : "Aucune opportunite"}
                        description={
                          searchQuery
                            ? `Aucun resultat pour "${searchQuery}". Essayez avec d'autres termes.`
                            : "Importez votre premier DCE pour commencer a repondre aux appels d'offres."
                        }
                        action={
                          !searchQuery
                            ? { label: "Importer un DCE", onClick: () => setIsUploadOpen(true), icon: Upload }
                            : undefined
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTenders.map((tender) => {
                    const score = "relevance_score" in tender ? (tender as TenderWithRelevance).relevance_score : tender.score;
                    const details = "relevance_details" in tender ? (tender as TenderWithRelevance).relevance_details : null;
                    const tier = score != null ? getScoreTier(score) : null;
                    const deadlineInfo = getDeadlineInfo(tender.deadline);
                    const src = (tender.source && sourceConfig[tender.source]) || { label: tender.source || "-", pill: "bg-violet-100 text-violet-700" };

                    return (
                      <TableRow
                        key={tender.id}
                        className="group cursor-pointer hover:bg-zinc-50 transition-colors"
                        onClick={() => setDrawerTender(tender)}
                      >
                        {/* Source */}
                        <TableCell>
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", src.pill)}>
                            {src.label}
                          </span>
                        </TableCell>

                        {/* Title + Buyer */}
                        <TableCell>
                          <div>
                            <span className="font-medium text-sm">
                              {tender.title && tender.title.length > 55
                                ? `${tender.title.slice(0, 55)}...`
                                : tender.title}
                            </span>
                            {tender.client && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Building2 className="h-3 w-3 text-zinc-400" />
                                <span className="text-xs text-zinc-500">
                                  {tender.client.length > 40 ? `${tender.client.slice(0, 40)}...` : tender.client}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Budget */}
                        <TableCell className="hidden md:table-cell">
                          <span className="font-medium text-sm tabular-nums">
                            {tender.budget ? formatCurrency(tender.budget) : "-"}
                          </span>
                        </TableCell>

                        {/* Deadline */}
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-sm tabular-nums", deadlineInfo.className)}>
                              {deadlineInfo.text}
                            </span>
                            {tender.deadline && (
                              <span className="text-[10px] text-zinc-400">
                                {formatDate(tender.deadline)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Score */}
                        <TableCell>
                          {tier && score != null ? (
                            <div className="flex items-center gap-2">
                              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", tier.className)}>
                                {tier.label}
                              </span>
                              <span className="text-xs font-medium tabular-nums text-zinc-600">
                                {score}/100
                              </span>
                              {details && (details.domain_match != null || details.cpv_match != null || details.geo_match != null) && (
                                <div className="hidden lg:flex items-center gap-1">
                                  {details.domain_match != null && (
                                    <span className="inline-flex items-center rounded px-1 py-0.5 text-[9px] bg-zinc-100 text-zinc-500">
                                      Dom. {details.domain_match}
                                    </span>
                                  )}
                                  {details.cpv_match != null && (
                                    <span className="inline-flex items-center rounded px-1 py-0.5 text-[9px] bg-zinc-100 text-zinc-500">
                                      CPV {details.cpv_match}
                                    </span>
                                  )}
                                  {details.geo_match != null && (
                                    <span className="inline-flex items-center rounded px-1 py-0.5 text-[9px] bg-zinc-100 text-zinc-500">
                                      Geo {details.geo_match}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">-</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/opportunities/${tender.id}`);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Voir details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRespond(tender.id); }}>
                                <FileEdit className="mr-2 h-4 w-4" />
                                Repondre
                              </DropdownMenuItem>
                              {tender.url && (
                                <DropdownMenuItem asChild>
                                  <a href={tender.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Voir source
                                  </a>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 flex items-center justify-between border-t border-zinc-200">
            <p className="text-sm text-zinc-500">
              Affichage de {paginatedTenders.length} sur {isRelevantMode ? filteredTenders.length : totalCount} resultats
              {isRelevantMode && (
                <span className="ml-2 text-zinc-400">
                  (tries par pertinence)
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(displayTotalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 w-8 rounded-lg",
                      page === pageNum && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg"
                disabled={page >= displayTotalPages}
                onClick={() => setPage(p => Math.min(displayTotalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side Drawer */}
      <Sheet open={!!drawerTender} onOpenChange={(open) => { if (!open) setDrawerTender(null); }}>
        <SheetContent side="right" className="w-[40%] min-w-[360px] max-w-[560px] sm:max-w-[560px] overflow-y-auto">
          {drawerTender && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base leading-snug pr-8">
                  {drawerTender.title}
                </SheetTitle>
              </SheetHeader>

              <div className="px-6 pb-6 space-y-5">
                {/* Buyer */}
                {drawerTender.client && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Building2 className="h-4 w-4 text-zinc-400" />
                    {drawerTender.client}
                  </div>
                )}

                {/* Budget & Deadline */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zinc-200 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">Budget</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {drawerTender.budget ? formatCurrency(drawerTender.budget) : "Non specifie"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">Date limite</p>
                    <p className={cn("text-sm font-semibold tabular-nums", getDeadlineInfo(drawerTender.deadline).className)}>
                      {drawerTender.deadline ? (
                        <>
                          {getDeadlineInfo(drawerTender.deadline).text}
                          <span className="text-xs text-zinc-400 font-normal ml-1.5">
                            {formatDate(drawerTender.deadline)}
                          </span>
                        </>
                      ) : "Non specifiee"}
                    </p>
                  </div>
                </div>

                {/* Score */}
                {(() => {
                  const score = "relevance_score" in drawerTender ? drawerTender.relevance_score : drawerTender.score;
                  const tier = score != null ? getScoreTier(score) : null;
                  if (!tier || score == null) return null;
                  return (
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400">Score de pertinence</p>
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", tier.className)}>
                          {tier.label}
                        </span>
                      </div>
                      <p className="text-2xl font-bold tabular-nums mt-1">{score}<span className="text-sm text-zinc-400 font-normal">/100</span></p>
                    </div>
                  );
                })()}

                {/* Description */}
                {drawerTender.description && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5">Description</p>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {drawerTender.description.length > 300
                        ? `${drawerTender.description.slice(0, 300)}...`
                        : drawerTender.description}
                    </p>
                  </div>
                )}

                {/* CTA */}
                <Button
                  className="w-full gap-2 rounded-xl"
                  onClick={() => {
                    setDrawerTender(null);
                    router.push(`/opportunities/${drawerTender.id}`);
                  }}
                >
                  Ouvrir
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Upload DCE Dialog */}
      <UploadDCEDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </div>
  );
}
