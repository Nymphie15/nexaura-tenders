/**
 * @file dashboard-page.test.tsx
 * @description Tests unitaires pour la page Dashboard principale
 *
 * The dashboard page uses hooks from @/hooks/use-dashboard-queries:
 *   useDashboardOverview, useConsultationTimeline, useRecentActivity,
 *   useRecentTenders, useSourceDistribution, usePipelineValue
 * And also useHITLPending from @/hooks/use-hitl.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock hooks used by the dashboard
vi.mock('@/hooks/use-dashboard-queries', () => ({
  useDashboardOverview: vi.fn(),
  useConsultationTimeline: vi.fn(),
  useRecentActivity: vi.fn(),
  useRecentTenders: vi.fn(),
  useSourceDistribution: vi.fn(),
  usePipelineValue: vi.fn(),
  monthNumberToFrench: vi.fn((m: string) => {
    const names = ['Jan','Fev','Mar','Avr','Mai','Juin','Juil','Aout','Sep','Oct','Nov','Dec'];
    return names[parseInt(m, 10) - 1] || m;
  }),
  formatRelativeTime: vi.fn(() => 'Il y a 5 min'),
}));

vi.mock('@/hooks/use-hitl', () => ({
  useHITLPending: vi.fn(),
}));

vi.mock('@/components/charts/client-charts', () => ({
  AreaChart: ({ data }: any) => (
    <div data-testid="area-chart">
      {data?.map((item: any, i: number) => (
        <div key={i}>{JSON.stringify(item)}</div>
      ))}
    </div>
  ),
  BarChart: ({ data }: any) => (
    <div data-testid="bar-chart">
      {data?.map((item: any, i: number) => (
        <div key={i}>{JSON.stringify(item)}</div>
      ))}
    </div>
  ),
  DonutChart: ({ data }: any) => (
    <div data-testid="donut-chart">
      {data?.map((item: any, i: number) => (
        <div key={i}>{item.name}: {item.value}</div>
      ))}
    </div>
  ),
  BarList: ({ data }: any) => (
    <div data-testid="bar-list">
      {data?.map((item: any, i: number) => (
        <div key={i}>{item.name}: {item.value}</div>
      ))}
    </div>
  ),
}));

import DashboardPage from '@/app/(dashboard)/page';
import {
  useDashboardOverview,
  useConsultationTimeline,
  useRecentActivity,
  useRecentTenders,
  useSourceDistribution,
  usePipelineValue,
} from '@/hooks/use-dashboard-queries';
import { useHITLPending } from '@/hooks/use-hitl';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

function setupDefaultMocks(overrides: Record<string, any> = {}) {
  vi.mocked(useDashboardOverview).mockReturnValue({
    data: {
      total_workflows: 47,
      active_workflows: 12,
      completed_workflows: 31,
      pending_hitl: 4,
      success_rate: 0.78,
      avg_processing_time_hours: 3.8,
      decisions: { go: 45, review: 30, nogo: 25 },
      period_change: {
        total_workflows: 12,
        active_workflows: 8,
        success_rate: 5,
        avg_processing_time_hours: -15,
      },
    },
    isLoading: false,
    isError: false,
    ...overrides.overview,
  } as any);

  vi.mocked(useConsultationTimeline).mockReturnValue({
    data: [
      { month: '01', year: 2026, count: 8 },
      { month: '02', year: 2026, count: 12 },
    ],
    isLoading: false,
    ...overrides.timeline,
  } as any);

  vi.mocked(useRecentActivity).mockReturnValue({
    data: [],
    ...overrides.recentActivity,
  } as any);

  vi.mocked(useRecentTenders).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    ...overrides.recentTenders,
  } as any);

  vi.mocked(useSourceDistribution).mockReturnValue({
    data: [],
    isLoading: false,
    ...overrides.sourceDistribution,
  } as any);

  vi.mocked(usePipelineValue).mockReturnValue({
    data: 0,
    ...overrides.pipelineValue,
  } as any);

  vi.mocked(useHITLPending).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    ...overrides.hitl,
  } as any);
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout & Structure', () => {
    it('affiche le titre Dashboard', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('affiche les 4 cartes KPI principales', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Pipeline Estime')).toBeInTheDocument();
      expect(screen.getByText('Taux de Succes')).toBeInTheDocument();
      expect(screen.getByText('AO Actifs')).toBeInTheDocument();
    });

    it('affiche la section consultations mensuelles', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Consultations mensuelles')).toBeInTheDocument();
    });

    it('affiche la section sources d\'opportunites', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Sources d/)).toBeInTheDocument();
      expect(screen.getByText(/Repartition par plateforme/i)).toBeInTheDocument();
    });

    it('affiche la section decisions en attente', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/cisions en attente/)).toBeInTheDocument();
    });

    it('affiche la section opportunites recentes', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/r[eé]centes/i)).toBeInTheDocument();
    });
  });

  describe('KPI Cards - Data Loading', () => {
    it('affiche les squelettes pendant le chargement', () => {
      setupDefaultMocks({
        overview: { data: undefined, isLoading: true },
      });

      render(<DashboardPage />, { wrapper: createWrapper() });

      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('affiche les valeurs KPI quand les donnees sont chargees', () => {
      setupDefaultMocks({
        pipelineValue: { data: 1500000 },
      });

      render(<DashboardPage />, { wrapper: createWrapper() });

      // Pipeline value formatted
      expect(screen.getByText(/1\s*500\s*000/)).toBeInTheDocument();
      // Success rate: 0.78 * 100 = 78%
      expect(screen.getByText('78%')).toBeInTheDocument();
      // Active workflows
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('affiche les descriptions sous chaque KPI', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Valeur totale des AO en cours/i)).toBeInTheDocument();
      expect(screen.getByText(/Sur les 30 derniers jours/i)).toBeInTheDocument();
      expect(screen.getByText(/En cours de traitement/i)).toBeInTheDocument();
      expect(screen.getByText(/En attente de validation/i)).toBeInTheDocument();
    });

    it('affiche un tiret quand aucune tendance disponible', () => {
      setupDefaultMocks({
        overview: {
          data: {
            total_workflows: 10,
            active_workflows: 5,
            completed_workflows: 3,
            pending_hitl: 2,
            success_rate: 0.5,
            avg_processing_time_hours: 2,
            decisions: { go: 5, review: 3, nogo: 2 },
          },
          isLoading: false,
          isError: false,
        },
      });

      render(<DashboardPage />, { wrapper: createWrapper() });

      // The 4th KPI (Decisions) always has change=null, so shows '-'
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe('Recent Tenders Section', () => {
    it('affiche un message si aucune opportunite recente', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Aucune opportunite recente/i)).toBeInTheDocument();
    });

    it('affiche les tenders recents avec titre et reference', () => {
      setupDefaultMocks({
        recentTenders: {
          data: [
            {
              id: '1',
              reference: 'REF-001',
              title: 'Construction piscine municipale',
              client: 'Ville de Paris',
              status: 'PROCESSING',
              score: 85,
            },
          ],
          isLoading: false,
          isError: false,
        },
      });

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Construction piscine municipale')).toBeInTheDocument();
      expect(screen.getByText('REF-001')).toBeInTheDocument();
      expect(screen.getByText('Ville de Paris')).toBeInTheDocument();
    });

    it('affiche les squelettes pendant le chargement des tenders', () => {
      setupDefaultMocks({
        recentTenders: { data: undefined, isLoading: true, isError: false },
      });

      render(<DashboardPage />, { wrapper: createWrapper() });

      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Pending Decisions Section', () => {
    it('affiche un message si aucune decision en attente', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Aucune decision en attente/i)).toBeInTheDocument();
    });

    it('affiche les decisions en attente', () => {
      setupDefaultMocks({
        hitl: {
          data: [
            {
              case_id: 'case-1',
              reference: 'DEC-001',
              checkpoint: 'go_nogo',
              tender_title: 'Construction ecole',
              tender_reference: 'REF-001',
              urgency: 'critical',
            },
          ],
          isLoading: false,
          isError: false,
        },
      });

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getAllByText('Construction ecole').length).toBeGreaterThan(0);
      expect(screen.getAllByText('DEC-001').length).toBeGreaterThan(0);
    });

    it('affiche les squelettes pendant le chargement des decisions', () => {
      setupDefaultMocks({
        hitl: { data: undefined, isLoading: true, isError: false },
      });

      render(<DashboardPage />, { wrapper: createWrapper() });

      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('gere les erreurs de chargement gracieusement', () => {
      setupDefaultMocks({
        overview: {
          data: undefined,
          isLoading: false,
          isError: true,
          error: new Error('Failed to load'),
        },
      });

      expect(() => {
        render(<DashboardPage />, { wrapper: createWrapper() });
      }).not.toThrow();
    });

    it('affiche un message d\'erreur partielle', () => {
      setupDefaultMocks({
        overview: {
          data: undefined,
          isLoading: false,
          isError: true,
        },
      });

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Certaines donnees sont indisponibles/i)).toBeInTheDocument();
    });
  });

  describe('Charts', () => {
    it('affiche le graphique consultations quand les donnees sont chargees', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('affiche le bouton "Voir details"', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Voir details/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('utilise une grille responsive pour les KPI', () => {
      setupDefaultMocks();
      const { container } = render(<DashboardPage />, { wrapper: createWrapper() });

      const grid = container.querySelector('[class*="sm:grid-cols-2"][class*="lg:grid-cols-4"]');
      expect(grid).toBeInTheDocument();
    });

    it('utilise space-y pour l\'espacement vertical', () => {
      setupDefaultMocks();
      const { container } = render(<DashboardPage />, { wrapper: createWrapper() });

      const mainContainer = container.querySelector('[class*="space-y-6"]');
      expect(mainContainer).toBeInTheDocument();
    });

    it('les cartes ont des ombres', () => {
      setupDefaultMocks();
      const { container } = render(<DashboardPage />, { wrapper: createWrapper() });

      const shadowedElements = container.querySelectorAll('[class*="shadow"]');
      expect(shadowedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Links', () => {
    it('contient un lien "Voir toutes les decisions"', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Voir toutes les decisions/i)).toBeInTheDocument();
    });

    it('contient un lien "Voir tout" pour les opportunites', () => {
      setupDefaultMocks();
      render(<DashboardPage />, { wrapper: createWrapper() });

      const viewAllButtons = screen.getAllByText(/Voir tout/i);
      expect(viewAllButtons.length).toBeGreaterThan(0);
    });
  });
});
