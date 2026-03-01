/**
 * Test Template: Hook
 *
 * Copy this template to create a new hook test:
 * 1. Copy file to tests/unit/hooks/
 * 2. Rename to match hook name
 * 3. Update imports and test descriptions
 * 4. Write your tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/tests/utils';
import React from 'react';

// TODO: Import your hook
// import { useMyHook } from '@/hooks/use-my-hook';

describe('useMyHook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  // Wrapper for hooks that need providers
  function createWrapper() {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  describe('Basic Functionality', () => {
    it('should return initial state', () => {
      // TODO: Render hook
      // const { result } = renderHook(() => useMyHook());

      // TODO: Check initial state
      // expect(result.current.data).toBeUndefined();
      // expect(result.current.isLoading).toBe(false);
    });

    it('should return expected values', () => {
      // TODO: Render hook with parameters
      // const { result } = renderHook(() => useMyHook({ param: 'value' }));

      // TODO: Check returned values
      // expect(result.current.someValue).toBe('expected');
    });
  });

  describe('State Updates', () => {
    it('should update state when action is called', async () => {
      // TODO: Render hook
      // const { result } = renderHook(() => useMyHook());

      // TODO: Call action
      // act(() => {
      //   result.current.doSomething();
      // });

      // TODO: Check updated state
      // await waitFor(() => {
      //   expect(result.current.value).toBe('updated');
      // });
    });

    it('should handle async updates', async () => {
      // TODO: Render hook
      // const { result } = renderHook(() => useMyHook());

      // TODO: Call async action
      // await act(async () => {
      //   await result.current.fetchData();
      // });

      // TODO: Check result
      // expect(result.current.data).toBeDefined();
    });
  });

  describe('With React Query', () => {
    it('should fetch data successfully', async () => {
      // TODO: Render hook with wrapper
      // const { result } = renderHook(() => useMyHook(), {
      //   wrapper: createWrapper(),
      // });

      // TODO: Wait for query
      // await waitFor(() => {
      //   expect(result.current.isSuccess).toBe(true);
      // });

      // TODO: Check data
      // expect(result.current.data).toBeDefined();
    });

    it('should handle query errors', async () => {
      // TODO: Mock error
      // const mockFetch = vi.fn().mockRejectedValue(new Error('Failed'));

      // TODO: Render hook
      // const { result } = renderHook(() => useMyHook(), {
      //   wrapper: createWrapper(),
      // });

      // TODO: Wait for error
      // await waitFor(() => {
      //   expect(result.current.isError).toBe(true);
      // });

      // TODO: Check error
      // expect(result.current.error).toBeDefined();
    });

    it('should refetch when invalidated', async () => {
      // TODO: Render hook
      // const { result } = renderHook(() => useMyHook(), {
      //   wrapper: createWrapper(),
      // });

      // TODO: Wait for initial fetch
      // await waitFor(() => {
      //   expect(result.current.isSuccess).toBe(true);
      // });

      // TODO: Invalidate and refetch
      // await queryClient.invalidateQueries({ queryKey: ['myKey'] });

      // TODO: Check refetch happened
      // await waitFor(() => {
      //   expect(mockFetch).toHaveBeenCalledTimes(2);
      // });
    });
  });

  describe('Parameters and Dependencies', () => {
    it('should react to parameter changes', () => {
      // TODO: Render hook with initial params
      // const { result, rerender } = renderHook(
      //   ({ param }: { param: string }) => useMyHook(param),
      //   { initialProps: { param: 'initial' } }
      // );

      // TODO: Check initial state
      // expect(result.current.value).toBe('initial');

      // TODO: Rerender with new param
      // rerender({ param: 'updated' });

      // TODO: Check updated state
      // expect(result.current.value).toBe('updated');
    });

    it('should handle dependency changes', async () => {
      // TODO: Render hook with dependency
      // const { result, rerender } = renderHook(
      //   ({ id }: { id: string | null }) => useMyHook(id),
      //   { initialProps: { id: null } }
      // );

      // TODO: Initially should not fetch
      // expect(result.current.isLoading).toBe(false);

      // TODO: Update dependency
      // rerender({ id: '123' });

      // TODO: Should fetch now
      // await waitFor(() => {
      //   expect(result.current.isSuccess).toBe(true);
      // });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      // TODO: Render hook
      // const { unmount } = renderHook(() => useMyHook());

      // TODO: Setup spy on cleanup
      // const cleanupSpy = vi.fn();

      // TODO: Unmount
      // unmount();

      // TODO: Check cleanup was called
      // expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should cancel pending requests on unmount', async () => {
      // TODO: Render hook with async operation
      // const { unmount } = renderHook(() => useMyHook(), {
      //   wrapper: createWrapper(),
      // });

      // TODO: Start async operation
      // act(() => {
      //   result.current.startAsync();
      // });

      // TODO: Unmount before completion
      // unmount();

      // TODO: Check request was cancelled
      // expect(mockAbort).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined parameters', () => {
      // TODO: Render hook with null
      // const { result } = renderHook(() => useMyHook(null));

      // TODO: Check fallback behavior
      // expect(result.current.value).toBe('default');
    });

    it('should handle rapid updates', async () => {
      // TODO: Render hook
      // const { result } = renderHook(() => useMyHook());

      // TODO: Call action multiple times rapidly
      // act(() => {
      //   result.current.update('1');
      //   result.current.update('2');
      //   result.current.update('3');
      // });

      // TODO: Check final state
      // expect(result.current.value).toBe('3');
    });

    it('should debounce calls if needed', async () => {
      vi.useFakeTimers();

      // TODO: Render hook with debounced action
      // const { result } = renderHook(() => useMyHook());

      // TODO: Call action multiple times
      // act(() => {
      //   result.current.debouncedAction();
      //   result.current.debouncedAction();
      //   result.current.debouncedAction();
      // });

      // TODO: Fast-forward time
      // act(() => {
      //   vi.runAllTimers();
      // });

      // TODO: Check action was called once
      // expect(mockAction).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});
