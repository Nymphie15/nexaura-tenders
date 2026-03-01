import { useQuery } from '@tanstack/react-query';
import { workflowApi } from '@/lib/api/endpoints';
import type { WorkflowState } from '@/types';

// Query keys for cache management
export const workflowKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...workflowKeys.lists(), filters] as const,
  details: () => [...workflowKeys.all, 'detail'] as const,
  detail: (id: string) => [...workflowKeys.details(), id] as const,
  history: (id: string) => [...workflowKeys.detail(id), 'history'] as const,
  transitions: (id: string) => [...workflowKeys.detail(id), 'transitions'] as const,
  phaseDetails: (id: string, phase: string) => [...workflowKeys.detail(id), 'phase', phase] as const,
};

interface UseWorkflowOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

/**
 * Hook to fetch a single workflow by case ID
 * Uses workflowApi.getCase
 */
export function useWorkflow(caseId: string | undefined, options: UseWorkflowOptions = {}) {
  const { enabled = true, refetchInterval = false } = options;

  return useQuery({
    queryKey: workflowKeys.detail(caseId ?? ''),
    queryFn: async (): Promise<WorkflowState> => {
      if (!caseId) return Promise.reject(new Error('Case ID is required'));
      return await workflowApi.getCase(caseId);
    },
    enabled: enabled && !!caseId,
    refetchInterval,
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry if case ID is missing
      if (error instanceof Error && error.message === 'Case ID is required') return false;
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch workflow history (phase history)
 * Uses workflowApi.getCaseHistory
 */
export function useWorkflowHistory(caseId: string | undefined, options: UseWorkflowOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: workflowKeys.history(caseId ?? ''),
    queryFn: async () => {
      if (!caseId) throw new Error('Case ID is required');
      return await workflowApi.getCaseHistory(caseId);
    },
    enabled: enabled && !!caseId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch workflow transitions
 * Uses workflowApi.getTransitions
 */
export function useWorkflowTransitions(caseId: string | undefined, options: UseWorkflowOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: workflowKeys.transitions(caseId ?? ''),
    queryFn: async () => {
      if (!caseId) throw new Error('Case ID is required');
      return await workflowApi.getTransitions(caseId);
    },
    enabled: enabled && !!caseId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch phase details
 * Uses workflowApi.getPhaseDetails
 */
export function useWorkflowPhaseDetails(
  caseId: string | undefined, 
  phase: string | undefined,
  options: UseWorkflowOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: workflowKeys.phaseDetails(caseId ?? '', phase ?? ''),
    queryFn: async () => {
      if (!caseId || !phase) throw new Error('Case ID and phase are required');
      return await workflowApi.getPhaseDetails(caseId, phase);
    },
    enabled: enabled && !!caseId && !!phase,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch all workflows with optional filters
 * Uses workflowApi.listCases
 */
export function useWorkflows(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: workflowKeys.list(filters),
    queryFn: async (): Promise<WorkflowState[]> => {
      return await workflowApi.listCases(filters as any);
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch workflow stats
 * Uses workflowApi.getStats
 */
export function useWorkflowStats() {
  return useQuery({
    queryKey: ['workflow-stats'],
    queryFn: async () => {
      return await workflowApi.getStats();
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for real-time workflow updates (polling)
 * Use this when you need live updates on workflow progress
 */
export function useWorkflowLive(caseId: string | undefined, intervalMs = 5000) {
  return useWorkflow(caseId, {
    enabled: !!caseId,
    refetchInterval: intervalMs,
  });
}
