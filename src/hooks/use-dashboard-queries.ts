import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import type {
  Tender,
  ApiDashboardOverview,
  ApiTimelineEntry,
  ApiRecentActivityItem,
} from "@/types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// ============================================
// Query Keys
// ============================================

export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
  timeline: () => [...dashboardKeys.all, "timeline"] as const,
  recentActivity: (limit: number) =>
    [...dashboardKeys.all, "recent-activity", limit] as const,
  recentTenders: (limit: number) =>
    [...dashboardKeys.all, "recent-tenders", limit] as const,
  sourceDistribution: () =>
    [...dashboardKeys.all, "source-distribution"] as const,
  pipelineValue: () =>
    [...dashboardKeys.all, "pipeline-value"] as const,
};

// ============================================
// Backend Response Shapes (actual API)
// ============================================

interface BackendDashboardOverview {
  total_workflows: number;
  active_workflows: number;
  pending_hitl: number;
  completed_today: number;
  failed_today: number;
  avg_processing_time_minutes: number;
  success_rate_percent: number;
  by_phase: Record<string, number>;
}

interface BackendTimelineEntry {
  month: string; // "2026-02-01"
  workflows_started: number;
  workflows_completed: number;
}

interface BackendRecentActivity {
  case_id: string;
  tender_reference: string | null;
  event_type: string;
  event_description: string;
  phase: string | null;
  timestamp: string;
}

// ============================================
// Mock Data
// ============================================

const MOCK_OVERVIEW: ApiDashboardOverview = {
  total_workflows: 47,
  active_workflows: 12,
  completed_workflows: 31,
  pending_hitl: 4,
  success_rate: 0.78,
  avg_processing_time_hours: 3.8,
  decisions: { go: 45, review: 30, nogo: 25 },
  period_change: {
    total_workflows: 12,
    active_workflows: 8,
    success_rate: 5,
    avg_processing_time_hours: -15,
  },
};

const MONTH_NAMES_FR = [
  "Jan", "Fev", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aout", "Sep", "Oct", "Nov", "Dec",
];

const MOCK_TIMELINE: ApiTimelineEntry[] = [
  { month: "01", year: 2026, count: 8 },
  { month: "02", year: 2026, count: 12 },
  { month: "03", year: 2026, count: 15 },
  { month: "04", year: 2026, count: 10 },
  { month: "05", year: 2026, count: 18 },
  { month: "06", year: 2026, count: 22 },
];

