import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";
import { authApi } from "@/lib/api/endpoints";
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    company_siret?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  setUser: (user: User) => void;
  checkAuth: () => Promise<boolean>;
  setHasHydrated: (state: boolean) => void;
}

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });

          set({
            user: response.user,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });

          // TODO: Migrate client.ts interceptor to read from Zustand store instead of localStorage,
          // then remove these localStorage.setItem calls (duplicates Zustand persist)
          if (typeof window !== "undefined") {
            localStorage.setItem("access_token", response.access_token);
            localStorage.setItem("refresh_token", response.refresh_token);

            // Set auth presence cookie for Next.js middleware route protection
            document.cookie = "auth_presence=1; path=/; max-age=86400; SameSite=Lax";
          }

        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          set({
            user: response.user,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });

          if (typeof window !== "undefined") {
            localStorage.setItem("access_token", response.access_token);
            localStorage.setItem("refresh_token", response.refresh_token);
            // Set auth presence cookie for Next.js middleware route protection
            document.cookie = "auth_presence=1; path=/; max-age=86400; SameSite=Lax";
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        // Call backend logout to invalidate refresh token
        try {
          await authApi.logout();
        } catch (error) {
          // Continue logout even if API fails (network error, server down, etc.)
          console.warn("Logout API call failed, proceeding with local cleanup:", error);
        }

        // Clear local state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });

        // Clear localStorage (for axios interceptor)
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          // Clear auth presence cookie for Next.js middleware
          document.cookie = "auth_presence=; path=/; max-age=0; SameSite=Lax";
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          console.warn("No refresh token available");
          return false;
        }

        try {
          const response = await authApi.refresh(refreshToken);
          set({ accessToken: response.access_token });

          if (typeof window !== "undefined") {
            localStorage.setItem("access_token", response.access_token);
          }
          return true;
        } catch (error) {
          console.error("Token refresh failed:", error);
          toast.error("Session expirée", {
            description: "Veuillez vous reconnecter.",
          });
          await get().logout();
          return false;
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      checkAuth: async () => {
        const { accessToken, isAuthenticated, user } = get();

        // If already authenticated with user data, skip API call
        if (isAuthenticated && user && accessToken) {
          return true;
        }

        if (!accessToken) {
          return false;
        }

        try {
          const user = await authApi.me();
          set({ user, isAuthenticated: true });
          return true;
        } catch (error) {
          await get().logout();
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Hook to wait for hydration (use in components that need persisted state)
export const useAuthHydration = () => {
  return useAuthStore((state) => state._hasHydrated);
};
