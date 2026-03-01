import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardLayout from '@/app/(dashboard)/layout';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/'),
}));

// Mock auth store
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
  useAuthHydration: vi.fn(),
}));

// Mock layout components
vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

vi.mock('@/components/layout/header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

vi.mock('@/components/layout/mobile-nav', () => ({
  MobileNav: () => <div data-testid="mobile-nav">MobileNav</div>,
}));

// Mock onboarding provider
vi.mock('@/components/onboarding/onboarding-tour', () => ({
  OnboardingProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="onboarding-provider">{children}</div>
  ),
}));

// Mock Skeleton
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('DashboardLayout Component', () => {
  const mockPush = vi.fn();
  const mockCheckAuth = vi.fn();

  const defaultAuthState = {
    user: {
      id: '1',
      email: 'test@example.com',
      full_name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      role: 'user' as const,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    isAuthenticated: true,
    accessToken: 'test-token',
    refreshToken: 'refresh-token',
    isLoading: false,
    _hasHydrated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshAccessToken: vi.fn(),
    setUser: vi.fn(),
    checkAuth: mockCheckAuth,
    setHasHydrated: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as any);

    vi.mocked(useAuthStore).mockReturnValue(defaultAuthState);

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('test-access-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    mockCheckAuth.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Check', () => {
    it('doit afficher le skeleton pendant la verification auth', () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      // Pendant le chargement, on devrait voir des skeletons
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('doit rediriger vers /login si pas de token', async () => {
      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('doit verifier la validite du token avec checkAuth', async () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockCheckAuth).toHaveBeenCalled();
      });
    });

    it('doit rediriger si le token est invalide', async () => {
      mockCheckAuth.mockResolvedValue(false);

      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('doit afficher le contenu si authentifie', async () => {
      mockCheckAuth.mockResolvedValue(true);

      render(
        <DashboardLayout>
          <div data-testid="test-content">Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });
    });
  });

  describe('Layout Structure', () => {
    it('doit rendre la sidebar', async () => {
      mockCheckAuth.mockResolvedValue(true);

      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });
    });

    it('doit rendre le header', async () => {
      mockCheckAuth.mockResolvedValue(true);

      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('doit wrapper le contenu avec OnboardingProvider', async () => {
      mockCheckAuth.mockResolvedValue(true);

      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-provider')).toBeInTheDocument();
      });
    });

    it('doit rendre le contenu enfant', async () => {
      mockCheckAuth.mockResolvedValue(true);

      render(
        <DashboardLayout>
          <div data-testid="child-content">Child Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByText('Child Content')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Layout', () => {
    it('doit avoir un padding-left pour la sidebar (260px)', async () => {
      mockCheckAuth.mockResolvedValue(true);

      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        const contentWrapper = container.querySelector('.lg\\:pl-\\[260px\\]');
        expect(contentWrapper).toBeInTheDocument();
      });
    });

    it('doit avoir une hauteur minimale pour le main', async () => {
      mockCheckAuth.mockResolvedValue(true);

      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        const main = container.querySelector('main');
        expect(main).toHaveClass('min-h-[calc(100vh-4rem)]');
      });
    });

    it('doit appliquer le background mesh', async () => {
      mockCheckAuth.mockResolvedValue(true);

      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        const wrapper = container.querySelector('.bg-mesh-light');
        expect(wrapper).toBeInTheDocument();
      });
    });
  });

  describe('Loading Skeleton', () => {
    it('doit afficher des content skeletons', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      // Pendant le chargement initial, on devrait voir des Skeleton components
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Transitions', () => {
    it('doit appliquer des transitions au content wrapper', async () => {
      mockCheckAuth.mockResolvedValue(true);

      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        const contentWrapper = container.querySelector('.transition-all.duration-300');
        expect(contentWrapper).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Children', () => {
    it('doit gerer plusieurs enfants', async () => {
      mockCheckAuth.mockResolvedValue(true);

      render(
        <DashboardLayout>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <div data-testid="child3">Child 3</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child1')).toBeInTheDocument();
        expect(screen.getByTestId('child2')).toBeInTheDocument();
        expect(screen.getByTestId('child3')).toBeInTheDocument();
      });
    });

    it('doit appliquer le padding au contenu', async () => {
      mockCheckAuth.mockResolvedValue(true);

      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      await waitFor(() => {
        const main = container.querySelector('main');
        expect(main).toHaveClass('p-4');
      });
    });
  });
});
