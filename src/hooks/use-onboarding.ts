import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AchievementBadge, ACHIEVEMENT_BADGES } from "@/components/onboarding/tour-steps";
import { onboardingApi } from "@/lib/api/endpoints";

// Types
export type OnboardingStatus = "not_started" | "in_progress" | "completed" | "skipped";

export interface OnboardingState {
  status: OnboardingStatus;
  currentStepIndex: number;
  completedSteps: string[];
  earnedBadges: AchievementBadge[];
  startedAt?: string;
  completedAt?: string;
  skippedAt?: string;
}

interface OnboardingAPIResponse {
  onboarding_status: OnboardingStatus;
  current_step: number;
  completed_steps: string[];
  badges: string[];
  started_at?: string;
  completed_at?: string;
  skipped_at?: string;
}

// LocalStorage key
const STORAGE_KEY = "nexaura_onboarding_state";

// Default state
const DEFAULT_STATE: OnboardingState = {
  status: "not_started",
  currentStepIndex: 0,
  completedSteps: [],
  earnedBadges: [],
};

function apiResponseToState(data: OnboardingAPIResponse): OnboardingState {
  const badges = (data.badges || [])
    .map((badgeId) => ACHIEVEMENT_BADGES.find((b: { id: string }) => b.id === badgeId))
    .filter((b): b is AchievementBadge => b !== undefined);

  return {
    status: data.onboarding_status,
    currentStepIndex: data.current_step,
    completedSteps: data.completed_steps || [],
    earnedBadges: badges,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    skippedAt: data.skipped_at,
  };
}

// API functions (with fallback to localStorage if API unavailable)
async function fetchOnboardingStatus(): Promise<OnboardingState> {
  // Check localStorage first for immediate state (prevents dialog flash)
  const stored = localStorage.getItem(STORAGE_KEY);
  let localState: OnboardingState | null = null;
  if (stored) {
    try {
      localState = JSON.parse(stored);
    } catch {
      // ignore parse error
    }
  }

  try {
    const data: OnboardingAPIResponse = await onboardingApi.getStatus();
    const apiState = apiResponseToState(data);

    // If API returns not_started but localStorage says skipped/completed,
    // trust localStorage (API persistence may have failed)
    if (
      apiState.status === "not_started" &&
      localState &&
      (localState.status === "skipped" || localState.status === "completed")
    ) {
      return localState;
    }

    // Sync localStorage with API state
    saveToLocalStorage(apiState);
    return apiState;
  } catch {
    // Fallback to localStorage
    if (localState) {
      return localState;
    }
    return DEFAULT_STATE;
  }
}

