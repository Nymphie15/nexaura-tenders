import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { templatesApi } from "@/lib/api/endpoints";
import type { TemplateCreateRequest, TemplateSearchParams } from "@/lib/api/endpoints";

export function useTemplates(params?: {
  sector?: string;
  section_name?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["templates", "list", params],
    queryFn: () => templatesApi.list(params),
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ["templates", "detail", id],
    queryFn: () => templatesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TemplateCreateRequest) => templatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateCreateRequest> }) =>
      templatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useTemplateSearch(params: TemplateSearchParams) {
  return useQuery({
    queryKey: ["templates", "search", params],
    queryFn: () => templatesApi.search(params),
    enabled: !!params.query && params.query.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useTemplateStats() {
  return useQuery({
    queryKey: ["templates", "stats"],
    queryFn: () => templatesApi.stats(),
    staleTime: 60 * 1000,
  });
}
