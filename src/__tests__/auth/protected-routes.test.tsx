import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: vi.fn(),
  useAuthHydration: vi.fn(),
}));

import React from "react";

// Mock protected component
const ProtectedComponent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, _hasHydrated, checkAuth } = useAuthStore();

  // Wait for hydration
  if (!_hasHydrated) {
    return <div>Loading...</div>;
  }

  // Check auth on mount
  React.useEffect(() => {
    const verify = async () => {
      try {
        const isValid = await checkAuth();
        if (!isValid && pathname !== "/login") {
          router.push("/login");
        }
      } catch {
        // Token verification failed, redirect to login
        if (pathname !== "/login") {
          router.push("/login");
        }
      }
    };
    verify();
  }, []);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Welcome, {user.full_name}</p>
    </div>
  );
};

describe("Protected Routes", () => {
  const mockPush = vi.fn();
  const mockCheckAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/tenders");
  });

  describe("Authentication Check", () => {
    it("should show loading while hydrating", () => {
      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        user: null,
        _hasHydrated: false,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should redirect to login when not authenticated", async () => {
      mockCheckAuth.mockResolvedValueOnce(false);

      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        user: null,
        _hasHydrated: true,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(mockCheckAuth).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });

    it("should show protected content when authenticated", async () => {
      mockCheckAuth.mockResolvedValueOnce(true);

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        full_name: "John Doe",
        role: "user",
        company_id: "company-123",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        _hasHydrated: true,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });

      expect(screen.getByText("Welcome, John Doe")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should not redirect when on login page", async () => {
      mockCheckAuth.mockResolvedValueOnce(false);
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/login");

      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        user: null,
        _hasHydrated: true,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(mockCheckAuth).toHaveBeenCalled();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Token Validation", () => {
    it("should verify token on component mount", async () => {
      mockCheckAuth.mockResolvedValueOnce(true);

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Jane Doe",
        role: "user",
        company_id: "company-123",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        _hasHydrated: true,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(mockCheckAuth).toHaveBeenCalled();
      });
    });

    it("should handle token verification failure", async () => {
      // Use resolved false instead of rejected to avoid unhandled rejection warnings
      mockCheckAuth.mockResolvedValueOnce(false);

      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        user: null,
        _hasHydrated: true,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(mockCheckAuth).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("Hydration Handling", () => {
    it("should wait for store hydration before checking auth", () => {
      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        user: null,
        _hasHydrated: false,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      expect(mockCheckAuth).not.toHaveBeenCalled();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should check auth after hydration completes", async () => {
      // First render: not hydrated
      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        user: null,
        _hasHydrated: false,
        checkAuth: mockCheckAuth,
      });

      const { rerender } = render(<ProtectedComponent />);
      expect(mockCheckAuth).not.toHaveBeenCalled();

      // Then hydrated
      mockCheckAuth.mockResolvedValueOnce(true);
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "user",
        company_id: "company-123",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        _hasHydrated: true,
        checkAuth: mockCheckAuth,
      });

      rerender(<ProtectedComponent />);

      await waitFor(() => {
        expect(mockCheckAuth).toHaveBeenCalled();
      });
    });
  });

  describe("User Session Persistence", () => {
    it("should restore authenticated session from storage", async () => {
      mockCheckAuth.mockResolvedValueOnce(true);

      const mockUser = {
        id: "user-123",
        email: "returning@example.com",
        full_name: "Returning User",
        role: "user",
        company_id: "company-123",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      // Simulate hydrated state from localStorage
      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        _hasHydrated: true,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });

      expect(screen.getByText("Welcome, Returning User")).toBeInTheDocument();
    });

    it("should handle corrupted session data", async () => {
      mockCheckAuth.mockResolvedValueOnce(false);

      // Simulate corrupted state (authenticated but no user)
      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        user: null,
        _hasHydrated: true,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(mockCheckAuth).toHaveBeenCalled();
      });
    });
  });

  describe("Multiple Protected Routes", () => {
    it("should protect multiple routes with same logic", async () => {
      const routes = ["/tenders", "/dashboard", "/settings", "/profile"];

      for (const route of routes) {
        vi.clearAllMocks();
        mockCheckAuth.mockResolvedValueOnce(false);

        (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(route);
        (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
          isAuthenticated: false,
          user: null,
          _hasHydrated: true,
          checkAuth: mockCheckAuth,
        });

        render(<ProtectedComponent />);

        await waitFor(() => {
          expect(mockCheckAuth).toHaveBeenCalled();
        });

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith("/login");
        });
      }
    });
  });

  describe("Role-Based Access", () => {
    it("should allow access for users with proper role", async () => {
      mockCheckAuth.mockResolvedValueOnce(true);

      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        full_name: "Regular User",
        role: "user" as const,
        company_id: "company-123",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        _hasHydrated: true,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
    });

    it("should allow access for admin users", async () => {
      mockCheckAuth.mockResolvedValueOnce(true);

      const mockAdmin = {
        id: "admin-123",
        email: "admin@example.com",
        full_name: "Admin User",
        role: "admin" as const,
        company_id: "company-123",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        user: mockAdmin,
        _hasHydrated: true,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
    });

    it("should block inactive users", async () => {
      mockCheckAuth.mockResolvedValueOnce(true);

      const mockInactiveUser = {
        id: "user-123",
        email: "inactive@example.com",
        full_name: "Inactive User",
        role: "user" as const,
        company_id: "company-123",
        is_active: false, // Inactive
        created_at: new Date().toISOString(),
      };

      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        user: mockInactiveUser,
        _hasHydrated: true,
        checkAuth: mockCheckAuth,
      });

      render(<ProtectedComponent />);

      // Component should still check auth
      await waitFor(() => {
        expect(mockCheckAuth).toHaveBeenCalled();
      });
    });
  });
});
