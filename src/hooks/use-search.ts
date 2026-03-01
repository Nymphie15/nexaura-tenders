import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { searchApi } from "@/lib/api/endpoints";
import type {
  UnifiedSearchParams,
  UnifiedSearchResult,
  AdvancedTenderSearchParams,
  AdvancedTenderSearchResult,
} from "@/lib/api/endpoints";

export function useUnifiedSearch(query: string, options?: Partial<UnifiedSearchParams>) {
  return useQuery<UnifiedSearchResult>({
    queryKey: ["search", "unified", query, options],
    queryFn: () => searchApi.unified({ query, ...options }),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useAdvancedTenderSearch(params: AdvancedTenderSearchParams) {
  return useQuery<AdvancedTenderSearchResult>({
    queryKey: ["search", "tenders-advanced", params],
    queryFn: () => searchApi.advancedTenders(params),
    enabled: !!(params.query && params.query.length >= 2) || !!(params.statuses?.length || params.sources?.length || params.date_from || params.budget_min || params.score_min),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useSearchSuggestions(query: string) {
  return useQuery<Array<{ text: string; type: string; id?: string }>>({
    queryKey: ["search", "suggestions", query],
    queryFn: () => searchApi.suggestions(query),
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });
}
