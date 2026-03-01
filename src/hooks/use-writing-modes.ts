import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { writingModesApi } from "@/lib/api/endpoints";
import type { ApplyModeRequest, WritingModeKey } from "@/types/writing-modes";

export const writingModeKeys = {
  all: ["writingModes"] as const,
  list: () => [...writingModeKeys.all, "list"] as const,
  preview: (content: string, mode: string) =>
    [...writingModeKeys.all, "preview", content.slice(0, 50), mode] as const,
};

export function useWritingModes() {
  return useQuery({
    queryKey: writingModeKeys.list(),
    queryFn: () => writingModesApi.list(),
  });
}

export function useApplyMode() {
  return useMutation({
    mutationFn: (data: ApplyModeRequest) => writingModesApi.apply(data),
  });
}

export function usePreviewMode() {
  return useMutation({
    mutationFn: (data: ApplyModeRequest) => writingModesApi.preview(data),
  });
}

export function useSuggestMode() {
  return useMutation({
    mutationFn: ({ content, documentType }: { content: string; documentType?: string }) =>
      writingModesApi.suggest(content, documentType),
  });
}

export function useApplyModeToDocument() {
  return useMutation({
    mutationFn: ({
      documentId,
      mode,
      personaId,
    }: {
      documentId: string;
      mode: WritingModeKey;
      personaId?: string;
    }) => writingModesApi.applyToDocument(documentId, mode, personaId),
  });
}
