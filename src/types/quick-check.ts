// Quick Check Types

export type QuickCheckRecommendation = "GO" | "NO_GO" | "REVIEW";
export type CriterionSeverity = "blocking" | "warning" | "info";

export interface QuickCheckCriterion {
  type: string;
  severity: CriterionSeverity;
  message: string;
  details?: Record<string, unknown>;
}

export interface QuickCheckResult {
  id: string;
  tender_id: string;
  matching_score: number;
  eligibility_score: number;
  risk_score: number;
  recommendation: QuickCheckRecommendation;
  confidence: number;
  blocking_criteria: QuickCheckCriterion[];
  warning_criteria: QuickCheckCriterion[];
  info_criteria: QuickCheckCriterion[];
  estimated_effort_hours: number;
  estimated_cost_euros: number;
  estimated_success_probability: number;
  key_requirements: string[];
  deliverables: string[];
  deadline?: string;
  budget_range?: string;
  processing_time_ms: number;
  can_proceed: boolean;
}

export interface QuickCheckJob {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  result?: QuickCheckResult;
  error?: string;
  progress?: number;
}

export interface StartQuickCheckRequest {
  tender_id: string;
}

export interface StartQuickCheckResponse {
  job_id: string;
  status: string;
  estimated_seconds: number;
}

export interface QuickCheckSummary {
  matching_score: number;
  recommendation: QuickCheckRecommendation;
  confidence: number;
  blocking_count: number;
  warning_count: number;
  estimated_effort_hours: number;
  estimated_cost_euros: number;
  can_proceed: boolean;
}
