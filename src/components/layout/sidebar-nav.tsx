"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  dataTour?: string;
}

interface NavItemLinkProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}

function NavItemLink({ item, isActive, collapsed }: NavItemLinkProps) {
  const content = (
    <Link
      href={item.href}
      data-tour={item.dataTour}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
        "transition-colors duration-150",
        isActive
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/70 hover:bg-muted/60 hover:text-sidebar-foreground"
      )}
    >
      {/* Active indicator bar */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-r-full bg-primary"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={springConfig}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <motion.div
        animate={{ scale: isActive ? 1.1 : 1 }}
        transition={springConfig}
      >
        <item.icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
      </motion.div>

      {/* Label */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 truncate overflow-hidden"
          >
            {item.name}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge (expanded) */}
      <AnimatePresence>
        {!collapsed && item.badge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Badge
              variant={item.badgeVariant || "secondary"}
              className="ml-auto h-5 min-w-[20px] justify-center px-1.5 text-xs"
            >
              {item.badge}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge (collapsed) */}
      {collapsed && item.badge && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute -right-1 -top-1 h-4 w-4 rounded-full text-[10px] font-bold leading-4 text-center",
            item.badgeVariant === "destructive"
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          {item.badge}
        </motion.div>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          <p>{item.name}</p>
          {item.badge && (
            <Badge variant={item.badgeVariant} className="ml-2">
              {item.badge}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

interface SidebarNavProps {
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  exactMatch?: boolean;
}

export function SidebarNav({ items, pathname, collapsed, exactMatch = false }: SidebarNavProps) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = exactMatch
          ? pathname === item.href
          : item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href);
        return (
          <NavItemLink
            key={item.name}
            item={item}
            isActive={isActive}
            collapsed={collapsed}
          />
        );
      })}
    </div>
  );
}
