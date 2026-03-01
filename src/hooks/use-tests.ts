"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  testsApi,
  realLLMTestsApi,
  TestStatusResponse,
  TestResultsResponse,
  TestHistoryItem,
  ExistingResults,
  GeneratedTestResponse,
  GeneratedTestStats,
  RealLLMTestStatus,
  RealLLMTestResult,
  RealLLMProgressEvent,
} from "@/lib/api/endpoints";
import { toast } from "sonner";

// Query keys factory
export const testKeys = {
  all: ["tests"] as const,
  sectors: () => [...testKeys.all, "sectors"] as const,
  history: (limit?: number) => [...testKeys.all, "history", limit] as const,
  status: (testId: string) => [...testKeys.all, "status", testId] as const,
  results: (testId: string) => [...testKeys.all, "results", testId] as const,
  existing: () => [...testKeys.all, "existing"] as const,
  memoire: (sector: string) => [...testKeys.all, "memoire", sector] as const,
};

// Hook to get available sectors
export function useTestSectors() {
  return useQuery({
    queryKey: testKeys.sectors(),
    queryFn: () => testsApi.listSectors(),
    staleTime: 1000 * 60 * 60, // 1 hour - sectors don't change
  });
}

// Hook to get test history
export function useTestHistory(limit = 20) {
  return useQuery({
    queryKey: testKeys.history(limit),
    queryFn: () => testsApi.getHistory(limit),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Auto-refresh every 30s
  });
}

// Hook to get test status (with polling for running tests)
export function useTestStatus(testId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: testKeys.status(testId || ""),
    queryFn: () => testsApi.getStatus(testId!),
    enabled: !!testId && options?.enabled !== false,
    staleTime: 1000 * 2, // 2 seconds
    refetchInterval: (query) => {
      // Poll every 2s while test is running
      const status = query.state.data?.status;
      return status === "running" ? 2000 : false;
    },
  });
}

// Hook to get test results
export function useTestResults(testId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: testKeys.results(testId || ""),
    queryFn: () => testsApi.getResults(testId!),
    enabled: !!testId && options?.enabled !== false,
    staleTime: 1000 * 10, // 10 seconds
  });
}

// Hook to get existing results from disk
export function useExistingResults() {
  return useQuery({
    queryKey: testKeys.existing(),
    queryFn: () => testsApi.getExistingResults(),
    staleTime: 1000 * 60, // 1 minute
  });
}

