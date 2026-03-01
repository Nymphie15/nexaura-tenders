import api from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Tender,
  TenderDetail,
  TenderDocument,
  WorkflowState,
  WorkflowStats,
  HITLCheckpointInfo,
  HITLDecision,
  CompanyProfile,
  HealthStatus,
  PaginatedResponse,
} from "@/types";
import type {
  CompanyPersona,
  PersonaTemplate,
  CreatePersonaRequest,
  UpdatePersonaRequest,
} from "@/types/persona";
import type {
  WritingMode,
  ModeApplicationResult,
  ApplyModeRequest,
  PreviewModeResponse,
  SuggestModeResponse,
} from "@/types/writing-modes";
import type {
  QuickCheckResult,
  QuickCheckJob,
  StartQuickCheckRequest,
  StartQuickCheckResponse,
} from "@/types/quick-check";
import type {
  DocumentSuggestion,
  InlineEditResult,
  InlineEditRequest,
  GenerateSuggestionsRequest,
  ChatMessageRequest,
  ChatMessageResponse,
  DocumentVersion,
  VersionComparison,
} from "@/types/document-edition";

// ============================================
// Auth Endpoints
// ============================================

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
  }): Promise<void> => {
    await api.post("/auth/change-password", data);
  },

  refresh: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await api.post<{ access_token: string }>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
};

// ============================================
// Tenders Endpoints
// ============================================

export interface TendersListParams {
  limit?: number;
  offset?: number;
  status?: string;
  source?: string;
  domain?: string;
  search?: string;
}

export interface SearchParams {
  keywords: string[];
  domains?: string[];
  limit?: number;
  sources?: string[];
}

export interface TenderWithRelevance extends Tender {
  relevance_score: number;
  relevance_details?: {
    domain_match: number;
    cpv_match: number;
    geo_match: number;
    budget_match: number;
    cert_match: number;
  };
  recommendation?: "excellent" | "bon" | "moyen" | "faible";
  matched_keywords?: string[];
}

export interface RelevantTendersParams {
  limit?: number;
  offset?: number;
  min_score?: number;
}

export const tendersApi = {
  list: async (params?: TendersListParams): Promise<Tender[]> => {
    const response = await api.get<Tender[]>("/tenders", { params });
    return response.data;
  },

  listRelevant: async (params?: RelevantTendersParams): Promise<TenderWithRelevance[]> => {
    const response = await api.get<TenderWithRelevance[]>("/tenders/relevant", { params });
    return response.data;
  },

  count: async (params?: { status?: string; source?: string }): Promise<{ count: number }> => {
    const response = await api.get<{ count: number }>("/tenders/count", { params });
    return response.data;
  },

  search: async (data: SearchParams): Promise<Tender[]> => {
    const response = await api.post<Tender[]>("/tenders/search", data);
    return response.data;
  },

  upload: async (files: File[], metadata?: {
    title?: string;
    client?: string;
    deadline?: string;
  }): Promise<Tender> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (metadata?.title) formData.append("title", metadata.title);
    if (metadata?.client) formData.append("client", metadata.client);
    if (metadata?.deadline) formData.append("deadline", metadata.deadline);

    const response = await api.post<Tender>("/tenders/upload", formData, {
      headers: { "Content-Type": undefined },
      timeout: 120000, // 2 minutes for uploads
    });
    return response.data;
  },

  get: async (id: string): Promise<TenderDetail> => {
    const response = await api.get<TenderDetail>(`/tenders/${id}`);
    return response.data;
  },

  process: async (id: string, options?: {
    download_dce?: boolean;
    priority?: "low" | "normal" | "high";
  }): Promise<{ case_id: string }> => {
    const response = await api.post<{ case_id: string }>(`/tenders/${id}/process`, options || {});
    return response.data;
  },

  getStatus: async (id: string): Promise<{
    status: string;
    progress: number;
    current_phase?: string;
  }> => {
    const response = await api.get(`/tenders/${id}/status`);
    return response.data;
  },

  getMatchingResults: async (id: string): Promise<{
    matching_rate: number;
    matched_products: Array<{
      requirement_id: string;
      product_id: string;
      score: number;
    }>;
  }> => {
    const response = await api.get(`/tenders/${id}/results/matching`);
    return response.data;
  },

  getComplianceResults: async (id: string): Promise<{
    compliance_score: number;
    checks: Array<{
      check_id: string;
      name: string;
      passed: boolean;
      details?: string;
    }>;
  }> => {
    const response = await api.get(`/tenders/${id}/results/compliance`);
    return response.data;
  },

  listDocuments: async (id: string): Promise<TenderDocument[]> => {
    const response = await api.get<TenderDocument[]>(`/tenders/${id}/documents`);
    return response.data;
  },

  downloadDocument: async (id: string, filename: string): Promise<Blob> => {
    const response = await api.get(`/tenders/${id}/documents/${filename}`, {
      responseType: "blob",
    });
    return response.data;
  },

  getDocumentContent: async (id: string, filename: string): Promise<{
    filename: string;
    tender_id: string;
    content: string;
    format: string;
    size: number;
    editable: boolean;
  }> => {
    const response = await api.get(`/tenders/${id}/documents/${filename}/content`);
    return response.data;
  },

  saveDocumentContent: async (id: string, filename: string, content: string): Promise<{
    filename: string;
    tender_id: string;
    saved: boolean;
    size: number;
    backup: string;
  }> => {
    const response = await api.put(`/tenders/${id}/documents/${filename}/content`, { content });
    return response.data;
  },
};

// ============================================
// Workflow Endpoints
// ============================================

export interface WorkflowsListParams {
  limit?: number;
  status?: string;
  phase?: string;
  awaiting_human?: boolean;
  search?: string;
}

