"use client";

import { useMemo } from "react";
import { usePathname, useParams } from "next/navigation";
import type { CopilotContext } from "@/stores/copilot-store";

/**
 * Derives the AI copilot context from the current route.
 */
export function useCopilotContext(): CopilotContext {
  const pathname = usePathname();
  const params = useParams();

  return useMemo(() => {
    const id = params?.id as string | undefined;

    if (pathname?.startsWith("/opportunities/") && id) {
      return { page: "tender-detail", tender_id: id };
    }
    if (pathname?.startsWith("/workflows/") && id) {
      return { page: "workflow", case_id: id };
    }
    if (pathname?.startsWith("/projects/") && id) {
      return { page: "project", case_id: id };
    }
    if (pathname?.startsWith("/decisions/") && id) {
      return { page: "decision", case_id: id };
    }

    return { page: pathname || "/" };
  }, [pathname, params]);
}
