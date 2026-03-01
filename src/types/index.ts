// Re-export all types

export * from "./persona";
export * from "./writing-modes";
export * from "./quick-check";
export * from "./document-edition";

// ============================================
// Core Enums & Union Types
// ============================================

export type WorkflowPhase =
  | "CREATED"
  | "INGESTION"
  | "EXTRACTION"
  | "MATCHING"
  | "RISK_ANALYSIS"
  | "STRATEGY"
  | "CALCULATION"
  | "GENERATION"
  | "VALIDATION"
  | "PACKAGING"
  | "COMPLETED"
  | "REJECTED"
  | "ERROR";

export type WorkflowStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "waiting_hitl";

export type HITLCheckpoint =
  | "go_nogo"
  | "strategy_review"
  | "price_review"
  | "tech_review";

export type HITLAction =
  | "approve"
  | "reject"
  | "modify"
  | "retry"
  | "skip";

export type TenderStatus =
  | "new"
  | "analyzing"
  | "ready"
  | "submitted"
  | "won"
  | "lost"
  | "archived";

export type TenderSource =
  | "boamp"
  | "ted"
  | "manual"
  | "api";

export type RiskDecision =
  | "GO"
  | "NO_GO"
  | "REVIEW";

// ============================================
// Workflow Phase Info
// ============================================

export interface WorkflowPhaseInfo {
  phase: WorkflowPhase;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// Auth & User Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  company_id: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  full_name?: string;
  company_name?: string;
  company_siret?: string;
}

// ============================================
// Tender Types
// ============================================

export interface Tender {
  id: string;
  title: string;
  reference?: string;
  description?: string;
  client?: string;
  acheteur?: string | { nom: string; adresse?: string; contact?: string };
  budget?: number;
  deadline?: string;
  status: string;
  source?: TenderSource | string;
  url?: string;
  score?: number;
  urgency?: string;
  lots?: TenderLot[];
  criteres_jugement?: CritereJugement[];
  delais?: Record<string, string>;
  type_marche?: string;
  procedure?: string;
  created_at: string;
  updated_at: string;
}

export interface TenderLot {
  id: string;
  number: number;
  lot_number?: number;
  title: string;
  description?: string;
  budget?: number;
}

export interface CritereJugement {
  name: string;
  critere?: string;
  weight: number;
  ponderation?: number;
  description?: string;
}

export interface TenderDetail extends Tender {
  documents: TenderDocument[];
  risk_score?: number;
  requirements?: TenderRequirement[];
  workflow_cases?: Array<{
    case_id: string;
    status: string;
    phase: string;
    created_at: string;
  }>;
  case_id?: string;
  acheteur_siret?: string;
  acheteur_email?: string;
  acheteur_telephone?: string;
  contact_nom?: string;
  contact_fonction?: string;
  relevance_details?: {
    domain_match?: number;
    cpv_match?: number;
    geo_match?: number;
    budget_match?: number;
    cert_match?: number;
  };
}

export interface TenderDocument {
  id: string;
  tender_id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  created_at: string;
}

export interface TenderRequirement {
  id: string;
  text: string;
  title?: string;
  category?: string;
  type?: string;
  priority?: string;
  source_document?: string;
  score?: number;
  mandatory?: boolean;
}

// ============================================
// Workflow Types
// ============================================

export interface WorkflowState {
  case_id: string;
  tender_id: string;
  status: string;
  current_phase: string;
  progress: number;
  risk_score?: number;
  risk_decision?: RiskDecision;
  matching_rate?: number;
  confidence_score?: number;
  requirements?: TenderRequirement[];
  errors?: string[];
  pending_hitl?: boolean;
  waiting_hitl?: boolean;
  running?: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  total_cases?: number;
  running?: number;
  waiting_hitl?: number;
  pending_hitl?: number;
  by_phase: Record<string, number>;
}

// ============================================
// HITL Types
// ============================================

export interface HITLCheckpointInfo {
  case_id: string;
  checkpoint_type: string;
  checkpoint?: HITLCheckpoint;
  phase: string;
  data: Record<string, unknown>;
  context?: any;
  ai_recommendation?: {
    action: HITLAction | string;
    confidence: number;
    reasoning: string;
  };
  tender_reference?: string;
  tender_title?: string;
  urgency?: string;
  reference?: string;
  created_at: string;
}

export interface HITLDecision {
  action: HITLAction | string;
  comments?: string;
  modifications?: Record<string, unknown>;
  data?: Record<string, unknown>;
  decided_by?: string;
  decided_at?: string;
}

// ============================================
// Company Types
// ============================================

export interface CompanyProfile {
  id: string;
  name: string;
  siren?: string;
  siret?: string;
  description?: string;
  legal_form?: string;
  sector?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  contact_email?: string;
  email?: string;
  contact_phone?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  employees?: number;
  company_size?: string;
  annual_revenue?: number;
  years_experience?: number;
  certifications?: string[];
  completeness_score?: number;
  stats?: {
    total_tenders: number;
    won: number;
    lost: number;
    win_rate: number;
    total_won?: number;
  };
}

// ============================================
// API / Infrastructure Types
// ============================================

export interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
  components: Record<string, { status: string; latency_ms: number }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ============================================
// Dashboard API Types
// ============================================

export interface ApiDashboardOverview {
  total_workflows: number;
  active_workflows: number;
  completed_workflows: number;
  pending_hitl: number;
  success_rate: number;
  avg_processing_time_hours: number;
  decisions: {
    go: number;
    review: number;
    nogo: number;
  };
  period_change?: {
    total_workflows: number | null;
    active_workflows: number | null;
    success_rate: number | null;
    avg_processing_time_hours: number | null;
  };
}

export interface ApiTimelineEntry {
  month: string;
  year: number;
  count: number;
}

export interface ApiRecentActivityItem {
  id: string;
  event_type: string;
  description: string;
  reference: string;
  case_id: string;
  created_at: string;
}
