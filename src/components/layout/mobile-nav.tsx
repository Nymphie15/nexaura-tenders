"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  FileEdit,
  CheckCircle2,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Library,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Opportunités", href: "/tenders", icon: Search },
  { name: "Mes Réponses", href: "/responses", icon: FileEdit },
  { name: "Décisions", href: "/decisions", icon: CheckCircle2 },
  { name: "Templates", href: "/templates", icon: Library },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Audit", href: "/audit", icon: ShieldCheck },
  { name: "Entreprise", href: "/company", icon: Building2 },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/login");
  };

  const displayName =
    user?.full_name ||
    (user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name) ||
    "Utilisateur";

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Nav panel */}
          <nav className="relative z-50 flex h-full w-72 max-w-[80vw] flex-col bg-sidebar border-r border-sidebar-border">
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                  <span className="text-lg font-bold text-primary-foreground">N</span>
                </div>
                <span className="text-lg font-semibold text-sidebar-foreground">
                  Nexaura
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-sidebar-border p-4 space-y-3">
              <div className="text-sm text-sidebar-foreground truncate">
                {displayName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email}
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
