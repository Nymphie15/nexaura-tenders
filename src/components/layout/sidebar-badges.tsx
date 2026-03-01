"use client";

import { useWorkflowStats } from "@/hooks/use-workflows";
import { useHITLPending } from "@/hooks/use-hitl";
import { useTendersCount } from "@/hooks/use-tenders";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  dataTour?: string;
}

export function useSidebarBadges(baseNavigation: NavItem[]): NavItem[] {
  const { data: workflowStats } = useWorkflowStats();
  const { data: hitlPending } = useHITLPending();
  const { data: tendersCount } = useTendersCount();

  const workflowsCount = workflowStats?.total_cases || 0;
  const hitlCount = hitlPending?.length || 0;
  const tendersCountValue = tendersCount?.count || 0;

  return baseNavigation.map((item) => {
    if (item.href === "/responses" && workflowsCount > 0) {
      return { ...item, badge: String(workflowsCount) };
    }
    if (item.href === "/decisions" && hitlCount > 0) {
      return { ...item, badge: String(hitlCount) };
    }
    if (item.href === "/tenders" && tendersCountValue > 0) {
      return { ...item, badge: String(tendersCountValue) };
    }
    return item;
  });
}
