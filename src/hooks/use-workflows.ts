import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowApi, WorkflowsListParams } from "@/lib/api/endpoints";

export const workflowKeys = {
  all: ["workflows"] as const,
  lists: () => [...workflowKeys.all, "list"] as const,
  list: (params?: WorkflowsListParams) => [...workflowKeys.lists(), params] as const,
  details: () => [...workflowKeys.all, "detail"] as const,
  detail: (caseId: string) => [...workflowKeys.details(), caseId] as const,
  history: (caseId: string) => [...workflowKeys.detail(caseId), "history"] as const,
  stats: () => [...workflowKeys.all, "stats"] as const,
};

export function useWorkflows(params?: WorkflowsListParams) {
  return useQuery({
    queryKey: workflowKeys.list(params),
    queryFn: () => workflowApi.listCases(params),
    staleTime: 30_000,
  });
}

export function useWorkflow(caseId: string) {
  return useQuery({
    queryKey: workflowKeys.detail(caseId),
    queryFn: () => workflowApi.getCase(caseId),
    enabled: !!caseId,
  });
}

export function useWorkflowHistory(caseId: string) {
  return useQuery({
    queryKey: workflowKeys.history(caseId),
    queryFn: () => workflowApi.getCaseHistory(caseId),
    enabled: !!caseId,
  });
}

export function useWorkflowStats() {
  return useQuery({
    queryKey: workflowKeys.stats(),
    queryFn: () => workflowApi.getStats(),
  });
}

export function useResumeWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (caseId: string) => workflowApi.resumeCase(caseId),

    // 🎯 OPTIMISTIC UPDATE
    onMutate: async (caseId) => {
      await queryClient.cancelQueries({ queryKey: workflowKeys.detail(caseId) });
      const previousWorkflow = queryClient.getQueryData(workflowKeys.detail(caseId));

      // Optimistically update status to running
      queryClient.setQueryData<any>(workflowKeys.detail(caseId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: "running",
          updated_at: new Date().toISOString(),
        };
      });

      return { previousWorkflow };
    },

    onSuccess: (_, caseId) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },

    onError: (_, caseId, context) => {
      if (context?.previousWorkflow) {
        queryClient.setQueryData(workflowKeys.detail(caseId), context.previousWorkflow);
      }
    },
  });
}

export function useCancelWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, reason }: { caseId: string; reason?: string }) =>
      workflowApi.cancelCase(caseId, reason),

    // 🎯 OPTIMISTIC UPDATE
    onMutate: async ({ caseId }) => {
      await queryClient.cancelQueries({ queryKey: workflowKeys.detail(caseId) });
      const previousWorkflow = queryClient.getQueryData(workflowKeys.detail(caseId));

      // Optimistically update status to cancelled
      queryClient.setQueryData<any>(workflowKeys.detail(caseId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: "cancelled",
          updated_at: new Date().toISOString(),
        };
      });

      return { previousWorkflow };
    },

    onSuccess: (_, { caseId }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },

    onError: (_, { caseId }, context) => {
      if (context?.previousWorkflow) {
        queryClient.setQueryData(workflowKeys.detail(caseId), context.previousWorkflow);
      }
    },
  });
}

export function useRetryPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, phase }: { caseId: string; phase: string }) =>
      workflowApi.retryPhase(caseId, phase),
    onSuccess: (_, { caseId }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(caseId) });
    },
  });
}

export function useAssignWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, assignedTo }: { caseId: string; assignedTo: string }) =>
      workflowApi.assignCase(caseId, assignedTo),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

export function useRequirements(caseId: string) {
  return useQuery({
    queryKey: ["requirements", caseId],
    queryFn: () => workflowApi.getRequirements(caseId),
    enabled: !!caseId,
  });
}

export function useUpdateRequirements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, requirements }: { caseId: string; requirements: any[] }) =>
      workflowApi.updateRequirements(caseId, requirements),
    onSuccess: (_, { caseId }) => qc.invalidateQueries({ queryKey: ["requirements", caseId] }),
  });
}
