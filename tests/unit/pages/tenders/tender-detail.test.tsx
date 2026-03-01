/**
 * Tests pour la page de detail d'une opportunite (ex-tender)
 * Teste le rendu des informations, les onglets et les actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { TenderDetail } from '@/types';

// Mock des hooks
vi.mock('@/hooks/use-tenders', () => ({
  useTender: vi.fn(),
  useProcessTender: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'tender-123' }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import OpportunityDetailPage from '@/app/(dashboard)/opportunities/[id]/page';
import {
  useTender,
  useProcessTender,
} from '@/hooks/use-tenders';

// Donnees de test
const mockTender: TenderDetail = {
  id: 'tender-123',
  reference: 'REF-2026-001',
  title: 'Fourniture de materiel informatique pour etablissements scolaires',
  client: 'Mairie de Lyon',
  source: 'BOAMP',
  status: 'ANALYZING',
  budget: 250000,
  deadline: '2026-03-15T23:59:59Z',
  publication_date: '2026-01-20T10:00:00Z',
  url: 'https://boamp.example.com/tender/001',
  description:
    'Achat de materiel informatique (ordinateurs, tablettes, projecteurs) pour equiper les etablissements scolaires de la ville de Lyon.',
  cpv_codes: ['30213000-5', '30231300-0'],
  score: 85,
  risk_score: 25,
  created_at: '2026-01-20T10:00:00Z',
  updated_at: '2026-01-22T14:30:00Z',
  acheteur: {
    nom: 'Mairie de Lyon',
    adresse: '1 Place de la Comedie, 69001 Lyon',
    contact: 'marches@mairie-lyon.fr',
  },
  criteres_jugement: [
    { critere: 'Prix', ponderation: 40 },
    { critere: 'Qualite technique', ponderation: 35 },
    { critere: 'Delais de livraison', ponderation: 15 },
    { critere: 'Service apres-vente', ponderation: 10 },
  ],
  delais: {
    depot: '2026-03-15T23:59:59Z',
    execution: '6 mois',
    garantie: '3 ans',
  },
  lots: [
    {
      lot_number: 1,
      title: 'Ordinateurs portables',
      description: '200 ordinateurs portables pour les enseignants',
      budget: 150000,
    },
    {
      lot_number: 2,
      title: 'Tablettes numeriques',
      description: '500 tablettes pour les eleves',
      budget: 75000,
    },
    {
      lot_number: 3,
      title: 'Projecteurs interactifs',
      description: '50 projecteurs pour les salles de classe',
      budget: 25000,
    },
  ],
  requirements: [
    {
      id: 'req-1',
      type: 'TECHNIQUE',
      title: 'Certification CE pour tout le materiel',
      description: 'Tous les equipements doivent etre certifies CE',
      mandatory: true,
      score: 95,
    },
    {
      id: 'req-2',
      type: 'TECHNIQUE',
      title: 'Garantie constructeur minimum 3 ans',
      description: 'Garantie pieces et main d\'oeuvre',
      mandatory: true,
      score: 90,
    },
  ],
  documents: [
    {
      name: 'DCE_complet.pdf',
      type: 'application/pdf',
      size: 2456789,
      modified: '2026-01-20T10:00:00Z',
    },
    {
      name: 'CCTP.pdf',
      type: 'application/pdf',
      size: 856234,
      modified: '2026-01-20T10:00:00Z',
    },
  ],
};

// Helper pour wrapper avec QueryClient
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

function setupMocks(overrides: Record<string, any> = {}) {
  vi.mocked(useTender).mockReturnValue({
    data: mockTender,
    isLoading: false,
    error: null,
    ...overrides.tender,
  } as any);

  vi.mocked(useProcessTender).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    ...overrides.process,
  } as any);
}

describe('OpportunityDetailPage - Detail d\'une opportunite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chargement et etats', () => {
    it('affiche le squelette pendant le chargement', () => {
      setupMocks({
        tender: { data: undefined, isLoading: true, error: null },
      });

      const { container } = renderWithQueryClient(<OpportunityDetailPage />);

      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('affiche un message d\'erreur si le tender n\'existe pas', async () => {
      setupMocks({
        tender: { data: null, isLoading: false, error: new Error('Not found') },
      });

      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/non trouv/i)).toBeInTheDocument();
      });
    });
  });

  describe('En-tete et informations principales', () => {
    it('affiche le titre du tender', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        expect(screen.getAllByText(/materiel informatique pour etablissements scolaires/).length).toBeGreaterThan(0);
      });
    });

    it('affiche le statut', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('En analyse')).toBeInTheDocument();
      });
    });

    it('affiche le client', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Mairie de Lyon')).toBeInTheDocument();
      });
    });
  });

  describe('Onglets de contenu', () => {
    it('affiche les onglets principaux', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Resume')).toBeInTheDocument();
        expect(screen.getByText('Acheteur')).toBeInTheDocument();
        expect(screen.getByText(/Exigences/)).toBeInTheDocument();
        expect(screen.getByText(/Documents/)).toBeInTheDocument();
      });
    });
  });

  describe('Onglet Resume', () => {
    it('affiche la description du tender', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Achat de materiel informatique/)).toBeInTheDocument();
      });
    });

    it('affiche les criteres de jugement avec ponderation', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Prix')).toBeInTheDocument();
        expect(screen.getByText('40%')).toBeInTheDocument();
        expect(screen.getByText('Qualite technique')).toBeInTheDocument();
        expect(screen.getByText('35%')).toBeInTheDocument();
      });
    });

    it('affiche les delais', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('6 mois')).toBeInTheDocument();
        expect(screen.getByText('3 ans')).toBeInTheDocument();
      });
    });

    it('affiche les lots', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Ordinateurs portables')).toBeInTheDocument();
        expect(screen.getByText('Tablettes numeriques')).toBeInTheDocument();
        expect(screen.getByText('Projecteurs interactifs')).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('affiche le bouton de lancement', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Lancer la reponse IA')).toBeInTheDocument();
      });
    });

    it('lance le traitement d\'un tender', async () => {
      const user = userEvent.setup();
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      setupMocks({
        process: { mutateAsync: mockMutateAsync, isPending: false },
      });

      renderWithQueryClient(<OpportunityDetailPage />);

      const processButton = await screen.findByText('Lancer la reponse IA');
      await user.click(processButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({ id: 'tender-123' });
      });
    });

    it('affiche un etat de chargement pendant le traitement', async () => {
      setupMocks({
        process: { mutateAsync: vi.fn(), isPending: true },
      });

      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Lancement...')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('affiche un lien breadcrumb vers la liste', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunityDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /Opportunites/i });
        expect(backLink).toHaveAttribute('href', '/opportunities');
      });
    });
  });
});
