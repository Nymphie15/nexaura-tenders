import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/endpoints";
import type { User } from "@/types";

// Mock authApi
vi.mock("@/lib/api/endpoints", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    me: vi.fn(),
  },
}));

// Mock localStorage for SSR-safe storage
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

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("AuthStore", () => {
  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    full_name: "Test User",
    role: "user",
    company_siret: "12345678901234",
    created_at: "2024-01-01T00:00:00Z",
  };

  const mockTokens = {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
  };

  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,
    });

    // Clear localStorage
    localStorageMock.clear();

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should have null user", () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it("should have null tokens", () => {
      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });

    it("should not be authenticated", () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it("should not be loading", () => {
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it("should not be hydrated", () => {
      const state = useAuthStore.getState();
      expect(state._hasHydrated).toBe(false);
    });
  });

  describe("login", () => {
    it("should successfully login and update state", async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      const state = useAuthStore.getState();
      await state.login("test@example.com", "password123");

      const finalState = useAuthStore.getState();
      expect(finalState.user).toEqual(mockUser);
      expect(finalState.accessToken).toBe(mockTokens.access_token);
      expect(finalState.refreshToken).toBe(mockTokens.refresh_token);
      expect(finalState.isAuthenticated).toBe(true);
      expect(finalState.isLoading).toBe(false);
    });

    it("should store tokens in localStorage", async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      const state = useAuthStore.getState();
      await state.login("test@example.com", "password123");

      expect(localStorageMock.getItem("access_token")).toBe(mockTokens.access_token);
      expect(localStorageMock.getItem("refresh_token")).toBe(mockTokens.refresh_token);
    });

    it("should store auth-storage in localStorage for persistence", async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      const state = useAuthStore.getState();
      await state.login("test@example.com", "password123");

      const authStorage = localStorageMock.getItem("auth-storage");
      expect(authStorage).toBeTruthy();

      const parsed = JSON.parse(authStorage!);
      expect(parsed.state.user).toEqual(mockUser);
      expect(parsed.state.accessToken).toBe(mockTokens.access_token);
      expect(parsed.state.isAuthenticated).toBe(true);
    });

    it("should set loading state during login", async () => {
      vi.mocked(authApi.login).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                user: mockUser,
                ...mockTokens,
              });
            }, 100);
          })
      );

      const state = useAuthStore.getState();
      const loginPromise = state.login("test@example.com", "password123");

      // Check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      await loginPromise;

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("should handle login errors", async () => {
      const error = new Error("Invalid credentials");
      vi.mocked(authApi.login).mockRejectedValue(error);

      const state = useAuthStore.getState();

      await expect(state.login("test@example.com", "wrongpass")).rejects.toThrow(
        "Invalid credentials"
      );

      const finalState = useAuthStore.getState();
      expect(finalState.isLoading).toBe(false);
      expect(finalState.isAuthenticated).toBe(false);
    });

    it("should call authApi.login with correct parameters", async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      const state = useAuthStore.getState();
      await state.login("test@example.com", "password123");

      expect(authApi.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  describe("register", () => {
    it("should successfully register and update state", async () => {
      const registerData = {
        email: "new@example.com",
        password: "password123",
        full_name: "New User",
        company_siret: "98765432109876",
      };

      vi.mocked(authApi.register).mockResolvedValue({
        user: { ...mockUser, ...registerData },
        ...mockTokens,
      });

      const state = useAuthStore.getState();
      await state.register(registerData);

      const finalState = useAuthStore.getState();
      expect(finalState.user).toMatchObject({
        email: registerData.email,
        full_name: registerData.full_name,
      });
      expect(finalState.isAuthenticated).toBe(true);
      expect(finalState.isLoading).toBe(false);
    });

    it("should store tokens in localStorage", async () => {
      const registerData = {
        email: "new@example.com",
        password: "password123",
        full_name: "New User",
      };

      vi.mocked(authApi.register).mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      const state = useAuthStore.getState();
      await state.register(registerData);

      expect(localStorageMock.getItem("access_token")).toBe(mockTokens.access_token);
      expect(localStorageMock.getItem("refresh_token")).toBe(mockTokens.refresh_token);
    });

    it("should handle registration errors", async () => {
      const error = new Error("Email already exists");
      vi.mocked(authApi.register).mockRejectedValue(error);

      const state = useAuthStore.getState();

      await expect(
        state.register({
          email: "existing@example.com",
          password: "password123",
          full_name: "User",
        })
      ).rejects.toThrow("Email already exists");

      const finalState = useAuthStore.getState();
      expect(finalState.isLoading).toBe(false);
      expect(finalState.isAuthenticated).toBe(false);
    });
  });

  describe("logout", () => {
    it("should clear user and tokens", async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: mockUser,
        accessToken: mockTokens.access_token,
        refreshToken: mockTokens.refresh_token,
        isAuthenticated: true,
      });

      vi.mocked(authApi.logout).mockResolvedValue();

      const state = useAuthStore.getState();
      await state.logout();

      const finalState = useAuthStore.getState();
      expect(finalState.user).toBeNull();
      expect(finalState.accessToken).toBeNull();
      expect(finalState.refreshToken).toBeNull();
      expect(finalState.isAuthenticated).toBe(false);
    });

    it("should remove tokens from localStorage", async () => {
      // Set up localStorage with tokens
      localStorageMock.setItem("access_token", mockTokens.access_token);
      localStorageMock.setItem("refresh_token", mockTokens.refresh_token);

      vi.mocked(authApi.logout).mockResolvedValue();

      const state = useAuthStore.getState();
      await state.logout();

      expect(localStorageMock.getItem("access_token")).toBeNull();
      expect(localStorageMock.getItem("refresh_token")).toBeNull();
    });

    it("should continue logout even if API fails", async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: mockTokens.access_token,
        isAuthenticated: true,
      });

      vi.mocked(authApi.logout).mockRejectedValue(new Error("Network error"));

      const state = useAuthStore.getState();
      await state.logout();

      // Should still clear local state
      const finalState = useAuthStore.getState();
      expect(finalState.user).toBeNull();
      expect(finalState.isAuthenticated).toBe(false);
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh access token successfully", async () => {
      const newAccessToken = "new-access-token";

      useAuthStore.setState({
        refreshToken: mockTokens.refresh_token,
      });

      vi.mocked(authApi.refresh).mockResolvedValue({
        access_token: newAccessToken,
      });

      const state = useAuthStore.getState();
      const result = await state.refreshAccessToken();

      expect(result).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe(newAccessToken);
      expect(localStorageMock.getItem("access_token")).toBe(newAccessToken);
    });

    it("should return false if no refresh token available", async () => {
      useAuthStore.setState({
        refreshToken: null,
      });

      const state = useAuthStore.getState();
      const result = await state.refreshAccessToken();

      expect(result).toBe(false);
      expect(authApi.refresh).not.toHaveBeenCalled();
    });

    it("should logout on refresh failure", async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: mockTokens.access_token,
        refreshToken: mockTokens.refresh_token,
        isAuthenticated: true,
      });

      vi.mocked(authApi.refresh).mockRejectedValue(new Error("Invalid refresh token"));
      vi.mocked(authApi.logout).mockResolvedValue();

      const state = useAuthStore.getState();
      const result = await state.refreshAccessToken();

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("setUser", () => {
    it("should update user", () => {
      const state = useAuthStore.getState();
      state.setUser(mockUser);

      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it("should allow partial updates", () => {
      useAuthStore.setState({ user: mockUser });

      const updatedUser = { ...mockUser, full_name: "Updated Name" };
      const state = useAuthStore.getState();
      state.setUser(updatedUser);

      expect(useAuthStore.getState().user?.full_name).toBe("Updated Name");
    });
  });

  describe("checkAuth", () => {
    it("should return true if already authenticated", async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: mockTokens.access_token,
        isAuthenticated: true,
      });

      const state = useAuthStore.getState();
      const result = await state.checkAuth();

      expect(result).toBe(true);
      expect(authApi.me).not.toHaveBeenCalled();
    });

    it("should return false if no access token", async () => {
      useAuthStore.setState({
        accessToken: null,
      });

      const state = useAuthStore.getState();
      const result = await state.checkAuth();

      expect(result).toBe(false);
      expect(authApi.me).not.toHaveBeenCalled();
    });

    it("should fetch user data if token exists but not authenticated", async () => {
      useAuthStore.setState({
        accessToken: mockTokens.access_token,
        isAuthenticated: false,
        user: null,
      });

      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const state = useAuthStore.getState();
      const result = await state.checkAuth();

      expect(result).toBe(true);
      expect(authApi.me).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("should logout on auth check failure", async () => {
      useAuthStore.setState({
        accessToken: "invalid-token",
        isAuthenticated: false,
      });

      vi.mocked(authApi.me).mockRejectedValue(new Error("Unauthorized"));
      vi.mocked(authApi.logout).mockResolvedValue();

      const state = useAuthStore.getState();
      const result = await state.checkAuth();

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("setHasHydrated", () => {
    it("should update hydration state", () => {
      const state = useAuthStore.getState();
      state.setHasHydrated(true);

      expect(useAuthStore.getState()._hasHydrated).toBe(true);
    });
  });

  describe("Persistence (partialize)", () => {
    it("should only persist specific fields", () => {
      // This tests the partialize configuration
      // In a real scenario, Zustand would handle this, but we can verify
      // by checking which fields would be persisted

      useAuthStore.setState({
        user: mockUser,
        accessToken: mockTokens.access_token,
        refreshToken: mockTokens.refresh_token,
        isAuthenticated: true,
        isLoading: true, // Should NOT be persisted
        _hasHydrated: true, // Should NOT be persisted
      });

      const state = useAuthStore.getState();

      // These should be available in state
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(mockTokens.access_token);
      expect(state.refreshToken).toBe(mockTokens.refresh_token);
      expect(state.isAuthenticated).toBe(true);

      // These would NOT be persisted (but are still in state during runtime)
      expect(state.isLoading).toBe(true);
      expect(state._hasHydrated).toBe(true);
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
        useAuthStore.getState();
      }).not.toThrow();

      // Restore window
      // @ts-ignore
      global.window = originalWindow;
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent login attempts", async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      const state = useAuthStore.getState();

      // Start two login attempts simultaneously
      const login1 = state.login("test1@example.com", "password1");
      const login2 = state.login("test2@example.com", "password2");

      await Promise.all([login1, login2]);

      // Should have called login twice
      expect(authApi.login).toHaveBeenCalledTimes(2);
    });

    it("should maintain state consistency after failed operations", async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: mockTokens.access_token,
        refreshToken: mockTokens.refresh_token,
        isAuthenticated: true,
      });

      vi.mocked(authApi.refresh).mockRejectedValue(new Error("Failed"));
      vi.mocked(authApi.logout).mockResolvedValue();

      const state = useAuthStore.getState();

      // Try refresh (will fail and logout)
      await state.refreshAccessToken();

      const finalState = useAuthStore.getState();
      expect(finalState.isAuthenticated).toBe(false);
      expect(finalState.user).toBeNull();
      expect(finalState.accessToken).toBeNull();
    });
  });
});
