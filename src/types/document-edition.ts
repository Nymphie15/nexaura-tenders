// Document Edition Types

export type SuggestionType = 
  | "improvement" 
  | "clarity" 
  | "conciseness" 
  | "grammar" 
  | "style" 
  | "technical" 
  | "compliance" 
  | "custom";

export type SuggestionStatus = "pending" | "applied" | "rejected" | "modified";

export type EditCommand =
  | "make_concise"
  | "expand"
  | "simplify"
  | "formalize"
  | "add_example"
  | "add_reference"
  | "strengthen_argument"
  | "fix_grammar"
  | "adapt_tone"
  | "custom";

export interface DocumentSuggestion {
  id: string;
  type: SuggestionType;
  status: SuggestionStatus;
  start_index: number;
  end_index: number;
  original_text: string;
  suggested_text: string;
  reason: string;
  confidence: number;
  alternatives: string[];
  created_at: string;
}

export interface InlineEditRequest {
  content: string;
  selection?: string;
  command: EditCommand;
  instruction?: string;
  persona_id?: string;
}

export interface InlineEditResult {
  original: string;
  modified: string;
  command: string;
  explanation: string;
  diff_added: number;
  diff_removed: number;
  quality_score: number;
}

export interface GenerateSuggestionsRequest {
  content: string;
  document_type: string;
  persona_id?: string;
  max_suggestions?: number;
}

export interface ChatMessageRequest {
  content: string;
  message: string;
  conversation_history: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface ChatMessageResponse {
  response: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content_preview: string;
  writing_mode_key?: string;
  change_description?: string;
  triggered_by: "user" | "ai" | "system";
  created_at: string;
  created_by?: string;
}

export interface VersionComparison {
  version_from_id: string;
  version_to_id: string;
  version_from_number: number;
  version_to_number: number;
  additions: Array<{ text: string; position: number }>;
  deletions: Array<{ text: string; position: number }>;
  stats: {
    added_chars: number;
    removed_chars: number;
  };
}
