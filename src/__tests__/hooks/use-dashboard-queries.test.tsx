/**
 * Tests for use-dashboard-queries hooks
 * Tests useDashboardOverview, useConsultationTimeline, useRecentActivity
 * Mock data matches actual backend response shapes (mappers transform to frontend types)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useDashboardOverview,
  useConsultationTimeline,
  useRecentActivity,
  monthNumberToFrench,
  formatRelativeTime,
} from "@/hooks/use-dashboard-queries";

// Mock the API client
vi.mock("@/lib/api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import api from "@/lib/api/client";

// ============================================
// Mock Data — Backend response shapes
// ============================================

const BACKEND_OVERVIEW = {
  total_workflows: 47,
  active_workflows: 12,
  pending_hitl: 4,
  completed_today: 5,
  failed_today: 1,
  avg_processing_time_minutes: 228,
  success_rate_percent: 78,
  by_phase: { COMPLETED: 31, ERROR: 3, EXTRACTION: 5, MATCHING: 4, PACKAGING: 4 },
};

const BACKEND_TIMELINE = [
  { month: "2026-01-01", workflows_started: 8, workflows_completed: 5 },
  { month: "2026-02-01", workflows_started: 12, workflows_completed: 9 },
  { month: "2026-03-01", workflows_started: 15, workflows_completed: 11 },
  { month: "2026-04-01", workflows_started: 10, workflows_completed: 7 },
  { month: "2026-05-01", workflows_started: 18, workflows_completed: 14 },
  { month: "2026-06-01", workflows_started: 22, workflows_completed: 17 },
];

const BACKEND_RECENT_ACTIVITY = [
  {
    case_id: "case-001",
    tender_reference: "AO-2026-0142",
    event_type: "phase_completed",
    event_description: "Processing phase: EXTRACTION",
    phase: "EXTRACTION",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    case_id: "case-002",
    tender_reference: "AO-2026-0138",
    event_type: "completed",
    event_description: "Workflow completed successfully",
    phase: "COMPLETED",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    case_id: "case-003",
    tender_reference: "AO-2026-0141",
    event_type: "hitl_required",
    event_description: "Human decision required: go_nogo",
    phase: "RISK_ANALYSIS",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    case_id: "case-004",
    tender_reference: "AO-2026-0143",
    event_type: "phase_completed",
    event_description: "Processing phase: INGESTION",
    phase: "INGESTION",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    case_id: "case-005",
    tender_reference: null,
    event_type: "failed",
    event_description: "Workflow failed: Timeout exceeded",
    phase: "ERROR",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// Test Wrapper
// ============================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ============================================
// Tests
// ============================================

describe("use-dashboard-queries hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ----------------------------------------
  // useDashboardOverview
  // ----------------------------------------

  describe("useDashboardOverview", () => {
    it("devrait charger et mapper les KPIs du dashboard", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: BACKEND_OVERVIEW });

      const { result } = renderHook(() => useDashboardOverview(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const data = result.current.data!;
      expect(data.total_workflows).toBe(47);
      expect(data.active_workflows).toBe(12);
      expect(data.pending_hitl).toBe(4);
      expect(api.get).toHaveBeenCalledWith("/dashboard/overview");
    });

    it("devrait mapper success_rate_percent → success_rate (0-1)", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: BACKEND_OVERVIEW });

      const { result } = renderHook(() => useDashboardOverview(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Backend returns 78 (percent), frontend expects 0.78 (ratio)
      expect(result.current.data?.success_rate).toBe(0.78);
      expect(Math.round(result.current.data!.success_rate * 100)).toBe(78);
    });

    it("devrait mapper avg_processing_time_minutes → hours", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: BACKEND_OVERVIEW });

      const { result } = renderHook(() => useDashboardOverview(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 228 minutes = 3.8 hours
      expect(result.current.data?.avg_processing_time_hours).toBe(3.8);
    });

    it("devrait deriver les decisions depuis by_phase", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: BACKEND_OVERVIEW });

      const { result } = renderHook(() => useDashboardOverview(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // go = COMPLETED count, nogo = ERROR count, review = pending_hitl
      expect(result.current.data?.decisions).toEqual({
        go: 31,
        review: 4,
        nogo: 3,
      });
    });

    it("devrait deriver completed_workflows depuis by_phase", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: BACKEND_OVERVIEW });

      const { result } = renderHook(() => useDashboardOverview(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.completed_workflows).toBe(31);
    });

    it("devrait gerer les erreurs API", async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useDashboardOverview(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ----------------------------------------
  // useConsultationTimeline
  // ----------------------------------------

  describe("useConsultationTimeline", () => {
    it("devrait charger et mapper la timeline sur 6 mois", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: BACKEND_TIMELINE });

      const { result } = renderHook(() => useConsultationTimeline(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(6);
      expect(api.get).toHaveBeenCalledWith("/analytics/user/timeline", {
        params: { months: 6 },
      });
    });

    it("devrait mapper les dates backend en month/year/count", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: BACKEND_TIMELINE });

      const { result } = renderHook(() => useConsultationTimeline(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const first = result.current.data![0];
      // "2026-01-01" → month: "01", year: 2026, count: 8
      expect(first.month).toBe("01");
      expect(first.year).toBe(2026);
      expect(first.count).toBe(8);
      expect(typeof first.count).toBe("number");
    });

    it("devrait accepter un parametre months personnalise", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: BACKEND_TIMELINE.slice(0, 3),
      });

      const { result } = renderHook(() => useConsultationTimeline(3), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.get).toHaveBeenCalledWith("/analytics/user/timeline", {
        params: { months: 3 },
      });
    });

    it("devrait gerer les erreurs API", async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error("Server error"));

      const { result } = renderHook(() => useConsultationTimeline(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ----------------------------------------
  // useRecentActivity
  // ----------------------------------------

  describe("useRecentActivity", () => {
    it("devrait charger et mapper les activites recentes", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: BACKEND_RECENT_ACTIVITY,
      });

      const { result } = renderHook(() => useRecentActivity(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(5);
      expect(api.get).toHaveBeenCalledWith("/dashboard/recent-activity", {
        params: { limit: 5 },
      });
    });

    it("devrait mapper les champs backend vers le format frontend", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: BACKEND_RECENT_ACTIVITY,
      });

      const { result } = renderHook(() => useRecentActivity(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const first = result.current.data![0];
      // Backend: case_id, tender_reference, event_type, event_description, phase, timestamp
      // Frontend: id, event_type, description, reference, case_id, created_at
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("event_type", "phase_completed");
      expect(first).toHaveProperty("description", "Processing phase: EXTRACTION");
      expect(first).toHaveProperty("reference", "AO-2026-0142");
      expect(first).toHaveProperty("case_id", "case-001");
      expect(first).toHaveProperty("created_at");
    });

    it("devrait gerer tender_reference null", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: BACKEND_RECENT_ACTIVITY,
      });

      const { result } = renderHook(() => useRecentActivity(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Last item has tender_reference: null → reference: ""
      const last = result.current.data![4];
      expect(last.reference).toBe("");
    });

    it("devrait respecter le parametre limit", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: BACKEND_RECENT_ACTIVITY.slice(0, 3),
      });

      const { result } = renderHook(() => useRecentActivity(3), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.get).toHaveBeenCalledWith("/dashboard/recent-activity", {
        params: { limit: 3 },
      });
    });

    it("devrait gerer les erreurs API", async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error("Timeout"));

      const { result } = renderHook(() => useRecentActivity(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ----------------------------------------
  // Helpers
  // ----------------------------------------

  describe("monthNumberToFrench", () => {
    it("devrait convertir les numeros de mois en francais", () => {
      expect(monthNumberToFrench("01")).toBe("Jan");
      expect(monthNumberToFrench("02")).toBe("Fev");
      expect(monthNumberToFrench("06")).toBe("Juin");
      expect(monthNumberToFrench("12")).toBe("Dec");
    });

    it("devrait accepter des numeros", () => {
      expect(monthNumberToFrench(1)).toBe("Jan");
      expect(monthNumberToFrench(7)).toBe("Juil");
    });
  });

  describe("formatRelativeTime", () => {
    it("devrait afficher 'A l'instant' pour < 1 min", () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe("A l'instant");
    });

    it("devrait afficher les minutes", () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinAgo)).toBe("Il y a 5 min");
    });

    it("devrait afficher les heures", () => {
      const twoHoursAgo = new Date(
        Date.now() - 2 * 60 * 60 * 1000
      ).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toBe("Il y a 2h");
    });

    it("devrait afficher les jours", () => {
      const threeDaysAgo = new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000
      ).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe("Il y a 3 jours");
    });

    it("devrait afficher les mois", () => {
      const twoMonthsAgo = new Date(
        Date.now() - 60 * 24 * 60 * 60 * 1000
      ).toISOString();
      expect(formatRelativeTime(twoMonthsAgo)).toBe("Il y a 2 mois");
    });
  });
});
