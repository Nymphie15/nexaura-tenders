import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/endpoints";

export function useUserKPIs(period: number = 30) {
  return useQuery({
    queryKey: ["analytics", "kpis", period],
    queryFn: () => analyticsApi.userKpis(period),
    staleTime: 60 * 1000,
  });
}

export function useWinRate() {
  return useQuery({
    queryKey: ["analytics", "win-rate"],
    queryFn: () => analyticsApi.winRate(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActivityTimeline(months: number = 6) {
  return useQuery({
    queryKey: ["analytics", "timeline", months],
    queryFn: () => analyticsApi.timeline(months),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecommendations(limit: number = 5) {
  return useQuery({
    queryKey: ["analytics", "recommendations", limit],
    queryFn: () => analyticsApi.recommendations(limit),
    staleTime: 10 * 60 * 1000,
  });
}
