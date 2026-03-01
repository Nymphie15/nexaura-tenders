/**
 * Tests pour la page d'erreur des tenders
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TendersError from '@/app/(dashboard)/tenders/error';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('TendersError - Page d\'erreur', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Failed to fetch tenders');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le message d\'erreur principal', () => {
    render(<TendersError error={mockError} reset={mockReset} />);

    expect(screen.getByText(/Erreur de chargement des appels d'offres/i)).toBeInTheDocument();
  });

  it('affiche un message d\'explication', () => {
    render(<TendersError error={mockError} reset={mockReset} />);

    expect(
      screen.getByText(/Impossible de charger la liste des appels d'offres/i)
    ).toBeInTheDocument();
  });

  it('affiche une icone d\'alerte', () => {
    const { container } = render(<TendersError error={mockError} reset={mockReset} />);

    // L'icone AlertTriangle est un SVG element (lucide-react doesn't add role="img")
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('affiche les suggestions de résolution', () => {
    render(<TendersError error={mockError} reset={mockReset} />);

    expect(screen.getByText(/Vérifiez votre connexion internet/i)).toBeInTheDocument();
    expect(screen.getByText(/Rechargez la page/i)).toBeInTheDocument();
    expect(screen.getByText(/Réessayez dans quelques instants/i)).toBeInTheDocument();
  });

  it('affiche le bouton de réessai', () => {
    render(<TendersError error={mockError} reset={mockReset} />);

    expect(screen.getByRole('button', { name: /Réessayer/i })).toBeInTheDocument();
  });

  it('appelle reset() lors du clic sur Réessayer', async () => {
    const user = userEvent.setup();
    render(<TendersError error={mockError} reset={mockReset} />);

    const retryButton = screen.getByRole('button', { name: /Réessayer/i });
    await user.click(retryButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('affiche le bouton de retour au tableau de bord', () => {
    render(<TendersError error={mockError} reset={mockReset} />);

    expect(
      screen.getByRole('button', { name: /Retour au tableau de bord/i })
    ).toBeInTheDocument();
  });

  it('navigue vers le dashboard lors du clic sur Retour', async () => {
    const user = userEvent.setup();
    render(<TendersError error={mockError} reset={mockReset} />);

    const backButton = screen.getByRole('button', { name: /Retour au tableau de bord/i });
    await user.click(backButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('affiche le message d\'erreur en mode développement', () => {
    // Simule NODE_ENV=development
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<TendersError error={mockError} reset={mockReset} />);

    expect(screen.getByText('Failed to fetch tenders')).toBeInTheDocument();

    // Restaure l'environnement
    process.env.NODE_ENV = originalEnv;
  });

  it('affiche le digest de l\'erreur si disponible', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const errorWithDigest = new Error('Test error') as Error & { digest?: string };
    errorWithDigest.digest = 'abc123';

    render(<TendersError error={errorWithDigest} reset={mockReset} />);

    expect(screen.getByText(/Error ID: abc123/i)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('n\'affiche pas le détail de l\'erreur en production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(<TendersError error={mockError} reset={mockReset} />);

    expect(screen.queryByText('Failed to fetch tenders')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('utilise des classes CSS d\'erreur appropriées', () => {
    const { container } = render(<TendersError error={mockError} reset={mockReset} />);

    // Vérifie les classes de style d'erreur
    const card = container.querySelector('[class*="border-red"]');
    expect(card).toBeInTheDocument();
  });

  it('a des boutons accessibles avec aria-label', () => {
    render(<TendersError error={mockError} reset={mockReset} />);

    const retryButton = screen.getByRole('button', { name: /Réessayer/i });
    const backButton = screen.getByRole('button', { name: /Retour au tableau de bord/i });

    expect(retryButton).toHaveAttribute('aria-label');
    expect(backButton).toHaveAttribute('aria-label');
  });

  it('affiche les icones sur les boutons', () => {
    const { container } = render(<TendersError error={mockError} reset={mockReset} />);

    // Les icones RefreshCw et FileText sont des SVGs (lucide-react)
    // AlertTriangle (1) + RefreshCw (1) + FileText (1) = 3 SVGs
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(1);
  });

  it('centre le contenu sur la page', () => {
    const { container } = render(<TendersError error={mockError} reset={mockReset} />);

    const wrapper = container.querySelector('.min-h-screen');
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('logue l\'erreur dans la console au montage', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<TendersError error={mockError} reset={mockReset} />);

    expect(consoleSpy).toHaveBeenCalledWith('Tenders page error:', mockError);

    consoleSpy.mockRestore();
  });

  it('gère les erreurs sans message', () => {
    const errorWithoutMessage = new Error() as Error;
    errorWithoutMessage.message = '';

    // Ne devrait pas crasher
    expect(() => {
      render(<TendersError error={errorWithoutMessage} reset={mockReset} />);
    }).not.toThrow();
  });

  it('est responsive sur mobile', () => {
    const { container } = render(<TendersError error={mockError} reset={mockReset} />);

    const card = container.querySelector('[class*="max-w-lg"]');
    expect(card).toHaveClass('w-full');
  });
});
