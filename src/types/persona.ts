// Company Persona Types

export type FormalityLevel = "casual" | "professional" | "formal";
export type TechnicalLevel = "beginner" | "intermediate" | "expert";
export type ToneStyle = "modest" | "confident" | "assertive";
export type VerbosityLevel = "minimal" | "concise" | "detailed" | "verbose";
export type ArgumentationStructure = 
  | "problem_solution_benefit" 
  | "feature_advantage_benefit" 
  | "star" 
  | "chronological" 
  | "thematic";

export interface VoiceProfile {
  formality: FormalityLevel;
  technical_level: TechnicalLevel;
  tone: ToneStyle;
  verbosity: VerbosityLevel;
}

export interface VocabularyPreferences {
  preferred_terms: string[];
  avoided_terms: string[];
  sector_jargon: string[];
}

export interface DocumentExample {
  id: string;
  title: string;
  content: string;
  document_type: string;
  context?: string;
  score?: number;
}

export interface CompanyPersona {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  voice_profile: VoiceProfile;
  vocabulary: VocabularyPreferences;
  introduction_template?: string;
  argumentation_structure: ArgumentationStructure;
  closing_template?: string;
  example_documents: DocumentExample[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PersonaTemplate {
  id: string;
  name: string;
  sector: string;
  description: string;
  voice_profile: VoiceProfile;
  vocabulary: VocabularyPreferences;
  argumentation_structure: ArgumentationStructure;
  is_active: boolean;
}

export interface CreatePersonaRequest {
  name: string;
  description?: string;
  voice_profile: VoiceProfile;
  vocabulary?: VocabularyPreferences;
  is_default?: boolean;
}

export interface UpdatePersonaRequest {
  name?: string;
  description?: string;
  voice_profile?: VoiceProfile;
  vocabulary?: VocabularyPreferences;
  is_default?: boolean;
}
