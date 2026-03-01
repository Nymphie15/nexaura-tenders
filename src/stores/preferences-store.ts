import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// SSR-safe storage that handles server-side rendering
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

// Types
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  digest: "none" | "daily" | "weekly";
  types: {
    newTenders: boolean;
    deadlines: boolean;
    analysis: boolean;
    system: boolean;
  };
}

interface PreferencesState {
  // Notification Preferences (the only thing this store should manage)
  notificationPrefs: NotificationPreferences;
  
  // Locale
  language: "fr" | "en";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  
  // Actions
  updateNotificationPrefs: (prefs: Partial<NotificationPreferences>) => void;
  setLanguage: (lang: "fr" | "en") => void;
  setDateFormat: (format: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD") => void;
  resetAllPreferences: () => void;
}

// Default values
const defaultNotificationPrefs: NotificationPreferences = {
  email: true,
  push: true,
  inApp: true,
  digest: "daily",
  types: {
    newTenders: true,
    deadlines: true,
    analysis: true,
    system: true,
  },
};

const defaultState = {
  notificationPrefs: defaultNotificationPrefs,
  language: "fr" as const,
  dateFormat: "DD/MM/YYYY" as const,
};

/**
 * Preferences Store - Manages user preferences that are NOT handled elsewhere
 * 
 * NOTE: Theme is managed by next-themes (localStorage["theme"])
 * NOTE: Sidebar state is managed by sidebar.tsx (localStorage["sidebar-collapsed"])
 * NOTE: Dashboard layout is managed by use-dashboard-config (localStorage["dashboard-config"])
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultState,

      updateNotificationPrefs: (prefs: Partial<NotificationPreferences>) => {
        set((state) => ({
          notificationPrefs: {
            ...state.notificationPrefs,
            ...prefs,
            types: {
              ...state.notificationPrefs.types,
              ...(prefs.types || {}),
            },
          },
        }));
      },

      setLanguage: (language: "fr" | "en") => {
        set({ language });
      },

      setDateFormat: (dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD") => {
        set({ dateFormat });
      },

      resetAllPreferences: () => {
        set(defaultState);
      },
    }),
    {
      name: "preferences-storage",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        notificationPrefs: state.notificationPrefs,
        language: state.language,
        dateFormat: state.dateFormat,
      }),
    }
  )
);
