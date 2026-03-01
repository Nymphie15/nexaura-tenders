import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hitlApi } from "@/lib/api/endpoints";
import type { HITLDecision } from "@/types";
import { workflowKeys } from "./use-workflows";
import { toast } from "sonner";

export const hitlKeys = {
  all: ["hitl"] as const,
  pending: (checkpointType?: string) =>
    [...hitlKeys.all, "pending", checkpointType] as const,
  checkpoint: (caseId: string, checkpoint: string) =>
    [...hitlKeys.all, "checkpoint", caseId, checkpoint] as const,
  enrichedContext: (caseId: string, checkpoint: string) =>
    [...hitlKeys.all, "enrichedContext", caseId, checkpoint] as const,
};

export function useHITLPending(checkpointType?: string) {
  return useQuery({
    queryKey: hitlKeys.pending(checkpointType),
    queryFn: () => hitlApi.getPending(checkpointType),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useHITLCheckpoint(caseId: string, checkpoint: string) {
  return useQuery({
    queryKey: hitlKeys.checkpoint(caseId, checkpoint),
    queryFn: () => hitlApi.getCheckpoint(caseId, checkpoint),
    enabled: !!caseId && !!checkpoint,
  });
}

export function useHITLEnrichedContext(caseId: string, checkpoint: string) {
  return useQuery({
    queryKey: hitlKeys.enrichedContext(caseId, checkpoint),
    queryFn: () => hitlApi.getEnrichedContext(caseId, checkpoint),
    enabled: !!caseId && !!checkpoint,
  });
}

export function useSubmitDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      checkpoint,
      decision,
    }: {
      caseId: string;
      checkpoint: string;
      decision: HITLDecision;
    }) => hitlApi.submitDecision(caseId, checkpoint, decision),

    // 🎯 OPTIMISTIC UPDATE
    onMutate: async ({ caseId, checkpoint }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: hitlKeys.pending() });
      await queryClient.cancelQueries({ queryKey: workflowKeys.detail(caseId) });

      // Snapshot previous data for rollback
      const previousPending = queryClient.getQueryData(hitlKeys.pending());
      const previousWorkflow = queryClient.getQueryData(workflowKeys.detail(caseId));

      // Optimistically remove from pending list
      queryClient.setQueryData<any[]>(hitlKeys.pending(), (old = []) =>
        old.filter((cp) => !(cp.case_id === caseId && cp.checkpoint === checkpoint))
      );

      // Optimistically update workflow checkpoint status
      queryClient.setQueryData<any>(workflowKeys.detail(caseId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          hitl_checkpoints: old.hitl_checkpoints?.map((cp: any) =>
            cp.checkpoint === checkpoint
              ? { ...cp, status: "resolved", resolved_at: new Date().toISOString() }
              : cp
          ),
        };
      });

      return { previousPending, previousWorkflow };
    },

    onSuccess: (_, { caseId, checkpoint }) => {
      // Remove resolved checkpoint from cache (don't refetch — it will 400)
      queryClient.removeQueries({ queryKey: hitlKeys.checkpoint(caseId, checkpoint) });
      queryClient.removeQueries({ queryKey: hitlKeys.enrichedContext(caseId, checkpoint) });
      // Invalidate lists to refetch updated data
      queryClient.invalidateQueries({ queryKey: hitlKeys.pending() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(caseId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },

    // ❌ ROLLBACK on error
    onError: (err, { caseId }, context) => {
      // Restore previous data
      if (context?.previousPending) {
        queryClient.setQueryData(hitlKeys.pending(), context.previousPending);
      }
      if (context?.previousWorkflow) {
        queryClient.setQueryData(workflowKeys.detail(caseId), context.previousWorkflow);
      }
      toast.error("Erreur de decision", {
        description: err instanceof Error ? err.message : "Impossible de soumettre la decision. Veuillez reessayer.",
      });
    },

    // 🔄 Always refetch after a delay for safety
    onSettled: (_, __, { caseId, checkpoint }) => {
      setTimeout(() => {
        queryClient.removeQueries({ queryKey: hitlKeys.checkpoint(caseId, checkpoint) });
        queryClient.removeQueries({ queryKey: hitlKeys.enrichedContext(caseId, checkpoint) });
        queryClient.invalidateQueries({ queryKey: hitlKeys.pending() });
      }, 1000);
    },
  });
}