export const workflowApi = {
  listCases: async (params?: WorkflowsListParams): Promise<WorkflowState[]> => {
    const response = await api.get<WorkflowState[]>("/workflow/cases", { params });
    return response.data;
  },

  getCase: async (caseId: string): Promise<WorkflowState> => {
    const response = await api.get<WorkflowState>(`/workflow/cases/${caseId}`);
    return response.data;
  },

  getCaseHistory: async (caseId: string): Promise<{
    phases: Array<{
      phase: string;
      status: string;
      started_at: string;
      completed_at?: string;
      duration_ms?: number;
    }>;
  }> => {
    const response = await api.get(`/workflow/cases/${caseId}/history`);
    return response.data;
  },

  resumeCase: async (caseId: string): Promise<void> => {
    await api.post(`/workflow/cases/${caseId}/resume`);
  },

  cancelCase: async (caseId: string, reason?: string): Promise<void> => {
    await api.post(`/workflow/cases/${caseId}/cancel`, { reason });
  },

  retryPhase: async (caseId: string, phase: string): Promise<void> => {
    await api.post(`/workflow/cases/${caseId}/retry/${phase}`);
  },

  getStats: async (): Promise<WorkflowStats> => {
    const response = await api.get<WorkflowStats>("/workflow/stats");
    return response.data;
  },

  // New workflow methods
  getPhaseDetails: async (caseId: string, phase: string): Promise<{
    phase: string;
    status: string;
    started_at?: string;
    completed_at?: string;
    duration_ms?: number;
    inputs?: Record<string, unknown>;
    outputs?: Record<string, unknown>;
    errors?: Array<{ message: string; timestamp: string }>;
    metrics?: {
      llm_calls?: number;
      tokens_used?: number;
      api_calls?: number;
    };
  }> => {
    const response = await api.get(`/workflow/cases/${caseId}/phases/${phase}`);
    return response.data;
  },

  getTransitions: async (caseId: string): Promise<{
    transitions: Array<{
      from_phase: string;
      to_phase: string;
      triggered_at: string;
      trigger: "auto" | "manual" | "hitl" | "error";
      metadata?: Record<string, unknown>;
    }>;
  }> => {
    const response = await api.get(`/workflow/cases/${caseId}/transitions`);
    return response.data;
  },

  skipPhase: async (caseId: string, phase: string, reason?: string): Promise<{
    skipped: boolean;
    next_phase: string;
  }> => {
    const response = await api.post(`/workflow/cases/${caseId}/skip/${phase}`, { reason });
    return response.data;
  },

  assignCase: async (caseId: string, assignedTo: string) => {
    const response = await api.patch(`/workflow/cases/${caseId}/assign`, { assigned_to: assignedTo });
    return response.data;
  },

  unassignCase: async (caseId: string) => {
    const response = await api.delete(`/workflow/cases/${caseId}/assign`);
    return response.data;
  },

  getRequirements: async (caseId: string): Promise<{ case_id: string; requirements: any[]; count: number }> => {
    const r = await api.get(`/workflow/cases/${caseId}/requirements`);
    return r.data;
  },

  updateRequirements: async (caseId: string, requirements: any[]): Promise<{ case_id: string; updated: boolean; count: number }> => {
    const r = await api.put(`/workflow/cases/${caseId}/requirements`, { requirements });
    return r.data;
  },
};

// ============================================
// HITL Endpoints
// ============================================

export const hitlApi = {
  getPending: async (checkpointType?: string): Promise<HITLCheckpointInfo[]> => {
    const response = await api.get<HITLCheckpointInfo[]>("/workflow/hitl/pending", {
      params: { checkpoint_type: checkpointType },
    });
    return response.data;
  },

  getCheckpoint: async (caseId: string, checkpoint: string): Promise<HITLCheckpointInfo> => {
    const response = await api.get<HITLCheckpointInfo>(
      `/workflow/hitl/${caseId}/${checkpoint}`
    );
    return response.data;
  },

  submitDecision: async (
    caseId: string,
    checkpoint: string,
    decision: HITLDecision
  ): Promise<void> => {
    await api.post(`/workflow/hitl/${caseId}/${checkpoint}`, decision, {
      timeout: 60000, // 60s — workflow resume can be slow
    });
  },

  getEnrichedContext: async (caseId: string, checkpoint: string): Promise<Record<string, unknown>> => {
    const response = await api.get(`/workflow/hitl/${caseId}/${checkpoint}/context`);
    return response.data;
  },
};

// ============================================
// Onboarding Endpoints
// ============================================

export const onboardingApi = {
  getStatus: async () => {
    const response = await api.get("/onboarding/status");
    return response.data;
  },
  start: async () => {
    const response = await api.post("/onboarding/start");
    return response.data;
  },
  completeStep: async (stepIndex: number) => {
    const response = await api.post(`/onboarding/step/${stepIndex}/complete`);
    return response.data;
  },
  complete: async () => {
    const response = await api.post("/onboarding/complete");
    return response.data;
  },
  skip: async () => {
    const response = await api.post("/onboarding/skip");
    return response.data;
  },
  getBadges: async () => {
    const response = await api.get("/onboarding/badges");
    return response.data;
  },
};

// ============================================
// Company Endpoints
// ============================================

export const companyApi = {
  get: async (): Promise<CompanyProfile> => {
    const response = await api.get<CompanyProfile>("/company/me");
    return response.data;
  },

  update: async (siret: string, data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
    const response = await api.put<CompanyProfile>(`/company/${siret}`, data);
    return response.data;
  },

  getBySiret: async (siret: string): Promise<CompanyProfile> => {
    const response = await api.get<CompanyProfile>(`/company/${siret}`);
    return response.data;
  },

  create: async (data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
    const response = await api.post<CompanyProfile>("/company", data);
    return response.data;
  },

  enrichBySiret: async (siret: string): Promise<Record<string, unknown>> => {
    const response = await api.get(`/company/enrich/${siret}`);
    return response.data;
  },
};


// ============================================
// Health Endpoints
// ============================================

export const healthApi = {
  check: async (): Promise<HealthStatus> => {
    const response = await api.get<HealthStatus>("/health");
    return response.data;
  },

  ready: async (): Promise<{ ready: boolean }> => {
    const response = await api.get<{ ready: boolean }>("/health/ready");
    return response.data;
  },

  detailed: async (): Promise<{
    status: string;
    services: Record<string, { status: string; latency_ms?: number }>;
  }> => {
    const response = await api.get("/health/detailed");
    return response.data;
  },
};

// ============================================
// Tests Endpoints (Admin Only)
// ============================================

export interface SectorResult {
  sector: string;
  status: string;
  company_name?: string;
  company_siret?: string;
  boamp_reference?: string;
  execution_time: number;
  documents: string[];
  certifications: string[];
  error_message?: string;
  memoire_technique_preview?: string;
}

export interface TestStatusResponse {
  test_id: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  progress: number;
  current_sector?: string;
  sectors_completed: number;
  sectors_total: number;
  sectors_requested: string[];
}

export interface TestResultsResponse {
  test_id: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  progress: number;
  sectors_completed: number;
  sectors_total: number;
  results: Record<string, SectorResult>;
}

