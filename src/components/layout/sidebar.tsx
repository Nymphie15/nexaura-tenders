"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  FileEdit,
  CheckCircle2,
  Building2,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Library,
  BarChart3,
  ShieldCheck,
  Bell,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarBadges } from "./sidebar-badges";
import { SidebarUserMenu } from "./sidebar-user-menu";
import { SidebarNav } from "./sidebar-nav";

// ============================================
// Constants
// ============================================

const SIDEBAR_STATE_KEY = "sidebar-collapsed";
const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;

const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

// ============================================
// Navigation Items
// ============================================

const baseNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, dataTour: "dashboard-nav" },
  { name: "Opportunites", href: "/opportunities", icon: Search, dataTour: "tenders-nav" },
  { name: "Mes Projets", href: "/projects", icon: FileEdit, dataTour: "workflows-nav" },
  { name: "Decisions", href: "/decisions", icon: CheckCircle2, badgeVariant: "destructive" as const, dataTour: "hitl-nav" },
  { name: "Templates", href: "/templates", icon: Library },
];

const secondaryNav = [
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Audit", href: "/audit", icon: ShieldCheck },
  { name: "Entreprise", href: "/company", icon: Building2, dataTour: "company-nav" },
  { name: "Parametres", href: "/settings", icon: Settings },
];

// ============================================
// Hook for persistent sidebar state
// ============================================

function useSidebarState() {
  const [collapsed, setCollapsed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
    setCollapsed(stored === "true");
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(SIDEBAR_STATE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  return { collapsed: collapsed ?? false, toggleCollapsed, isLoaded: collapsed !== null };
}

// ============================================
// Main Sidebar Component
// ============================================

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, isLoaded } = useSidebarState();
  const navigation = useSidebarBadges(baseNavigation);

  if (!isLoaded) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar",
          "w-[260px]"
        )}
      />
    );
  }

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        }}
        transition={springConfig}
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col",
          "border-r border-sidebar-border bg-sidebar",
          "overflow-hidden"
        )}
      >
        {/* Header with Logo */}
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <motion.div
              animate={{ rotate: collapsed ? 0 : 0 }}
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20"
            >
              <span className="text-lg font-bold text-primary-foreground">N</span>
            </motion.div>

            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
                    Nexaura
                  </span>
                  <span className="ml-1 text-xs font-medium text-muted-foreground">
                    Tenders
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 text-muted-foreground hover:text-foreground shrink-0",
                  collapsed && "mx-auto"
                )}
                onClick={toggleCollapsed}
                aria-label={collapsed ? "Developper la barre laterale" : "Reduire la barre laterale"}
              >
                <motion.div
                  animate={{ rotate: collapsed ? 180 : 0 }}
                  transition={springConfig}
                >
                  {collapsed ? (
                    <PanelLeft className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? "right" : "bottom"}>
              {collapsed ? "Developper" : "Reduire"}
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator className="mx-4 w-auto" />

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-hidden">
          <SidebarNav items={navigation} pathname={pathname} collapsed={collapsed} />

          <Separator className="my-4" />

          <SidebarNav items={secondaryNav} pathname={pathname} collapsed={collapsed} exactMatch />
        </nav>

        {/* Footer with User */}
        <div className="border-t border-sidebar-border p-3">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 flex items-center justify-between px-1 overflow-hidden"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
                      aria-label="Notifications"
                    >
                      <Bell className="h-4 w-4" />
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      aria-label="Aide"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Aide</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>

          <SidebarUserMenu collapsed={collapsed} />
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

export default Sidebar;
