import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/lib/api/endpoints", () => ({
  searchApi: {
    unified: vi.fn(),
    suggestions: vi.fn(),
    advancedTenders: vi.fn(),
  },
}));

import { searchApi } from "@/lib/api/endpoints";
import { useUnifiedSearch, useSearchSuggestions, useAdvancedTenderSearch } from "@/hooks/use-search";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useUnifiedSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not search when query is too short", () => {
    const { result } = renderHook(() => useUnifiedSearch("a"), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
  });

  it("should search when query has 2+ characters", async () => {
    const mockResults = {
      tenders: [{ id: "1", title: "Bureau mobilier" }],
      workflows: [],
      hitl: [],
      total: 1,
    };
    (searchApi.unified as any).mockResolvedValue(mockResults);

    const { result } = renderHook(() => useUnifiedSearch("bureau"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResults);
  });

  it("should pass options to API call", async () => {
    (searchApi.unified as any).mockResolvedValue({ tenders: [], workflows: [], hitl: [], total: 0 });

    const { result } = renderHook(
      () => useUnifiedSearch("test", { limit: 5 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(searchApi.unified).toHaveBeenCalledWith(expect.objectContaining({ query: "test", limit: 5 }));
  });
});

describe("useSearchSuggestions", () => {
  it("should not fetch suggestions for short queries", () => {
    const { result } = renderHook(() => useSearchSuggestions("x"), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
  });
});