export interface TestHistoryItem {
  test_id: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  sectors_requested: string[];
  sectors_completed: number;
  sectors_total: number;
}

export interface ExistingResults {
  sectors: Record<string, {
    sector: string;
    company_folder: string;
    documents: string[];
    memoire_preview?: string;
  }>;
  count: number;
  message: string;
}

export const testsApi = {
  listSectors: async (): Promise<string[]> => {
    const response = await api.get<string[]>("/tests/sectors");
    return response.data;
  },

  startTest: async (data: {
    sectors: string[];
    use_real_boamp?: boolean;
    company_siret?: string;
  }): Promise<TestStatusResponse> => {
    const response = await api.post<TestStatusResponse>("/tests/run-sectors", data);
    return response.data;
  },

  getStatus: async (testId: string): Promise<TestStatusResponse> => {
    const response = await api.get<TestStatusResponse>(`/tests/${testId}/status`);
    return response.data;
  },

  getResults: async (testId: string): Promise<TestResultsResponse> => {
    const response = await api.get<TestResultsResponse>(`/tests/${testId}/results`);
    return response.data;
  },

  cancelTest: async (testId: string): Promise<void> => {
    await api.post(`/tests/${testId}/cancel`);
  },

  getHistory: async (limit?: number): Promise<TestHistoryItem[]> => {
    const response = await api.get<TestHistoryItem[]>("/tests/history", {
      params: { limit },
    });
    return response.data;
  },

  downloadSectorDocuments: async (testId: string, sector: string): Promise<Blob> => {
    const response = await api.get(`/tests/${testId}/download/${sector}`, {
      responseType: "blob",
    });
    return response.data;
  },

  getExistingResults: async (): Promise<ExistingResults> => {
    const response = await api.get<ExistingResults>("/tests/existing-results");
    return response.data;
  },

  getSectorMemoire: async (sector: string): Promise<{
    sector: string;
    company_folder: string;
    content: string;
    length: number;
  }> => {
    const response = await api.get(`/tests/existing-results/${sector}/memoire`);
    return response.data;
  },

  downloadExistingSectorDocuments: async (sector: string): Promise<Blob> => {
    const response = await api.get(`/tests/existing-results/${sector}/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Database-backed endpoints (PostgreSQL)
  getDbTests: async (params?: { limit?: number; sector?: string }): Promise<GeneratedTestResponse[]> => {
    const response = await api.get<GeneratedTestResponse[]>("/tests/db/list", { params });
    return response.data;
  },

  getDbTestDocument: async (testId: string, docName: string): Promise<{
    test_id: string;
    document: string;
    content: string;
    length: number;
  }> => {
    const response = await api.get(`/tests/db/${testId}/document/${docName}`);
    return response.data;
  },

  getDbStats: async (): Promise<GeneratedTestStats> => {
    const response = await api.get<GeneratedTestStats>("/tests/db/stats");
    return response.data;
  },
};

// Types for database-backed tests
export interface GeneratedTestResponse {
  id: string;
  sector_id: string;
  sector_name: string;
  status: string;
  company_siret?: string;
  company_name?: string;
  company_city?: string;
  company_effectif?: number;
  dce_reference?: string;
  dce_objet?: string;
  dce_acheteur?: string;
  dce_type_marche?: string;
  output_path?: string;
  documents: string[];
  minijupe_score?: number;
  minijupe_compliant?: boolean;
  vcycle_score?: number;
  vcycle_coverage?: number;
  execution_time?: number;
  created_at?: string;
}

export interface GeneratedTestStats {
  total_tests: number;
  by_sector: Record<string, number>;
  average_minijupe_score?: number;
  average_vcycle_score?: number;
  average_execution_time?: number;
  minijupe_compliant_count: number;
  recent_tests: {
    sector: string;
    company: string;
    dce: string;
    created_at?: string;
  }[];
}

// ============================================
// Real LLM Test Types & Endpoints
// ============================================

export interface RealLLMTestStatus {
  test_id: string;
  status: "pending" | "running" | "success" | "error" | "cancelled";
  mode: "real_llm";
  sector: string;
  started_at?: string;
  completed_at?: string;
  execution_time: number;
  llm_calls_count: number;
  phases_completed: number;
  phases_total: number;
  current_phase?: string;
  progress_percent: number;
  error?: string;
}

export interface RealLLMTestResult {
  test_id: string;
  sector: string;
  status: string;
  mode: "real_llm";
  started_at?: string;
  completed_at?: string;
  execution_time: number;
  llm_calls_count: number;
  llm_total_tokens: number;
  llm_cost_estimate: number;
  phases_completed: number;
  phases_total: number;
  phase_progress: Array<{
    phase: string;
    index: number;
    status: string;
    duration_ms: number;
    llm_calls: number;
    error?: string;
  }>;
  company_siret?: string;
  company_name?: string;
  dce_reference?: string;
  documents_generated: string[];
  minijupe_score?: number;
  vcycle_score?: number;
  error?: string;
}

export interface RealLLMProgressEvent {
  type: "test_start" | "phase_start" | "phase_complete" | "test_complete" | "test_error" | "heartbeat" | "pong";
  test_id?: string;
  timestamp?: string;
  sector?: string;
  mode?: string;
  phase?: string;
  phase_index?: number;
  percent?: number;
  duration?: number;
  llm_calls?: number;
  status?: string;
  execution_time?: number;
  llm_calls_count?: number;
  error?: string;
}

export const realLLMTestsApi = {
  startTest: async (data: {
    sectors: string[];
    company_siret?: string;
  }): Promise<RealLLMTestStatus> => {
    const response = await api.post<RealLLMTestStatus>("/tests/run-real-llm", data);
    return response.data;
  },

  getStatus: async (testId: string): Promise<RealLLMTestStatus> => {
    const response = await api.get<RealLLMTestStatus>(`/tests/real-llm/${testId}/status`);
    return response.data;
  },

  getResults: async (testId: string): Promise<RealLLMTestResult> => {
    const response = await api.get<RealLLMTestResult>(`/tests/real-llm/${testId}/results`);
    return response.data;
  },

  cancelTest: async (testId: string): Promise<{ status: string; test_id: string }> => {
    const response = await api.post(`/tests/real-llm/${testId}/cancel`);
    return response.data;
  },
};

// ============================================
// Direct LLM Testing Types & Endpoints
// ============================================

export interface LLMPromptTestRequest {
  provider: "ollama" | "anthropic" | "gemini";
  model: string;
  prompt: string;
  system_prompt?: string;
  task_type?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface LLMPromptTestResponse {
  response: string;
  model_used: string;
  provider_used: string;
  tier_used: number;
  execution_time_ms: number;
  tokens_input: number;
  tokens_output: number;
  cost_estimate_usd: number;
  cache_hit: boolean;
}

export interface LLMModelInfo {
  model: string;
  tier: number;
  description: string;
  cost_per_1m_input: number;
  cost_per_1m_output: number;
}

export interface LLMModelsListResponse {
  providers: Record<string, LLMModelInfo[]>;
  default_routing: Record<string, { provider: string; model: string }>;
}

export interface LLMCompareRequest {
  prompt: string;
  system_prompt?: string;
  models: Array<{ provider: string; model: string }>;
  temperature?: number;
  max_tokens?: number;
}

export interface LLMCompareResult {
  provider: string;
  model: string;
  tier?: number;
  response: string | null;
  execution_time_ms: number;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  cache_hit?: boolean;
  error: string | null;
}

export interface LLMCompareResponse {
  prompt: string;
  results: LLMCompareResult[];
  total_time_ms: number;
  total_cost_usd: number;
}

export interface LLMMetrics {
  total_calls: number;
  total_tokens: number;
  total_cost_usd: number;
  by_provider: Record<string, { calls: number; cost: number; tokens: number }>;
  by_model: Record<string, { calls: number; cost: number; tokens: number }>;
  cache_stats: {
    hits: number;
    misses: number;
    hit_rate: number;
  };
  by_tier: Record<string, { calls: number; cost: number }>;
  recent_calls: Array<{
    timestamp: string;
    model: string;
    tokens: number;
    cost: number;
    cached: boolean;
  }>;
  error?: string;
}

export const llmTestsApi = {
  listModels: async (): Promise<LLMModelsListResponse> => {
    const response = await api.get<LLMModelsListResponse>("/tests/llm/models");
    return response.data;
  },

  testPrompt: async (data: LLMPromptTestRequest): Promise<LLMPromptTestResponse> => {
    const response = await api.post<LLMPromptTestResponse>("/tests/llm/prompt", data, {
      timeout: 120000, // 2 minutes timeout for LLM calls
    });
    return response.data;
  },

  compareModels: async (data: LLMCompareRequest): Promise<LLMCompareResponse> => {
    const response = await api.post<LLMCompareResponse>("/tests/llm/compare", data, {
      timeout: 300000, // 5 minutes timeout for multiple models
    });
    return response.data;
  },

  getMetrics: async (): Promise<LLMMetrics> => {
    const response = await api.get<LLMMetrics>("/tests/llm/metrics");
    return response.data;
  },
};

// ============================================
// Documents Endpoints
// ============================================

export interface DocumentAnnotation {
  id: string;
  document_id: string;
  user_id: string;
  type: "highlight" | "comment" | "flag" | "requirement";
  content: string;
  position?: {
    page: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  created_at: string;
  updated_at?: string;
}

export interface DocumentInfo {
  id: string;
  tender_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  category: "dce" | "rc" | "cctp" | "bpu" | "dpgf" | "acte_engagement" | "other";
  extracted_text?: boolean;
  page_count?: number;
  annotations_count: number;
  created_at: string;
  updated_at?: string;
}

export const documentsApi = {
  list: async (tenderId: string, params?: {
    category?: string;
    search?: string;
  }): Promise<DocumentInfo[]> => {
    const response = await api.get<DocumentInfo[]>(`/documents/${tenderId}`, { params });
    return response.data;
  },

  get: async (tenderId: string, docId: string): Promise<DocumentInfo> => {
    const response = await api.get<DocumentInfo>(`/documents/${tenderId}/${docId}`);
    return response.data;
  },

  upload: async (tenderId: string, files: File[], category?: string): Promise<{
    uploaded: DocumentInfo[];
    errors?: Array<{ filename: string; error: string }>;
  }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (category) formData.append("category", category);

    const response = await api.post(`/documents/${tenderId}/upload`, formData, {
      headers: { "Content-Type": undefined },
      timeout: 300000, // 5 minutes for large uploads
    });
    return response.data;
  },

  download: async (tenderId: string, docId: string): Promise<Blob> => {
    const response = await api.get(`/documents/${tenderId}/${docId}/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  downloadBatch: async (tenderId: string, docIds: string[]): Promise<Blob> => {
    const response = await api.post(`/documents/${tenderId}/download-batch`, { doc_ids: docIds }, {
      responseType: "blob",
      timeout: 300000,
    });
    return response.data;
  },

  delete: async (tenderId: string, docId: string): Promise<void> => {
    await api.delete(`/documents/${tenderId}/${docId}`);
  },

  // Annotations
  listAnnotations: async (docId: string): Promise<DocumentAnnotation[]> => {
    const response = await api.get<DocumentAnnotation[]>(`/documents/annotations/${docId}`);
    return response.data;
  },

  addAnnotation: async (docId: string, annotation: {
    type: DocumentAnnotation["type"];
    content: string;
    position?: DocumentAnnotation["position"];
  }): Promise<DocumentAnnotation> => {
    const response = await api.post<DocumentAnnotation>(`/documents/annotations/${docId}`, annotation);
    return response.data;
  },

  updateAnnotation: async (docId: string, annotationId: string, data: {
    content?: string;
    position?: DocumentAnnotation["position"];
  }): Promise<DocumentAnnotation> => {
    const response = await api.put<DocumentAnnotation>(`/documents/annotations/${docId}/${annotationId}`, data);
    return response.data;
  },

  deleteAnnotation: async (docId: string, annotationId: string): Promise<void> => {
    await api.delete(`/documents/annotations/${docId}/${annotationId}`);
  },
};

// ============================================
// Notifications Endpoints
// ============================================

export interface NotificationPreferences {
  email_enabled: boolean;
  email_frequency: "instant" | "hourly" | "daily" | "weekly";
  push_enabled: boolean;
  sound_enabled: boolean;
  categories: {
    hitl: boolean;
    workflow: boolean;
    tenders: boolean;
    system: boolean;
  };
  quiet_hours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
  };
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  priority: "low" | "medium" | "high" | "urgent";
  category: "hitl" | "workflow" | "tenders" | "system";
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  read_at?: string;
}

export interface NotificationListParams {
  limit?: number;
  offset?: number;
  unread_only?: boolean;
  category?: string;
  priority?: string;
  from_date?: string;
  to_date?: string;
}

export const notificationsApi = {
  list: async (params?: NotificationListParams): Promise<{
    notifications: NotificationItem[];
    total: number;
    unread_count: number;
  }> => {
    const response = await api.get("/notifications", { params });
    return response.data;
  },

  get: async (id: string): Promise<NotificationItem> => {
    const response = await api.get<NotificationItem>(`/notifications/${id}`);
    return response.data;
  },

  markAsRead: async (ids: string[]): Promise<{ updated: number }> => {
    const response = await api.post("/notifications/mark-read", { ids });
    return response.data;
  },

  markAllAsRead: async (category?: string): Promise<{ updated: number }> => {
    const response = await api.post("/notifications/mark-all-read", { category });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  deleteAll: async (params?: { read_only?: boolean; older_than_days?: number }): Promise<{ deleted: number }> => {
    const response = await api.delete("/notifications", { params });
    return response.data;
  },

  // Preferences
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get<NotificationPreferences>("/notifications/preferences");
    return response.data;
  },

  updatePreferences: async (prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await api.put<NotificationPreferences>("/notifications/preferences", prefs);
    return response.data;
  },

  // Unread count (lightweight endpoint for polling)
  getUnreadCount: async (): Promise<{ count: number; by_category: Record<string, number> }> => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },
};

