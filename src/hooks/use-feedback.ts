import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackApi, FeedbackType, InlineFeedbackRequest, InlineFeedbackResponse, RealtimeFeedbackMetrics, LearningTrigger, FeedbackDashboard } from "@/lib/api/endpoints";
import { toast } from "sonner";

/**
 * Query keys for feedback-related queries.
 */
export const feedbackKeys = {
  all: ["feedback"] as const,
  history: (params?: { limit?: number; offset?: number; section_type?: string }) =>
    [...feedbackKeys.all, "history", params] as const,
  stats: () => [...feedbackKeys.all, "stats"] as const,
  preferences: (params?: { section_type?: string; company_id?: string }) =>
    [...feedbackKeys.all, "preferences", params] as const,
  // New real-time feedback keys
  realtimeMetrics: (params?: { hours?: number; phase?: string }) =>
    [...feedbackKeys.all, "realtime", "metrics", params] as const,
  workflowFeedback: (workflowId: string, params?: { phase?: string }) =>
    [...feedbackKeys.all, "workflow", workflowId, params] as const,
  elementFeedback: (workflowId: string, elementId: string) =>
    [...feedbackKeys.all, "element", workflowId, elementId] as const,
  learningTriggers: (status?: string) =>
    [...feedbackKeys.all, "learning", "triggers", status] as const,
  dashboard: () => [...feedbackKeys.all, "dashboard"] as const,
};

/**
 * Hook for submitting quick feedback (thumbs up/down).
 *
 * Usage:
 * ```tsx
 * const { mutate: submitQuickFeedback, isPending } = useQuickFeedback();
 *
 * submitQuickFeedback({
 *   elementId: "requirement-123",
 *   type: "thumbs_up",
 *   phase: "extraction"
 * });
 * ```
 */
export function useQuickFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      elementId,
      type,
      phase,
      context,
    }: {
      elementId: string;
      type: "thumbs_up" | "thumbs_down";
      phase?: string;
      context?: Record<string, unknown>;
    }) =>
      feedbackApi.submitQuickFeedback({
        element_id: elementId,
        type,
        phase,
        context,
      }),

    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.stats() });

      const message = type === "thumbs_up"
        ? "Merci pour votre feedback positif !"
        : "Feedback enregistré. Nous améliorerons cette suggestion.";

      toast.success("Feedback enregistré", {
        description: message,
      });
    },

    onError: () => {
      toast.error("Erreur", {
        description: "Impossible d'enregistrer votre feedback. Veuillez réessayer.",
      });
    },
  });
}

/**
 * Hook for submitting corrections/edits.
 *
 * Usage:
 * ```tsx
 * const { mutate: submitCorrection, isPending } = useCorrection();
 *
 * submitCorrection({
 *   caseId: "case-uuid",
 *   sectionId: "methodologie",
 *   original: "Original text...",
 *   corrected: "Corrected text..."
 * });
 * ```
 */
export function useCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      sectionId,
      original,
      corrected,
      context,
    }: {
      caseId: string;
      sectionId: string;
      original: string;
      corrected: string;
      context?: Record<string, unknown>;
    }) =>
      feedbackApi.submitCorrection({
        case_id: caseId,
        section_id: sectionId,
        original,
        modified: corrected,
        context,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.history() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.stats() });

      toast.success("Correction enregistrée", {
        description: "Votre modification a été sauvegardée et sera utilisée pour améliorer les futures suggestions.",
      });
    },

    onError: () => {
      toast.error("Erreur", {
        description: "Impossible d'enregistrer votre correction. Veuillez réessayer.",
      });
    },
  });
}

/**
 * Hook for submitting batch corrections.
 */
export function useBatchCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      modifications,
      context,
    }: {
      caseId: string;
      modifications: Array<{ sectionId: string; original: string; corrected: string }>;
      context?: Record<string, unknown>;
    }) =>
      feedbackApi.submitCorrectionBatch({
        case_id: caseId,
        modifications: modifications.map((m) => ({
          section_id: m.sectionId,
          original: m.original,
          modified: m.corrected,
        })),
        context,
      }),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.history() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.stats() });

      toast.success("Corrections enregistrees", {
        description: `${data.length} modifications ont ete sauvegardees.`,
      });
    },

    onError: () => {
      toast.error("Erreur", {
        description: "Impossible d'enregistrer vos corrections. Veuillez reessayer.",
      });
    },
  });
}

