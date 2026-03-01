import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tendersApi, TendersListParams, SearchParams, RelevantTendersParams } from "@/lib/api/endpoints";

export const tenderKeys = {
  all: ["tenders"] as const,
  lists: () => [...tenderKeys.all, "list"] as const,
  list: (params?: TendersListParams) => [...tenderKeys.lists(), params] as const,
  relevant: (params?: RelevantTendersParams) => [...tenderKeys.all, "relevant", params] as const,
  details: () => [...tenderKeys.all, "detail"] as const,
  detail: (id: string) => [...tenderKeys.details(), id] as const,
  documents: (id: string) => [...tenderKeys.detail(id), "documents"] as const,
  count: (params?: { status?: string; source?: string }) =>
    [...tenderKeys.all, "count", params] as const,
};

export function useTenders(params?: TendersListParams) {
  return useQuery({
    queryKey: tenderKeys.list(params),
    queryFn: () => tendersApi.list(params),
  });
}

export function useTendersCount(params?: { status?: string; source?: string }) {
  return useQuery({
    queryKey: tenderKeys.count(params),
    queryFn: () => tendersApi.count(params),
  });
}

export function useRelevantTenders(params?: RelevantTendersParams) {
  return useQuery({
    queryKey: tenderKeys.relevant(params),
    queryFn: () => tendersApi.listRelevant(params),
  });
}

export function useTender(id: string) {
  return useQuery({
    queryKey: tenderKeys.detail(id),
    queryFn: () => tendersApi.get(id),
    enabled: !!id,
  });
}

export function useTenderDocuments(id: string) {
  return useQuery({
    queryKey: tenderKeys.documents(id),
    queryFn: () => tendersApi.listDocuments(id),
    enabled: !!id,
  });
}

export function useSearchTenders() {
  return useMutation({
    mutationFn: (data: SearchParams) => tendersApi.search(data),
  });
}

export function useUploadDCE() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      files,
      metadata,
    }: {
      files: File[];
      metadata?: { title?: string; client?: string; deadline?: string };
    }) => tendersApi.upload(files, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.lists() });
    },
  });
}

export function useProcessTender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      options,
    }: {
      id: string;
      options?: { download_dce?: boolean; priority?: "low" | "normal" | "high" };
    }) => tendersApi.process(id, options),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tenderKeys.detail(id) });
    },
  });
}

export function useTenderStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: [...tenderKeys.detail(id), "status"],
    queryFn: () => tendersApi.getStatus(id),
    enabled: enabled && !!id,
    refetchInterval: enabled ? 5000 : false,
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({
      tenderId,
      filename,
    }: {
      tenderId: string;
      filename: string;
    }) => {
      const blob = await tendersApi.downloadDocument(tenderId, filename);
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}

export function useTenderMatchingResults(id: string) {
  return useQuery({
    queryKey: [...tenderKeys.detail(id), "matching"],
    queryFn: () => tendersApi.getMatchingResults(id),
    enabled: !!id,
  });
}

export function useTenderComplianceResults(id: string) {
  return useQuery({
    queryKey: [...tenderKeys.detail(id), "compliance"],
    queryFn: () => tendersApi.getComplianceResults(id),
    enabled: !!id,
  });
}


export function useDocumentContent(tenderId: string, filename: string) {
  return useQuery({
    queryKey: [...tenderKeys.detail(tenderId), "document-content", filename],
    queryFn: () => tendersApi.getDocumentContent(tenderId, filename),
    enabled: !!tenderId && !!filename,
  });
}

export function useSaveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenderId,
      filename,
      content,
    }: {
      tenderId: string;
      filename: string;
      content: string;
    }) => {
      return tendersApi.saveDocumentContent(tenderId, filename, content);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...tenderKeys.detail(variables.tenderId), "document-content", variables.filename],
      });
    },
  });
}
