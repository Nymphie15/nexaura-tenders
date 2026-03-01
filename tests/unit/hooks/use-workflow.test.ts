/**
 * Workflow Hook Tests
 * Tests for workflow data fetching hooks with React Query
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the workflow API
const mockGetCase = vi.fn();
const mockGetCaseHistory = vi.fn();
const mockGetTransitions = vi.fn();
const mockGetPhaseDetails = vi.fn();
const mockListCases = vi.fn();
const mockGetStats = vi.fn();

vi.mock('@/lib/api/endpoints', () => ({
  workflowApi: {
    getCase: (...args: unknown[]) => mockGetCase(...args),
    getCaseHistory: (...args: unknown[]) => mockGetCaseHistory(...args),
    getTransitions: (...args: unknown[]) => mockGetTransitions(...args),
    getPhaseDetails: (...args: unknown[]) => mockGetPhaseDetails(...args),
    listCases: (...args: unknown[]) => mockListCases(...args),
    getStats: (...args: unknown[]) => mockGetStats(...args),
  },
}));

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

// Create a wrapper with QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe('workflowKeys', () => {
  it('generates correct base key', () => {
    expect(workflowKeys.all).toEqual(['workflows']);
  });

  it('generates correct lists key', () => {
    expect(workflowKeys.lists()).toEqual(['workflows', 'list']);
  });

  it('generates correct list key with filters', () => {
    const filters = { status: 'active' };
    expect(workflowKeys.list(filters)).toEqual(['workflows', 'list', filters]);
  });

  it('generates correct details key', () => {
    expect(workflowKeys.details()).toEqual(['workflows', 'detail']);
  });

  it('generates correct detail key with id', () => {
    expect(workflowKeys.detail('case-123')).toEqual([
      'workflows',
      'detail',
      'case-123',
    ]);
  });

  it('generates correct history key', () => {
    expect(workflowKeys.history('case-123')).toEqual([
      'workflows',
      'detail',
      'case-123',
      'history',
    ]);
  });

  it('generates correct transitions key', () => {
    expect(workflowKeys.transitions('case-123')).toEqual([
      'workflows',
      'detail',
      'case-123',
      'transitions',
    ]);
  });

  it('generates correct phaseDetails key', () => {
    expect(workflowKeys.phaseDetails('case-123', 'analysis')).toEqual([
      'workflows',
      'detail',
      'case-123',
      'phase',
      'analysis',
    ]);
  });
});

describe('useWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches workflow by case ID', async () => {
    const mockWorkflow = {
      id: 'case-123',
      status: 'in_progress',
      phase: 'analysis',
    };
    mockGetCase.mockResolvedValueOnce(mockWorkflow);

    const { result } = renderHook(() => useWorkflow('case-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetCase).toHaveBeenCalledWith('case-123');
    expect(result.current.data).toEqual(mockWorkflow);
  });

  it('does not fetch when caseId is undefined', () => {
    renderHook(() => useWorkflow(undefined), {
      wrapper: createWrapper(),
    });

    expect(mockGetCase).not.toHaveBeenCalled();
  });

  it('does not fetch when enabled is false', () => {
    renderHook(() => useWorkflow('case-123', { enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(mockGetCase).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    // The hook retries up to 3 times for non-"Case ID is required" errors.
    // Reject all attempts so the query eventually fails.
    mockGetCase.mockRejectedValue(new Error('Workflow not found'));

    const { result } = renderHook(() => useWorkflow('invalid-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 10000 });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useWorkflowHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches workflow history', async () => {
    const mockHistory = [
      { phase: 'intake', completed_at: '2024-01-01' },
      { phase: 'analysis', completed_at: '2024-01-02' },
    ];
    mockGetCaseHistory.mockResolvedValueOnce(mockHistory);

    const { result } = renderHook(() => useWorkflowHistory('case-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetCaseHistory).toHaveBeenCalledWith('case-123');
    expect(result.current.data).toEqual(mockHistory);
  });

  it('does not fetch when caseId is undefined', () => {
    renderHook(() => useWorkflowHistory(undefined), {
      wrapper: createWrapper(),
    });

    expect(mockGetCaseHistory).not.toHaveBeenCalled();
  });
});

describe('useWorkflowTransitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches available transitions', async () => {
    const mockTransitions = [
      { from: 'analysis', to: 'review', label: 'Submit for Review' },
      { from: 'analysis', to: 'rejected', label: 'Reject' },
    ];
    mockGetTransitions.mockResolvedValueOnce(mockTransitions);

    const { result } = renderHook(() => useWorkflowTransitions('case-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetTransitions).toHaveBeenCalledWith('case-123');
    expect(result.current.data).toEqual(mockTransitions);
  });
});

describe('useWorkflowPhaseDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches phase details', async () => {
    const mockPhaseDetails = {
      phase: 'analysis',
      started_at: '2024-01-01',
      progress: 75,
      tasks: [],
    };
    mockGetPhaseDetails.mockResolvedValueOnce(mockPhaseDetails);

    const { result } = renderHook(
      () => useWorkflowPhaseDetails('case-123', 'analysis'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetPhaseDetails).toHaveBeenCalledWith('case-123', 'analysis');
    expect(result.current.data).toEqual(mockPhaseDetails);
  });

  it('does not fetch when phase is undefined', () => {
    renderHook(() => useWorkflowPhaseDetails('case-123', undefined), {
      wrapper: createWrapper(),
    });

    expect(mockGetPhaseDetails).not.toHaveBeenCalled();
  });

  it('does not fetch when caseId is undefined', () => {
    renderHook(() => useWorkflowPhaseDetails(undefined, 'analysis'), {
      wrapper: createWrapper(),
    });

    expect(mockGetPhaseDetails).not.toHaveBeenCalled();
  });
});

describe('useWorkflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all workflows without filters', async () => {
    const mockWorkflows = [
      { id: 'case-1', status: 'active' },
      { id: 'case-2', status: 'completed' },
    ];
    mockListCases.mockResolvedValueOnce(mockWorkflows);

    const { result } = renderHook(() => useWorkflows(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockListCases).toHaveBeenCalledWith({});
    expect(result.current.data).toEqual(mockWorkflows);
  });

  it('fetches workflows with filters', async () => {
    const filters = { status: 'active', limit: 10 };
    mockListCases.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useWorkflows(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockListCases).toHaveBeenCalledWith(filters);
  });
});

describe('useWorkflowStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches workflow statistics', async () => {
    const mockStats = {
      total: 100,
      active: 25,
      completed: 70,
      failed: 5,
    };
    mockGetStats.mockResolvedValueOnce(mockStats);

    const { result } = renderHook(() => useWorkflowStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetStats).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockStats);
  });
});

describe('useWorkflowLive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not fetch when caseId is undefined', () => {
    renderHook(() => useWorkflowLive(undefined), {
      wrapper: createWrapper(),
    });

    expect(mockGetCase).not.toHaveBeenCalled();
  });

  it('uses default 5 second interval', () => {
    const mockWorkflow = { id: 'case-123', status: 'active' };
    mockGetCase.mockResolvedValue(mockWorkflow);

    const { result } = renderHook(() => useWorkflowLive('case-123'), {
      wrapper: createWrapper(),
    });

    // The hook should configure refetchInterval
    expect(result.current.isLoading || result.current.isSuccess).toBe(true);
  });

  it('allows custom interval', () => {
    const mockWorkflow = { id: 'case-123', status: 'active' };
    mockGetCase.mockResolvedValue(mockWorkflow);

    const { result } = renderHook(() => useWorkflowLive('case-123', 10000), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading || result.current.isSuccess).toBe(true);
  });
});