/**
 * Combined hook for all feedback types (convenience).
 *
 * Usage:
 * ```tsx
 * const { mutate: submitFeedback, isPending } = useFeedback();
 *
 * // Quick feedback
 * submitFeedback({ type: "thumbs_up", elementId: "123" });
 *
 * // Edit/correction
 * submitFeedback({
 *   type: "edit",
 *   elementId: "123",
 *   caseId: "case-uuid",
 *   original: "...",
 *   corrected: "..."
 * });
 * ```
 */
export function useFeedback() {
  const quickFeedback = useQuickFeedback();
  const correction = useCorrection();

  return useMutation({
    mutationFn: async ({
      type,
      elementId,
      caseId,
      original,
      corrected,
      phase,
      context,
    }: {
      type: FeedbackType;
      elementId: string;
      caseId?: string;
      original?: string;
      corrected?: string;
      phase?: string;
      context?: Record<string, unknown>;
    }) => {
      if (type === "edit") {
        if (!caseId || !original || !corrected) {
          throw new Error("caseId, original and corrected are required for edit feedback");
        }
        return correction.mutateAsync({
          caseId,
          sectionId: elementId,
          original,
          corrected,
          context,
        });
      } else {
        return quickFeedback.mutateAsync({
          elementId,
          type: type as "thumbs_up" | "thumbs_down",
          phase,
          context,
        });
      }
    },
    onError: () => {
      toast.error("Erreur", {
        description: "Impossible d'enregistrer votre feedback. Veuillez reessayer.",
      });
    },
  });
}

/**
 * Hook for fetching correction history.
 *
 * Usage:
 * ```tsx
 * const { data: history, isLoading } = useCorrectionHistory({ limit: 20 });
 * ```
 */
export function useCorrectionHistory(params?: {
  limit?: number;
  offset?: number;
  section_type?: string;
}) {
  return useQuery({
    queryKey: feedbackKeys.history(params),
    queryFn: () => feedbackApi.getCorrectionHistory(params),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for fetching feedback stats.
 */
export function useFeedbackStats() {
  return useQuery({
    queryKey: feedbackKeys.stats(),
    queryFn: () => feedbackApi.getStats(),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook for fetching user preferences.
 */
export function useUserPreferences(params?: {
  section_type?: string;
  company_id?: string;
}) {
  return useQuery({
    queryKey: feedbackKeys.preferences(params),
    queryFn: () => feedbackApi.getPreferences(params),
    staleTime: 120000, // 2 minutes
  });
}

/**
 * Hook for triggering learning from corrections.
 */
export function useTriggerLearning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: { company_id?: string; limit?: number }) =>
      feedbackApi.triggerLearning(params),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.preferences() });

      toast.success("Apprentissage lancé", {
        description: "Le système apprend de vos corrections en arrière-plan.",
      });
    },

    onError: () => {
      toast.error("Erreur", {
        description: "Impossible de lancer l'apprentissage. Veuillez réessayer.",
      });
    },
  });
}

// =============================================================================
// Real-Time Inline Feedback Hooks
// =============================================================================

/**
 * Hook for submitting inline feedback (thumbs up/down/edit).
 *
 * This is the primary hook for the real-time feedback loop system.
 * Automatically triggers learning when negative feedback threshold is reached.
 *
 * Usage:
 * ```tsx
 * const { mutate: submitInlineFeedback, isPending } = useInlineFeedback();
 *
 * submitInlineFeedback({
 *   workflow_id: "case-123",
 *   phase: "GENERATION",
 *   element_id: "section-methodologie",
 *   feedback_type: "thumbs_down",
 *   original_value: "Le texte genere..."
 * });
 * ```
 */
