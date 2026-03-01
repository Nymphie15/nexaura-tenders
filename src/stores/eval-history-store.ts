import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { EvaluationReport } from "@/types/llm-eval";

const MAX_REPORTS = 50;

// SSR-safe storage
const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(name);
    }
  },
};

interface EvalHistoryState {
  history: EvaluationReport[];
  addReport: (report: EvaluationReport) => void;
  clearHistory: () => void;
}

export const useEvalHistoryStore = create<EvalHistoryState>()(
  persist(
    (set) => ({
      history: [],

      addReport: (report: EvaluationReport) =>
        set((state) => ({
          history: [report, ...state.history].slice(0, MAX_REPORTS),
        })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "eval-history-storage",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
);
