/**
 * Helpers et utilitaires pour les tests de pages Tenders
 */

import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Tender, TenderDetail, TenderWithRelevance } from '@/types';

/**
 * Render un composant avec QueryClient configuré pour les tests
 */
export function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

/**
 * Mock complet de tous les hooks use-tenders
 */
export function mockTenderHooks(overrides?: {
  tenders?: Tender[];
  tender?: TenderDetail | null;
  relevantTenders?: TenderWithRelevance[];
  count?: number;
  isLoading?: boolean;
  error?: Error | null;
  documents?: any[];
  matchingResults?: any;
  complianceResults?: any;
}) {
  const {
    useTenders,
    useTendersCount,
    useRelevantTenders,
    useTender,
    useTenderDocuments,
    useTenderMatchingResults,
    useTenderComplianceResults,
    useProcessTender,
    useDownloadDocument,
  } = require('@/hooks/use-tenders');

  useTenders.mockReturnValue({
    data: overrides?.tenders ?? [],
    isLoading: overrides?.isLoading ?? false,
    error: overrides?.error ?? null,
  });

  useTendersCount.mockReturnValue({
    data: { count: overrides?.count ?? 0 },
  });

  useRelevantTenders.mockReturnValue({
    data: overrides?.relevantTenders ?? [],
    isLoading: overrides?.isLoading ?? false,
    error: overrides?.error ?? null,
  });

  useTender.mockReturnValue({
    data: overrides?.tender ?? null,
    isLoading: overrides?.isLoading ?? false,
    error: overrides?.error ?? null,
  });

  useTenderDocuments.mockReturnValue({
    data: overrides?.documents ?? [],
  });

  useTenderMatchingResults.mockReturnValue({
    data: overrides?.matchingResults,
  });

  useTenderComplianceResults.mockReturnValue({
    data: overrides?.complianceResults,
  });

  useProcessTender.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  });

  useDownloadDocument.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  });
}

/**
 * Créer un QueryClient pour les tests
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Attendre que le loading disparaisse
 */
export async function waitForLoadingToFinish(container: HTMLElement) {
  const { waitForElementToBeRemoved } = await import('@testing-library/react');
  const skeletons = container.querySelectorAll('[data-testid*="skeleton"]');
  if (skeletons.length > 0) {
    await waitForElementToBeRemoved(() =>
      container.querySelectorAll('[data-testid*="skeleton"]')
    );
  }
}

/**
 * Helper pour simuler un délai réseau
 */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock de toast avec tracking des appels
 */
export function createMockToast() {
  const toast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
  };

  vi.doMock('sonner', () => ({
    toast,
  }));

  return toast;
}

/**
 * Vérifier qu'un tableau contient au moins un élément matchant une condition
 */
export function arrayContains<T>(array: T[], predicate: (item: T) => boolean): boolean {
  return array.some(predicate);
}

/**
 * Obtenir tous les textes d'un conteneur
 */
export function getAllTexts(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('*'))
    .map((el) => el.textContent)
    .filter((text): text is string => !!text);
}

/**
 * Vérifier si un élément est visible (pas display:none, visibility:hidden, etc.)
 */
export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetParent !== null
  );
}

/**
 * Mock de useRouter avec tracking
 */
export function createMockRouter() {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };

  vi.doMock('next/navigation', () => ({
    useRouter: () => router,
    usePathname: () => '/tenders',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
  }));

  return router;
}

/**
 * Générer un ID unique pour les tests
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Vérifier qu'un élément a un attribut ARIA spécifique
 */
export function hasAriaAttribute(
  element: HTMLElement,
  attribute: string,
  value?: string
): boolean {
  const attr = element.getAttribute(attribute);
  if (value === undefined) {
    return attr !== null;
  }
  return attr === value;
}

/**
 * Trouver un élément par son texte partiel (case-insensitive)
 */
export function findByPartialText(
  container: HTMLElement,
  text: string
): HTMLElement | null {
  const normalizedText = text.toLowerCase();
  const elements = Array.from(container.querySelectorAll('*'));

  return (
    (elements.find((el) => {
      const content = el.textContent?.toLowerCase() || '';
      return content.includes(normalizedText);
    }) as HTMLElement) || null
  );
}

/**
 * Mock de window.matchMedia pour tester le responsive
 */
export function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Créer une fonction de mutation mockée avec tracking
 */
export function createMockMutation<T = any>(
  implementation?: (variables: T) => Promise<any>
) {
  const mutateAsync = vi.fn(implementation || (() => Promise.resolve({})));
  const mutate = vi.fn();

  return {
    mutateAsync,
    mutate,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
  };
}

/**
 * Vérifier qu'une fonction a été appelée avec des arguments partiels
 */
export function toHaveBeenCalledWithPartial<T extends any[]>(
  fn: (...args: T) => any,
  ...partialArgs: Partial<T>
) {
  const calls = (fn as any).mock.calls;
  return calls.some((call: T) =>
    partialArgs.every((arg, index) => {
      if (typeof arg === 'object') {
        return Object.keys(arg).every(
          (key) => call[index][key] === (arg as any)[key]
        );
      }
      return call[index] === arg;
    })
  );
}