function saveToLocalStorage(state: OnboardingState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Query keys
export const onboardingKeys = {
  all: ["onboarding"] as const,
  status: () => [...onboardingKeys.all, "status"] as const,
};

// Hook principal
export function useOnboarding() {
  const queryClient = useQueryClient();

  // Query for fetching onboarding status
  const { data: state = DEFAULT_STATE, isLoading } = useQuery({
    queryKey: onboardingKeys.status(),
    queryFn: fetchOnboardingStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Helper: update local state optimistically and sync localStorage
  const setLocalState = useCallback(
    (newState: OnboardingState) => {
      saveToLocalStorage(newState);
      queryClient.setQueryData(onboardingKeys.status(), newState);
    },
    [queryClient]
  );

  // Mutation: start onboarding
  const startMutation = useMutation({
    mutationFn: async () => {
      const newState: OnboardingState = {
        ...state,
        status: "in_progress",
        currentStepIndex: 0,
        startedAt: new Date().toISOString(),
      };
      saveToLocalStorage(newState);

      try {
        await onboardingApi.start();
      } catch {
        console.warn("API unavailable, using localStorage only");
      }
      // Always return local state (API response is {status, message}, not full format)
      return newState;
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(onboardingKeys.status(), newState);
    },
  });

  // Mutation: complete a step
  const completeStepMutation = useMutation({
    mutationFn: async (stepIndex: number) => {
      try {
        const data = await onboardingApi.completeStep(stepIndex);
        return apiResponseToState(data);
      } catch {
        console.warn("API unavailable, using localStorage only");
        return null;
      }
    },
    onSuccess: (newState) => {
      if (newState) {
        queryClient.setQueryData(onboardingKeys.status(), newState);
      }
    },
  });

  // Mutation: complete tour
  const completeMutation = useMutation({
    mutationFn: async () => {
      const newState: OnboardingState = {
        ...state,
        status: "completed",
        completedAt: new Date().toISOString(),
      };
      saveToLocalStorage(newState);

      try {
        await onboardingApi.complete();
      } catch {
        console.warn("API unavailable, using localStorage only");
      }
      return newState;
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(onboardingKeys.status(), newState);
    },
  });

  // Mutation: skip tour
  const skipMutation = useMutation({
    mutationFn: async () => {
      const newState: OnboardingState = {
        ...state,
        status: "skipped",
        skippedAt: new Date().toISOString(),
      };
      saveToLocalStorage(newState);

      try {
        await onboardingApi.skip();
      } catch {
        console.warn("API unavailable, using localStorage only");
      }
      return newState;
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(onboardingKeys.status(), newState);
    },
  });

  // Start the tour
  const startTour = useCallback(() => {
    startMutation.mutate();
  }, [startMutation]);

  // Complete a step and earn badge
  const completeStep = useCallback(
    (stepId: string) => {
      const badge = ACHIEVEMENT_BADGES.find((b) => b.stepId === stepId);
      const newCompletedSteps = [...state.completedSteps];

      if (!newCompletedSteps.includes(stepId)) {
        newCompletedSteps.push(stepId);
      }

      const newEarnedBadges = [...state.earnedBadges];
      if (badge && !newEarnedBadges.find((b: AchievementBadge) => b.id === badge.id)) {
        newEarnedBadges.push({
          ...badge,
          earnedAt: new Date().toISOString(),
        });
      }

      const newState: OnboardingState = {
        ...state,
        completedSteps: newCompletedSteps,
        earnedBadges: newEarnedBadges,
        currentStepIndex: state.currentStepIndex + 1,
      };
      saveToLocalStorage(newState);
      queryClient.setQueryData(onboardingKeys.status(), newState);

      // Sync with backend
      completeStepMutation.mutate(state.currentStepIndex);

      return badge;
    },
    [state, queryClient, completeStepMutation]
  );

  // Complete the tour
  const completeTour = useCallback(() => {
    completeMutation.mutate();
  }, [completeMutation]);

  // Skip the tour
  const skipTour = useCallback(() => {
    skipMutation.mutate();
  }, [skipMutation]);

  // Reset the tour (for testing/restart)
  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    queryClient.setQueryData(onboardingKeys.status(), DEFAULT_STATE);
  }, [queryClient]);

  // Set step index (local only - no dedicated backend endpoint)
  const setStepIndex = useCallback(
    (index: number) => {
      const newState: OnboardingState = {
        ...state,
        currentStepIndex: index,
      };
      setLocalState(newState);
    },
    [state, setLocalState]
  );

  // Check if tour should auto-start (first visit)
  const shouldShowTour = state.status === "not_started";
  const isTourActive = state.status === "in_progress";
  const isTourCompleted = state.status === "completed";
  const isTourSkipped = state.status === "skipped";

  // Calculate progress
  const totalSteps = 5;
  const progress = Math.round((state.completedSteps.length / totalSteps) * 100);

  return {
    // State
    state,
    isLoading,
    isTourActive,
    isTourCompleted,
    isTourSkipped,
    shouldShowTour,
    currentStepIndex: state.currentStepIndex,
    completedSteps: state.completedSteps,
    earnedBadges: state.earnedBadges,
    progress,

    // Actions
    startTour,
    completeStep,
    completeTour,
    skipTour,
    resetTour,
    setStepIndex,
  };
}

// Hook pour afficher une celebration lors de l'obtention d'un badge
export function useBadgeCelebration() {
  const [celebratingBadge, setCelebratingBadge] = useState<AchievementBadge | null>(null);

  const celebrate = useCallback((badge: AchievementBadge) => {
    setCelebratingBadge(badge);
  }, []);

  const dismissCelebration = useCallback(() => {
    setCelebratingBadge(null);
  }, []);

  return {
    celebratingBadge,
    celebrate,
    dismissCelebration,
  };
}

// Hook pour suivre si l'utilisateur est nouveau
export function useIsNewUser() {
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsNew(true);
    } else {
      try {
        const state: OnboardingState = JSON.parse(stored);
        setIsNew(state.status === "not_started");
      } catch {
        setIsNew(true);
      }
    }
  }, []);

  return isNew;
}