// ============================================
// Feedback/Learning Endpoints
// ============================================

export type FeedbackType = "thumbs_up" | "thumbs_down" | "edit";

export interface FeedbackRequest {
  element_id: string;
  type: FeedbackType;
  original_value?: string;
  corrected_value?: string;
  phase?: string;
  context?: Record<string, unknown>;
}

export interface FeedbackResponse {
  id: string;
  element_id: string;
  type: FeedbackType;
  created_at: string;
}

export interface CorrectionHistoryItem {
  id: string;
  case_id: string;
  section_id: string;
  section_type: string;
  correction_types: string[];
  change_ratio: number;
  original_preview: string;
  modified_preview: string;
  created_at: string;
}

export interface FeedbackStats {
  total_corrections: number;
  corrections_processed: number;
  patterns_extracted: number;
  preferences_learned: number;
  by_correction_type: Record<string, number>;
  by_section_type: Record<string, number>;
  avg_change_ratio: number;
}

export interface UserPreference {
  preference_id: string;
  preference_type: string;
  preference_key: string;
  preference_value: unknown;
  confidence: number;
  evidence_count: number;
}

// Real-time inline feedback types
export interface InlineFeedbackRequest {
  workflow_id: string;
  phase: string;
  element_id: string;
  feedback_type: FeedbackType;
  original_value: string;
  corrected_value?: string;
  metadata?: Record<string, unknown>;
}

