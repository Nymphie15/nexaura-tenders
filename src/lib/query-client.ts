import { QueryClient } from "@tanstack/react-query";

export const QUERY_PROFILES = {
  REALTIME: { staleTime: 5_000, gcTime: 60_000 },      // HITL, workflow statuts
  STANDARD: { staleTime: 60_000, gcTime: 300_000 },     // tenders, sidebar counts
  STATIC: { staleTime: 300_000, gcTime: 3_600_000 },    // analytics, stats
} as const;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        ...QUERY_PROFILES.STANDARD,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
