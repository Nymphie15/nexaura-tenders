// Writing Modes Types

export type WritingModeKey = 
  | "concise" 
  | "detailed" 
  | "technical" 
  | "executive" 
  | "pedagogical" 
  | "compliant" 
  | "persuasive";

export interface WritingMode {
  key: WritingModeKey;
  name: string;
  description: string;
  icon: string;
  color: string;
  shortcut?: string;
  sort_order: number;
  is_active: boolean;
}

export interface ModeApplicationResult {
  content: string;
  mode: string;
  mode_name: string;
  metrics: {
    original_length: number;
    new_length: number;
    change_percentage: number;
  };
  quality_score: number;
  suggestions: WritingSuggestion[];
  version_id?: string;
}

export interface WritingSuggestion {
  type: "improvement" | "warning" | "info" | "error";
  message: string;
  details?: Record<string, unknown>;
}

export interface ApplyModeRequest {
  content: string;
  mode: WritingModeKey;
  persona_id?: string;
  context?: string;
}

export interface PreviewModeResponse {
  preview: string;
  diff: {
    lines_added: number;
    lines_removed: number;
    total_changes: number;
  };
  metrics: {
    original_length: number;
    new_length: number;
    change_percentage: number;
  };
  mode: {
    key: string;
    name: string;
  };
}

export interface SuggestModeResponse {
  suggested_mode: string;
  suggested_mode_name: string;
  reason: string;
  confidence: number;
}
