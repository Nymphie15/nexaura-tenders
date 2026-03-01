"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  FileText,
  Workflow,
  LayoutDashboard,
  Upload,
  Plus,
  Settings,
  Building2,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Library,
} from "lucide-react";
import { useUnifiedSearch } from "@/hooks/use-search";
import { useHITLPending } from "@/hooks/use-hitl";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusIcons = {
  NEW: <FileText className="h-4 w-4" />,
  ANALYZING: <Loader2 className="h-4 w-4 animate-spin" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4" />,
  ERROR: <AlertCircle className="h-4 w-4" />,
  PENDING: <Clock className="h-4 w-4" />,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const shouldSearch = search.length >= 2;

  // Unified search replaces 3 separate hooks
  const { data: searchResults, isLoading: isSearching } = useUnifiedSearch(search);

  // HITL pending only when not searching (for quick access)
  const { data: hitlPending } = useHITLPending();

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false);
    callback();
  }, []);

  const addToRecent = useCallback((item: { type: string; label: string; url: string }) => {
    const recent = JSON.parse(localStorage.getItem("command-palette-recent") || "[]");
    const filtered = recent.filter((r: any) => r.url !== item.url);
    const updated = [item, ...filtered].slice(0, 5);
    localStorage.setItem("command-palette-recent", JSON.stringify(updated));
  }, []);

  const [recentItems, setRecentItems] = useState<any[]>([]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("command-palette-recent");
      setRecentItems(stored ? JSON.parse(stored) : []);
    }
  }, []);

  if (!open) return null;

  const tenders = searchResults?.tenders || [];
  const workflows = searchResults?.workflows || [];
  const hitlResults = searchResults?.hitl || [];
  const totalResults = searchResults?.total || 0;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2">
        <Command className="rounded-lg border bg-popover shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
            <Command.Input
              placeholder="Rechercher partout... (appels d'offres, workflows, decisions)"
              value={search}
              onValueChange={setSearch}
              className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <Command.List className="max-h-[500px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              {shouldSearch ? "Aucun resultat trouve." : "Tapez pour rechercher..."}
            </Command.Empty>

            {/* Actions rapides */}
            {!shouldSearch && (
              <Command.Group heading="Actions">
                <Command.Item
                  onSelect={() => handleSelect(() => { router.push("/tenders?upload=true"); addToRecent({ type: "action", label: "Upload DCE", url: "/tenders?upload=true" }); })}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 aria-selected:bg-accent"
                >
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span>Uploader un DCE</span>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>U
                  </kbd>
                </Command.Item>
                <Command.Item
                  onSelect={() => handleSelect(() => { router.push("/tenders"); addToRecent({ type: "action", label: "Nouvelle reponse", url: "/tenders" }); })}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 aria-selected:bg-accent"
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span>Nouvelle reponse</span>
                </Command.Item>
              </Command.Group>
            )}

            {/* Navigation */}
            {!shouldSearch && (
              <Command.Group heading="Navigation">
                {[
                  { icon: LayoutDashboard, label: "Dashboard", href: "/", kbd: "D" },
                  { icon: FileText, label: "Opportunites", href: "/tenders" },
                  { icon: Workflow, label: "Mes Reponses", href: "/responses" },
                  { icon: CheckCircle2, label: "Decisions", href: "/decisions" },
                  { icon: Library, label: "Templates", href: "/templates" },
                  { icon: Building2, label: "Entreprise", href: "/company" },
                  { icon: Settings, label: "Parametres", href: "/settings" },
                ].map((nav) => (
                  <Command.Item
                    key={nav.href}
                    onSelect={() => handleSelect(() => { router.push(nav.href); addToRecent({ type: "page", label: nav.label, url: nav.href }); })}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 aria-selected:bg-accent"
                  >
                    <nav.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{nav.label}</span>
                    {nav.kbd && (
                      <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        <span className="text-xs">⌘</span>{nav.kbd}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search Results: Tenders */}
            {shouldSearch && tenders.length > 0 && (
              <Command.Group heading={`Appels d'offres (${tenders.length})`}>
                {tenders.map((tender: any) => (
                  <Command.Item
                    key={tender.id}
                    value={`tender-${tender.id}-${tender.title}-${tender.reference}`}
                    onSelect={() => handleSelect(() => { router.push(`/tenders/${tender.id}`); addToRecent({ type: "tender", label: tender.title || tender.reference, url: `/tenders/${tender.id}` }); })}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 aria-selected:bg-accent"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{tender.title || tender.reference}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{tender.reference}</span>
                        {tender.score != null && (<><span>•</span><span>Score: {Math.round(tender.score)}%</span></>)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-auto">{tender.status}</Badge>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search Results: Workflows */}
            {shouldSearch && workflows.length > 0 && (
              <Command.Group heading={`Workflows (${workflows.length})`}>
                {workflows.map((wf: any) => (
                  <Command.Item
                    key={wf.case_id}
                    value={`workflow-${wf.case_id}-${wf.tender_reference}`}
                    onSelect={() => handleSelect(() => { router.push(`/responses/${wf.case_id}`); addToRecent({ type: "workflow", label: wf.tender_reference || wf.case_id, url: `/responses/${wf.case_id}` }); })}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 aria-selected:bg-accent"
                  >
                    <Workflow className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{wf.tender_reference || wf.case_id}</div>
                      <div className="text-xs text-muted-foreground">{wf.current_phase} • {wf.status}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search Results: HITL */}
            {shouldSearch && hitlResults.length > 0 && (
              <Command.Group heading={`Decisions (${hitlResults.length})`}>
                {hitlResults.map((item: any) => (
                  <Command.Item
                    key={`${item.case_id}-${item.checkpoint}`}
                    value={`hitl-${item.case_id}-${item.checkpoint}`}
                    onSelect={() => handleSelect(() => { router.push(`/decisions/${item.case_id}/${item.checkpoint}`); })}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 aria-selected:bg-accent"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-orange-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.tender_reference || item.case_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">{item.checkpoint.replace("_", " ")}</div>
                    </div>
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                      {item.urgency || "En attente"}
                    </Badge>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search total count */}
            {shouldSearch && !isSearching && totalResults > 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                {totalResults} resultat{totalResults > 1 ? "s" : ""} trouve{totalResults > 1 ? "s" : ""}
              </div>
            )}

            {/* HITL pending when not searching */}
            {!shouldSearch && hitlPending && hitlPending.length > 0 && (
              <Command.Group heading="Decisions en attente">
                {hitlPending.slice(0, 3).map((decision: any) => (
                  <Command.Item
                    key={`${decision.case_id}-${decision.checkpoint}`}
                    value={`hitl-${decision.case_id}-${decision.checkpoint}`}
                    onSelect={() => handleSelect(() => { router.push(`/decisions/${decision.case_id}/${decision.checkpoint}`); addToRecent({ type: "hitl", label: `Decision ${decision.checkpoint}`, url: `/decisions/${decision.case_id}/${decision.checkpoint}` }); })}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 aria-selected:bg-accent"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-orange-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{decision.checkpoint.replace("_", " ")}</div>
                      <div className="text-xs text-muted-foreground truncate">{decision.case_id}</div>
                    </div>
                    <Badge variant="outline" className="ml-auto bg-orange-500/10 text-orange-500 border-orange-500/20">En attente</Badge>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Recent history */}
            {!shouldSearch && recentItems.length > 0 && (
              <Command.Group heading="Recent">
                {recentItems.map((item: any, index: number) => (
                  <Command.Item
                    key={index}
                    value={`recent-${item.url}`}
                    onSelect={() => handleSelect(() => { router.push(item.url); })}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 aria-selected:bg-accent"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </>
  );
}
