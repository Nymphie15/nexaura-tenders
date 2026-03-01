/**
 * Test Server
 * MSW (Mock Service Worker) setup for API mocking in tests
 * Note: MSW is not installed yet - this file is ready for when it's added
 */

import { vi } from 'vitest';
import { mockApiResponses, mockTenders, mockWorkflows } from './mock-data';

/**
 * Mock fetch globally for tests
 */
export function setupMockFetch() {
  const mockFetch = vi.fn();
  global.fetch = mockFetch as unknown as typeof fetch;
  return mockFetch;
}

/**
 * Create a successful fetch response
 */
export function createFetchResponse<T>(data: T, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
  } as Response);
}

/**
 * Create a failed fetch response
 */
export function createFetchError(message: string, status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: 'Error',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    json: async () => ({ error: message }),
    text: async () => message,
    blob: async () => new Blob([message]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
  } as Response);
}

/**
 * Mock API handlers
 * These are simple mock functions for common API endpoints
 */
export const mockApiHandlers = {
  // Auth endpoints
  login: (success = true) => {
    if (success) {
      return createFetchResponse(mockApiResponses.login.success);
    }
    return createFetchResponse(mockApiResponses.login.invalid, 401);
  },

  // Tenders endpoints
  getTenders: () => createFetchResponse(mockApiResponses.tenders.list),
  getTender: (id: string) => {
    const tender = Object.values(mockTenders).find(t => t.id === id);
    if (!tender) {
      return createFetchError('Tender not found', 404);
    }
    return createFetchResponse(tender);
  },

  // Workflows endpoints
  createWorkflow: () => createFetchResponse(mockApiResponses.workflows.create),
  getWorkflow: (id: string) => {
    const workflow = Object.values(mockWorkflows).find(w => w.id === id);
    if (!workflow) {
      return createFetchError('Workflow not found', 404);
    }
    return createFetchResponse(workflow);
  },
  getWorkflowStatus: () => createFetchResponse(mockApiResponses.workflows.status),

  // Generic success
  success: <T>(data: T) => createFetchResponse(data),

  // Generic error
  error: (message: string, status = 500) => createFetchError(message, status),
};

/**
 * Setup fetch mock for specific endpoint
 */
export function mockEndpoint(
  url: string | RegExp,
  handler: () => Promise<Response>
) {
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

  if (!mockFetch) {
    throw new Error('Mock fetch not setup. Call setupMockFetch() first.');
  }

  mockFetch.mockImplementation((input: RequestInfo | URL) => {
    const requestUrl = typeof input === 'string' ? input : input.toString();

    if (typeof url === 'string') {
      if (requestUrl.includes(url)) {
        return handler();
      }
    } else {
      if (url.test(requestUrl)) {
        return handler();
      }
    }

    return createFetchError('Not found', 404);
  });
}

/**
 * Mock multiple endpoints at once
 */
export function mockEndpoints(
  endpoints: Array<{
    url: string | RegExp;
    method?: string;
    handler: () => Promise<Response>;
  }>
) {
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

  if (!mockFetch) {
    throw new Error('Mock fetch not setup. Call setupMockFetch() first.');
  }

  mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = typeof input === 'string' ? input : input.toString();
    const requestMethod = init?.method || 'GET';

    for (const endpoint of endpoints) {
      const urlMatches = typeof endpoint.url === 'string'
        ? requestUrl.includes(endpoint.url)
        : endpoint.url.test(requestUrl);

      const methodMatches = !endpoint.method || endpoint.method === requestMethod;

      if (urlMatches && methodMatches) {
        return endpoint.handler();
      }
    }

    return createFetchError('Not found', 404);
  });
}

/**
 * Reset all fetch mocks
 */
export function resetFetchMocks() {
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
  if (mockFetch && typeof mockFetch.mockReset === 'function') {
    mockFetch.mockReset();
  }
}

/**
 * Common API mock setups for tests
 */
export const apiMockPresets = {
  /**
   * Mock all endpoints to succeed
   */
  allSuccess: () => {
    mockEndpoints([
      { url: '/api/v1/auth/login', method: 'POST', handler: mockApiHandlers.login },
      { url: '/api/v1/tenders', method: 'GET', handler: mockApiHandlers.getTenders },
      { url: /\/api\/v1\/tenders\/[\w-]+$/, method: 'GET', handler: () => mockApiHandlers.getTender('tender-1') },
      { url: '/api/v1/workflows', method: 'POST', handler: mockApiHandlers.createWorkflow },
      { url: /\/api\/v1\/workflows\/[\w-]+$/, method: 'GET', handler: () => mockApiHandlers.getWorkflow('workflow-1') },
      { url: /\/api\/v1\/workflows\/[\w-]+\/status$/, method: 'GET', handler: mockApiHandlers.getWorkflowStatus },
    ]);
  },

  /**
   * Mock authentication to fail
   */
  authFailed: () => {
    mockEndpoint('/api/v1/auth/login', () => mockApiHandlers.login(false));
  },

  /**
   * Mock network error (fetch fails completely)
   */
  networkError: () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockRejectedValue(new Error('Network error'));
  },

  /**
   * Mock slow responses (for loading state tests)
   */
  slowResponses: (delay = 1000) => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(createFetchResponse({ data: 'slow response' }));
        }, delay);
      });
    });
  },
};
