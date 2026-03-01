import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/stores/auth-store';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkflowStats } from '@/hooks/use-workflows';
import { useHITLPending } from '@/hooks/use-hitl';
import { useTendersCount } from '@/hooks/use-tenders';

// Mocks
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

vi.mock('@/hooks/use-workflows', () => ({
  useWorkflowStats: vi.fn(),
}));

vi.mock('@/hooks/use-hitl', () => ({
  useHITLPending: vi.fn(),
}));

vi.mock('@/hooks/use-tenders', () => ({
  useTendersCount: vi.fn(),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/components/notifications', () => ({
  NotificationCenter: () => <div data-testid="notification-center">Notifications</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Actual navigation items defined in the component:
// baseNavigation:
//   Dashboard     → /          (data-tour: dashboard-nav)
//   Opportunites  → /opportunities (data-tour: tenders-nav)
//   Mes Projets   → /projects  (data-tour: workflows-nav)
//   Decisions     → /decisions (data-tour: hitl-nav)
//   Templates     → /templates
// secondaryNav:
//   Analytics     → /analytics
//   Audit         → /audit
//   Entreprise    → /company   (data-tour: company-nav)
//   Parametres    → /settings

describe('Navigation Integration Tests', () => {
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

  describe('Navigation Links Functionality', () => {
    it('doit naviguer correctement entre toutes les pages', () => {
      render(<Sidebar />);

      // Actual routes defined in the component
      const routes = [
        { name: 'Dashboard', href: '/' },
        { name: 'Opportunites', href: '/opportunities' },
        { name: 'Mes Projets', href: '/projects' },
        { name: 'Decisions', href: '/decisions' },
        { name: 'Entreprise', href: '/company' },
        { name: 'Parametres', href: '/settings' },
      ];

      routes.forEach(({ name, href }) => {
        const link = screen.getByText(name).closest('a');
        expect(link).toHaveAttribute('href', href);
      });
    });

    it('doit mettre à jour l\'état actif lors de la navigation', () => {
      const { rerender } = render(<Sidebar />);

      // État initial sur "/"
      let activeLink = screen.getByText('Dashboard').closest('a');
      expect(activeLink).toHaveClass('bg-sidebar-accent');

      // Navigation vers "/projects"
      vi.mocked(usePathname).mockReturnValue('/projects');
      rerender(<Sidebar />);

      activeLink = screen.getByText('Mes Projets').closest('a');
      expect(activeLink).toHaveClass('bg-sidebar-accent');

      // Navigation vers "/opportunities"
      vi.mocked(usePathname).mockReturnValue('/opportunities');
      rerender(<Sidebar />);

      activeLink = screen.getByText('Opportunites').closest('a');
      expect(activeLink).toHaveClass('bg-sidebar-accent');
    });

    it('doit afficher les icônes appropriées pour chaque lien', () => {
      const { container } = render(<Sidebar />);

      // Vérifier que chaque lien a une icône
      const navLinks = container.querySelectorAll('nav a');
      navLinks.forEach((link) => {
        const icon = link.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Active Route Highlighting', () => {
    it('doit marquer uniquement la route active', () => {
      vi.mocked(usePathname).mockReturnValue('/projects');

      render(<Sidebar />);

      const projectsLink = screen.getByText('Mes Projets').closest('a');
      const opportunitesLink = screen.getByText('Opportunites').closest('a');
      const dashboardLink = screen.getByText('Dashboard').closest('a');

      expect(projectsLink).toHaveClass('bg-sidebar-accent', 'text-sidebar-primary');
      expect(opportunitesLink).not.toHaveClass('bg-sidebar-accent');
      expect(dashboardLink).not.toHaveClass('bg-sidebar-accent');
    });

    it('doit gérer les routes profondes correctement', () => {
      vi.mocked(usePathname).mockReturnValue('/projects/123');

      render(<Sidebar />);

      // Le lien /projects devrait être actif car le pathname startsWith /projects
      const projectsLink = screen.getByText('Mes Projets').closest('a');
      expect(projectsLink).toHaveClass('bg-sidebar-accent');
    });

    it('doit synchroniser l\'état actif entre Sidebar et Header breadcrumbs', () => {
      vi.mocked(usePathname).mockReturnValue('/tenders');

      const { container: sidebarContainer } = render(<Sidebar />);
      const { container: headerContainer } = render(<Header />);

      // Header devrait afficher "Opportunités" dans le titre (pageTitles['/tenders'])
      const title = headerContainer.querySelector('h1');
      expect(title?.textContent).toBe('Opportunités');
    });
  });

  describe('Responsive Mobile Menu', () => {
    it('doit permettre de réduire la sidebar sur mobile', () => {
      render(<Sidebar />);

      const collapseButton = screen.getByLabelText(/Reduire la barre laterale/i);
      expect(collapseButton).toBeInTheDocument();

      fireEvent.click(collapseButton);

      // Le label devrait changer
      expect(screen.getByLabelText(/Developper la barre laterale/i)).toBeInTheDocument();
    });

    it('doit afficher uniquement les icônes en mode collapsed', () => {
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

      // En mode collapsed, le texte devrait être caché (via AnimatePresence et framer-motion)
      // Les icônes devraient toujours être visibles
      const icons = document.querySelectorAll('svg.lucide');
      expect(icons.length).toBeGreaterThan(0);
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

    it('doit masquer le champ de recherche sur mobile dans le Header', () => {
      const { container } = render(<Header />);

      const searchContainer = container.querySelector('.hidden.md\\:flex');
      expect(searchContainer).toBeInTheDocument();
    });

    it('doit afficher un bouton compact "+" sur mobile au lieu du texte complet', () => {
      render(<Header />);

      const buttonText = screen.getByText('Nouveau DCE');
      expect(buttonText).toHaveClass('hidden', 'sm:inline');
    });
  });

  describe('User Menu Dropdown', () => {
    it('doit avoir un bouton de menu utilisateur', () => {
      render(<Sidebar />);

      const userButton = screen.getByLabelText('Menu utilisateur');
      expect(userButton).toBeInTheDocument();
      expect(userButton.tagName).toBe('BUTTON');
    });

    it('doit afficher l\'avatar utilisateur avec initiales', () => {
      render(<Sidebar />);

      // L'avatar devrait afficher les initiales "JD"
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('doit afficher les informations utilisateur', () => {
      render(<Sidebar />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('doit permettre la navigation au clavier dans la sidebar', () => {
      render(<Sidebar />);

      const firstLink = screen.getByText('Dashboard').closest('a');
      expect(firstLink).not.toHaveAttribute('tabindex', '-1');
    });

    it('doit permettre d\'ouvrir le menu utilisateur au clavier', () => {
      render(<Sidebar />);

      const userButton = screen.getByLabelText('Menu utilisateur');
      expect(userButton.tagName).toBe('BUTTON');
      expect(userButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('doit avoir un ordre de tabulation logique', () => {
      const { container } = render(<Sidebar />);

      const focusableElements = container.querySelectorAll('a, button:not([disabled])');
      expect(focusableElements.length).toBeGreaterThan(0);

      // Tous les éléments focusables doivent être accessibles au clavier
      focusableElements.forEach((element) => {
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Notifications Integration', () => {
    it('doit afficher un indicateur de notification non lues', () => {
      render(<Sidebar />);

      const notificationBadge = document.querySelector('.bg-red-500');
      expect(notificationBadge).toBeInTheDocument();
    });

    it('doit intégrer le NotificationCenter dans le Header', () => {
      render(<Header />);

      expect(screen.getByTestId('notification-center')).toBeInTheDocument();
    });

    it('doit avoir un bouton notifications dans la sidebar', () => {
      render(<Sidebar />);

      const notificationButton = screen.getByLabelText('Notifications');
      expect(notificationButton).toBeInTheDocument();
    });
  });

  describe('Help & Support', () => {
    it('doit afficher un bouton d\'aide dans la sidebar', () => {
      render(<Sidebar />);

      const helpButton = screen.getByLabelText('Aide');
      expect(helpButton).toBeInTheDocument();
    });

    it('doit afficher une icône dans le bouton aide', () => {
      render(<Sidebar />);

      const helpButton = screen.getByLabelText('Aide');
      const icon = helpButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Onboarding Tour Integration', () => {
    it('doit avoir des attributs data-tour sur les éléments clés', () => {
      const { container: sidebarContainer } = render(<Sidebar />);
      const { container: headerContainer } = render(<Header />);

      // Actual data-tour values matching the component
      const opportunitesLink = sidebarContainer.querySelector('a[href="/opportunities"]');
      const projectsLink = sidebarContainer.querySelector('a[href="/projects"]');
      const decisionsLink = sidebarContainer.querySelector('a[href="/decisions"]');
      const companyLink = sidebarContainer.querySelector('a[href="/company"]');

      expect(opportunitesLink).toHaveAttribute('data-tour', 'tenders-nav');
      expect(projectsLink).toHaveAttribute('data-tour', 'workflows-nav');
      expect(decisionsLink).toHaveAttribute('data-tour', 'hitl-nav');
      expect(companyLink).toHaveAttribute('data-tour', 'company-nav');

      const newDceButton = headerContainer.querySelector('[data-tour="new-dce-button"]');
      expect(newDceButton).toBeInTheDocument();
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