export function useInlineFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      workflow_id: string;
      phase: string;
      element_id: string;
      feedback_type: FeedbackType;
      original_value: string;
      corrected_value?: string;
      metadata?: Record<string, unknown>;
    }) => feedbackApi.submitInlineFeedback(data),

    onSuccess: (response, { feedback_type }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: feedbackKeys.realtimeMetrics() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.dashboard() });

      const messages = {
        thumbs_up: "Merci pour votre feedback positif!",
        thumbs_down: "Feedback enregistré. Nous améliorerons cette suggestion.",
        edit: "Correction enregistrée et sera utilisée pour améliorer les futures générations.",
      };

      toast.success("Feedback enregistré", {
        description: messages[feedback_type],
      });

      // Notify if learning was triggered
      if (response.learning_triggered) {
        toast.info("Apprentissage déclenché", {
          description: `Le système va apprendre des feedbacks récents pour la phase ${response.phase}.`,
        });
      }
    },

    onError: () => {
      toast.error("Erreur", {
        description: "Impossible d'enregistrer votre feedback. Veuillez réessayer.",
      });
    },
  });
}

/**
 * Hook for fetching real-time feedback metrics.
 *
 * Usage:
 * ```tsx
 * const { data: metrics, isLoading } = useRealtimeFeedbackMetrics({ hours: 24 });
 * ```
 */
export function useRealtimeFeedbackMetrics(params?: {
  hours?: number;
  phase?: string;
}) {
  return useQuery({
    queryKey: feedbackKeys.realtimeMetrics(params),
    queryFn: () => feedbackApi.getRealtimeMetrics(params),
    staleTime: 30000, // 30 seconds - refresh frequently for real-time metrics
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

/**
 * Hook for fetching feedback for a specific workflow.
 *
 * Usage:
 * ```tsx
 * const { data: feedback } = useWorkflowFeedback("case-123", { phase: "GENERATION" });
 * ```
 */
export function useWorkflowFeedback(
  workflowId: string,
  params?: { phase?: string; limit?: number }
) {
  return useQuery({
    queryKey: feedbackKeys.workflowFeedback(workflowId, params),
    queryFn: () => feedbackApi.getWorkflowFeedback(workflowId, params),
    staleTime: 60000, // 1 minute
    enabled: !!workflowId,
  });
}

/**
 * Hook for fetching feedback summary for a specific element.
 *
 * Usage:
 * ```tsx
 * const { data: summary } = useElementFeedback("case-123", "section-methodologie");
 * ```
 */
export function useElementFeedback(workflowId: string, elementId: string) {
  return useQuery({
    queryKey: feedbackKeys.elementFeedback(workflowId, elementId),
    queryFn: () => feedbackApi.getElementFeedback(workflowId, elementId),
    staleTime: 60000, // 1 minute
    enabled: !!workflowId && !!elementId,
  });
}

/**
 * Hook for fetching pending learning triggers.
 *
 * Usage:
 * ```tsx
 * const { data: triggers } = useLearningTriggers("pending");
 * ```
 */
export function useLearningTriggers(status?: string) {
  return useQuery({
    queryKey: feedbackKeys.learningTriggers(status),
    queryFn: () => feedbackApi.getLearningTriggers(status),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook for marking a learning trigger as complete.
 */
export function useMarkLearningComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ triggerId, success }: { triggerId: string; success?: boolean }) =>
      feedbackApi.markLearningComplete(triggerId, success ?? true),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.learningTriggers() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.dashboard() });

      toast.success("Apprentissage terminé", {
        description: "Le trigger d'apprentissage a été marqué comme complété.",
      });
    },

    onError: () => {
      toast.error("Erreur", {
        description: "Impossible de marquer l'apprentissage comme complété.",
      });
    },
  });
}

/**
 * Hook for fetching the feedback dashboard data.
 *
 * Includes metrics for multiple time windows and learning alerts.
 *
 * Usage:
 * ```tsx
 * const { data: dashboard, isLoading } = useFeedbackDashboard();
 * ```
 */
export function useFeedbackDashboard() {
  return useQuery({
    queryKey: feedbackKeys.dashboard(),
    queryFn: () => feedbackApi.getDashboard(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Auto-refresh every minute
  });
}