const MOCK_RECENT_ACTIVITY: ApiRecentActivityItem[] = [
  {
    id: "1",
    event_type: "tender_created",
    description: "Nouvel appel d'offres detecte",
    reference: "AO-2026-0142",
    case_id: "case-001",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    event_type: "workflow_completed",
    description: "Reponse generee avec succes",
    reference: "AO-2026-0138",
    case_id: "case-002",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    event_type: "hitl_required",
    description: "Decision Go/No-Go requise",
    reference: "AO-2026-0141",
    case_id: "case-003",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    event_type: "document_uploaded",
    description: "DCE telecharge depuis BOAMP",
    reference: "AO-2026-0143",
    case_id: "case-004",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    event_type: "alert",
    description: "Deadline dans 48h",
    reference: "AO-2026-0135",
    case_id: "case-005",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// Mappers (backend → frontend types)
// ============================================

function mapOverview(raw: BackendDashboardOverview): ApiDashboardOverview {
  const byPhase = raw.by_phase || {};
  // Derive decision counts from by_phase when available
  const completedTotal = byPhase["COMPLETED"] || 0;
  const errorTotal = byPhase["ERROR"] || 0;
  const total = raw.total_workflows || 1;

  return {
    total_workflows: raw.total_workflows,
    active_workflows: raw.active_workflows,
    completed_workflows: completedTotal,
    pending_hitl: raw.pending_hitl,
    success_rate: raw.success_rate_percent / 100,
    avg_processing_time_hours: raw.avg_processing_time_minutes / 60,
    decisions: {
      go: completedTotal,
      review: raw.pending_hitl,
      nogo: errorTotal,
    },
  };
}

function mapTimeline(raw: BackendTimelineEntry[]): ApiTimelineEntry[] {
  return raw.map((entry) => {
    const date = new Date(entry.month);
    return {
      month: String(date.getMonth() + 1).padStart(2, "0"),
      year: date.getFullYear(),
      count: entry.workflows_started,
    };
  });
}

function mapRecentActivity(raw: BackendRecentActivity[]): ApiRecentActivityItem[] {
  return raw.map((entry, index) => ({
    id: `${entry.case_id}-${index}`,
    event_type: entry.event_type,
    description: entry.event_description,
    reference: entry.tender_reference || "",
    case_id: entry.case_id,
    created_at: entry.timestamp,
  }));
}

// ============================================
// Hooks
// ============================================

export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: async (): Promise<ApiDashboardOverview> => {
      if (USE_MOCK) return MOCK_OVERVIEW;
      const response = await api.get<BackendDashboardOverview>("/dashboard/overview");
      return mapOverview(response.data);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useConsultationTimeline(months = 6) {
  return useQuery({
    queryKey: dashboardKeys.timeline(),
    queryFn: async (): Promise<ApiTimelineEntry[]> => {
      if (USE_MOCK) return MOCK_TIMELINE;
      const response = await api.get<BackendTimelineEntry[]>(
        "/analytics/user/timeline",
        { params: { months } }
      );
      return mapTimeline(response.data);
    },
    staleTime: 60_000,
  });
}

export function useRecentActivity(limit = 5) {
  return useQuery({
    queryKey: dashboardKeys.recentActivity(limit),
    queryFn: async (): Promise<ApiRecentActivityItem[]> => {
      if (USE_MOCK) return MOCK_RECENT_ACTIVITY.slice(0, limit);
      const response = await api.get<BackendRecentActivity[]>(
        "/dashboard/recent-activity",
        { params: { limit } }
      );
      return mapRecentActivity(response.data);
    },
    staleTime: 30_000,
  });
}

export function useRecentTenders(limit = 5) {
  return useQuery({
    queryKey: dashboardKeys.recentTenders(limit),
    queryFn: async (): Promise<Tender[]> => {
      const response = await api.get<Tender[]>("/tenders", {
        params: { limit, sort_by: "created_at", sort_order: "desc" },
      });
      return response.data;
    },
    staleTime: 30_000,
  });
}

export interface SourceDistribution {
  source: string;
  count: number;
  percentage: number;
}

export function useSourceDistribution() {
  return useQuery({
    queryKey: dashboardKeys.sourceDistribution(),
    queryFn: async (): Promise<SourceDistribution[]> => {
      const response = await api.get<Tender[]>("/tenders", {
        params: { limit: 200 },
      });
      const tenders = response.data;
      const sourceMap = new Map<string, number>();
      tenders.forEach((tender) => {
        const source = tender.source || "AUTRE";
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });
      const total = tenders.length || 1;
      const distribution: SourceDistribution[] = [];
      sourceMap.forEach((count, source) => {
        distribution.push({
          source,
          count,
          percentage: Math.round((count / total) * 100),
        });
      });
      distribution.sort((a, b) => b.count - a.count);
      return distribution;
    },
    staleTime: 60_000,
  });
}

export function usePipelineValue() {
  return useQuery({
    queryKey: dashboardKeys.pipelineValue(),
    queryFn: async (): Promise<number> => {
      const response = await api.get<Tender[]>("/tenders", {
        params: { limit: 200 },
      });
      return response.data.reduce((sum, t) => sum + (t.budget || 0), 0);
    },
    staleTime: 60_000,
  });
}

// ============================================
// Helpers
// ============================================

export function monthNumberToFrench(month: string | number): string {
  const idx = typeof month === "string" ? parseInt(month, 10) - 1 : month - 1;
  return MONTH_NAMES_FR[idx] ?? String(month);
}

export function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `Il y a ${months} mois`;
}
