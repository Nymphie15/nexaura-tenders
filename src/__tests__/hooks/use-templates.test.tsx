import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock the API endpoints
vi.mock("@/lib/api/endpoints", () => ({
  templatesApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    stats: vi.fn(),
    search: vi.fn(),
  },
}));

import { templatesApi } from "@/lib/api/endpoints";
import { useTemplates, useTemplate, useTemplateStats } from "@/hooks/use-templates";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch templates list", async () => {
    const mockData = [
      { id: "1", title: "Template A", sector: "BTP" },
      { id: "2", title: "Template B", sector: "IT" },
    ];
    (templatesApi.list as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useTemplates(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(templatesApi.list).toHaveBeenCalledTimes(1);
  });

  it("should fetch single template by id", async () => {
    const mockTemplate = { id: "1", title: "Template A", content: "..." };
    (templatesApi.get as any).mockResolvedValue(mockTemplate);

    const { result } = renderHook(() => useTemplate("1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTemplate);
  });

  it("should not fetch template when id is empty", () => {
    const { result } = renderHook(() => useTemplate(""), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
  });
});

describe("useTemplateStats", () => {
  it("should fetch template stats", async () => {
    const mockStats = { total: 10, by_sector: { BTP: 5, IT: 5 } };
    (templatesApi.stats as any).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useTemplateStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockStats);
  });
});