export interface InlineFeedbackResponse {
  id: string;
  workflow_id: string;
  phase: string;
  element_id: string;
  feedback_type: FeedbackType;
  timestamp: string;
  learning_triggered: boolean;
}

export interface RealtimeFeedbackMetrics {
  total_count: number;
  thumbs_up_count: number;
  thumbs_down_count: number;
  edit_count: number;
  approval_rate: number;
  negative_rate: number;
  edit_rate: number;
  trend_last_24h: number;
  by_phase: Record<string, Record<string, number>>;
  learning_triggered: boolean;
}

export interface LearningTrigger {
  trigger_id: string;
  phase: string;
  negative_count: number;
  threshold: number;
  triggered_at: string;
  status: string;
}

export interface FeedbackDashboard {
  last_hour: RealtimeFeedbackMetrics;
  last_24h: RealtimeFeedbackMetrics;
  last_7d: RealtimeFeedbackMetrics;
  pending_learning_triggers: LearningTrigger[];
  alerts: Array<{ type: string; phase: string; message: string }>;
}

export const feedbackApi = {
  // NEW: Submit inline feedback (thumbs up/down/edit) - Real-time feedback loop
  submitInlineFeedback: async (data: InlineFeedbackRequest): Promise<InlineFeedbackResponse> => {
    const response = await api.post<InlineFeedbackResponse>("/feedback/inline", data);
    return response.data;
  },

  // NEW: Get real-time feedback metrics
  getRealtimeMetrics: async (params?: {
    hours?: number;
    phase?: string;
  }): Promise<RealtimeFeedbackMetrics> => {
    const response = await api.get<RealtimeFeedbackMetrics>("/feedback/metrics", { params });
    return response.data;
  },

  // NEW: Get feedback for a workflow
  getWorkflowFeedback: async (workflowId: string, params?: {
    phase?: string;
    limit?: number;
  }): Promise<InlineFeedbackResponse[]> => {
    const response = await api.get<InlineFeedbackResponse[]>(`/feedback/workflow/${workflowId}`, { params });
    return response.data;
  },

  // NEW: Get element feedback summary
  getElementFeedback: async (workflowId: string, elementId: string): Promise<{
    element_id: string;
    thumbs_up: number;
    thumbs_down: number;
    edit: number;
    latest_feedback: InlineFeedbackResponse | null;
  }> => {
    const response = await api.get("/feedback/element", {
      params: { workflow_id: workflowId, element_id: elementId },
    });
    return response.data;
  },

  // NEW: Get pending learning triggers
  getLearningTriggers: async (status?: string): Promise<LearningTrigger[]> => {
    const response = await api.get<LearningTrigger[]>("/feedback/learning/triggers", {
      params: { status },
    });
    return response.data;
  },

  // NEW: Mark learning complete
  markLearningComplete: async (triggerId: string, success: boolean = true): Promise<{
    status: string;
    trigger_id: string;
    marked_as: string;
  }> => {
    const response = await api.post("/feedback/learning/complete", {
      trigger_id: triggerId,
      success,
    });
    return response.data;
  },

  // NEW: Get feedback dashboard data
  getDashboard: async (): Promise<FeedbackDashboard> => {
    const response = await api.get<FeedbackDashboard>("/feedback/dashboard");
    return response.data;
  },

  // Submit a quick feedback (thumbs up/down) - Legacy endpoint
  submitQuickFeedback: async (data: {
    element_id: string;
    type: "thumbs_up" | "thumbs_down";
    phase?: string;
    context?: Record<string, unknown>;
  }): Promise<FeedbackResponse> => {
    const response = await api.post<FeedbackResponse>("/learning/feedback/quick", data);
    return response.data;
  },

  // Submit an edit/correction
  submitCorrection: async (data: {
    case_id: string;
    section_id: string;
    original: string;
    modified: string;
    context?: Record<string, unknown>;
  }): Promise<FeedbackResponse> => {
    const response = await api.post<FeedbackResponse>("/learning/corrections", data);
    return response.data;
  },

  // Submit batch corrections
  submitCorrectionBatch: async (data: {
    case_id: string;
    modifications: Array<{ section_id: string; original: string; modified: string }>;
    context?: Record<string, unknown>;
  }): Promise<FeedbackResponse[]> => {
    const response = await api.post<FeedbackResponse[]>("/learning/corrections/batch", data);
    return response.data;
  },

  // Get correction history for a user
  getCorrectionHistory: async (params?: {
    limit?: number;
    offset?: number;
    section_type?: string;
  }): Promise<CorrectionHistoryItem[]> => {
    const response = await api.get<CorrectionHistoryItem[]>("/learning/corrections", { params });
    return response.data;
  },

  // Get feedback stats
  getStats: async (): Promise<FeedbackStats> => {
    const response = await api.get<FeedbackStats>("/learning/stats");
    return response.data;
  },

  // Get user preferences
  getPreferences: async (params?: {
    section_type?: string;
    company_id?: string;
  }): Promise<UserPreference[]> => {
    const response = await api.get<UserPreference[]>("/learning/preferences", { params });
    return response.data;
  },

  // Trigger learning from corrections
  triggerLearning: async (params?: {
    company_id?: string;
    limit?: number;
  }): Promise<{ status: string; message: string }> => {
    const response = await api.post("/learning/train", params);
    return response.data;
  },
};

