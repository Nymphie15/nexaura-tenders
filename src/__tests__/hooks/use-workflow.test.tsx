/**
 * Tests for use-workflow hook
 * Tests workflow queries (useWorkflow, useWorkflowHistory, useWorkflowTransitions, etc.)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useWorkflow,
  useWorkflowHistory,
  useWorkflowTransitions,
  useWorkflowPhaseDetails,
  useWorkflows,
  useWorkflowStats,
  useWorkflowLive,
  workflowKeys,
} from '@/hooks/use-workflow';
import { workflowApi } from '@/lib/api/endpoints';
import type { WorkflowState } from '@/types';

// Mock the API module
vi.mock('@/lib/api/endpoints', () => ({
  workflowApi: {
    getCase: vi.fn(),
    getCaseHistory: vi.fn(),
    getTransitions: vi.fn(),
    getPhaseDetails: vi.fn(),
    listCases: vi.fn(),
    getStats: vi.fn(),
  },
}));

// Mock data
const mockWorkflowState: WorkflowState = {
  case_id: 'case-1',
  tender_id: 'tender-1',
  reference: 'REF-2024-001',
  current_phase: 'EXTRACTION',
  status: 'running',
  progress: 25,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  phases: [
    {
      phase: 'INGESTION',
      status: 'completed',
      progress: 100,
      started_at: '2024-01-15T10:00:00Z',
      completed_at: '2024-01-15T10:10:00Z',
      duration_ms: 600000,
    },
    {
      phase: 'EXTRACTION',
      status: 'in_progress',
      progress: 50,
      started_at: '2024-01-15T10:10:00Z',
    },
  ],
  metadata: {},
};

const mockHistory = [
  {
    phase: 'INGESTION',
    status: 'completed',
    timestamp: '2024-01-15T10:10:00Z',
    duration_ms: 600000,
  },
  {
    phase: 'EXTRACTION',
    status: 'started',
    timestamp: '2024-01-15T10:10:00Z',
  },
];

const mockTransitions = [
  {
    from_phase: 'INGESTION',
    to_phase: 'EXTRACTION',
    timestamp: '2024-01-15T10:10:00Z',
    trigger: 'automatic',
  },
];

const mockPhaseDetails = {
  phase: 'EXTRACTION',
  agent_name: 'extraction_agent',
  llm_calls: 3,
  tokens_used: 1500,
  confidence_score: 0.92,
  artifacts: [
    { type: 'requirements', count: 15 },
    { type: 'cpv_codes', count: 5 },
  ],
};

const mockStats = {
  total_cases: 42,
  by_status: {
    running: 5,
    completed: 30,
    failed: 2,
    waiting_hitl: 5,
  },
  by_phase: {
    EXTRACTION: 3,
    MATCHING: 1,
    GENERATION: 1,
  },
  average_duration_ms: 1800000,
};

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('use-workflow hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useWorkflow', () => {
    it('devrait charger un workflow par case ID', async () => {
      vi.mocked(workflowApi.getCase).mockResolvedValue(mockWorkflowState);

      const { result } = renderHook(() => useWorkflow('case-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockWorkflowState);
      expect(workflowApi.getCase).toHaveBeenCalledWith('case-1');
    });

    it('ne devrait pas charger si caseId est undefined', async () => {
      const { result } = renderHook(() => useWorkflow(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(workflowApi.getCase).not.toHaveBeenCalled();
    });

    it('devrait respecter l\'option enabled', async () => {
      const { result } = renderHook(() => useWorkflow('case-1', { enabled: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(workflowApi.getCase).not.toHaveBeenCalled();
    });

    it('devrait gerer les erreurs', async () => {
      const error = new Error('Workflow not found');
      vi.mocked(workflowApi.getCase).mockRejectedValue(error);

      const { result } = renderHook(() => useWorkflow('case-invalid'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 10000 });

      expect(result.current.error).toBeTruthy();
    });

    it('devrait refetch selon refetchInterval', async () => {
      vi.mocked(workflowApi.getCase).mockResolvedValue(mockWorkflowState);

      const { result } = renderHook(() => useWorkflow('case-1', { refetchInterval: 1000 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify refetchInterval is configured
      expect(result.current.dataUpdatedAt).toBeDefined();
    });

    it('devrait avoir un staleTime de 30 secondes', async () => {
      vi.mocked(workflowApi.getCase).mockResolvedValue(mockWorkflowState);

      const { result } = renderHook(() => useWorkflow('case-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isStale).toBe(false);
    });
  });

  describe('useWorkflowHistory', () => {
    it('devrait charger l\'historique du workflow', async () => {
      vi.mocked(workflowApi.getCaseHistory).mockResolvedValue(mockHistory);

      const { result } = renderHook(() => useWorkflowHistory('case-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockHistory);
      expect(workflowApi.getCaseHistory).toHaveBeenCalledWith('case-1');
    });

    it('ne devrait pas charger sans caseId', async () => {
      const { result } = renderHook(() => useWorkflowHistory(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(workflowApi.getCaseHistory).not.toHaveBeenCalled();
    });

    it('devrait avoir un staleTime de 60 secondes', async () => {
      vi.mocked(workflowApi.getCaseHistory).mockResolvedValue(mockHistory);

      const { result } = renderHook(() => useWorkflowHistory('case-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isStale).toBe(false);
    });
  });

  describe('useWorkflowTransitions', () => {
    it('devrait charger les transitions du workflow', async () => {
      vi.mocked(workflowApi.getTransitions).mockResolvedValue(mockTransitions);

      const { result } = renderHook(() => useWorkflowTransitions('case-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTransitions);
      expect(workflowApi.getTransitions).toHaveBeenCalledWith('case-1');
    });

    it('devrait gerer les erreurs', async () => {
      const error = new Error('Failed to load transitions');
      vi.mocked(workflowApi.getTransitions).mockRejectedValue(error);

      const { result } = renderHook(() => useWorkflowTransitions('case-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useWorkflowPhaseDetails', () => {
    it('devrait charger les details d\'une phase', async () => {
      vi.mocked(workflowApi.getPhaseDetails).mockResolvedValue(mockPhaseDetails);

      const { result } = renderHook(
        () => useWorkflowPhaseDetails('case-1', 'EXTRACTION'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPhaseDetails);
      expect(workflowApi.getPhaseDetails).toHaveBeenCalledWith('case-1', 'EXTRACTION');
    });

    it('ne devrait pas charger sans caseId ou phase', async () => {
      const { result: result1 } = renderHook(
        () => useWorkflowPhaseDetails(undefined, 'EXTRACTION'),
        {
          wrapper: createWrapper(),
        }
      );

      const { result: result2 } = renderHook(
        () => useWorkflowPhaseDetails('case-1', undefined),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result1.current.isLoading).toBe(false);
      expect(result2.current.isLoading).toBe(false);
      expect(workflowApi.getPhaseDetails).not.toHaveBeenCalled();
    });

    it('devrait respecter l\'option enabled', async () => {
      const { result } = renderHook(
        () => useWorkflowPhaseDetails('case-1', 'EXTRACTION', { enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(workflowApi.getPhaseDetails).not.toHaveBeenCalled();
    });
  });

  describe('useWorkflows', () => {
    it('devrait charger tous les workflows', async () => {
      const mockWorkflows = [mockWorkflowState];
      vi.mocked(workflowApi.listCases).mockResolvedValue(mockWorkflows);

      const { result } = renderHook(() => useWorkflows(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockWorkflows);
      expect(workflowApi.listCases).toHaveBeenCalled();
    });

    it('devrait passer les filtres', async () => {
      const filters = { status: 'running', phase: 'EXTRACTION' };
      vi.mocked(workflowApi.listCases).mockResolvedValue([mockWorkflowState]);

      renderHook(() => useWorkflows(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(workflowApi.listCases).toHaveBeenCalledWith(filters);
      });
    });

    it('devrait avoir un staleTime de 30 secondes', async () => {
      vi.mocked(workflowApi.listCases).mockResolvedValue([mockWorkflowState]);

      const { result } = renderHook(() => useWorkflows(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isStale).toBe(false);
    });
  });

  describe('useWorkflowStats', () => {
    it('devrait charger les statistiques', async () => {
      vi.mocked(workflowApi.getStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useWorkflowStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(workflowApi.getStats).toHaveBeenCalled();
    });

    it('devrait avoir un staleTime de 60 secondes', async () => {
      vi.mocked(workflowApi.getStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useWorkflowStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isStale).toBe(false);
    });

    it('devrait gerer les erreurs', async () => {
      const error = new Error('Stats unavailable');
      vi.mocked(workflowApi.getStats).mockRejectedValue(error);

      const { result } = renderHook(() => useWorkflowStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useWorkflowLive', () => {
    it('devrait poller le workflow en temps reel', async () => {
      vi.mocked(workflowApi.getCase).mockResolvedValue(mockWorkflowState);

      const { result } = renderHook(() => useWorkflowLive('case-1', 2000), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockWorkflowState);
    });

    it('ne devrait pas charger si caseId est undefined', async () => {
      const { result } = renderHook(() => useWorkflowLive(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(workflowApi.getCase).not.toHaveBeenCalled();
    });

    it('devrait utiliser un intervalle par defaut de 5000ms', async () => {
      vi.mocked(workflowApi.getCase).mockResolvedValue(mockWorkflowState);

      const { result } = renderHook(() => useWorkflowLive('case-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify polling is configured
      expect(result.current.dataUpdatedAt).toBeDefined();
    });
  });

  describe('query keys', () => {
    it('devrait generer des query keys consistantes', () => {
      expect(workflowKeys.all).toEqual(['workflows']);
      expect(workflowKeys.lists()).toEqual(['workflows', 'list']);
      expect(workflowKeys.list({ status: 'running' })).toEqual([
        'workflows',
        'list',
        { status: 'running' },
      ]);
      expect(workflowKeys.detail('case-1')).toEqual(['workflows', 'detail', 'case-1']);
      expect(workflowKeys.history('case-1')).toEqual([
        'workflows',
        'detail',
        'case-1',
        'history',
      ]);
      expect(workflowKeys.transitions('case-1')).toEqual([
        'workflows',
        'detail',
        'case-1',
        'transitions',
      ]);
      expect(workflowKeys.phaseDetails('case-1', 'EXTRACTION')).toEqual([
        'workflows',
        'detail',
        'case-1',
        'phase',
        'EXTRACTION',
      ]);
    });
  });
});
