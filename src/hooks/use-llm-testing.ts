"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  llmTestsApi,
  LLMPromptTestRequest,
  LLMPromptTestResponse,
  LLMCompareRequest,
  LLMCompareResponse,
  LLMModelsListResponse,
  LLMMetrics,
} from "@/lib/api/endpoints";
import { toast } from "sonner";

// Query keys factory
export const llmTestKeys = {
  all: ["llm-tests"] as const,
  models: () => [...llmTestKeys.all, "models"] as const,
  metrics: () => [...llmTestKeys.all, "metrics"] as const,
  history: () => [...llmTestKeys.all, "history"] as const,
};

// Hook to get available LLM models
export function useLLMModels() {
  return useQuery({
    queryKey: llmTestKeys.models(),
    queryFn: () => llmTestsApi.listModels(),
    staleTime: 1000 * 60 * 60, // 1 hour - models don't change often
  });
}

// Hook to get LLM metrics
export function useLLMMetrics() {
  return useQuery({
    queryKey: llmTestKeys.metrics(),
    queryFn: () => llmTestsApi.getMetrics(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Auto-refresh every minute
  });
}

// Mutation to test a prompt
export function useTestLLMPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LLMPromptTestRequest) => llmTestsApi.testPrompt(data),
    onSuccess: (data) => {
      toast.success(
        `Reponse recue en ${(data.execution_time_ms / 1000).toFixed(1)}s` +
          (data.cache_hit ? " (cache)" : "")
      );
      // Invalidate metrics after a test
      queryClient.invalidateQueries({ queryKey: llmTestKeys.metrics() });
    },
    onError: (error: Error) => {
      toast.error(`Erreur LLM: ${error.message}`);
    },
  });
}

// Mutation to compare multiple models
export function useCompareLLMModels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LLMCompareRequest) => llmTestsApi.compareModels(data),
    onSuccess: (data) => {
      const successCount = data.results.filter((r) => !r.error).length;
      toast.success(
        `Comparaison terminée: ${successCount}/${data.results.length} modèles` +
          ` en ${(data.total_time_ms / 1000).toFixed(1)}s`
      );
      queryClient.invalidateQueries({ queryKey: llmTestKeys.metrics() });
    },
    onError: (error: Error) => {
      toast.error(`Erreur comparaison: ${error.message}`);
    },
  });
}

// Hook to manage prompt testing state
export function useLLMPromptTester() {
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<"ollama" | "anthropic" | "gemini">("ollama");
  const [selectedModel, setSelectedModel] = useState("gpt-oss:20b");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [taskType, setTaskType] = useState("custom");
  const [lastResult, setLastResult] = useState<LLMPromptTestResponse | null>(null);
  const [history, setHistory] = useState<LLMPromptTestResponse[]>([]);

  const testPrompt = useTestLLMPrompt();

  const runTest = async () => {
    if (!prompt.trim()) {
      toast.error("Veuillez entrer un prompt");
      return;
    }

    const result = await testPrompt.mutateAsync({
      provider: selectedProvider,
      model: selectedModel,
      prompt: prompt.trim(),
      system_prompt: systemPrompt.trim() || undefined,
      task_type: taskType,
      temperature,
      max_tokens: maxTokens,
    });

    setLastResult(result);
    setHistory((prev) => [result, ...prev].slice(0, 10)); // Keep last 10
  };

  const clearHistory = () => {
    setHistory([]);
    setLastResult(null);
  };

  return {
    // State
    prompt,
    setPrompt,
    systemPrompt,
    setSystemPrompt,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    taskType,
    setTaskType,
    lastResult,
    history,

    // Actions
    runTest,
    clearHistory,
    isLoading: testPrompt.isPending,
    error: testPrompt.error,
  };
}

// Hook to manage model comparison state
export function useLLMModelComparison() {
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<Array<{ provider: string; model: string }>>([
    { provider: "ollama", model: "gpt-oss:20b" },
    { provider: "ollama", model: "gpt-oss:120b" },
  ]);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [lastComparison, setLastComparison] = useState<LLMCompareResponse | null>(null);

  const compareModels = useCompareLLMModels();

  const runComparison = async () => {
    if (!prompt.trim()) {
      toast.error("Veuillez entrer un prompt");
      return;
    }

    if (selectedModels.length < 2) {
      toast.error("Selectionnez au moins 2 modeles a comparer");
      return;
    }

    const result = await compareModels.mutateAsync({
      prompt: prompt.trim(),
      system_prompt: systemPrompt.trim() || undefined,
      models: selectedModels,
      temperature,
      max_tokens: maxTokens,
    });

    setLastComparison(result);
  };

  const addModel = (provider: string, model: string) => {
    if (selectedModels.length >= 4) {
      toast.error("Maximum 4 modeles");
      return;
    }
    if (selectedModels.some((m) => m.provider === provider && m.model === model)) {
      toast.error("Modèle déjà sélectionné");
      return;
    }
    setSelectedModels((prev) => [...prev, { provider, model }]);
  };

  const removeModel = (index: number) => {
    if (selectedModels.length <= 2) {
      toast.error("Minimum 2 modeles requis");
      return;
    }
    setSelectedModels((prev) => prev.filter((_, i) => i !== index));
  };

  const clearComparison = () => {
    setLastComparison(null);
  };

  return {
    // State
    prompt,
    setPrompt,
    systemPrompt,
    setSystemPrompt,
    selectedModels,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    lastComparison,

    // Actions
    runComparison,
    addModel,
    removeModel,
    clearComparison,
    isLoading: compareModels.isPending,
    error: compareModels.error,
  };
}