// ============================================
// Cost Analytics Endpoints
// ============================================

export interface CostBreakdown {
  cost_usd: number;
  tokens: number;
  calls: number;
  percentage?: number;
}

export interface CostReportResponse {
  company_id: string | null;
  period_start: string;
  period_end: string;
  total_cost_usd: number;
  total_tokens: number;
  total_calls: number;
  avg_cost_per_call: number;
  by_model: Record<string, CostBreakdown>;
  by_phase: Record<string, CostBreakdown>;
  top_workflows: Array<{
    workflow_id: string;
    cost_usd: number;
    tokens: number;
    calls: number;
  }>;
}

export interface BudgetStatusResponse {
  current_month_cost_usd: number;
  monthly_budget_usd: number;
  usage_percent: number;
  remaining_usd: number;
  projected_month_end_usd: number;
  days_elapsed: number;
  alert: {
    level: "warning" | "critical";
    message: string;
    recommendations: string[];
  } | null;
}

export interface CostsByModelResponse {
  period_days: number;
  total_models: number;
  total_cost_usd: number;
  models: Array<{
    model: string;
    tier: number;
    cost_usd: number;
    tokens: number;
    calls: number;
    percentage: number;
    cost_per_1k_tokens: number;
  }>;
  by_tier: Record<number, number>;
}

export interface CostsByPhaseResponse {
  period_days: number;
  total_phases: number;
  total_cost_usd: number;
  phases: Array<{
    phase: string;
    cost_usd: number;
    tokens: number;
    calls: number;
    percentage: number;
    avg_cost_per_call: number;
  }>;
}

export interface CostsByCompanyResponse {
  period_days: number;
  total_companies: number;
  total_cost_usd: number;
  companies: Array<{
    company_id: string;
    cost: number;
    tokens: number;
    calls: number;
    percentage: number;
  }>;
}

export interface TrackLLMCallRequest {
  model: string;
  tokens: number;
  workflow_id?: string;
  phase?: string;
  user_id?: string;
  company_id?: string;
  latency_ms?: number;
  cached?: boolean;
  success?: boolean;
  error_message?: string;
}