// Hook to get memoire technique for a sector
export function useSectorMemoire(sector: string | null) {
  return useQuery({
    queryKey: testKeys.memoire(sector || ""),
    queryFn: () => testsApi.getSectorMemoire(sector!),
    enabled: !!sector,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Mutation to start a test
export function useStartTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      sectors: string[];
      use_real_boamp?: boolean;
      company_siret?: string;
    }) => testsApi.startTest(data),
    onSuccess: (data) => {
      toast.success(`Test demarré: ${data.test_id}`);
      queryClient.invalidateQueries({ queryKey: testKeys.history() });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Mutation to cancel a test
export function useCancelTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (testId: string) => testsApi.cancelTest(testId),
    onSuccess: (_, testId) => {
      toast.info("Test annulé");
      queryClient.invalidateQueries({ queryKey: testKeys.status(testId) });
      queryClient.invalidateQueries({ queryKey: testKeys.history() });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Function to download documents (not a hook, just a utility)
export async function downloadSectorDocuments(testId: string, sector: string) {
  try {
    const blob = await testsApi.downloadSectorDocuments(testId, sector);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documents_${sector}_${testId}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success(`Documents ${sector} téléchargés`);
  } catch (error) {
    toast.error("Erreur lors du téléchargement");
  }
}

// Function to download existing sector documents (from disk, no test_id needed)
export async function downloadExistingSectorDocuments(sector: string) {
  try {
    const blob = await testsApi.downloadExistingSectorDocuments(sector);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documents_${sector}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success(`Documents ${sector} téléchargés`);
  } catch (error) {
    toast.error("Erreur lors du téléchargement");
  }
}

// ============================================
// Database-backed hooks (PostgreSQL)
// ============================================

// Hook to get generated tests from database
export function useDbGeneratedTests(params?: { limit?: number; sector?: string }) {
  return useQuery({
    queryKey: [...testKeys.all, "db", "list", params?.sector, params?.limit],
    queryFn: () => testsApi.getDbTests(params),
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hook to get document content from database
export function useDbTestDocument(testId: string | null, docName: string | null) {
  return useQuery({
    queryKey: [...testKeys.all, "db", "document", testId, docName],
    queryFn: () => testsApi.getDbTestDocument(testId!, docName!),
    enabled: !!testId && !!docName,
    staleTime: 1000 * 60 * 5, // 5 minutes - documents don't change
  });
}

// Hook to get database test statistics
export function useDbTestStats() {
  return useQuery({
    queryKey: [...testKeys.all, "db", "stats"],
    queryFn: () => testsApi.getDbStats(),
    staleTime: 1000 * 60, // 1 minute
  });
}

// ============================================
// Real LLM Test Hooks (30-60s execution time)
// ============================================

// Mutation to start a REAL LLM test
export function useStartRealLLMTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { sectors: string[]; company_siret?: string }) =>
      realLLMTestsApi.startTest(data),
    onSuccess: (data) => {
      toast.success(`Test LLM réel démarré: ${data.test_id}`);
      queryClient.invalidateQueries({ queryKey: testKeys.history() });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Hook to get real LLM test status (with polling)
export function useRealLLMTestStatus(testId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...testKeys.all, "real-llm", "status", testId],
    queryFn: () => realLLMTestsApi.getStatus(testId!),
    enabled: !!testId && options?.enabled !== false,
    staleTime: 1000 * 2, // 2 seconds
    refetchInterval: (query) => {
      // Poll every 2s while test is running
      const status = query.state.data?.status;
      return status === "running" ? 2000 : false;
    },
  });
}

// Hook to get real LLM test results
export function useRealLLMTestResults(testId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...testKeys.all, "real-llm", "results", testId],
    queryFn: () => realLLMTestsApi.getResults(testId!),
    enabled: !!testId && options?.enabled !== false,
    staleTime: 1000 * 10, // 10 seconds
  });
}

// Mutation to cancel a real LLM test
export function useCancelRealLLMTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (testId: string) => realLLMTestsApi.cancelTest(testId),
    onSuccess: (_, testId) => {
      toast.info("Test LLM réel annulé");
      queryClient.invalidateQueries({ queryKey: [...testKeys.all, "real-llm", "status", testId] });
      queryClient.invalidateQueries({ queryKey: testKeys.history() });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Hook for WebSocket progress streaming
export function useRealLLMTestProgress(testId: string | null) {
  const [progress, setProgress] = useState<RealLLMProgressEvent | null>(null);
  const [phases, setPhases] = useState<RealLLMProgressEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!testId) return;

    // Get WebSocket URL from API base URL (strip /api/v2 suffix — WS is at root)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v2\/?$/, "").replace(/^https?:\/\//, "") || "localhost:8000";
    const wsUrl = `${protocol}//${host}/ws/tests/${testId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealLLMProgressEvent;

        setProgress(data);

        // Track phase completions
        if (data.type === "phase_complete") {
          setPhases((prev) => [...prev, data]);
        }

        // Show toast for important events
        if (data.type === "test_complete") {
          toast.success(`Test terminé en ${data.execution_time?.toFixed(1)}s`);
        } else if (data.type === "test_error") {
          toast.error(`Erreur: ${data.error}`);
        }
      } catch (e) {
        console.error("[WebSocket] Parse error:", e);
      }
    };

    ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return ws;
  }, [testId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "ping" }));
    }
  }, []);

  useEffect(() => {
    if (testId) {
      connect();
      return () => disconnect();
    }
  }, [testId, connect, disconnect]);

  return {
    progress,
    phases,
    isConnected,
    connect,
    disconnect,
    sendPing,
  };
}
