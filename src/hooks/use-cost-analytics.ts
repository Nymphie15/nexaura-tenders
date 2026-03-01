import { useQuery } from "@tanstack/react-query";
import { costAnalyticsApi } from "@/lib/api/endpoints";

export const costAnalyticsKeys = {
  all: ["cost-analytics"] as const,
  report: (periodDays: number) => [...costAnalyticsKeys.all, "report", periodDays] as const,
  budget: () => [...costAnalyticsKeys.all, "budget"] as const,
  byModel: (periodDays: number) => [...costAnalyticsKeys.all, "by-model", periodDays] as const,
  byPhase: (periodDays: number) => [...costAnalyticsKeys.all, "by-phase", periodDays] as const,
  byCompany: (periodDays: number) => [...costAnalyticsKeys.all, "by-company", periodDays] as const,
};

export function useCostReport(periodDays: number) {
  return useQuery({
    queryKey: costAnalyticsKeys.report(periodDays),
    queryFn: () => costAnalyticsApi.getReport({ period_days: periodDays }),
    staleTime: 60_000,
  });
}

export function useBudgetStatus() {
  return useQuery({
    queryKey: costAnalyticsKeys.budget(),
    queryFn: () => costAnalyticsApi.getBudgetStatus(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useCostsByModel(periodDays: number) {
  return useQuery({
    queryKey: costAnalyticsKeys.byModel(periodDays),
    queryFn: () => costAnalyticsApi.getByModel({ period_days: periodDays }),
    staleTime: 60_000,
  });
}

export function useCostsByPhase(periodDays: number) {
  return useQuery({
    queryKey: costAnalyticsKeys.byPhase(periodDays),
    queryFn: () => costAnalyticsApi.getByPhase({ period_days: periodDays }),
    staleTime: 60_000,
  });
}

export function useCostsByCompany(periodDays: number) {
  return useQuery({
    queryKey: costAnalyticsKeys.byCompany(periodDays),
    queryFn: () => costAnalyticsApi.getByCompany({ period_days: periodDays }),
    staleTime: 60_000,
  });
}
