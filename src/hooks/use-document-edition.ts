import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentEditionApi } from "@/lib/api/endpoints";
import type {
  GenerateSuggestionsRequest,
  InlineEditRequest,
  ChatMessageRequest,
} from "@/types/document-edition";

export const documentEditionKeys = {
  all: ["documentEdition"] as const,
  suggestions: (docId: string) => [...documentEditionKeys.all, "suggestions", docId] as const,
  versions: (docId: string) => [...documentEditionKeys.all, "versions", docId] as const,
  comparison: (docId: string, from: string, to: string) =>
    [...documentEditionKeys.all, "comparison", docId, from, to] as const,
};

export function useGenerateSuggestions(documentId: string) {
  return useMutation({
    mutationFn: (data: GenerateSuggestionsRequest) =>
      documentEditionApi.generateSuggestions(documentId, data),
  });
}

export function useInlineEdit(documentId: string) {
  return useMutation({
    mutationFn: (data: InlineEditRequest) => documentEditionApi.inlineEdit(documentId, data),
  });
}

export function useChatWithDocument(documentId: string) {
  return useMutation({
    mutationFn: (data: ChatMessageRequest) => documentEditionApi.chat(documentId, data),
  });
}

export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: documentEditionKeys.versions(documentId),
    queryFn: () => documentEditionApi.listVersions(documentId),
    enabled: !!documentId,
  });
}

export function useCompareVersions(documentId: string) {
  return useMutation({
    mutationFn: ({ versionFromId, versionToId }: { versionFromId: string; versionToId: string }) =>
      documentEditionApi.compareVersions(documentId, versionFromId, versionToId),
  });
}

export function useRollbackVersion(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (versionId: string) => documentEditionApi.rollback(documentId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentEditionKeys.versions(documentId) });
    },
  });
}
