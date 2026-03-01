"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { NotificationCenter } from "@/components/notifications";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Tableau de bord",
    description: "Vue d'ensemble de votre activité",
  },
  "/tenders": {
    title: "Opportunités",
    description: "Gérez vos appels d'offres",
  },
  "/responses": {
    title: "Mes Réponses",
    description: "Gérez vos dossiers de réponse",
  },
  "/decisions": {
    title: "Décisions",
    description: "Suivi et décisions HITL",
  },
  "/company": {
    title: "Profil entreprise",
    description: "Configurez votre profil",
  },
  "/settings": {
    title: "Paramètres",
    description: "Personnalisez votre expérience",
  },
  "/analytics": {
    title: "Analytiques",
    description: "Vue d'ensemble de vos performances",
  },
  "/audit": {
    title: "Audit",
    description: "Conformité et traçabilité",
  },
  "/templates": {
    title: "Templates",
    description: "Gérez vos modèles de documents",
  },
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [{ name: "Accueil", href: "/" }];

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    const pageInfo = pageTitles[currentPath];
    if (pageInfo) {
      breadcrumbs.push({ name: pageInfo.title, href: currentPath });
    } else if (segment === "edit") {
      // Skip "edit" intermediate segment (no page exists at /tenders/id/edit)
      continue;
    } else if (i > 0 && segments[i - 1] === "tenders") {
      // Tender ID segment → show "Détail"
      breadcrumbs.push({ name: "Détail", href: currentPath });
    } else if (i > 0 && segments[i - 1] === "responses") {
      breadcrumbs.push({ name: "Détail", href: currentPath });
    } else if (i > 0 && segments[i - 1] === "edit") {
      // Filename segment after edit
      const displayName = decodeURIComponent(segment)
        .replace(/\.(docx|txt|md|json)$/i, "")
        .replace(/_/g, " ");
      breadcrumbs.push({ name: `Édition`, href: currentPath });
    } else {
      breadcrumbs.push({
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
      });
    }
  }

  return breadcrumbs;
}

function getPageInfo(path: string): { title: string; description: string } {
  if (pageTitles[path]) return pageTitles[path];
  if (path.match(/^\/tenders\/[^/]+\/edit\//)) {
    return { title: "Édition document", description: "Modifiez votre document avec l\u2019IA" };
  }
  if (path.match(/^\/tenders\/[^/]+/)) {
    return { title: "Détail appel d\u2019offres", description: "Analyse et documents" };
  }
  if (path.match(/^\/responses\/[^/]+\/edit\//)) {
    return { title: "Édition document", description: "Modifiez votre document avec l\u2019IA" };
  }
  if (path.match(/^\/responses\/[^/]+/)) {
    return { title: "Détail réponse", description: "Workflow et documents générés" };
  }
  if (path.match(/^\/decisions\/[^/]+\/[^/]+/)) {
    return { title: "Décision HITL", description: "Validez cette étape" };
  }
  return { title: "Page", description: "" };
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const pageInfo = useMemo(() => getPageInfo(pathname), [pathname]);
  const breadcrumbs = useMemo(() => getBreadcrumbs(pathname), [pathname]);

  // Get auth token from localStorage
  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }, []);

  const handleNewDCE = useCallback(() => {
    router.push('/tenders?upload=true');
  }, [router]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background shadow-xs px-6">
      {/* Left: Title & Breadcrumbs */}
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 1 && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="h-3 w-3" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-foreground">{crumb.name}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        )}
        <h1 className="text-lg font-semibold text-foreground">
          {pageInfo.title}
        </h1>
      </div>

      {/* Center: Search */}
      <div className="hidden flex-1 justify-center px-8 md:flex">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un appel d'offres..."
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-12 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Rechercher un appel d'offres"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notification Center */}
        <NotificationCenter getToken={getToken} />

        <Button
          data-tour="new-dce-button"
          size="sm"
          className="gap-2 rounded-xl"
          aria-label="Créer un nouveau DCE"
          onClick={handleNewDCE}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau DCE</span>
        </Button>
      </div>
    </header>
  );
}
