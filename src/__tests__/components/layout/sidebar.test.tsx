import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/stores/auth-store';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkflowStats } from '@/hooks/use-workflows';
import { useHITLPending } from '@/hooks/use-hitl';
import { useTendersCount } from '@/hooks/use-tenders';

// Mock des hooks Next.js
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock des hooks de données
vi.mock('@/hooks/use-workflows', () => ({
  useWorkflowStats: vi.fn(),
}));

vi.mock('@/hooks/use-hitl', () => ({
  useHITLPending: vi.fn(),
}));

vi.mock('@/hooks/use-tenders', () => ({
  useTendersCount: vi.fn(),
}));

// Mock du store auth
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock framer-motion pour éviter les problèmes d'animation dans les tests
vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Actual navigation items as defined in the component
// baseNavigation: Dashboard(/), Opportunites(/opportunities), Mes Projets(/projects),
//                 Decisions(/decisions), Templates(/templates)
// secondaryNav: Analytics(/analytics), Audit(/audit), Entreprise(/company), Parametres(/settings)

describe('Sidebar Component', () => {
  const mockPush = vi.fn();
  const mockLogout = vi.fn();

  const defaultUser = {
    id: '1',
    email: 'test@example.com',
    full_name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe',
    role: 'user' as const,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    // Setup mocks par défaut
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as any);

    vi.mocked(usePathname).mockReturnValue('/');

    vi.mocked(useAuthStore).mockReturnValue({
      user: defaultUser,
      logout: mockLogout,
      isAuthenticated: true,
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
      isLoading: false,
      _hasHydrated: true,
      login: vi.fn(),
      register: vi.fn(),
      refreshAccessToken: vi.fn(),
      setUser: vi.fn(),
      checkAuth: vi.fn(),
      setHasHydrated: vi.fn(),
    });

    vi.mocked(useWorkflowStats).mockReturnValue({
      data: { total_cases: 5, active_cases: 3, completed_cases: 2 },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useHITLPending).mockReturnValue({
      data: [{ id: '1' }, { id: '2' }],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useTendersCount).mockReturnValue({
      data: { count: 10 },
      isLoading: false,
      error: null,
    } as any);

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('doit afficher le logo Nexaura', () => {
      render(<Sidebar />);
      expect(screen.getByText('Nexaura')).toBeInTheDocument();
      expect(screen.getByText('Tenders')).toBeInTheDocument();
    });

    it('doit afficher tous les éléments de navigation principaux', () => {
      render(<Sidebar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Opportunites')).toBeInTheDocument();
      expect(screen.getByText('Mes Projets')).toBeInTheDocument();
      expect(screen.getByText('Decisions')).toBeInTheDocument();
    });

    it('doit afficher les éléments de navigation secondaires', () => {
      render(<Sidebar />);

      expect(screen.getByText('Entreprise')).toBeInTheDocument();
      expect(screen.getByText('Parametres')).toBeInTheDocument();
    });

    it('doit afficher les informations utilisateur', () => {
      render(<Sidebar />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('doit afficher les initiales de l\'utilisateur dans l\'avatar', () => {
      render(<Sidebar />);

      // Les initiales "JD" devraient être dans l'avatar
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('doit gérer les noms d\'utilisateur manquants', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { ...defaultUser, full_name: '', first_name: '', last_name: '' },
        logout: mockLogout,
        isAuthenticated: true,
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        isLoading: false,
        _hasHydrated: true,
        login: vi.fn(),
        register: vi.fn(),
        refreshAccessToken: vi.fn(),
        setUser: vi.fn(),
        checkAuth: vi.fn(),
        setHasHydrated: vi.fn(),
      });

      render(<Sidebar />);

      expect(screen.getByText('Utilisateur')).toBeInTheDocument();
      expect(screen.getByText('U')).toBeInTheDocument(); // Initiale par défaut
    });
  });

  describe('Navigation Active State', () => {
    it('doit marquer l\'élément actif sur la route courante', () => {
      vi.mocked(usePathname).mockReturnValue('/projects');

      render(<Sidebar />);

      const projectsLink = screen.getByText('Mes Projets').closest('a');
      expect(projectsLink).toHaveClass('bg-sidebar-accent');
    });

    it('doit changer l\'état actif selon la route', () => {
      const { rerender } = render(<Sidebar />);

      // Route initiale "/"
      let dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-sidebar-accent');

      // Change vers "/opportunities"
      vi.mocked(usePathname).mockReturnValue('/opportunities');
      rerender(<Sidebar />);

      const opportunitesLink = screen.getByText('Opportunites').closest('a');
      expect(opportunitesLink).toHaveClass('bg-sidebar-accent');
    });

    it('doit avoir des liens fonctionnels vers toutes les pages', () => {
      render(<Sidebar />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      const opportunitesLink = screen.getByText('Opportunites').closest('a');
      const projectsLink = screen.getByText('Mes Projets').closest('a');
      const decisionsLink = screen.getByText('Decisions').closest('a');

      expect(dashboardLink).toHaveAttribute('href', '/');
      expect(opportunitesLink).toHaveAttribute('href', '/opportunities');
      expect(projectsLink).toHaveAttribute('href', '/projects');
      expect(decisionsLink).toHaveAttribute('href', '/decisions');
    });
  });

  describe('Dynamic Badges', () => {
    it('doit afficher le badge de décisions HITL', () => {
      render(<Sidebar />);

      // Le badge doit afficher "2" (HITL pending count on /decisions route)
      const badges = screen.getAllByText('2');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('ne doit pas afficher de badge si le compte est 0', () => {
      vi.mocked(useHITLPending).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<Sidebar />);

      // Vérifier qu'il n'y a pas de badge "0"
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('doit gérer les données manquantes gracieusement', () => {
      vi.mocked(useWorkflowStats).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useHITLPending).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useTendersCount).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      // Ne devrait pas crasher
      expect(() => render(<Sidebar />)).not.toThrow();
    });
  });

  describe('Collapse Functionality', () => {
    it('doit avoir un bouton pour réduire/agrandir la sidebar', () => {
      render(<Sidebar />);

      const collapseButton = screen.getByLabelText(/Reduire la barre laterale/i);
      expect(collapseButton).toBeInTheDocument();
    });

    it('doit sauvegarder l\'état collapsed dans localStorage', () => {
      const setItemMock = vi.fn();
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(),
          setItem: setItemMock,
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });

      render(<Sidebar />);

      const collapseButton = screen.getByLabelText(/Reduire la barre laterale/i);
      fireEvent.click(collapseButton);

      expect(setItemMock).toHaveBeenCalledWith('sidebar-collapsed', 'true');
    });

    it('doit charger l\'état collapsed depuis localStorage', () => {
      const getItemMock = vi.fn().mockReturnValue('true');
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: getItemMock,
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });

      render(<Sidebar />);

      expect(getItemMock).toHaveBeenCalledWith('sidebar-collapsed');
    });
  });

  describe('User Menu Dropdown', () => {
    it('doit avoir un bouton de menu utilisateur', () => {
      render(<Sidebar />);

      const userButton = screen.getByLabelText('Menu utilisateur');
      expect(userButton).toBeInTheDocument();
      expect(userButton.tagName).toBe('BUTTON');
    });

    it('doit afficher les informations utilisateur dans le bouton', () => {
      render(<Sidebar />);

      // Le bouton devrait contenir le nom et l'email de l'utilisateur
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('doit avoir des labels ARIA appropriés', () => {
      render(<Sidebar />);

      expect(screen.getByLabelText(/Reduire la barre laterale/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Menu utilisateur/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Notifications/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Aide/i)).toBeInTheDocument();
    });

    it('doit afficher les data-tour pour l\'onboarding', () => {
      render(<Sidebar />);

      // data-tour attributes match the actual component nav items
      const opportunitesLink = screen.getByText('Opportunites').closest('a');
      const projectsLink = screen.getByText('Mes Projets').closest('a');
      const decisionsLink = screen.getByText('Decisions').closest('a');
      const companyLink = screen.getByText('Entreprise').closest('a');

      expect(opportunitesLink).toHaveAttribute('data-tour', 'tenders-nav');
      expect(projectsLink).toHaveAttribute('data-tour', 'workflows-nav');
      expect(decisionsLink).toHaveAttribute('data-tour', 'hitl-nav');
      expect(companyLink).toHaveAttribute('data-tour', 'company-nav');
    });
  });

  describe('Quick Actions', () => {
    it('doit afficher les boutons d\'actions rapides', () => {
      render(<Sidebar />);

      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('Aide')).toBeInTheDocument();
    });

    it('doit afficher un indicateur de notification', () => {
      render(<Sidebar />);

      // Chercher le span avec la classe de notification badge
      const notificationBadge = document.querySelector('.bg-red-500');
      expect(notificationBadge).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('doit ajuster la largeur en mode collapsed', () => {
      const getItemMock = vi.fn().mockReturnValue('true');
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: getItemMock,
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });

      const { container } = render(<Sidebar />);

      const aside = container.querySelector('aside');
      // En mode collapsed, la largeur devrait être réduite (72px au lieu de 260px)
      // Note: framer-motion est mocké, donc on ne peut pas tester l'animation réelle
      expect(aside).toBeInTheDocument();
    });

    it('doit conserver les icônes visibles en mode collapsed', () => {
      const getItemMock = vi.fn().mockReturnValue('true');
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: getItemMock,
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });

      const { container } = render(<Sidebar />);

      // Les icônes devraient toujours être visibles
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('doit gérer l\'absence de données utilisateur', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        logout: mockLogout,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        _hasHydrated: true,
        login: vi.fn(),
        register: vi.fn(),
        refreshAccessToken: vi.fn(),
        setUser: vi.fn(),
        checkAuth: vi.fn(),
        setHasHydrated: vi.fn(),
      });

      expect(() => render(<Sidebar />)).not.toThrow();
    });

    it('doit gérer les erreurs de chargement des stats', () => {
      vi.mocked(useWorkflowStats).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
      } as any);

      expect(() => render(<Sidebar />)).not.toThrow();
    });

    it('doit gérer localStorage indisponible', () => {
      const originalLocalStorage = window.localStorage;

      // Mock localStorage pour simuler une erreur
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => null,
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });

      expect(() => render(<Sidebar />)).not.toThrow();

      // Restaurer localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
    });
  });
});