export const costAnalyticsApi = {
  // Get detailed cost report
  getReport: async (params?: {
    company_id?: string;
    workflow_id?: string;
    period_days?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<CostReportResponse> => {
    const response = await api.get<CostReportResponse>("/analytics/costs/report", { params });
    return response.data;
  },

  // Get budget status
  getBudgetStatus: async (): Promise<BudgetStatusResponse> => {
    const response = await api.get<BudgetStatusResponse>("/analytics/costs/budget");
    return response.data;
  },

  // Get costs by model
  getByModel: async (params?: { period_days?: number }): Promise<CostsByModelResponse> => {
    const response = await api.get<CostsByModelResponse>("/analytics/costs/by-model", { params });
    return response.data;
  },

  // Get costs by phase
  getByPhase: async (params?: { period_days?: number }): Promise<CostsByPhaseResponse> => {
    const response = await api.get<CostsByPhaseResponse>("/analytics/costs/by-phase", { params });
    return response.data;
  },

  // Get costs by company
  getByCompany: async (params?: {
    period_days?: number;
    limit?: number;
  }): Promise<CostsByCompanyResponse> => {
    const response = await api.get<CostsByCompanyResponse>("/analytics/costs/by-company", { params });
    return response.data;
  },

  // Get pricing table
  getPricing: async (): Promise<{
    currency: string;
    unit: string;
    tiers: Record<string, { description: string; models: Record<string, number> }>;
    default_price: number;
  }> => {
    const response = await api.get("/analytics/costs/pricing");
    return response.data;
  },

  // Get quick summary
  getSummary: async (): Promise<{
    timestamp: string;
    totals: { cost_usd: number; tokens: number; calls: number };
    budget: {
      current_month_cost_usd: number;
      monthly_budget_usd: number;
      usage_percent: number;
      remaining_usd: number;
      alert_level: string | null;
    };
    top_models: Array<{ model: string; cost_usd: number }>;
    top_phases: Array<{ phase: string; cost_usd: number }>;
  }> => {
    const response = await api.get("/analytics/costs/summary");
    return response.data;
  },

  // Track an LLM call manually
  trackCall: async (data: TrackLLMCallRequest): Promise<{
    status: string;
    model: string;
    tokens: number;
    cost_usd: number;
    phase: string;
    company_id: string | null;
  }> => {
    const response = await api.post("/analytics/costs/track", data);
    return response.data;
  },
};

// ============================================
// Persona Endpoints
// ============================================

export const personaApi = {
  list: async (): Promise<CompanyPersona[]> => {
    const response = await api.get<CompanyPersona[]>("/company/persona");
    return response.data;
  },

  get: async (id: string): Promise<CompanyPersona> => {
    const response = await api.get<CompanyPersona>(`/company/persona/${id}`);
    return response.data;
  },

  create: async (data: CreatePersonaRequest): Promise<CompanyPersona> => {
    const response = await api.post<CompanyPersona>("/company/persona", data);
    return response.data;
  },

  update: async (id: string, data: UpdatePersonaRequest): Promise<CompanyPersona> => {
    const response = await api.put<CompanyPersona>(`/company/persona/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/company/persona/${id}`);
  },

  getTemplates: async (): Promise<PersonaTemplate[]> => {
    const response = await api.get<PersonaTemplate[]>("/company/persona/templates");
    return response.data;
  },

  createFromTemplate: async (templateId: string, name?: string): Promise<CompanyPersona> => {
    const response = await api.post<CompanyPersona>("/company/persona/from-template", null, {
      params: { template_id: templateId, name },
    });
    return response.data;
  },

  analyzeDocuments: async (id: string): Promise<{ suggested_profile: CompanyPersona["voice_profile"] }> => {
    const response = await api.post(`/company/persona/${id}/analyze`);
    return response.data;
  },
};

// ============================================
// Writing Modes Endpoints
// ============================================

export const writingModesApi = {
  list: async (): Promise<WritingMode[]> => {
    const response = await api.get<WritingMode[]>("/writing-modes");
    return response.data;
  },

  apply: async (data: ApplyModeRequest): Promise<ModeApplicationResult> => {
    const response = await api.post<ModeApplicationResult>("/writing-modes/apply", data);
    return response.data;
  },

  preview: async (data: ApplyModeRequest): Promise<PreviewModeResponse> => {
    const response = await api.post<PreviewModeResponse>("/writing-modes/preview", data);
    return response.data;
  },

  suggest: async (content: string, documentType: string = "memoire"): Promise<SuggestModeResponse> => {
    const response = await api.post<SuggestModeResponse>("/writing-modes/suggest", null, {
      params: { content, document_type: documentType },
    });
    return response.data;
  },

  applyToDocument: async (documentId: string, mode: string, personaId?: string): Promise<ModeApplicationResult> => {
    const response = await api.post<ModeApplicationResult>(`/documents/${documentId}/apply-mode`, {
      mode,
      persona_id: personaId,
    });
    return response.data;
  },
};

// ============================================
// Quick Check Endpoints
// ============================================

export const quickCheckApi = {
  start: async (data: StartQuickCheckRequest): Promise<StartQuickCheckResponse> => {
    const response = await api.post<StartQuickCheckResponse>("/quick-check/start", data);
    return response.data;
  },

  getJobStatus: async (jobId: string): Promise<QuickCheckJob> => {
    const response = await api.get<QuickCheckJob>(`/quick-check/jobs/${jobId}/status`);
    return response.data;
  },

  getResult: async (jobId: string): Promise<QuickCheckResult> => {
    const response = await api.get<QuickCheckResult>(`/quick-check/jobs/${jobId}/result`);
    return response.data;
  },

  checkTenderSync: async (tenderId: string): Promise<QuickCheckResult> => {
    const response = await api.post<QuickCheckResult>(`/quick-check/tenders/${tenderId}/quick-check`);
    return response.data;
  },
};

// ============================================
// Document Edition Endpoints
// ============================================

export const documentEditionApi = {
  generateSuggestions: async (documentId: string, data: GenerateSuggestionsRequest): Promise<DocumentSuggestion[]> => {
    const response = await api.post<DocumentSuggestion[]>(`/documents/${documentId}/suggestions`, data);
    return response.data;
  },

  inlineEdit: async (documentId: string, data: InlineEditRequest): Promise<InlineEditResult> => {
    const response = await api.post<InlineEditResult>(`/documents/${documentId}/inline-edit`, data);
    return response.data;
  },

  chat: async (documentId: string, data: ChatMessageRequest): Promise<ChatMessageResponse> => {
    const response = await api.post<ChatMessageResponse>(`/documents/${documentId}/chat`, data);
    return response.data;
  },

  listVersions: async (documentId: string): Promise<DocumentVersion[]> => {
    const response = await api.get<DocumentVersion[]>(`/documents/${documentId}/versions`);
    return response.data;
  },

  compareVersions: async (documentId: string, versionFromId: string, versionToId: string): Promise<VersionComparison> => {
    const response = await api.post<VersionComparison>(`/documents/${documentId}/versions/compare`, null, {
      params: { version_from_id: versionFromId, version_to_id: versionToId },
    });
    return response.data;
  },

  rollback: async (documentId: string, versionId: string): Promise<void> => {
    await api.post(`/documents/${documentId}/rollback`, null, {
      params: { version_id: versionId },
    });
  },
};

// ============================================
// Search Endpoints
// ============================================

export interface UnifiedSearchParams {
  query: string;
  limit?: number;
  include_tenders?: boolean;
  include_workflows?: boolean;
  include_hitl?: boolean;
}

export interface UnifiedSearchResult {
  tenders: Array<{
    id: string;
    reference: string;
    title: string;
    status: string;
    score: number;
    relevance: number;
  }>;
  workflows: Array<{
    case_id: string;
    tender_reference: string;
    tender_title: string;
    status: string;
    current_phase: string;
    relevance: number;
  }>;
  hitl: Array<{
    case_id: string;
    checkpoint: string;
    tender_reference: string;
    urgency: string;
    relevance: number;
  }>;
  total: number;
}

export interface AdvancedTenderSearchParams {
  query?: string;
  statuses?: string[];
  sources?: string[];
  date_from?: string;
  date_to?: string;
  budget_min?: number;
  budget_max?: number;
  score_min?: number;
  score_max?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface AdvancedTenderSearchResult {
  results: Array<{
    id: string;
    reference: string;
    title: string;
    buyer: string;
    status: string;
    source: string;
    deadline: string;
    budget: number | null;
    score: number | null;
    relevance: number;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export const searchApi = {
  unified: async (params: UnifiedSearchParams): Promise<UnifiedSearchResult> => {
    const response = await api.post<any>("/search/unified", params);
    const data = response.data;
    // API returns { results: [{type, id, title, ...}], total } - transform to grouped format
    if (data.results && !data.tenders) {
      const tenders = data.results
        .filter((r: any) => r.type === "tender")
        .map((r: any) => ({ id: r.id, reference: r.subtitle || r.id, title: r.title, status: r.metadata?.status || "nouveau", score: r.score || 0, relevance: r.score || 0 }));
      const workflows = data.results
        .filter((r: any) => r.type === "workflow")
        .map((r: any) => ({ case_id: r.id, tender_reference: r.subtitle || r.id, tender_title: r.title, status: r.metadata?.status || "", current_phase: r.metadata?.current_phase || "", relevance: r.score || 0 }));
      const hitl = data.results
        .filter((r: any) => r.type === "hitl")
        .map((r: any) => ({ case_id: r.id, checkpoint: r.metadata?.checkpoint || "", tender_reference: r.title, urgency: r.metadata?.urgency || "", relevance: r.score || 0 }));
      return { tenders, workflows, hitl, total: data.total || data.results.length };
    }
    return data;
  },

  advancedTenders: async (params: AdvancedTenderSearchParams): Promise<AdvancedTenderSearchResult> => {
    const response = await api.post<AdvancedTenderSearchResult>("/search/tenders/advanced", params);
    return response.data;
  },

  suggestions: async (query: string): Promise<Array<{ text: string; type: string; id?: string }>> => {
    const response = await api.get("/search/suggestions", { params: { q: query } });
    return response.data;
  },
};

// ============================================
// Templates Endpoints
// ============================================

export interface TemplateItem {
  id: string;
  section_name: string;
  section_title: string;
  sector: string;
  content: string;
  summary: string;
  quality_score: number;
  reuse_count: number;
  success_rate: number;
  tags: string[];
  word_count: number;
  source_case_id?: string;
  source_tender_reference?: string;
  validated_by?: string;
  validated_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TemplateCreateRequest {
  section_name: string;
  section_title?: string;
  sector: string;
  content: string;
  tags?: string[];
  source_case_id?: string;
  source_tender_reference?: string;
}

export interface TemplateSearchParams {
  query: string;
  section_name?: string;
  sector?: string;
  top_k?: number;
  min_score?: number;
}

export interface TemplateSearchResult {
  template: TemplateItem;
  similarity_score: number;
}

export interface TemplateStats {
  total_templates: number;
  by_section: Record<string, number>;
  by_sector: Record<string, number>;
  top_templates: Array<{
    id: string;
    section_name: string;
    sector: string;
    reuse_count: number;
    quality_score: number;
  }>;
  avg_quality_score: number;
}

export const templatesApi = {
  list: async (params?: {
    sector?: string;
    section_name?: string;
    limit?: number;
    offset?: number;
  }): Promise<TemplateItem[]> => {
    const response = await api.get<TemplateItem[]>("/templates/", { params });
    return response.data;
  },

  get: async (id: string): Promise<TemplateItem> => {
    const response = await api.get<TemplateItem>(`/templates/${id}`);
    return response.data;
  },

  create: async (data: TemplateCreateRequest): Promise<TemplateItem> => {
    const response = await api.post<TemplateItem>("/templates/", data);
    return response.data;
  },

  update: async (id: string, data: Partial<TemplateCreateRequest>): Promise<TemplateItem> => {
    const response = await api.put<TemplateItem>(`/templates/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/templates/${id}`);
  },

  search: async (params: TemplateSearchParams): Promise<TemplateSearchResult[]> => {
    const response = await api.post<TemplateSearchResult[]>("/templates/search", params);
    return response.data;
  },

  stats: async (): Promise<TemplateStats> => {
    const response = await api.get<TemplateStats>("/templates/stats");
    return response.data;
  },
};

// ============================================
// Analytics Endpoints (#7)
// ============================================

export const analyticsApi = {
  userKpis: async (period: number = 30) => {
    const response = await api.get("/analytics/user/kpis", { params: { period } });
    return response.data;
  },
  winRate: async () => {
    const response = await api.get("/analytics/user/win-rate");
    return response.data;
  },
  timeline: async (months: number = 6) => {
    const response = await api.get("/analytics/user/timeline", { params: { months } });
    return response.data;
  },
  recommendations: async (limit: number = 5) => {
    const response = await api.get("/analytics/user/recommendations", { params: { limit } });
    return response.data;
  },
};

// ============================================
// Audit Endpoints
// ============================================

export const auditApi = {
  list: async (params?: Record<string, any>) => {
    const response = await api.get("/audit", { params });
    return response.data;
  },
  stats: async () => {
    const response = await api.get("/audit/stats");
    const d = response.data;
    return {
      total_events: d.total_logs ?? 0,
      events_today: d.logs_today ?? 0,
      unique_users: d.unique_users_today ?? 0,
      by_status: { error: d.failures_today ?? 0 },
    };
  },
};

// ============================================
// Comments & Annotations Endpoints (#25)
// ============================================

import type {
  CommentThread,
  Comment,
  CreateCommentRequest,
  ReplyCommentRequest,
  EditCommentRequest,
} from "@/types/comments";

export type { CommentThread, Comment, CreateCommentRequest, ReplyCommentRequest, EditCommentRequest };

export const commentsApi = {
  listThreads: async (
    resourceType: string,
    resourceId: string
  ): Promise<CommentThread[]> => {
    const response = await api.get<CommentThread[]>(
      `/comments/${resourceType}/${resourceId}`
    );
    return response.data;
  },

  createThread: async (
    resourceType: string,
    resourceId: string,
    data: CreateCommentRequest
  ): Promise<CommentThread> => {
    const response = await api.post<CommentThread>(
      `/comments/${resourceType}/${resourceId}`,
      data
    );
    return response.data;
  },

  replyToThread: async (
    threadId: string,
    data: ReplyCommentRequest
  ): Promise<Comment> => {
    const response = await api.post<Comment>(
      `/comments/thread/${threadId}/reply`,
      data
    );
    return response.data;
  },

  editComment: async (
    commentId: string,
    data: EditCommentRequest
  ): Promise<Comment> => {
    const response = await api.patch<Comment>(
      `/comments/${commentId}`,
      data
    );
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },

  resolveThread: async (threadId: string): Promise<CommentThread> => {
    const response = await api.patch<CommentThread>(
      `/comments/thread/${threadId}/resolve`
    );
    return response.data;
  },
};

// ============================================
// Export all endpoints
// ============================================

export const endpoints = {
  auth: authApi,
  tenders: tendersApi,
  workflow: workflowApi,
  hitl: hitlApi,
  company: companyApi,
  health: healthApi,
  tests: testsApi,
  realLLMTests: realLLMTestsApi,
  llmTests: llmTestsApi,
  documents: documentsApi,
  notifications: notificationsApi,
  feedback: feedbackApi,
  costAnalytics: costAnalyticsApi,
  persona: personaApi,
  writingModes: writingModesApi,
  quickCheck: quickCheckApi,
  documentEdition: documentEditionApi,
  search: searchApi,
  templates: templatesApi,
  analytics: analyticsApi,
  audit: auditApi,
  comments: commentsApi,
};

export default endpoints;
