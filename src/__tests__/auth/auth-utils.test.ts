import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateMockJWT,
  generateExpiredMockJWT,
  TEST_TOKENS,
} from "./test-helpers";

describe("Auth Utilities", () => {
  describe("JWT Token Utilities", () => {
    it("should generate a valid JWT structure", () => {
      const token = generateMockJWT({ sub: "user-123" });

      expect(token).toMatch(/^[A-Za-z0-9-_+/=]+\.[A-Za-z0-9-_+/=]+\.[A-Za-z0-9-_+/=]+$/);

      const parts = token.split(".");
      expect(parts).toHaveLength(3);
    });

    it("should decode JWT payload", () => {
      const payload = { sub: "user-456", role: "admin" };
      const token = generateMockJWT(payload);

      const parts = token.split(".");
      const decodedPayload = JSON.parse(atob(parts[1]));

      expect(decodedPayload.sub).toBe("user-456");
      expect(decodedPayload.role).toBe("admin");
      expect(decodedPayload.exp).toBeDefined();
    });

    it("should generate expired token", () => {
      const token = generateExpiredMockJWT();
      const parts = token.split(".");
      const payload = JSON.parse(atob(parts[1]));

      const now = Math.floor(Date.now() / 1000);
      expect(payload.exp).toBeLessThan(now);
    });

    it("should generate valid (non-expired) token by default", () => {
      const token = generateMockJWT();
      const parts = token.split(".");
      const payload = JSON.parse(atob(parts[1]));

      const now = Math.floor(Date.now() / 1000);
      expect(payload.exp).toBeGreaterThan(now);
    });
  });

  describe("Token Validation", () => {
    const isTokenExpired = (token: string): boolean => {
      try {
        const parts = token.split(".");
        if (parts.length !== 3) return true;

        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);

        return payload.exp < now;
      } catch {
        return true;
      }
    };

    it("should detect expired tokens", () => {
      const expiredToken = generateExpiredMockJWT();
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it("should detect valid tokens", () => {
      const validToken = generateMockJWT();
      expect(isTokenExpired(validToken)).toBe(false);
    });

    it("should detect malformed tokens", () => {
      expect(isTokenExpired("not-a-token")).toBe(true);
      expect(isTokenExpired("invalid.token")).toBe(true);
      expect(isTokenExpired("")).toBe(true);
    });

    it("should handle tokens with invalid base64", () => {
      const invalidToken = "header.!!!invalid-base64!!!.signature";
      expect(isTokenExpired(invalidToken)).toBe(true);
    });
  });

  describe("Token Extraction", () => {
    const extractUserId = (token: string): string | null => {
      try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));
        return payload.sub || null;
      } catch {
        return null;
      }
    };

    it("should extract user ID from token", () => {
      const token = generateMockJWT({ sub: "user-789" });
      const userId = extractUserId(token);

      expect(userId).toBe("user-789");
    });

    it("should return null for invalid token", () => {
      expect(extractUserId("invalid-token")).toBeNull();
      expect(extractUserId("")).toBeNull();
    });

    it("should extract custom claims", () => {
      const token = generateMockJWT({
        sub: "user-123",
        role: "admin",
        company_id: "company-456",
      });

      const parts = token.split(".");
      const payload = JSON.parse(atob(parts[1]));

      expect(payload.role).toBe("admin");
      expect(payload.company_id).toBe("company-456");
    });
  });

  describe("Token Storage Helpers", () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const setTokens = (access: string, refresh: string) => {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    };

    const getTokens = () => ({
      access: localStorage.getItem("access_token"),
      refresh: localStorage.getItem("refresh_token"),
    });

    const clearTokens = () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    };

    it("should store and retrieve tokens", () => {
      setTokens("access-123", "refresh-456");

      const tokens = getTokens();
      expect(tokens.access).toBe("access-123");
      expect(tokens.refresh).toBe("refresh-456");
    });

    it("should clear tokens", () => {
      setTokens("access-123", "refresh-456");
      clearTokens();

      const tokens = getTokens();
      expect(tokens.access).toBeNull();
      expect(tokens.refresh).toBeNull();
    });

    it("should handle missing tokens", () => {
      const tokens = getTokens();
      expect(tokens.access).toBeNull();
      expect(tokens.refresh).toBeNull();
    });
  });

  describe("Auth Header Generation", () => {
    const createAuthHeader = (token: string | null): Record<string, string> => {
      if (!token) return {};
      return {
        Authorization: `Bearer ${token}`,
      };
    };

    it("should create Bearer token header", () => {
      const header = createAuthHeader("my-token-123");

      expect(header.Authorization).toBe("Bearer my-token-123");
    });

    it("should return empty object for null token", () => {
      const header = createAuthHeader(null);

      expect(header).toEqual({});
    });

    it("should format token correctly", () => {
      const token = generateMockJWT();
      const header = createAuthHeader(token);

      expect(header.Authorization).toMatch(/^Bearer [A-Za-z0-9-_+/=]+\.[A-Za-z0-9-_+/=]+\.[A-Za-z0-9-_+/=]+$/);
    });
  });

  describe("Session Timeout Calculation", () => {
    const getSessionTimeRemaining = (token: string): number => {
      try {
        const parts = token.split(".");
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, payload.exp - now);
      } catch {
        return 0;
      }
    };

    it("should calculate time remaining for valid token", () => {
      const token = generateMockJWT();
      const timeRemaining = getSessionTimeRemaining(token);

      expect(timeRemaining).toBeGreaterThan(0);
      expect(timeRemaining).toBeLessThanOrEqual(3600); // 1 hour
    });

    it("should return 0 for expired token", () => {
      const token = generateExpiredMockJWT();
      const timeRemaining = getSessionTimeRemaining(token);

      expect(timeRemaining).toBe(0);
    });

    it("should return 0 for invalid token", () => {
      expect(getSessionTimeRemaining("invalid")).toBe(0);
      expect(getSessionTimeRemaining("")).toBe(0);
    });
  });

  describe("Token Refresh Logic", () => {
    const shouldRefreshToken = (token: string, bufferSeconds: number = 300): boolean => {
      try {
        const parts = token.split(".");
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);

        // Refresh if token expires in less than buffer time
        return payload.exp - now < bufferSeconds;
      } catch {
        return true; // Invalid token should trigger refresh
      }
    };

    it("should suggest refresh for soon-to-expire token", () => {
      // Token expiring in 2 minutes
      const token = generateMockJWT({ exp: Math.floor(Date.now() / 1000) + 120 });

      expect(shouldRefreshToken(token, 300)).toBe(true); // 5 min buffer
    });

    it("should not suggest refresh for fresh token", () => {
      // Token expiring in 30 minutes
      const token = generateMockJWT({ exp: Math.floor(Date.now() / 1000) + 1800 });

      expect(shouldRefreshToken(token, 300)).toBe(false); // 5 min buffer
    });

    it("should suggest refresh for expired token", () => {
      const expiredToken = generateExpiredMockJWT();

      expect(shouldRefreshToken(expiredToken)).toBe(true);
    });

    it("should suggest refresh for invalid token", () => {
      expect(shouldRefreshToken("invalid-token")).toBe(true);
    });
  });

  describe("Auth State Validation", () => {
    const isValidAuthState = (state: {
      user: any;
      accessToken: string | null;
      isAuthenticated: boolean;
    }): boolean => {
      // Must have all three or none
      const hasUser = state.user !== null;
      const hasToken = state.accessToken !== null;
      const isAuth = state.isAuthenticated;

      if (isAuth) {
        return hasUser && hasToken;
      } else {
        return !hasUser && !hasToken;
      }
    };

    it("should validate correct authenticated state", () => {
      const state = {
        user: { id: "123", email: "test@example.com" },
        accessToken: "token-123",
        isAuthenticated: true,
      };

      expect(isValidAuthState(state)).toBe(true);
    });

    it("should validate correct unauthenticated state", () => {
      const state = {
        user: null,
        accessToken: null,
        isAuthenticated: false,
      };

      expect(isValidAuthState(state)).toBe(true);
    });

    it("should detect invalid state (authenticated but no token)", () => {
      const state = {
        user: { id: "123", email: "test@example.com" },
        accessToken: null,
        isAuthenticated: true,
      };

      expect(isValidAuthState(state)).toBe(false);
    });

    it("should detect invalid state (authenticated but no user)", () => {
      const state = {
        user: null,
        accessToken: "token-123",
        isAuthenticated: true,
      };

      expect(isValidAuthState(state)).toBe(false);
    });

    it("should detect invalid state (token without authentication)", () => {
      const state = {
        user: null,
        accessToken: "token-123",
        isAuthenticated: false,
      };

      expect(isValidAuthState(state)).toBe(false);
    });
  });

  describe("Email Validation", () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it("should validate correct email formats", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("test.user@company.co.uk")).toBe(true);
      expect(isValidEmail("admin+tag@domain.org")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(isValidEmail("notanemail")).toBe(false);
      expect(isValidEmail("missing@domain")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("Password Strength Validation", () => {
    const isStrongPassword = (password: string): boolean => {
      // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
      if (password.length < 8) return false;
      if (!/[A-Z]/.test(password)) return false;
      if (!/[a-z]/.test(password)) return false;
      if (!/[0-9]/.test(password)) return false;
      return true;
    };

    it("should accept strong passwords", () => {
      expect(isStrongPassword("Password123")).toBe(true);
      expect(isStrongPassword("MyP@ssw0rd")).toBe(true);
      expect(isStrongPassword("SecurePass1")).toBe(true);
    });

    it("should reject weak passwords", () => {
      expect(isStrongPassword("weak")).toBe(false);
      expect(isStrongPassword("alllowercase1")).toBe(false);
      expect(isStrongPassword("ALLUPPERCASE1")).toBe(false);
      expect(isStrongPassword("NoNumbers")).toBe(false);
      expect(isStrongPassword("Short1")).toBe(false);
    });
  });

  describe("Remember Me Functionality", () => {
    const REMEMBER_ME_KEY = "remember_me_email";

    const rememberEmail = (email: string) => {
      localStorage.setItem(REMEMBER_ME_KEY, email);
    };

    const getRememberedEmail = (): string | null => {
      return localStorage.getItem(REMEMBER_ME_KEY);
    };

    const forgetEmail = () => {
      localStorage.removeItem(REMEMBER_ME_KEY);
    };

    beforeEach(() => {
      localStorage.clear();
    });

    it("should remember email", () => {
      rememberEmail("user@example.com");
      expect(getRememberedEmail()).toBe("user@example.com");
    });

    it("should forget email", () => {
      rememberEmail("user@example.com");
      forgetEmail();
      expect(getRememberedEmail()).toBeNull();
    });

    it("should return null when no email remembered", () => {
      expect(getRememberedEmail()).toBeNull();
    });
  });
});
