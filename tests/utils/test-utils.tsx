/**
 * Test Utilities
 * Custom render functions and test helpers for React Testing Library
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

/**
 * Custom QueryClient for tests
 * Disables retries and sets cache time to 0 for predictable test behavior
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  });
}

/**
 * All Providers Wrapper
 * Wraps components with all necessary providers for testing
 */
interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Custom render with providers
 * Use this instead of RTL's render to automatically wrap with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders queryClient={queryClient}>{children}</AllProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient || createTestQueryClient(),
  };
}

/**
 * Mock fetch response helper
 */
export function mockFetchResponse<T>(data: T, options?: {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
}) {
  return vi.fn().mockResolvedValue({
    ok: (options?.status || 200) >= 200 && (options?.status || 200) < 300,
    status: options?.status || 200,
    statusText: options?.statusText || 'OK',
    headers: new Headers(options?.headers || {}),
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response);
}

/**
 * Mock fetch error helper
 */
export function mockFetchError(message: string, options?: {
  status?: number;
  statusText?: string;
}) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status: options?.status || 500,
    statusText: options?.statusText || 'Internal Server Error',
    json: async () => ({ error: message }),
    text: async () => message,
  } as Response);
}

/**
 * Wait for loading states to complete
 */
export async function waitForLoadingToFinish() {
  const { waitFor } = await import('@testing-library/react');
  return waitFor(() => {
    expect(document.querySelector('[data-testid*="loading"]')).not.toBeInTheDocument();
  }, { timeout: 3000 });
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  let store: Record<string, string> = {};

  const localStorageMock = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  return localStorageMock;
}

/**
 * Mock sessionStorage
 */
export function mockSessionStorage() {
  let store: Record<string, string> = {};

  const sessionStorageMock = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };

  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });

  return sessionStorageMock;
}

/**
 * Mock Next.js router with custom values
 */
export function mockRouter(overrides?: {
  pathname?: string;
  query?: Record<string, string>;
  push?: ReturnType<typeof vi.fn>;
  replace?: ReturnType<typeof vi.fn>;
}) {
  const router = {
    pathname: overrides?.pathname || '/',
    route: overrides?.pathname || '/',
    query: overrides?.query || {},
    asPath: overrides?.pathname || '/',
    push: overrides?.push || vi.fn(),
    replace: overrides?.replace || vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
  };

  return router;
}

/**
 * Create mock FormData
 */
export function createMockFormData(data: Record<string, string | File>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, value);
    }
  });
  return formData;
}

/**
 * Create mock File
 */
export function createMockFile(
  name: string,
  content: string,
  type: string = 'application/pdf'
): File {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

/**
 * Flush all promises
 * Useful for waiting for all pending promises to resolve
 */
export async function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Mock API response with delay
 */
export function mockApiResponseWithDelay<T>(
  data: T,
  delay: number = 100
): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

/**
 * Common test data factories
 */
export const testDataFactories = {
  user: (overrides?: Partial<{
    id: string;
    email: string;
    name: string;
    role: string;
  }>) => ({
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    ...overrides,
  }),

  tender: (overrides?: Partial<{
    id: string;
    title: string;
    reference: string;
    deadline: string;
  }>) => ({
    id: '1',
    title: 'Test Tender',
    reference: 'REF-2026-001',
    deadline: '2026-12-31',
    status: 'open',
    ...overrides,
  }),

  workflow: (overrides?: Partial<{
    id: string;
    tenderId: string;
    phase: string;
    status: string;
  }>) => ({
    id: '1',
    tenderId: '1',
    phase: 'INGESTION',
    status: 'IN_PROGRESS',
    progress: 0,
    ...overrides,
  }),
};

/**
 * Re-export everything from React Testing Library
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export custom render as default
export { renderWithProviders as render };
