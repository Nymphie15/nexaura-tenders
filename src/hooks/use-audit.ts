import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/lib/api/endpoints";
import type { AuditLogFilters } from "@/types/audit";

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ["audit", "logs", filters],
    queryFn: () => auditApi.list(filters),
    staleTime: 30 * 1000,
    retry: 1,
    meta: {
      errorMessage: "Impossible de charger les logs d'audit",
    },
  });
}

export function useAuditStats() {
  return useQuery({
    queryKey: ["audit", "stats"],
    queryFn: () => auditApi.stats(),
    staleTime: 60 * 1000,
    retry: 1,
    meta: {
      errorMessage: "Impossible de charger les statistiques d'audit",
    },
  });
}
