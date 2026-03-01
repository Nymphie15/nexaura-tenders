/**
 * React Query Test Helpers
 * Utilities for testing components that use React Query
 */

import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';

/**
 * Wait for all queries to settle (no pending queries)
 */
export async function waitForQueriesToSettle(queryClient: QueryClient) {
  const { waitFor } = await import('@testing-library/react');

  await waitFor(
    () => {
      const queries = queryClient.getQueryCache().getAll();
      const hasPendingQueries = queries.some(
        (query) => query.state.fetchStatus === 'fetching'
      );
      if (hasPendingQueries) {
        throw new Error('Queries still fetching');
      }
    },
    { timeout: 5000 }
  );
}

/**
 * Get query state for debugging
 */
export function getQueryState(queryClient: QueryClient, queryKey: unknown[]) {
  const query = queryClient.getQueryCache().find({ queryKey });
  return query?.state;
}

/**
 * Check if a query is loading
 */
export function isQueryLoading(queryClient: QueryClient, queryKey: unknown[]) {
  const query = queryClient.getQueryCache().find({ queryKey });
  return query?.state.fetchStatus === 'fetching';
}

/**
 * Check if a query has data
 */
export function hasQueryData(queryClient: QueryClient, queryKey: unknown[]) {
  const query = queryClient.getQueryCache().find({ queryKey });
  return query?.state.data !== undefined;
}

/**
 * Check if a query has error
 */
export function hasQueryError(queryClient: QueryClient, queryKey: unknown[]) {
  const query = queryClient.getQueryCache().find({ queryKey });
  return query?.state.error !== null;
}

/**
 * Invalidate all queries for testing
 */
export async function invalidateAllQueries(queryClient: QueryClient) {
  await queryClient.invalidateQueries();
}

/**
 * Clear all query cache
 */
export function clearAllQueries(queryClient: QueryClient) {
  queryClient.clear();
}

/**
 * Set query data manually for testing
 */
export function setQueryData<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  data: T
) {
  queryClient.setQueryData(queryKey, data);
}

/**
 * Mock a successful query
 */
export function mockSuccessfulQuery<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  data: T
) {
  queryClient.setQueryData(queryKey, data);
  queryClient.setQueryDefaults(queryKey, {
    retry: false,
  });
}

/**
 * Mock a failed query
 */
export function mockFailedQuery(
  queryClient: QueryClient,
  queryKey: unknown[],
  error: Error
) {
  queryClient.setQueryData(queryKey, undefined);
  queryClient.setQueryDefaults(queryKey, {
    retry: false,
    queryFn: () => Promise.reject(error),
  });
}

/**
 * Mock a loading query
 */
export function mockLoadingQuery(
  queryClient: QueryClient,
  queryKey: unknown[]
) {
  queryClient.setQueryDefaults(queryKey, {
    retry: false,
    queryFn: () => new Promise(() => {}), // Never resolves
  });
}

/**
 * Get all queries for debugging
 */
export function getAllQueries(queryClient: QueryClient) {
  return queryClient.getQueryCache().getAll();
}

/**
 * Log all query states (for debugging)
 */
export function logQueryStates(queryClient: QueryClient) {
  const queries = queryClient.getQueryCache().getAll();

  console.log('\n=== Query States ===');
  queries.forEach((query) => {
    console.log({
      queryKey: query.queryKey,
      fetchStatus: query.state.fetchStatus,
      status: query.state.status,
      hasData: query.state.data !== undefined,
      hasError: query.state.error !== null,
    });
  });
  console.log('===================\n');
}

/**
 * Create a spy on QueryClient methods for testing
 */
export function spyOnQueryClient(queryClient: QueryClient) {
  return {
    fetchQuery: vi.spyOn(queryClient, 'fetchQuery'),
    prefetchQuery: vi.spyOn(queryClient, 'prefetchQuery'),
    invalidateQueries: vi.spyOn(queryClient, 'invalidateQueries'),
    resetQueries: vi.spyOn(queryClient, 'resetQueries'),
    cancelQueries: vi.spyOn(queryClient, 'cancelQueries'),
    setQueryData: vi.spyOn(queryClient, 'setQueryData'),
    getQueryData: vi.spyOn(queryClient, 'getQueryData'),
  };
}

/**
 * Wait for a specific query to finish
 */
export async function waitForQuery(
  queryClient: QueryClient,
  queryKey: unknown[],
  options?: { timeout?: number }
) {
  const { waitFor } = await import('@testing-library/react');

  await waitFor(
    () => {
      const query = queryClient.getQueryCache().find({ queryKey });
      if (!query) {
        throw new Error('Query not found');
      }
      if (query.state.fetchStatus === 'fetching') {
        throw new Error('Query still fetching');
      }
    },
    { timeout: options?.timeout || 5000 }
  );
}

/**
 * Assert query state matches expected
 */
export function expectQueryState(
  queryClient: QueryClient,
  queryKey: unknown[],
  expected: {
    status?: 'pending' | 'error' | 'success';
    fetchStatus?: 'fetching' | 'paused' | 'idle';
    hasData?: boolean;
    hasError?: boolean;
  }
) {
  const query = queryClient.getQueryCache().find({ queryKey });

  if (!query) {
    throw new Error(`Query with key ${JSON.stringify(queryKey)} not found`);
  }

  if (expected.status !== undefined) {
    expect(query.state.status).toBe(expected.status);
  }

  if (expected.fetchStatus !== undefined) {
    expect(query.state.fetchStatus).toBe(expected.fetchStatus);
  }

  if (expected.hasData !== undefined) {
    const hasData = query.state.data !== undefined;
    expect(hasData).toBe(expected.hasData);
  }

  if (expected.hasError !== undefined) {
    const hasError = query.state.error !== null;
    expect(hasError).toBe(expected.hasError);
  }
}

/**
 * Create a mock query function for testing
 */
export function createMockQueryFn<T>(data: T, delay?: number) {
  return vi.fn().mockImplementation(async () => {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return data;
  });
}

/**
 * Create a mock mutation function for testing
 */
export function createMockMutationFn<T, V>(
  response: (variables: V) => T,
  delay?: number
) {
  return vi.fn().mockImplementation(async (variables: V) => {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return response(variables);
  });
}

/**
 * Helper to test query refetch
 */
export async function testQueryRefetch(
  queryClient: QueryClient,
  queryKey: unknown[]
) {
  await queryClient.refetchQueries({ queryKey });
  await waitForQuery(queryClient, queryKey);
}

/**
 * Helper to test query invalidation
 */
export async function testQueryInvalidation(
  queryClient: QueryClient,
  queryKey: unknown[]
) {
  await queryClient.invalidateQueries({ queryKey });
  await waitForQuery(queryClient, queryKey);
}

// Re-export expect for convenience
import { expect } from 'vitest';
export { expect };
