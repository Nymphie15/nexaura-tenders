import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { personaApi } from "@/lib/api/endpoints";
import type { CreatePersonaRequest, UpdatePersonaRequest } from "@/types/persona";

export const personaKeys = {
  all: ["personas"] as const,
  lists: () => [...personaKeys.all, "list"] as const,
  detail: (id: string) => [...personaKeys.all, "detail", id] as const,
  templates: () => [...personaKeys.all, "templates"] as const,
};

export function usePersonas() {
  return useQuery({
    queryKey: personaKeys.lists(),
    queryFn: () => personaApi.list(),
  });
}

export function usePersona(id: string) {
  return useQuery({
    queryKey: personaKeys.detail(id),
    queryFn: () => personaApi.get(id),
    enabled: !!id,
  });
}

export function usePersonaTemplates() {
  return useQuery({
    queryKey: personaKeys.templates(),
    queryFn: () => personaApi.getTemplates(),
  });
}

export function useCreatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePersonaRequest) => personaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.lists() });
    },
  });
}

export function useUpdatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonaRequest }) =>
      personaApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: personaKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: personaKeys.lists() });
    },
  });
}

export function useDeletePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => personaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.lists() });
    },
  });
}

export function useCreatePersonaFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name?: string }) =>
      personaApi.createFromTemplate(templateId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.lists() });
    },
  });
}
