/**
 * Tests pour la page de liste des opportunites (ex-tenders)
 * Teste le rendu, le filtrage, la pagination et les interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { Tender } from '@/types';

// Mock des hooks
vi.mock('@/hooks/use-tenders', () => ({
  useTenders: vi.fn(),
  useTendersCount: vi.fn(),
  useRelevantTenders: vi.fn(),
  useProcessTender: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock du composant UploadDCEDialog
vi.mock('@/components/upload-dce-dialog', () => ({
  UploadDCEDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    open ? <div data-testid="upload-dialog">Upload Dialog</div> : null
  ),
}));

// Mock EmptyState
vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title, description }: { title: string; description: string; compact?: boolean; illustration?: string; action?: any }) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import OpportunitiesPage from '@/app/(dashboard)/opportunities/page';
import { useTenders, useTendersCount, useRelevantTenders, useProcessTender } from '@/hooks/use-tenders';

// Données de test
const mockTenders: Tender[] = [
  {
    id: '1',
    reference: 'REF-001',
    title: 'Fourniture de matériel informatique',
    client: 'Mairie de Paris',
    source: 'BOAMP',
    status: 'NEW',
    budget: 50000,
    deadline: '2026-03-15T23:59:59Z',
    publication_date: '2026-01-20T10:00:00Z',
    url: 'https://boamp.example.com/tender/001',
    description: 'Achat de matériel informatique pour les services municipaux',
    cpv_codes: ['30213000-5'],
    score: 85,
    risk_score: 20,
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-01-20T10:00:00Z',
  },
  {
    id: '2',
    reference: 'REF-002',
    title: 'Maintenance des espaces verts',
    client: 'Conseil Départemental',
    source: 'TED',
    status: 'ANALYZING',
    budget: 120000,
    deadline: '2026-02-28T23:59:59Z',
    publication_date: '2026-01-18T09:00:00Z',
    url: 'https://ted.example.com/tender/002',
    description: 'Entretien des parcs et jardins publics',
    cpv_codes: ['77310000-6'],
    score: 65,
    risk_score: 45,
    created_at: '2026-01-18T09:00:00Z',
    updated_at: '2026-01-20T08:00:00Z',
  },
  {
    id: '3',
    reference: 'REF-003',
    title: 'Construction de bureaux',
    client: 'Préfecture',
    source: 'PLACE',
    status: 'SCORED',
    budget: 2500000,
    deadline: '2026-04-30T23:59:59Z',
    publication_date: '2026-01-15T14:00:00Z',
    description: 'Construction de nouveaux locaux administratifs',
    cpv_codes: ['45000000-7'],
    score: 72,
    risk_score: 35,
    created_at: '2026-01-15T14:00:00Z',
    updated_at: '2026-01-19T16:00:00Z',
  },
];

const mockRelevantTenders = mockTenders.map((tender, index) => ({
  ...tender,
  relevance_score: 90 - index * 10,
  relevance_details: {
    domain_match: 35 - index * 5,
    cpv_match: 20 - index * 2,
    geo_match: 12,
    budget_match: 8,
    cert_match: 10,
  },
  recommendation: index === 0 ? 'excellent' : index === 1 ? 'bon' : 'moyen',
  matched_keywords: ['informatique', 'équipement'],
}));

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
  vi.mocked(useTenders).mockReturnValue({
    data: mockTenders,
    isLoading: false,
    ...overrides.tenders,
  } as any);

  vi.mocked(useTendersCount).mockReturnValue({
    data: { count: 3 },
    ...overrides.count,
  } as any);

  vi.mocked(useRelevantTenders).mockReturnValue({
    data: mockRelevantTenders,
    isLoading: false,
    ...overrides.relevant,
  } as any);

  vi.mocked(useProcessTender).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    ...overrides.process,
  } as any);
}

describe('OpportunitiesPage - Liste des opportunites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendu initial', () => {
    it('affiche le squelette de chargement pendant le chargement', () => {
      setupMocks({
        tenders: { data: undefined, isLoading: true },
        relevant: { data: undefined, isLoading: true },
      });

      const { container } = renderWithQueryClient(<OpportunitiesPage />);

      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('affiche le titre de la page', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Veille marche')).toBeInTheDocument();
      });
    });

    it('affiche le compteur d\'opportunites', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunitiesPage />);

      await waitFor(() => {
        expect(screen.getByText(/opportunite/)).toBeInTheDocument();
      });
    });
  });

  describe('Liste des tenders', () => {
    it('affiche la liste des tenders correctement', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunitiesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Fourniture de matériel informatique/)).toBeInTheDocument();
        expect(screen.getByText(/Maintenance des espaces verts/)).toBeInTheDocument();
        expect(screen.getByText(/Construction de bureaux/)).toBeInTheDocument();
      });
    });

    it('affiche les clients de chaque tender', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunitiesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Mairie de Paris/)).toBeInTheDocument();
      });
    });

    it('affiche un message quand aucun tender n\'est trouvé', async () => {
      setupMocks({
        tenders: { data: [], isLoading: false },
        count: { data: { count: 0 } },
        relevant: { data: [], isLoading: false },
      });

      renderWithQueryClient(<OpportunitiesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Aucune opportunite/)).toBeInTheDocument();
      });
    });
  });

  describe('Filtrage et recherche', () => {
    it('affiche les contrôles de filtrage', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunitiesPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Rechercher par reference, titre ou client/i)).toBeInTheDocument();
      });
    });

    it('permet de rechercher un tender par titre', async () => {
      const user = userEvent.setup();
      setupMocks();

      renderWithQueryClient(<OpportunitiesPage />);

      const searchInput = await screen.findByPlaceholderText(/Rechercher par reference, titre ou client/i);

      await user.type(searchInput, 'informatique');

      expect(searchInput).toHaveValue('informatique');
    });

    it('filtre les résultats lors de la recherche', async () => {
      const user = userEvent.setup();
      setupMocks();

      renderWithQueryClient(<OpportunitiesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Fourniture de matériel informatique/)).toBeInTheDocument();
      });

      const searchInput = await screen.findByPlaceholderText(/Rechercher par reference, titre ou client/i);

      await user.type(searchInput, 'espaces verts');

      await waitFor(() => {
        expect(screen.getByText(/Maintenance des espaces verts/)).toBeInTheDocument();
        expect(screen.queryByText(/Fourniture de matériel informatique/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Modes de vue (Pertinentes / Toutes)', () => {
    it('affiche les onglets de vue', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Pertinentes')).toBeInTheDocument();
        expect(screen.getByText('Toutes')).toBeInTheDocument();
      });
    });

    it('permet de basculer entre les vues', async () => {
      const user = userEvent.setup();
      setupMocks();

      renderWithQueryClient(<OpportunitiesPage />);

      const toutesTab = await screen.findByText('Toutes');
      await user.click(toutesTab);

      expect(toutesTab.closest('button')).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Actions sur les tenders', () => {
    it('affiche le bouton d\'import DCE', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Importer DCE')).toBeInTheDocument();
      });
    });

    it('ouvre le dialogue d\'upload lors du clic sur Importer DCE', async () => {
      const user = userEvent.setup();
      setupMocks();

      renderWithQueryClient(<OpportunitiesPage />);

      const importButton = await screen.findByText('Importer DCE');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByTestId('upload-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('affiche le nombre de résultats', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunitiesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Affichage de \d+ sur \d+ resultats/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibilité', () => {
    it('utilise des rôles ARIA appropriés', async () => {
      setupMocks();
      renderWithQueryClient(<OpportunitiesPage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('gère les erreurs de chargement gracieusement', async () => {
      setupMocks({
        tenders: {
          data: undefined,
          isLoading: false,
          error: new Error('Network error'),
        },
        relevant: {
          data: undefined,
          isLoading: false,
          error: new Error('Network error'),
        },
      });

      renderWithQueryClient(<OpportunitiesPage />);

      // L'application ne devrait pas crasher
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});
