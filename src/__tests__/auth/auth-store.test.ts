import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/endpoints";
import { toast } from "sonner";
import type { User } from "@/types";

// Mock dependencies
vi.mock("@/lib/api/endpoints", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    me: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("Auth Store", () => {
  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    full_name: "Test User",
    role: "user",
    company_id: "company-123",
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const mockAuthResponse = {
    user: mockUser,
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: true,
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Login", () => {
    it("should successfully login with valid credentials", async () => {
      vi.mocked(authApi.login).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe("mock-access-token");
      expect(result.current.refreshToken).toBe("mock-refresh-token");
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it("should store tokens in localStorage on login", async () => {
      vi.mocked(authApi.login).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(localStorage.getItem("access_token")).toBe("mock-access-token");
      expect(localStorage.getItem("refresh_token")).toBe("mock-refresh-token");
    });

    it("should persist auth data to auth-storage", async () => {
      vi.mocked(authApi.login).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      const authStorage = JSON.parse(localStorage.getItem("auth-storage") || "{}");
      expect(authStorage.state.user).toEqual(mockUser);
      expect(authStorage.state.accessToken).toBe("mock-access-token");
      expect(authStorage.state.isAuthenticated).toBe(true);
    });

    it("should set loading state during login", async () => {
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      vi.mocked(authApi.login).mockReturnValueOnce(loginPromise as any);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login("test@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin!(mockAuthResponse);
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should handle login failure", async () => {
      const error = new Error("Invalid credentials");
      vi.mocked(authApi.login).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuthStore());

      await expect(async () => {
        await act(async () => {
          await result.current.login("wrong@example.com", "wrongpassword");
        });
      }).rejects.toThrow("Invalid credentials");

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it("should reset loading state on login error", async () => {
      vi.mocked(authApi.login).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useAuthStore());

      try {
        await act(async () => {
          await result.current.login("test@example.com", "password123");
        });
      } catch (error) {
        // Expected to throw
      }

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Register", () => {
    it("should successfully register new user", async () => {
      vi.mocked(authApi.register).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          email: "newuser@example.com",
          password: "password123",
          full_name: "New User",
          company_siret: "12345678901234",
        });
      });

      expect(authApi.register).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
        full_name: "New User",
        company_siret: "12345678901234",
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should store tokens on successful registration", async () => {
      vi.mocked(authApi.register).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          email: "newuser@example.com",
          password: "password123",
          full_name: "New User",
        });
      });

      expect(localStorage.getItem("access_token")).toBe("mock-access-token");
      expect(localStorage.getItem("refresh_token")).toBe("mock-refresh-token");
    });

    it("should handle registration failure", async () => {
      const error = new Error("Email already exists");
      vi.mocked(authApi.register).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuthStore());

      await expect(async () => {
        await act(async () => {
          await result.current.register({
            email: "existing@example.com",
            password: "password123",
            full_name: "New User",
          });
        });
      }).rejects.toThrow("Email already exists");

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("Logout", () => {
    it("should clear auth state on logout", async () => {
      vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuthStore());

      // Setup authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: "token",
          refreshToken: "refresh",
          isAuthenticated: true,
        });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should remove tokens from localStorage on logout", async () => {
      vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);
      localStorage.setItem("access_token", "token");
      localStorage.setItem("refresh_token", "refresh");

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem("access_token")).toBeNull();
      expect(localStorage.getItem("refresh_token")).toBeNull();
    });

    it("should call backend logout endpoint", async () => {
      vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).toHaveBeenCalled();
    });

    it("should clear state even if backend logout fails", async () => {
      vi.mocked(authApi.logout).mockRejectedValueOnce(new Error("Network error"));
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useAuthStore());

      // Setup authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: "token",
          refreshToken: "refresh",
          isAuthenticated: true,
        });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Token Refresh", () => {
    it("should refresh access token successfully", async () => {
      vi.mocked(authApi.refresh).mockResolvedValueOnce({
        access_token: "new-access-token",
      });

      const { result } = renderHook(() => useAuthStore());

      // Setup refresh token
      act(() => {
        useAuthStore.setState({
          refreshToken: "valid-refresh-token",
        });
      });

      let refreshResult: boolean = false;
      await act(async () => {
        refreshResult = await result.current.refreshAccessToken();
      });

      expect(refreshResult).toBe(true);
      expect(authApi.refresh).toHaveBeenCalledWith("valid-refresh-token");
      expect(result.current.accessToken).toBe("new-access-token");
      expect(localStorage.getItem("access_token")).toBe("new-access-token");
    });

    it("should return false when no refresh token available", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { result } = renderHook(() => useAuthStore());

      let refreshResult: boolean = true;
      await act(async () => {
        refreshResult = await result.current.refreshAccessToken();
      });

      expect(refreshResult).toBe(false);
      expect(authApi.refresh).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith("No refresh token available");

      consoleWarnSpy.mockRestore();
    });

    it("should logout on refresh failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(authApi.refresh).mockRejectedValueOnce(new Error("Invalid refresh token"));
      vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuthStore());

      // Setup initial state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: "old-token",
          refreshToken: "invalid-refresh-token",
          isAuthenticated: true,
        });
      });

      let refreshResult: boolean = true;
      await act(async () => {
        refreshResult = await result.current.refreshAccessToken();
      });

      expect(refreshResult).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(
        "Session expirée",
        { description: "Veuillez vous reconnecter." }
      );
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Check Auth", () => {
    it("should return true if already authenticated with user data", async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: "valid-token",
          isAuthenticated: true,
        });
      });

      let authResult: boolean = false;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authResult).toBe(true);
      expect(authApi.me).not.toHaveBeenCalled();
    });

    it("should return false if no access token", async () => {
      const { result } = renderHook(() => useAuthStore());

      let authResult: boolean = true;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authResult).toBe(false);
      expect(authApi.me).not.toHaveBeenCalled();
    });

    it("should fetch user data if token exists but no user", async () => {
      vi.mocked(authApi.me).mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({
          accessToken: "valid-token",
        });
      });

      let authResult: boolean = false;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authResult).toBe(true);
      expect(authApi.me).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should logout on auth check failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(authApi.me).mockRejectedValueOnce(new Error("Invalid token"));
      vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({
          accessToken: "invalid-token",
        });
      });

      let authResult: boolean = true;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authResult).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Set User", () => {
    it("should update user data", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it("should update user data while preserving other state", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({
          accessToken: "token",
          refreshToken: "refresh",
          isAuthenticated: true,
        });
      });

      const updatedUser: User = { ...mockUser, full_name: "Updated Name" };

      act(() => {
        result.current.setUser(updatedUser);
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(result.current.accessToken).toBe("token");
      expect(result.current.refreshToken).toBe("refresh");
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("Hydration", () => {
    it("should set hydration state", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setHasHydrated(true);
      });

      expect(result.current._hasHydrated).toBe(true);
    });

    it("should track hydration state separately", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setHasHydrated(false);
      });

      expect(result.current._hasHydrated).toBe(false);

      act(() => {
        result.current.setHasHydrated(true);
      });

      expect(result.current._hasHydrated).toBe(true);
    });
  });

  describe("Persistence", () => {
    it("should persist selected state to localStorage", async () => {
      vi.mocked(authApi.login).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      const storedData = JSON.parse(localStorage.getItem("auth-storage") || "{}");

      expect(storedData.state).toBeDefined();
      expect(storedData.state.user).toEqual(mockUser);
      expect(storedData.state.accessToken).toBe("mock-access-token");
      expect(storedData.state.refreshToken).toBe("mock-refresh-token");
      expect(storedData.state.isAuthenticated).toBe(true);
    });

    it("should not persist loading state", async () => {
      vi.mocked(authApi.login).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      const storedData = JSON.parse(localStorage.getItem("auth-storage") || "{}");

      expect(storedData.state.isLoading).toBeUndefined();
    });

    it("should not persist hydration state", async () => {
      vi.mocked(authApi.login).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      const storedData = JSON.parse(localStorage.getItem("auth-storage") || "{}");

      expect(storedData.state._hasHydrated).toBeUndefined();
    });
  });
});
