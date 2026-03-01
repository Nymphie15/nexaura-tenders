/**
 * Mock Data
 * Centralized mock data for tests to ensure consistency
 */

import type { WorkflowPhase, WorkflowStatus } from '@/types/workflow';

/**
 * Mock User Data
 */
export const mockUsers = {
  admin: {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  user: {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  viewer: {
    id: '3',
    email: 'viewer@example.com',
    name: 'Viewer User',
    role: 'viewer',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

/**
 * Mock Auth Token
 */
export const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwNjc0MDgwMCwiZXhwIjoxNzA2ODI3MjAwfQ.fake-signature';

/**
 * Mock Tender Data
 */
export const mockTenders = {
  open: {
    id: 'tender-1',
    title: 'Construction de 10 logements sociaux',
    reference: 'REF-2026-001',
    deadline: '2026-12-31T23:59:59.000Z',
    status: 'open',
    publishDate: '2026-01-01T00:00:00.000Z',
    estimatedValue: 1500000,
    description: 'Construction de 10 logements sociaux à Lyon',
    source: 'BOAMP',
    sourceUrl: 'https://boamp.fr/tender-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  closed: {
    id: 'tender-2',
    title: 'Rénovation école primaire',
    reference: 'REF-2025-042',
    deadline: '2025-12-31T23:59:59.000Z',
    status: 'closed',
    publishDate: '2025-11-01T00:00:00.000Z',
    estimatedValue: 500000,
    description: 'Rénovation complète de l\'école primaire Jean Moulin',
    source: 'PLACE',
    sourceUrl: 'https://place.fr/tender-2',
    createdAt: '2025-11-01T00:00:00.000Z',
    updatedAt: '2025-12-31T00:00:00.000Z',
  },
  awarded: {
    id: 'tender-3',
    title: 'Fourniture de matériel informatique',
    reference: 'REF-2025-089',
    deadline: '2025-09-30T23:59:59.000Z',
    status: 'awarded',
    publishDate: '2025-08-01T00:00:00.000Z',
    estimatedValue: 250000,
    description: 'Fourniture de 500 ordinateurs portables',
    source: 'TED',
    sourceUrl: 'https://ted.europa.eu/tender-3',
    winner: 'ABC Informatique SAS',
    awardedAmount: 245000,
    createdAt: '2025-08-01T00:00:00.000Z',
    updatedAt: '2025-10-15T00:00:00.000Z',
  },
};

/**
 * Mock Workflow Data
 */
export const mockWorkflows = {
  inProgress: {
    id: 'workflow-1',
    tenderId: 'tender-1',
    phase: 'EXTRACTION' as WorkflowPhase,
    status: 'running' as WorkflowStatus,
    progress: 35,
    startedAt: '2026-01-20T10:00:00.000Z',
    estimatedCompletion: '2026-01-25T16:00:00.000Z',
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-24T14:30:00.000Z',
  },
  completed: {
    id: 'workflow-2',
    tenderId: 'tender-2',
    phase: 'PACKAGING' as WorkflowPhase,
    status: 'completed' as WorkflowStatus,
    progress: 100,
    startedAt: '2025-12-01T09:00:00.000Z',
    completedAt: '2025-12-15T17:30:00.000Z',
    createdAt: '2025-12-01T09:00:00.000Z',
    updatedAt: '2025-12-15T17:30:00.000Z',
  },
  paused: {
    id: 'workflow-3',
    tenderId: 'tender-3',
    phase: 'STRATEGY' as WorkflowPhase,
    status: 'paused' as WorkflowStatus,
    progress: 60,
    startedAt: '2025-11-10T08:00:00.000Z',
    pausedAt: '2025-11-20T12:00:00.000Z',
    pauseReason: 'Awaiting client information',
    createdAt: '2025-11-10T08:00:00.000Z',
    updatedAt: '2025-11-20T12:00:00.000Z',
  },
  error: {
    id: 'workflow-4',
    tenderId: 'tender-1',
    phase: 'RISK_ANALYSIS' as WorkflowPhase,
    status: 'failed' as WorkflowStatus,
    progress: 45,
    error: 'LLM timeout - DeepSeek unavailable',
    startedAt: '2026-01-18T11:00:00.000Z',
    createdAt: '2026-01-18T11:00:00.000Z',
    updatedAt: '2026-01-18T15:30:00.000Z',
  },
};

/**
 * Mock HITL Checkpoints
 */
export const mockCheckpoints = {
  goNoGo: {
    id: 'checkpoint-1',
    workflowId: 'workflow-1',
    type: 'GO_NOGO',
    status: 'pending',
    data: {
      matchingRate: 0.72,
      riskScore: 0.45,
      recommendation: 'GO',
      criticalRequirements: ['ISO 9001', 'Assurance décennale'],
    },
    createdAt: '2026-01-20T10:30:00.000Z',
  },
  strategyReview: {
    id: 'checkpoint-2',
    workflowId: 'workflow-1',
    type: 'STRATEGY_REVIEW',
    status: 'approved',
    data: {
      strategy: 'price_aggressive',
      differentiators: ['Innovation technique', 'Délais courts'],
      risks: ['Marge faible'],
    },
    approvedAt: '2026-01-21T14:00:00.000Z',
    approvedBy: '1',
    createdAt: '2026-01-21T09:00:00.000Z',
    updatedAt: '2026-01-21T14:00:00.000Z',
  },
  priceReview: {
    id: 'checkpoint-3',
    workflowId: 'workflow-2',
    type: 'PRICE_REVIEW',
    status: 'rejected',
    data: {
      totalPrice: 1250000,
      breakdown: {
        labor: 800000,
        materials: 350000,
        overhead: 100000,
      },
      margin: 0.08,
    },
    rejectedAt: '2025-12-10T16:00:00.000Z',
    rejectedBy: '1',
    rejectionReason: 'Margin too low - increase to 12%',
    createdAt: '2025-12-10T10:00:00.000Z',
    updatedAt: '2025-12-10T16:00:00.000Z',
  },
};

/**
 * Mock Documents
 */
export const mockDocuments = {
  dce: {
    id: 'doc-1',
    tenderId: 'tender-1',
    type: 'DCE',
    name: 'DCE_2026_001.pdf',
    size: 2547896,
    mimeType: 'application/pdf',
    url: '/api/documents/doc-1/download',
    uploadedAt: '2026-01-20T10:00:00.000Z',
    extractedText: 'Cahier des charges pour la construction...',
    pageCount: 45,
  },
  technicalSpec: {
    id: 'doc-2',
    tenderId: 'tender-1',
    type: 'TECHNICAL_SPEC',
    name: 'specifications_techniques.pdf',
    size: 1234567,
    mimeType: 'application/pdf',
    url: '/api/documents/doc-2/download',
    uploadedAt: '2026-01-20T10:05:00.000Z',
    extractedText: 'Spécifications techniques détaillées...',
    pageCount: 23,
  },
  response: {
    id: 'doc-3',
    tenderId: 'tender-2',
    workflowId: 'workflow-2',
    type: 'RESPONSE',
    name: 'reponse_REF-2025-042.docx',
    size: 456789,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    url: '/api/documents/doc-3/download',
    generatedAt: '2025-12-15T15:00:00.000Z',
    pageCount: 12,
  },
};

/**
 * Mock Notifications
 */
export const mockNotifications = {
  info: {
    id: 'notif-1',
    type: 'info',
    title: 'Workflow started',
    message: 'Workflow for REF-2026-001 has started',
    createdAt: '2026-01-20T10:00:00.000Z',
    read: false,
  },
  success: {
    id: 'notif-2',
    type: 'success',
    title: 'Workflow completed',
    message: 'Response generated successfully for REF-2025-042',
    createdAt: '2025-12-15T17:30:00.000Z',
    read: true,
  },
  warning: {
    id: 'notif-3',
    type: 'warning',
    title: 'HITL required',
    message: 'Price review needed for REF-2025-042',
    createdAt: '2025-12-10T10:00:00.000Z',
    read: false,
    actionUrl: '/workflows/workflow-2/checkpoints/checkpoint-3',
  },
  error: {
    id: 'notif-4',
    type: 'error',
    title: 'Workflow error',
    message: 'LLM timeout during risk analysis',
    createdAt: '2026-01-18T15:30:00.000Z',
    read: false,
    actionUrl: '/workflows/workflow-4',
  },
};

/**
 * Mock API Responses
 */
export const mockApiResponses = {
  login: {
    success: {
      accessToken: mockAuthToken,
      refreshToken: 'refresh-token-fake',
      user: mockUsers.admin,
    },
    invalid: {
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS',
    },
  },
  tenders: {
    list: {
      data: [mockTenders.open, mockTenders.closed],
      total: 2,
      page: 1,
      pageSize: 20,
    },
  },
  workflows: {
    create: {
      workflow: mockWorkflows.inProgress,
      message: 'Workflow created successfully',
    },
    status: {
      workflow: mockWorkflows.inProgress,
      currentPhase: 'EXTRACTION' as WorkflowPhase,
      estimatedTimeRemaining: 3600,
    },
  },
};

/**
 * Mock Environment Variables
 */
export const mockEnv = {
  NEXT_PUBLIC_API_URL: 'http://localhost:8000',
  NEXT_PUBLIC_APP_NAME: 'Tender Response System',
  NEXT_PUBLIC_ENABLE_ANALYTICS: 'false',
};
