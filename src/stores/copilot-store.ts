import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// SSR-safe sessionStorage wrapper
const safeSessionStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(name);
    }
  },
};

export interface CopilotContext {
  page: string;
  tender_id?: string;
  case_id?: string;
}

interface CopilotState {
  isOpen: boolean;
  currentContext: CopilotContext | null;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setContext: (ctx: CopilotContext) => void;
}

export const useCopilotStore = create<CopilotState>()(
  persist(
    (set) => ({
      isOpen: false,
      currentContext: null,

      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setContext: (ctx: CopilotContext) => set({ currentContext: ctx }),
    }),
    {
      name: "copilot-storage",
      storage: createJSONStorage(() => safeSessionStorage),
      partialize: (state) => ({
        isOpen: state.isOpen,
      }),
    }
  )
);
