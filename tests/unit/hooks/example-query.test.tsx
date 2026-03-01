/**
 * Example React Query Test
 * Demonstrates how to test hooks that use React Query
 *
 * This file can be deleted once real tests are written
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  createTestQueryClient,
  mockApiHandlers,
  setupMockFetch,
  waitForQueriesToSettle,
  expectQueryState,
  createMockQueryFn,
} from '../../utils';
import React from 'react';

// Example hook that uses React Query
function useTenders() {
  return useQuery({
    queryKey: ['tenders'],
    queryFn: async () => {
      const response = await fetch('/api/v1/tenders');
      if (!response.ok) {
        throw new Error('Failed to fetch tenders');
      }
      return response.json();
    },
  });
}

describe('useTenders Hook (React Query)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    setupMockFetch();
  });

  function createWrapper() {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  it('should fetch tenders successfully', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(() => mockApiHandlers.getTenders());

    const { result } = renderHook(() => useTenders(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for query to settle
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check data
    expect(result.current.data).toBeDefined();
    expect(result.current.data.data).toBeInstanceOf(Array);
  });

  it('should handle fetch error', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(() => mockApiHandlers.error('Network error'));

    const { result } = renderHook(() => useTenders(), {
      wrapper: createWrapper(),
    });

    // Wait for query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Check error
    expect(result.current.error).toBeDefined();
  });

  it('should refetch when invalidated', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(() => mockApiHandlers.getTenders());

    const { result } = renderHook(() => useTenders(), {
      wrapper: createWrapper(),
    });

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const initialData = result.current.data;

    // Invalidate and refetch
    await queryClient.invalidateQueries({ queryKey: ['tenders'] });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Data should be the same (same mock)
    expect(result.current.data).toEqual(initialData);
  });

  it('should use cached data on second render', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(() => mockApiHandlers.getTenders());

    // Use the SAME QueryClient for both renders so cache is shared
    const sharedWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // First render
    const { result: result1 } = renderHook(() => useTenders(), {
      wrapper: sharedWrapper,
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    // Second render should use cache from same QueryClient
    const { result: result2 } = renderHook(() => useTenders(), {
      wrapper: sharedWrapper,
    });

    // Should immediately have data from cache (even if stale refetch happens)
    expect(result2.current.data).toBeDefined();
    expect(result2.current.data).toEqual(result1.current.data);

    // With default staleTime=0, React Query serves cache but refetches in background
    // so we may see 1 or 2 calls, but the important thing is data is immediately available
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle query state correctly', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(() => mockApiHandlers.getTenders());

    const { result } = renderHook(() => useTenders(), {
      wrapper: createWrapper(),
    });

    // Wait for success
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check query state using helper
    expectQueryState(queryClient, ['tenders'], {
      status: 'success',
      fetchStatus: 'idle',
      hasData: true,
      hasError: false,
    });
  });
});

// Example: Testing with custom query function
describe('Custom Query Function', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  function createWrapper() {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  it('should use custom mock query function', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockQueryFn = createMockQueryFn(mockData, 100);

    function useCustomQuery() {
      return useQuery({
        queryKey: ['custom'],
        queryFn: mockQueryFn,
      });
    }

    const { result } = renderHook(() => useCustomQuery(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for success
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check data
    expect(result.current.data).toEqual(mockData);

    // Verify query function was called
    expect(mockQueryFn).toHaveBeenCalledTimes(1);
  });

  it('should handle slow queries', async () => {
    const mockData = { id: 1, name: 'Slow Data' };
    const mockQueryFn = createMockQueryFn(mockData, 500); // 500ms delay

    function useSlowQuery() {
      return useQuery({
        queryKey: ['slow'],
        queryFn: mockQueryFn,
      });
    }

    const { result } = renderHook(() => useSlowQuery(), {
      wrapper: createWrapper(),
    });

    // Should be loading for at least 400ms
    expect(result.current.isLoading).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 400));

    // Still loading
    expect(result.current.isLoading).toBe(true);

    // Wait for success
    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 2000 }
    );

    expect(result.current.data).toEqual(mockData);
  });
});

// Example: Testing query with variables
describe('Parameterized Query', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    setupMockFetch();
  });

  function createWrapper() {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  function useTender(id: string | null) {
    return useQuery({
      queryKey: ['tender', id],
      queryFn: async () => {
        if (!id) throw new Error('No ID provided');
        const response = await fetch(`/api/v1/tenders/${id}`);
        if (!response.ok) throw new Error('Failed to fetch');
        return response.json();
      },
      enabled: !!id, // Only run if ID is provided
    });
  }

  it('should not fetch when disabled', () => {
    const { result } = renderHook(() => useTender(null), {
      wrapper: createWrapper(),
    });

    // Should not fetch without ID
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should fetch when enabled', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(() => mockApiHandlers.getTender('tender-1'));

    const { result } = renderHook(() => useTender('tender-1'), {
      wrapper: createWrapper(),
    });

    // Wait for success
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/tenders/tender-1')
    );
  });

  it('should refetch when ID changes', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch
      .mockImplementationOnce(() => mockApiHandlers.getTender('tender-1'))
      .mockImplementationOnce(() => mockApiHandlers.getTender('tender-2'));

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useTender(id),
      {
        wrapper: createWrapper(),
        initialProps: { id: 'tender-1' },
      }
    );

    // Wait for first fetch
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Change ID
    rerender({ id: 'tender-2' });

    // Wait for second fetch
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/v1/tenders/tender-2')
    );
  });
});
