/**
 * Tests for use-auth (auth-store)
 * Tests authentication, login, logout, token management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/endpoints';
import type { User, AuthResponse } from '@/types';

// Mock the API module
vi.mock('@/lib/api/endpoints', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    me: vi.fn(),
  },
}));

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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock data
const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user',
  company_siret: '12345678901234',
  is_active: true,
  created_at: '2024-01-15T10:00:00Z',
};

const mockAuthResponse: AuthResponse = {
  access_token: 'access_token_123',
  refresh_token: 'refresh_token_456',
  token_type: 'bearer',
  user: mockUser,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear store state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: true,
    });

    // Clear localStorage
    localStorageMock.clear();

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('devrait se connecter avec succes', async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe('access_token_123');
      expect(result.current.refreshToken).toBe('refresh_token_456');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);

      // Verify localStorage
      expect(localStorageMock.getItem('access_token')).toBe('access_token_123');
      expect(localStorageMock.getItem('refresh_token')).toBe('refresh_token_456');
    });

    it('devrait gerer les erreurs de connexion', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(authApi.login).mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await expect(async () => {
        await act(async () => {
          await result.current.login('wrong@example.com', 'wrongpassword');
        });
      }).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('devrait mettre isLoading pendant la connexion', async () => {
      vi.mocked(authApi.login).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockAuthResponse), 100))
      );

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('register', () => {
    it('devrait s\'inscrire avec succes', async () => {
      vi.mocked(authApi.register).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        full_name: 'New User',
        company_siret: '12345678901234',
      };

      await act(async () => {
        await result.current.register(registerData);
      });

      expect(authApi.register).toHaveBeenCalledWith(registerData);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('devrait gerer les erreurs d\'inscription', async () => {
      const error = new Error('Email already exists');
      vi.mocked(authApi.register).mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await expect(async () => {
        await act(async () => {
          await result.current.register({
            email: 'existing@example.com',
            password: 'password123',
            full_name: 'Test User',
          });
        });
      }).rejects.toThrow('Email already exists');

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('devrait se deconnecter avec succes', async () => {
      // Setup authenticated state
      useAuthStore.setState({
        user: mockUser,
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        isAuthenticated: true,
      });

      localStorageMock.setItem('access_token', 'access_token_123');
      localStorageMock.setItem('refresh_token', 'refresh_token_456');

      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      // Verify localStorage cleared
      expect(localStorageMock.getItem('access_token')).toBeNull();
      expect(localStorageMock.getItem('refresh_token')).toBeNull();
    });

    it('devrait se deconnecter meme si l\'API echoue', async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        isAuthenticated: true,
      });

      vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear local state
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('devrait rafraichir le token avec succes', async () => {
      useAuthStore.setState({
        refreshToken: 'refresh_token_456',
      });

      vi.mocked(authApi.refresh).mockResolvedValue({
        access_token: 'new_access_token_789',
      });

      const { result } = renderHook(() => useAuthStore());

      let refreshResult: boolean = false;
      await act(async () => {
        refreshResult = await result.current.refreshAccessToken();
      });

      expect(authApi.refresh).toHaveBeenCalledWith('refresh_token_456');
      expect(result.current.accessToken).toBe('new_access_token_789');
      expect(refreshResult).toBe(true);
      expect(localStorageMock.getItem('access_token')).toBe('new_access_token_789');
    });

    it('devrait retourner false si pas de refresh token', async () => {
      useAuthStore.setState({
        refreshToken: null,
      });

      const { result } = renderHook(() => useAuthStore());

      let refreshResult: boolean = true;
      await act(async () => {
        refreshResult = await result.current.refreshAccessToken();
      });

      expect(authApi.refresh).not.toHaveBeenCalled();
      expect(refreshResult).toBe(false);
    });

    it('devrait se deconnecter en cas d\'echec de rafraichissement', async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: 'old_token',
        refreshToken: 'refresh_token_456',
        isAuthenticated: true,
      });

      vi.mocked(authApi.refresh).mockRejectedValue(new Error('Invalid refresh token'));
      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      let refreshResult: boolean = true;
      await act(async () => {
        refreshResult = await result.current.refreshAccessToken();
      });

      expect(refreshResult).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('devrait verifier l\'authentification avec succes', async () => {
      useAuthStore.setState({
        accessToken: 'access_token_123',
      });

      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      let authResult: boolean = false;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authApi.me).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(authResult).toBe(true);
    });

    it('devrait skip l\'API si deja authentifie avec user', async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: 'access_token_123',
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuthStore());

      let authResult: boolean = false;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authApi.me).not.toHaveBeenCalled();
      expect(authResult).toBe(true);
    });

    it('devrait retourner false si pas de token', async () => {
      useAuthStore.setState({
        accessToken: null,
      });

      const { result } = renderHook(() => useAuthStore());

      let authResult: boolean = true;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authApi.me).not.toHaveBeenCalled();
      expect(authResult).toBe(false);
    });

    it('devrait se deconnecter en cas d\'echec de verification', async () => {
      useAuthStore.setState({
        accessToken: 'invalid_token',
      });

      vi.mocked(authApi.me).mockRejectedValue(new Error('Invalid token'));
      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      let authResult: boolean = true;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authResult).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('devrait mettre a jour l\'utilisateur', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('persistence', () => {
    it('devrait sauvegarder l\'etat dans auth-storage', async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      const authStorage = localStorageMock.getItem('auth-storage');
      expect(authStorage).toBeTruthy();

      const parsed = JSON.parse(authStorage!);
      expect(parsed.state.user).toEqual(mockUser);
      expect(parsed.state.accessToken).toBe('access_token_123');
      expect(parsed.state.isAuthenticated).toBe(true);
    });
  });
});
