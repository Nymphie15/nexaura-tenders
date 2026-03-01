import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quickCheckApi } from "@/lib/api/endpoints";
import type { StartQuickCheckRequest } from "@/types/quick-check";

export const quickCheckKeys = {
  all: ["quickCheck"] as const,
  job: (id: string) => [...quickCheckKeys.all, "job", id] as const,
  result: (id: string) => [...quickCheckKeys.all, "result", id] as const,
};

export function useStartQuickCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartQuickCheckRequest) => quickCheckApi.start(data),
    onSuccess: (data) => {
      // Optionally prefetch the status
      queryClient.prefetchQuery({
        queryKey: quickCheckKeys.job(data.job_id),
        queryFn: () => quickCheckApi.getJobStatus(data.job_id),
      });
    },
  });
}

export function useQuickCheckJob(jobId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: quickCheckKeys.job(jobId),
    queryFn: () => quickCheckApi.getJobStatus(jobId),
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      // Progressive polling: 1s → 2s → 5s (#14)
      const count = query.state.dataUpdateCount;
      if (count < 5) return 1000;
      if (count < 15) return 2000;
      return 5000;
    },
  });
}

export function useQuickCheckResult(jobId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: quickCheckKeys.result(jobId),
    queryFn: () => quickCheckApi.getResult(jobId),
    enabled: !!jobId && enabled,
  });
}

export function useQuickCheckTenderSync() {
  return useMutation({
    mutationFn: (tenderId: string) => quickCheckApi.checkTenderSync(tenderId),
  });
}
