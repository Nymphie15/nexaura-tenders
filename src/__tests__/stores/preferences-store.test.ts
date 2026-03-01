import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePreferencesStore } from "@/stores/preferences-store";
import type { NotificationPreferences } from "@/stores/preferences-store";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("PreferencesStore", () => {
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

  beforeEach(() => {
    // Reset store to initial/default state
    usePreferencesStore.setState({
      notificationPrefs: defaultNotificationPrefs,
      language: "fr",
      dateFormat: "DD/MM/YYYY",
    });

    // Clear localStorage
    localStorageMock.clear();

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should have default notification preferences", () => {
      const state = usePreferencesStore.getState();
      expect(state.notificationPrefs).toEqual(defaultNotificationPrefs);
    });

    it("should have all notification channels enabled by default", () => {
      const state = usePreferencesStore.getState();
      expect(state.notificationPrefs.email).toBe(true);
      expect(state.notificationPrefs.push).toBe(true);
      expect(state.notificationPrefs.inApp).toBe(true);
    });

    it("should have daily digest by default", () => {
      const state = usePreferencesStore.getState();
      expect(state.notificationPrefs.digest).toBe("daily");
    });

    it("should have all notification types enabled by default", () => {
      const state = usePreferencesStore.getState();
      const { types } = state.notificationPrefs;
      expect(types.newTenders).toBe(true);
      expect(types.deadlines).toBe(true);
      expect(types.analysis).toBe(true);
      expect(types.system).toBe(true);
    });

    it("should have French as default language", () => {
      const state = usePreferencesStore.getState();
      expect(state.language).toBe("fr");
    });

    it("should have DD/MM/YYYY as default date format", () => {
      const state = usePreferencesStore.getState();
      expect(state.dateFormat).toBe("DD/MM/YYYY");
    });
  });

  describe("updateNotificationPrefs", () => {
    it("should update email notification preference", () => {
      const state = usePreferencesStore.getState();
      state.updateNotificationPrefs({ email: false });

      expect(usePreferencesStore.getState().notificationPrefs.email).toBe(false);
    });

    it("should update push notification preference", () => {
      const state = usePreferencesStore.getState();
      state.updateNotificationPrefs({ push: false });

      expect(usePreferencesStore.getState().notificationPrefs.push).toBe(false);
    });

    it("should update inApp notification preference", () => {
      const state = usePreferencesStore.getState();
      state.updateNotificationPrefs({ inApp: false });

      expect(usePreferencesStore.getState().notificationPrefs.inApp).toBe(false);
    });

    it("should update digest preference", () => {
      const state = usePreferencesStore.getState();
      state.updateNotificationPrefs({ digest: "weekly" });

      expect(usePreferencesStore.getState().notificationPrefs.digest).toBe("weekly");
    });

    it("should update digest to none", () => {
      const state = usePreferencesStore.getState();
      state.updateNotificationPrefs({ digest: "none" });

      expect(usePreferencesStore.getState().notificationPrefs.digest).toBe("none");
    });

    it("should update specific notification types", () => {
      const state = usePreferencesStore.getState();
      state.updateNotificationPrefs({
        types: {
          newTenders: false,
          deadlines: true,
        },
      });

      const { types } = usePreferencesStore.getState().notificationPrefs;
      expect(types.newTenders).toBe(false);
      expect(types.deadlines).toBe(true);
      expect(types.analysis).toBe(true); // Should remain unchanged
      expect(types.system).toBe(true); // Should remain unchanged
    });

    it("should merge notification types without overwriting others", () => {
      const state = usePreferencesStore.getState();

      // First update
      state.updateNotificationPrefs({
        types: {
          newTenders: false,
        },
      });

      // Second update
      state.updateNotificationPrefs({
        types: {
          deadlines: false,
        },
      });

      const { types } = usePreferencesStore.getState().notificationPrefs;
      expect(types.newTenders).toBe(false);
      expect(types.deadlines).toBe(false);
      expect(types.analysis).toBe(true); // Should remain unchanged
      expect(types.system).toBe(true); // Should remain unchanged
    });

    it("should update multiple preferences at once", () => {
      const state = usePreferencesStore.getState();
      state.updateNotificationPrefs({
        email: false,
        push: false,
        digest: "weekly",
        types: {
          system: false,
        },
      });

      const prefs = usePreferencesStore.getState().notificationPrefs;
      expect(prefs.email).toBe(false);
      expect(prefs.push).toBe(false);
      expect(prefs.digest).toBe("weekly");
      expect(prefs.types.system).toBe(false);
      expect(prefs.inApp).toBe(true); // Should remain unchanged
    });

    it("should preserve existing preferences when updating partial preferences", () => {
      const state = usePreferencesStore.getState();
      state.updateNotificationPrefs({ email: false });

      const prefs = usePreferencesStore.getState().notificationPrefs;
      expect(prefs.push).toBe(true);
      expect(prefs.inApp).toBe(true);
      expect(prefs.digest).toBe("daily");
    });

    it("should handle empty update without changing state", () => {
      const state = usePreferencesStore.getState();
      const beforePrefs = { ...state.notificationPrefs };

      state.updateNotificationPrefs({});

      const afterPrefs = usePreferencesStore.getState().notificationPrefs;
      expect(afterPrefs).toEqual(beforePrefs);
    });
  });

  describe("setLanguage", () => {
    it("should set language to French", () => {
      const state = usePreferencesStore.getState();
      state.setLanguage("fr");

      expect(usePreferencesStore.getState().language).toBe("fr");
    });

    it("should set language to English", () => {
      const state = usePreferencesStore.getState();
      state.setLanguage("en");

      expect(usePreferencesStore.getState().language).toBe("en");
    });

    it("should switch language back and forth", () => {
      const state = usePreferencesStore.getState();

      state.setLanguage("en");
      expect(usePreferencesStore.getState().language).toBe("en");

      state.setLanguage("fr");
      expect(usePreferencesStore.getState().language).toBe("fr");
    });

    it("should not affect other preferences", () => {
      const state = usePreferencesStore.getState();
      const beforePrefs = { ...state.notificationPrefs };
      const beforeDateFormat = state.dateFormat;

      state.setLanguage("en");

      const afterState = usePreferencesStore.getState();
      expect(afterState.notificationPrefs).toEqual(beforePrefs);
      expect(afterState.dateFormat).toBe(beforeDateFormat);
    });
  });

  describe("setDateFormat", () => {
    it("should set date format to DD/MM/YYYY", () => {
      const state = usePreferencesStore.getState();
      state.setDateFormat("DD/MM/YYYY");

      expect(usePreferencesStore.getState().dateFormat).toBe("DD/MM/YYYY");
    });

    it("should set date format to MM/DD/YYYY", () => {
      const state = usePreferencesStore.getState();
      state.setDateFormat("MM/DD/YYYY");

      expect(usePreferencesStore.getState().dateFormat).toBe("MM/DD/YYYY");
    });

    it("should set date format to YYYY-MM-DD", () => {
      const state = usePreferencesStore.getState();
      state.setDateFormat("YYYY-MM-DD");

      expect(usePreferencesStore.getState().dateFormat).toBe("YYYY-MM-DD");
    });

    it("should switch between date formats", () => {
      const state = usePreferencesStore.getState();

      state.setDateFormat("MM/DD/YYYY");
      expect(usePreferencesStore.getState().dateFormat).toBe("MM/DD/YYYY");

      state.setDateFormat("YYYY-MM-DD");
      expect(usePreferencesStore.getState().dateFormat).toBe("YYYY-MM-DD");

      state.setDateFormat("DD/MM/YYYY");
      expect(usePreferencesStore.getState().dateFormat).toBe("DD/MM/YYYY");
    });

    it("should not affect other preferences", () => {
      const state = usePreferencesStore.getState();
      const beforePrefs = { ...state.notificationPrefs };
      const beforeLanguage = state.language;

      state.setDateFormat("YYYY-MM-DD");

      const afterState = usePreferencesStore.getState();
      expect(afterState.notificationPrefs).toEqual(beforePrefs);
      expect(afterState.language).toBe(beforeLanguage);
    });
  });

  describe("resetAllPreferences", () => {
    it("should reset notification preferences to defaults", () => {
      const state = usePreferencesStore.getState();

      // Change preferences
      state.updateNotificationPrefs({
        email: false,
        push: false,
        digest: "none",
        types: {
          newTenders: false,
          system: false,
        },
      });

      // Reset
      state.resetAllPreferences();

      const prefs = usePreferencesStore.getState().notificationPrefs;
      expect(prefs).toEqual(defaultNotificationPrefs);
    });

    it("should reset language to default", () => {
      const state = usePreferencesStore.getState();

      state.setLanguage("en");
      state.resetAllPreferences();

      expect(usePreferencesStore.getState().language).toBe("fr");
    });

    it("should reset date format to default", () => {
      const state = usePreferencesStore.getState();

      state.setDateFormat("YYYY-MM-DD");
      state.resetAllPreferences();

      expect(usePreferencesStore.getState().dateFormat).toBe("DD/MM/YYYY");
    });

    it("should reset all preferences at once", () => {
      const state = usePreferencesStore.getState();

      // Change everything
      state.updateNotificationPrefs({
        email: false,
        digest: "weekly",
      });
      state.setLanguage("en");
      state.setDateFormat("MM/DD/YYYY");

      // Reset
      state.resetAllPreferences();

      const finalState = usePreferencesStore.getState();
      expect(finalState.notificationPrefs).toEqual(defaultNotificationPrefs);
      expect(finalState.language).toBe("fr");
      expect(finalState.dateFormat).toBe("DD/MM/YYYY");
    });

    it("should work when already at default values", () => {
      const state = usePreferencesStore.getState();

      // Already at defaults
      state.resetAllPreferences();

      const finalState = usePreferencesStore.getState();
      expect(finalState.notificationPrefs).toEqual(defaultNotificationPrefs);
      expect(finalState.language).toBe("fr");
      expect(finalState.dateFormat).toBe("DD/MM/YYYY");
    });
  });

  describe("Persistence (partialize)", () => {
    it("should persist all preferences", () => {
      usePreferencesStore.setState({
        notificationPrefs: {
          email: false,
          push: true,
          inApp: true,
          digest: "weekly",
          types: {
            newTenders: true,
            deadlines: false,
            analysis: true,
            system: false,
          },
        },
        language: "en",
        dateFormat: "YYYY-MM-DD",
      });

      const state = usePreferencesStore.getState();

      // All fields should be persisted
      expect(state.notificationPrefs.email).toBe(false);
      expect(state.notificationPrefs.digest).toBe("weekly");
      expect(state.notificationPrefs.types.deadlines).toBe(false);
      expect(state.language).toBe("en");
      expect(state.dateFormat).toBe("YYYY-MM-DD");
    });
  });

  describe("SSR-safe storage", () => {
    it("should handle server-side rendering gracefully", () => {
      // Simulate SSR by removing window
      const originalWindow = global.window;
      // @ts-ignore - intentionally removing window for test
      delete global.window;

      // Should not throw error
      expect(() => {
        usePreferencesStore.getState();
      }).not.toThrow();

      // Restore window
      // @ts-ignore
      global.window = originalWindow;
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid successive updates", () => {
      const state = usePreferencesStore.getState();

      for (let i = 0; i < 10; i++) {
        state.updateNotificationPrefs({
          email: i % 2 === 0,
        });
      }

      // Should have the last value (i=9, which is odd, so false)
      expect(usePreferencesStore.getState().notificationPrefs.email).toBe(false);
    });

    it("should maintain state consistency after mixed operations", () => {
      const state = usePreferencesStore.getState();

      // Update notification preferences
      state.updateNotificationPrefs({
        email: false,
        types: {
          newTenders: false,
        },
      });

      // Update language
      state.setLanguage("en");

      // Update date format
      state.setDateFormat("YYYY-MM-DD");

      // Update more notification preferences
      state.updateNotificationPrefs({
        digest: "weekly",
        types: {
          deadlines: false,
        },
      });

      const finalState = usePreferencesStore.getState();
      expect(finalState.notificationPrefs.email).toBe(false);
      expect(finalState.notificationPrefs.digest).toBe("weekly");
      expect(finalState.notificationPrefs.types.newTenders).toBe(false);
      expect(finalState.notificationPrefs.types.deadlines).toBe(false);
      expect(finalState.notificationPrefs.types.analysis).toBe(true); // Unchanged
      expect(finalState.language).toBe("en");
      expect(finalState.dateFormat).toBe("YYYY-MM-DD");
    });

    it("should handle all digest options", () => {
      const state = usePreferencesStore.getState();

      const digestOptions = ["none", "daily", "weekly"] as const;

      digestOptions.forEach((digest) => {
        state.updateNotificationPrefs({ digest });
        expect(usePreferencesStore.getState().notificationPrefs.digest).toBe(digest);
      });
    });

    it("should handle all notification types independently", () => {
      const state = usePreferencesStore.getState();

      // Disable all types one by one
      state.updateNotificationPrefs({ types: { newTenders: false } });
      state.updateNotificationPrefs({ types: { deadlines: false } });
      state.updateNotificationPrefs({ types: { analysis: false } });
      state.updateNotificationPrefs({ types: { system: false } });

      const { types } = usePreferencesStore.getState().notificationPrefs;
      expect(types.newTenders).toBe(false);
      expect(types.deadlines).toBe(false);
      expect(types.analysis).toBe(false);
      expect(types.system).toBe(false);
    });

    it("should handle complete notification preferences replacement", () => {
      const state = usePreferencesStore.getState();

      const newPrefs: NotificationPreferences = {
        email: false,
        push: false,
        inApp: false,
        digest: "none",
        types: {
          newTenders: false,
          deadlines: false,
          analysis: false,
          system: false,
        },
      };

      state.updateNotificationPrefs(newPrefs);

      const finalPrefs = usePreferencesStore.getState().notificationPrefs;
      expect(finalPrefs).toEqual(newPrefs);
    });

    it("should handle reset after multiple changes", () => {
      const state = usePreferencesStore.getState();

      // Make many changes
      state.updateNotificationPrefs({ email: false });
      state.setLanguage("en");
      state.setDateFormat("MM/DD/YYYY");
      state.updateNotificationPrefs({ digest: "weekly" });
      state.updateNotificationPrefs({ types: { newTenders: false } });
      state.setDateFormat("YYYY-MM-DD");

      // Reset everything
      state.resetAllPreferences();

      const finalState = usePreferencesStore.getState();
      expect(finalState).toEqual({
        notificationPrefs: defaultNotificationPrefs,
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        updateNotificationPrefs: expect.any(Function),
        setLanguage: expect.any(Function),
        setDateFormat: expect.any(Function),
        resetAllPreferences: expect.any(Function),
      });
    });
  });

  describe("Notification Preferences Scenarios", () => {
    it("should allow disabling all notification channels", () => {
      const state = usePreferencesStore.getState();

      state.updateNotificationPrefs({
        email: false,
        push: false,
        inApp: false,
      });

      const prefs = usePreferencesStore.getState().notificationPrefs;
      expect(prefs.email).toBe(false);
      expect(prefs.push).toBe(false);
      expect(prefs.inApp).toBe(false);
    });

    it("should allow enabling only specific notification types", () => {
      const state = usePreferencesStore.getState();

      state.updateNotificationPrefs({
        types: {
          newTenders: true,
          deadlines: true,
          analysis: false,
          system: false,
        },
      });

      const { types } = usePreferencesStore.getState().notificationPrefs;
      expect(types.newTenders).toBe(true);
      expect(types.deadlines).toBe(true);
      expect(types.analysis).toBe(false);
      expect(types.system).toBe(false);
    });

    it("should allow email-only notifications", () => {
      const state = usePreferencesStore.getState();

      state.updateNotificationPrefs({
        email: true,
        push: false,
        inApp: false,
      });

      const prefs = usePreferencesStore.getState().notificationPrefs;
      expect(prefs.email).toBe(true);
      expect(prefs.push).toBe(false);
      expect(prefs.inApp).toBe(false);
    });
  });
});
