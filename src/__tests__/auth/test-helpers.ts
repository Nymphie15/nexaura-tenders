/**
 * Test Helpers for Authentication Tests
 *
 * Utilities, mocks, and fixtures for auth testing
 */

import type { User } from "@/types";

/**
 * Mock user factory
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: "user-123",
  email: "test@example.com",
  full_name: "Test User",
  role: "user",
  company_id: "company-123",
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Mock auth response factory
 */
export const createMockAuthResponse = (
  userOverrides?: Partial<User>
) => ({
  user: createMockUser(userOverrides),
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
});

/**
 * Mock admin user
 */
export const createMockAdminUser = (): User =>
  createMockUser({
    id: "admin-123",
    email: "admin@example.com",
    full_name: "Admin User",
    role: "admin",
  });

/**
 * Mock inactive user
 */
export const createMockInactiveUser = (): User =>
  createMockUser({
    id: "inactive-123",
    email: "inactive@example.com",
    full_name: "Inactive User",
    is_active: false,
  });

/**
 * Wait for async updates
 */
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Setup localStorage with auth data
 */
export const setupAuthStorage = (
  accessToken: string = "test-token",
  refreshToken: string = "test-refresh",
  user?: User
) => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);

  if (user) {
    const authData = {
      state: {
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      },
      version: 0,
    };
    localStorage.setItem("auth-storage", JSON.stringify(authData));
  }
};

/**
 * Clear all auth-related storage
 */
export const clearAuthStorage = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("auth-storage");
  sessionStorage.clear();
};

/**
 * Mock successful API responses
 */
export const mockApiSuccess = {
  login: (user?: User) => ({
    user: user || createMockUser(),
    access_token: "new-access-token",
    refresh_token: "new-refresh-token",
  }),

  register: (user?: User) => ({
    user: user || createMockUser(),
    access_token: "new-access-token",
    refresh_token: "new-refresh-token",
  }),

  refresh: (token: string = "refreshed-token") => ({
    access_token: token,
  }),

  me: (user?: User) => user || createMockUser(),
};

/**
 * Mock API errors
 */
export const mockApiErrors = {
  unauthorized: () => {
    const error = new Error("Unauthorized");
    (error as any).response = {
      status: 401,
      data: { detail: "Invalid credentials" },
    };
    return error;
  },

  forbidden: () => {
    const error = new Error("Forbidden");
    (error as any).response = {
      status: 403,
      data: { detail: "Access denied" },
    };
    return error;
  },

  badRequest: (message: string = "Bad request") => {
    const error = new Error(message);
    (error as any).response = {
      status: 400,
      data: { detail: message },
    };
    return error;
  },

  serverError: () => {
    const error = new Error("Internal server error");
    (error as any).response = {
      status: 500,
      data: { detail: "Internal server error" },
    };
    return error;
  },

  networkError: () => {
    const error = new Error("Network error");
    (error as any).code = "ECONNABORTED";
    return error;
  },

  tokenExpired: () => {
    const error = new Error("Token expired");
    (error as any).response = {
      status: 401,
      data: { detail: "Token has expired" },
    };
    return error;
  },

  refreshTokenExpired: () => {
    const error = new Error("Refresh token expired");
    (error as any).response = {
      status: 401,
      data: { detail: "Refresh token is invalid or expired" },
    };
    return error;
  },
};

/**
 * Assert localStorage contains auth tokens
 */
export const assertTokensStored = (
  accessToken?: string,
  refreshToken?: string
) => {
  const storedAccess = localStorage.getItem("access_token");
  const storedRefresh = localStorage.getItem("refresh_token");

  if (accessToken) {
    expect(storedAccess).toBe(accessToken);
  } else {
    expect(storedAccess).toBeTruthy();
  }

  if (refreshToken) {
    expect(storedRefresh).toBe(refreshToken);
  } else {
    expect(storedRefresh).toBeTruthy();
  }
};

