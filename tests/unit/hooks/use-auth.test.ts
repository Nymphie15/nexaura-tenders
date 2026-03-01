/**
 * Auth Store Tests
 * Tests for authentication state management with Zustand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock the API before importing the store
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockRefresh = vi.fn();
const mockMe = vi.fn();

vi.mock('@/lib/api/endpoints', () => ({
  authApi: {
    login: (...args: unknown[]) => mockLogin(...args),
    register: (...args: unknown[]) => mockRegister(...args),
    logout: (...args: unknown[]) => mockLogout(...args),
    refresh: (...args: unknown[]) => mockRefresh(...args),
    me: (...args: unknown[]) => mockMe(...args),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Now import the store after mocks are set up
import { useAuthStore } from '@/stores/auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { getState } = useAuthStore;
    act(() => {
      getState().logout();
    });
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('starts with no authenticated user', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Login', () => {
    it('successfully logs in user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
      };
      const mockResponse = {
        user: mockUser,
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
      };

      mockLogin.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password123');
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-token-123');
      expect(state.refreshToken).toBe('refresh-token-123');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('sets isLoading during login', async () => {
      let loadingState = false;
      mockLogin.mockImplementation(() => {
        loadingState = useAuthStore.getState().isLoading;
        return Promise.resolve({
          user: { id: '1' },
          access_token: 'token',
          refresh_token: 'refresh',
        });
      });

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password');
      });

      expect(loadingState).toBe(true);
    });

    it('throws error on failed login', async () => {
      const error = new Error('Invalid credentials');
      mockLogin.mockRejectedValueOnce(error);

      await expect(
        act(async () => {
          await useAuthStore.getState().login('test@example.com', 'wrong');
        })
      ).rejects.toThrow('Invalid credentials');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('stores tokens in localStorage', async () => {
      mockLogin.mockResolvedValueOnce({
        user: { id: '1' },
        access_token: 'access-123',
        refresh_token: 'refresh-123',
      });

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password');
      });

      expect(localStorage.getItem('access_token')).toBe('access-123');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-123');
    });
  });

  describe('Register', () => {
    it('successfully registers new user', async () => {
      const mockUser = {
        id: '456',
        email: 'newuser@example.com',
        full_name: 'New User',
      };
      const mockResponse = {
        user: mockUser,
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      mockRegister.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await useAuthStore.getState().register({
          email: 'newuser@example.com',
          password: 'password123',
          full_name: 'New User',
        });
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('handles registration error', async () => {
      mockRegister.mockRejectedValueOnce(new Error('Email already exists'));

      await expect(
        act(async () => {
          await useAuthStore.getState().register({
            email: 'existing@example.com',
            password: 'password',
            full_name: 'User',
          });
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('Logout', () => {
    it('clears user state on logout', async () => {
      // Setup authenticated state
      mockLogin.mockResolvedValueOnce({
        user: { id: '1' },
        access_token: 'token',
        refresh_token: 'refresh',
      });

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password');
      });

      mockLogout.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('clears localStorage on logout', async () => {
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh');

      mockLogout.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('continues logout even if API fails', async () => {
      mockLogout.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Refresh Token', () => {
    it('successfully refreshes access token', async () => {
      // Setup with refresh token
      useAuthStore.setState({
        refreshToken: 'valid-refresh-token',
        isAuthenticated: true,
      });

      mockRefresh.mockResolvedValueOnce({
        access_token: 'new-access-token',
      });

      let result: boolean = false;
      await act(async () => {
        result = await useAuthStore.getState().refreshAccessToken();
      });

      expect(result).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('new-access-token');
    });

    it('returns false when no refresh token', async () => {
      useAuthStore.setState({ refreshToken: null });

      let result: boolean = true;
      await act(async () => {
        result = await useAuthStore.getState().refreshAccessToken();
      });

      expect(result).toBe(false);
    });

    it('logs out on refresh failure', async () => {
      useAuthStore.setState({
        refreshToken: 'expired-token',
        isAuthenticated: true,
      });

      mockRefresh.mockRejectedValueOnce(new Error('Token expired'));
      mockLogout.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAuthStore.getState().refreshAccessToken();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('Check Auth', () => {
    it('returns true for valid session', async () => {
      useAuthStore.setState({ accessToken: 'valid-token' });
      mockMe.mockResolvedValueOnce({
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
      });

      let result: boolean = false;
      await act(async () => {
        result = await useAuthStore.getState().checkAuth();
      });

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('returns false when no access token', async () => {
      useAuthStore.setState({ accessToken: null });

      const result = await useAuthStore.getState().checkAuth();

      expect(result).toBe(false);
    });

    it('logs out on check failure', async () => {
      useAuthStore.setState({ accessToken: 'invalid-token' });
      mockMe.mockRejectedValueOnce(new Error('Unauthorized'));
      mockLogout.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAuthStore.getState().checkAuth();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('updates user without changing auth state', () => {
      const newUser = {
        id: '1',
        email: 'updated@example.com',
        full_name: 'Updated Name',
      };

      act(() => {
        useAuthStore.getState().setUser(newUser as any);
      });

      expect(useAuthStore.getState().user).toEqual(newUser);
    });
  });

  describe('Hydration', () => {
    it('tracks hydration state', () => {
      expect(useAuthStore.getState()._hasHydrated).toBeDefined();
    });

    it('allows setting hydration state', () => {
      act(() => {
        useAuthStore.getState().setHasHydrated(true);
      });

      expect(useAuthStore.getState()._hasHydrated).toBe(true);
    });
  });
});
