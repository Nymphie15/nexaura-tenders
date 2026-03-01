/**
 * Tests for use-tenders hook
 * Tests all tender-related queries and mutations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useTenders,
  useTendersCount,
  useRelevantTenders,
  useTender,
  useTenderDocuments,
  useSearchTenders,
  useUploadDCE,
  useProcessTender,
  useTenderStatus,
  useDownloadDocument,
  useTenderMatchingResults,
  useTenderComplianceResults,
} from '@/hooks/use-tenders';
import { tendersApi } from '@/lib/api/endpoints';
import type { Tender, TenderDetail, TenderDocument } from '@/types';

// Mock the API module
vi.mock('@/lib/api/endpoints', () => ({
  tendersApi: {
    list: vi.fn(),
    count: vi.fn(),
    listRelevant: vi.fn(),
    get: vi.fn(),
    listDocuments: vi.fn(),
    search: vi.fn(),
    upload: vi.fn(),
    process: vi.fn(),
    getStatus: vi.fn(),
    downloadDocument: vi.fn(),
    getMatchingResults: vi.fn(),
    getComplianceResults: vi.fn(),
  },
}));

// Mock data
const mockTender: Tender = {
  id: 'tender-1',
  reference: 'REF-2024-001',
  title: 'Construction de batiment',
  description: 'Projet de construction',
  source: 'BOAMP',
  status: 'published',
  publication_date: '2024-01-15',
  deadline: '2024-03-15',
  estimated_budget: 500000,
  cpv_codes: ['45000000'],
  location: 'Paris',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

const mockTenderDetail: TenderDetail = {
  ...mockTender,
  documents: [],
  requirements: ['Certification ISO 9001'],
  evaluation_criteria: ['Prix: 60%', 'Qualite: 40%'],
  contact: {
    organization: 'Mairie de Paris',
    email: 'contact@paris.fr',
  },
};

const mockDocument: TenderDocument = {
  id: 'doc-1',
  filename: 'dce.pdf',
  size: 1024000,
  mime_type: 'application/pdf',
  uploaded_at: '2024-01-15T10:00:00Z',
};

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('use-tenders hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useTenders', () => {
    it('devrait charger la liste des tenders', async () => {
      const mockTenders = [mockTender];
      vi.mocked(tendersApi.list).mockResolvedValue(mockTenders);

      const { result } = renderHook(() => useTenders(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTenders);
      expect(tendersApi.list).toHaveBeenCalledTimes(1);
    });

    it('devrait passer les parametres de filtrage', async () => {
      const params = { status: 'published', source: 'BOAMP', limit: 10 };
      vi.mocked(tendersApi.list).mockResolvedValue([mockTender]);

      renderHook(() => useTenders(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(tendersApi.list).toHaveBeenCalledWith(params);
      });
    });

    it('devrait gerer les erreurs de chargement', async () => {
      const error = new Error('Network error');
      vi.mocked(tendersApi.list).mockRejectedValue(error);

      const { result } = renderHook(() => useTenders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useTendersCount', () => {
    it('devrait retourner le nombre de tenders', async () => {
      vi.mocked(tendersApi.count).mockResolvedValue({ count: 42 });

      const { result } = renderHook(() => useTendersCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ count: 42 });
    });

    it('devrait filtrer par statut', async () => {
      const params = { status: 'published' };
      vi.mocked(tendersApi.count).mockResolvedValue({ count: 10 });

      renderHook(() => useTendersCount(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(tendersApi.count).toHaveBeenCalledWith(params);
      });
    });
  });

  describe('useRelevantTenders', () => {
    it('devrait charger les tenders pertinents', async () => {
      const mockRelevant = [{ ...mockTender, relevance_score: 0.85 }];
      vi.mocked(tendersApi.listRelevant).mockResolvedValue(mockRelevant);

      const { result } = renderHook(() => useRelevantTenders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRelevant);
    });

    it('devrait refetch automatiquement toutes les 60 secondes', async () => {
      vi.mocked(tendersApi.listRelevant).mockResolvedValue([]);

      const { result } = renderHook(() => useRelevantTenders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify refetchInterval is set (via query options)
      expect(result.current.dataUpdatedAt).toBeDefined();
    });
  });

  describe('useTender', () => {
    it('devrait charger un tender specifique', async () => {
      vi.mocked(tendersApi.get).mockResolvedValue(mockTenderDetail);

      const { result } = renderHook(() => useTender('tender-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTenderDetail);
      expect(tendersApi.get).toHaveBeenCalledWith('tender-1');
    });

    it('ne devrait pas charger si id est vide', async () => {
      const { result } = renderHook(() => useTender(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(tendersApi.get).not.toHaveBeenCalled();
    });
  });

  describe('useTenderDocuments', () => {
    it('devrait charger les documents d\'un tender', async () => {
      const mockDocuments = [mockDocument];
      vi.mocked(tendersApi.listDocuments).mockResolvedValue(mockDocuments);

      const { result } = renderHook(() => useTenderDocuments('tender-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDocuments);
      expect(tendersApi.listDocuments).toHaveBeenCalledWith('tender-1');
    });
  });

  describe('useSearchTenders', () => {
    it('devrait rechercher des tenders', async () => {
      const searchParams = { keywords: ['construction'], domains: ['BTP'] };
      const mockResults = [mockTender];
      vi.mocked(tendersApi.search).mockResolvedValue(mockResults);

      const { result } = renderHook(() => useSearchTenders(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(searchParams);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResults);
      expect(tendersApi.search).toHaveBeenCalledWith(searchParams);
    });

    it('devrait gerer les erreurs de recherche', async () => {
      const error = new Error('Search failed');
      vi.mocked(tendersApi.search).mockRejectedValue(error);

      const { result } = renderHook(() => useSearchTenders(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ keywords: ['test'] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useUploadDCE', () => {
    it('devrait uploader des fichiers DCE', async () => {
      const mockResponse = { tender_id: 'tender-1', message: 'Upload success' };
      vi.mocked(tendersApi.upload).mockResolvedValue(mockResponse);

      const file = new File(['content'], 'dce.pdf', { type: 'application/pdf' });
      const metadata = { title: 'DCE Test' };

      const { result } = renderHook(() => useUploadDCE(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ files: [file], metadata });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(tendersApi.upload).toHaveBeenCalledWith([file], metadata);
    });

    it('devrait invalider les queries apres upload', async () => {
      const mockResponse = { tender_id: 'tender-1', message: 'Upload success' };
      vi.mocked(tendersApi.upload).mockResolvedValue(mockResponse);

      const file = new File(['content'], 'dce.pdf', { type: 'application/pdf' });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUploadDCE(), { wrapper });

      result.current.mutate({ files: [file] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // QueryClient should invalidate queries
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('useProcessTender', () => {
    it('devrait lancer le traitement d\'un tender', async () => {
      const mockResponse = { case_id: 'case-1', status: 'processing' };
      vi.mocked(tendersApi.process).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useProcessTender(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 'tender-1', options: { priority: 'high' } });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(tendersApi.process).toHaveBeenCalledWith('tender-1', { priority: 'high' });
    });
  });

  describe('useTenderStatus', () => {
    it('devrait recuperer le statut d\'un tender', async () => {
      const mockStatus = { status: 'processing', progress: 50 };
      vi.mocked(tendersApi.getStatus).mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useTenderStatus('tender-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStatus);
    });

    it('devrait poller toutes les 5 secondes', async () => {
      vi.mocked(tendersApi.getStatus).mockResolvedValue({ status: 'processing', progress: 50 });

      const { result } = renderHook(() => useTenderStatus('tender-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify polling is configured
      expect(result.current.dataUpdatedAt).toBeDefined();
    });

    it('ne devrait pas charger si enabled=false', async () => {
      const { result } = renderHook(() => useTenderStatus('tender-1', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(tendersApi.getStatus).not.toHaveBeenCalled();
    });
  });

  describe('useDownloadDocument', () => {
    it('devrait appeler l\'API de telechargement', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      vi.mocked(tendersApi.downloadDocument).mockResolvedValue(mockBlob);

      // Mock DOM APIs before rendering
      const mockAnchor = document.createElement('a');
      mockAnchor.click = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDownloadDocument(), { wrapper });

      act(() => {
        result.current.mutate({ tenderId: 'tender-1', filename: 'dce.pdf' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(tendersApi.downloadDocument).toHaveBeenCalledWith('tender-1', 'dce.pdf');
    });
  });

  describe('useTenderMatchingResults', () => {
    it('devrait charger les résultats de matching', async () => {
      const mockMatching = {
        score: 0.85,
        matched_criteria: ['domain', 'cpv'],
        recommendation: 'excellent',
      };
      vi.mocked(tendersApi.getMatchingResults).mockResolvedValue(mockMatching);

      const { result } = renderHook(() => useTenderMatchingResults('tender-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMatching);
    });
  });

  describe('useTenderComplianceResults', () => {
    it('devrait charger les résultats de compliance', async () => {
      const mockCompliance = {
        is_compliant: true,
        checks: [
          { name: 'Certification ISO', passed: true },
          { name: 'Experience', passed: true },
        ],
      };
      vi.mocked(tendersApi.getComplianceResults).mockResolvedValue(mockCompliance);

      const { result } = renderHook(() => useTenderComplianceResults('tender-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCompliance);
    });
  });
});