/**
 * Assert localStorage is cleared
 */
export const assertTokensCleared = () => {
  expect(localStorage.getItem("access_token")).toBeNull();
  expect(localStorage.getItem("refresh_token")).toBeNull();
  expect(localStorage.getItem("auth-storage")).toBeNull();
};

/**
 * Assert auth state in Zustand store
 */
export const assertAuthState = (
  state: any,
  expected: {
    isAuthenticated?: boolean;
    hasUser?: boolean;
    hasToken?: boolean;
    isLoading?: boolean;
  }
) => {
  if (expected.isAuthenticated !== undefined) {
    expect(state.isAuthenticated).toBe(expected.isAuthenticated);
  }

  if (expected.hasUser !== undefined) {
    if (expected.hasUser) {
      expect(state.user).toBeTruthy();
    } else {
      expect(state.user).toBeNull();
    }
  }

  if (expected.hasToken !== undefined) {
    if (expected.hasToken) {
      expect(state.accessToken).toBeTruthy();
    } else {
      expect(state.accessToken).toBeNull();
    }
  }

  if (expected.isLoading !== undefined) {
    expect(state.isLoading).toBe(expected.isLoading);
  }
};

/**
 * Mock router push with assertion helper
 */
export const createMockRouter = () => {
  const push = vi.fn();
  const replace = vi.fn();
  const back = vi.fn();
  const forward = vi.fn();
  const refresh = vi.fn();
  const prefetch = vi.fn();

  return {
    push,
    replace,
    back,
    forward,
    refresh,
    prefetch,
    assertRedirectedTo: (path: string) => {
      expect(push).toHaveBeenCalledWith(path);
    },
    assertNotRedirected: () => {
      expect(push).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    },
  };
};

/**
 * Mock toast with assertion helpers
 */
export const createMockToast = () => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),

  assertSuccessShown: (message?: string) => {
    expect(toast.success).toHaveBeenCalled();
    if (message) {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining(message),
        expect.anything()
      );
    }
  },

  assertErrorShown: (message?: string) => {
    expect(toast.error).toHaveBeenCalled();
    if (message) {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining(message),
        expect.anything()
      );
    }
  },
});

/**
 * Delay helper for testing async flows
 */
export const delay = (ms: number = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate mock JWT token (not cryptographically valid, just for testing structure)
 */
export const generateMockJWT = (payload: Record<string, any> = {}) => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(
    JSON.stringify({
      sub: "user-123",
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      ...payload,
    })
  );
  const signature = "mock-signature";

  return `${header}.${body}.${signature}`;
};

/**
 * Generate expired mock JWT
 */
export const generateExpiredMockJWT = () => {
  return generateMockJWT({
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  });
};

/**
 * Mock Axios error
 */
export const createAxiosError = (
  status: number,
  data: any = {},
  config: any = {}
) => ({
  config,
  response: {
    status,
    data,
    statusText: getStatusText(status),
    headers: {},
    config,
  },
  isAxiosError: true,
  toJSON: () => ({}),
  name: "AxiosError",
  message: `Request failed with status code ${status}`,
});

/**
 * Get HTTP status text
 */
const getStatusText = (status: number): string => {
  const statusTexts: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };
  return statusTexts[status] || "Unknown";
};

/**
 * Test data constants
 */
export const TEST_CREDENTIALS = {
  valid: {
    email: "test@example.com",
    password: "Password123!",
  },
  invalid: {
    email: "wrong@example.com",
    password: "wrongpassword",
  },
  admin: {
    email: "admin@example.com",
    password: "AdminPass123!",
  },
};

export const TEST_TOKENS = {
  access: "test-access-token-xyz123",
  refresh: "test-refresh-token-abc456",
  expired: generateExpiredMockJWT(),
  valid: generateMockJWT(),
};

// Export vi for convenience
import { vi, expect } from "vitest";
import { toast } from "sonner";

export { vi, expect };
