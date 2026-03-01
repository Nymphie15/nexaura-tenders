import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/components/layout/header';
import { usePathname, useRouter } from 'next/navigation';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock NotificationCenter
vi.mock('@/components/notifications', () => ({
  NotificationCenter: ({ getToken }: { getToken: () => string | null }) => (
    <button aria-label="Notifications" onClick={() => getToken()}>
      Notifications
    </button>
  ),
}));

describe('Header Component', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/');
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('doit afficher le titre de la page d\'accueil par defaut', () => {
      render(<Header />);

      expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    });

    it('doit afficher le titre pour chaque page', () => {
      const pages = [
        { path: '/', title: 'Tableau de bord' },
        { path: '/tenders', title: 'Opportunités' },
        { path: '/company', title: 'Profil entreprise' },
        { path: '/settings', title: 'Paramètres' },
      ];

      pages.forEach(({ path, title }) => {
        vi.mocked(usePathname).mockReturnValue(path);
        const { unmount } = render(<Header />);

        // Use heading role to avoid matching breadcrumb spans with same text
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);

        unmount();
      });
    });

    it('doit afficher un titre par defaut pour les pages inconnues', () => {
      vi.mocked(usePathname).mockReturnValue('/unknown-page');

      render(<Header />);

      expect(screen.getByText('Page')).toBeInTheDocument();
    });

    it('doit afficher le champ de recherche', () => {
      render(<Header />);

      const searchInput = screen.getByPlaceholderText("Rechercher un appel d'offres...");
      expect(searchInput).toBeInTheDocument();
    });

    it('doit afficher le bouton "Nouveau DCE"', () => {
      render(<Header />);

      const newDceButton = screen.getByLabelText('Créer un nouveau DCE');
      expect(newDceButton).toBeInTheDocument();
      expect(screen.getByText('Nouveau DCE')).toBeInTheDocument();
    });

    it('doit afficher le centre de notifications', () => {
      render(<Header />);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  describe('Breadcrumbs', () => {
    it('ne doit pas afficher les breadcrumbs sur la page d\'accueil', () => {
      vi.mocked(usePathname).mockReturnValue('/');

      render(<Header />);

      // Il devrait y avoir seulement "Tableau de bord" (le titre), pas de breadcrumbs
      const breadcrumbs = screen.queryByRole('navigation');
      expect(breadcrumbs).not.toBeInTheDocument();
    });

    it('doit afficher les breadcrumbs pour les pages profondes', () => {
      vi.mocked(usePathname).mockReturnValue('/tenders');

      render(<Header />);

      const breadcrumbNav = screen.getByRole('navigation');
      expect(breadcrumbNav).toBeInTheDocument();

      // Doit contenir "Accueil" et "Opportunites"
      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getAllByText('Opportunités').length).toBeGreaterThan(0);
    });

    it('doit avoir des liens fonctionnels dans les breadcrumbs', () => {
      vi.mocked(usePathname).mockReturnValue('/tenders');

      render(<Header />);

      const homeLink = screen.getByText('Accueil').closest('a');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('doit marquer le dernier element comme actif (non cliquable)', () => {
      vi.mocked(usePathname).mockReturnValue('/tenders');

      render(<Header />);

      const breadcrumbNav = screen.getByRole('navigation');
      const lastItem = breadcrumbNav.querySelector('span.font-medium.text-foreground');
      expect(lastItem).toHaveTextContent('Opportunités');
    });

    it('doit gerer les chemins multi-niveaux', () => {
      vi.mocked(usePathname).mockReturnValue('/tenders/123');

      render(<Header />);

      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getAllByText('Opportunités').length).toBeGreaterThan(0);
    });

    it('doit capitaliser les segments inconnus', () => {
      vi.mocked(usePathname).mockReturnValue('/unknown-page');

      render(<Header />);

      expect(screen.getByText('Unknown-page')).toBeInTheDocument();
    });

    it('doit afficher les icones ChevronRight entre les elements', () => {
      vi.mocked(usePathname).mockReturnValue('/tenders');

      const { container } = render(<Header />);

      // Chercher les SVG chevron (classe peut varier)
      const chevrons = container.querySelectorAll('svg');
      expect(chevrons.length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    it('doit avoir un champ de recherche avec le bon placeholder', () => {
      render(<Header />);

      const searchInput = screen.getByPlaceholderText("Rechercher un appel d'offres...");
      expect(searchInput).toBeInTheDocument();
    });

    it('doit afficher le raccourci clavier Ctrl+K', () => {
      render(<Header />);

      const kbd = screen.getByText('Ctrl+K');
      expect(kbd).toBeInTheDocument();
      expect(kbd.tagName).toBe('KBD');
    });

    it('doit avoir un label ARIA pour l\'accessibilite', () => {
      render(<Header />);

      const searchInput = screen.getByLabelText("Rechercher un appel d'offres");
      expect(searchInput).toBeInTheDocument();
    });

    it('doit permettre la saisie de texte', () => {
      render(<Header />);

      const searchInput = screen.getByPlaceholderText("Rechercher un appel d'offres...") as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      expect(searchInput.value).toBe('test query');
    });
  });

  describe('New DCE Button', () => {
    it('doit afficher le bouton avec l\'icone Plus', () => {
      render(<Header />);

      const button = screen.getByLabelText('Créer un nouveau DCE');
      expect(button).toBeInTheDocument();

      // Verifier la presence de l'icone SVG
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('doit avoir l\'attribut data-tour pour l\'onboarding', () => {
      render(<Header />);

      const button = screen.getByLabelText('Créer un nouveau DCE');
      expect(button).toHaveAttribute('data-tour', 'new-dce-button');
    });

    it('doit masquer le texte sur mobile', () => {
      render(<Header />);

      const buttonText = screen.getByText('Nouveau DCE');
      expect(buttonText).toHaveClass('hidden', 'sm:inline');
    });

    it('doit etre cliquable', () => {
      render(<Header />);

      const button = screen.getByLabelText('Créer un nouveau DCE');
      expect(button.tagName).toBe('BUTTON');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Notification Center', () => {
    it('doit integrer le NotificationCenter', () => {
      render(<Header />);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('doit passer la fonction getToken au NotificationCenter', () => {
      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('test-access-token');

      render(<Header />);

      const notificationButton = screen.getByText('Notifications');
      fireEvent.click(notificationButton);

      expect(window.localStorage.getItem).toHaveBeenCalledWith('access_token');
    });

    it('doit gerer l\'absence de token', () => {
      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      render(<Header />);

      const notificationButton = screen.getByText('Notifications');
      fireEvent.click(notificationButton);

      expect(window.localStorage.getItem).toHaveBeenCalledWith('access_token');
    });
  });

  describe('Responsive Layout', () => {
    it('doit avoir un layout sticky', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('sticky', 'top-0');
    });

    it('doit avoir une bordure en bas', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('border-b', 'border-border');
    });

    it('doit avoir une hauteur fixe', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('h-16');
    });
  });

  describe('Accessibility', () => {
    it('doit utiliser la balise semantic <header>', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('doit avoir un z-index approprie pour rester au-dessus du contenu', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('z-30');
    });

    it('doit avoir des labels ARIA pour tous les elements interactifs', () => {
      render(<Header />);

      expect(screen.getByLabelText('Créer un nouveau DCE')).toBeInTheDocument();
      expect(screen.getByLabelText("Rechercher un appel d'offres")).toBeInTheDocument();
    });

    it('doit utiliser <nav> pour les breadcrumbs', () => {
      vi.mocked(usePathname).mockReturnValue('/tenders');

      render(<Header />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('doit utiliser <h1> pour le titre principal', () => {
      render(<Header />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Tableau de bord');
    });
  });

  describe('Visual Styling', () => {
    it('doit appliquer les bonnes classes de style au titre', () => {
      render(<Header />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-foreground');
    });

    it('doit appliquer le style muted aux breadcrumbs', () => {
      vi.mocked(usePathname).mockReturnValue('/tenders');

      const { container } = render(<Header />);

      const breadcrumbNav = container.querySelector('nav');
      expect(breadcrumbNav).toHaveClass('text-xs', 'text-muted-foreground');
    });
  });
});
