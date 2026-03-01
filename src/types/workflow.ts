// ============================================
// Advanced Workflow Types
// ============================================

import {
  WorkflowPhase,
  WorkflowStatus,
  HITLCheckpoint,
  HITLAction,
  WorkflowPhaseInfo,
} from "./index";

// ============================================
// Workflow Action Types
// ============================================

export type WorkflowActionType =
  | "start"
  | "pause"
  | "resume"
  | "cancel"
  | "retry"
  | "skip"
  | "rollback"
  | "force_complete";

export interface WorkflowAction {
  type: WorkflowActionType;
  label: string;
  icon: string;
  description: string;
  requiresConfirmation: boolean;
  allowedStatuses: WorkflowStatus[];
  allowedPhases?: WorkflowPhase[];
  dangerous?: boolean;
}

// ============================================
// Workflow Transition Types
// ============================================

export interface WorkflowTransition {
  from: WorkflowPhase;
  to: WorkflowPhase;
  trigger: "auto" | "manual" | "hitl" | "error";
  timestamp: string;
  duration_ms?: number;
  metadata?: Record<string, unknown>;
}

// ============================================
// Workflow Phase Configuration
// ============================================

export interface WorkflowPhaseDetail {
  phase: WorkflowPhase;
  displayName: string;
  description: string;
  estimatedDuration: string;
  agentName?: string;
  requiredInputs?: string[];
  outputs?: string[];
  canRetry: boolean;
  canSkip: boolean;
}

export interface WorkflowPhaseConfig {
  phase: WorkflowPhase;
  order: number;
  displayName: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  estimatedDuration: string;
  agentName: string;
  hitlCheckpoint?: HITLCheckpoint;
  isTerminal: boolean;
  allowedTransitions: WorkflowPhase[];
}

// ============================================
// Workflow History & Events
// ============================================

export type WorkflowEventType =
  | "phase_started"
  | "phase_completed"
  | "phase_failed"
  | "hitl_requested"
  | "hitl_decision"
  | "workflow_paused"
  | "workflow_resumed"
  | "workflow_cancelled"
  | "workflow_completed"
  | "error_occurred"
  | "retry_attempted"
  | "data_updated";

export interface WorkflowEvent {
  id: string;
  type: WorkflowEventType;
  timestamp: string;
  phase?: WorkflowPhase;
  checkpoint?: HITLCheckpoint;
  action?: HITLAction;
  actor?: string;
  message: string;
  details?: Record<string, unknown>;
  severity: "info" | "warning" | "error" | "success";
}

export interface WorkflowHistory {
  caseId: string;
  tenderId: string;
  events: WorkflowEvent[];
  transitions: WorkflowTransition[];
  phases: WorkflowPhaseInfo[];
  totalDuration?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Workflow Timeline Configuration
// ============================================

export interface WorkflowTimelineConfig {
  showEstimatedTime: boolean;
  showActualTime: boolean;
  showAgentNames: boolean;
  compactMode: boolean;
  highlightCurrentPhase: boolean;
  showHITLCheckpoints: boolean;
  animateTransitions: boolean;
}

// ============================================
// Workflow Metrics
// ============================================

export interface WorkflowMetrics {
  caseId: string;
  totalDuration: number;
  phaseMetrics: {
    phase: WorkflowPhase;
    duration: number;
    retryCount: number;
    errorCount: number;
  }[];
  hitlMetrics: {
    checkpoint: HITLCheckpoint;
    waitTime: number;
    decisionTime: number;
    action: HITLAction;
  }[];
  successRate: number;
  automationRate: number;
}

// ============================================
// Constants: Phase Configuration
// ============================================

export const WORKFLOW_PHASE_CONFIG: Record<WorkflowPhase, WorkflowPhaseConfig> = {
  CREATED: {
    phase: "CREATED",
    order: 0,
    displayName: "Créé",
    shortName: "Créé",
    description: "Dossier créé, en attente de traitement",
    icon: "FileText",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    estimatedDuration: "< 1s",
    agentName: "System",
    isTerminal: false,
    allowedTransitions: ["INGESTION", "REJECTED", "ERROR"],
  },
  INGESTION: {
    phase: "INGESTION",
    order: 1,
    displayName: "Ingestion",
    shortName: "Ingest",
    description: "Téléchargement et extraction des documents DCE",
    icon: "Download",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    estimatedDuration: "30s - 2min",
    agentName: "Ingestion Agent",
    isTerminal: false,
    allowedTransitions: ["EXTRACTION", "ERROR"],
  },
  EXTRACTION: {
    phase: "EXTRACTION",
    order: 2,
    displayName: "Extraction",
    shortName: "Extract",
    description: "Analyse et extraction des donnees des documents",
    icon: "Search",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    borderColor: "border-indigo-300",
    estimatedDuration: "1 - 3min",
    agentName: "Extraction Agent",
    hitlCheckpoint: "go_nogo",
    isTerminal: false,
    allowedTransitions: ["MATCHING", "ERROR"],
  },
  MATCHING: {
    phase: "MATCHING",
    order: 3,
    displayName: "Matching",
    shortName: "Match",
    description: "Correspondance avec le catalogue produits",
    icon: "GitMerge",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
    estimatedDuration: "2 - 5min",
    agentName: "Matching Agent",
    isTerminal: false,
    allowedTransitions: ["RISK_ANALYSIS", "ERROR"],
  },
  RISK_ANALYSIS: {
    phase: "RISK_ANALYSIS",
    order: 4,
    displayName: "Analyse Risques",
    shortName: "Risques",
    description: "Evaluation des risques et decision GO/NO-GO",
    icon: "Shield",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
    estimatedDuration: "1 - 2min",
    agentName: "Risk Analysis Agent",
    hitlCheckpoint: "go_nogo",
    isTerminal: false,
    allowedTransitions: ["STRATEGY", "REJECTED", "ERROR"],
  },
  STRATEGY: {
    phase: "STRATEGY",
    order: 5,
    displayName: "Strategie",
    shortName: "Strat",
    description: "Definition de la strategie commerciale",
    icon: "Target",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-300",
    estimatedDuration: "2 - 4min",
    agentName: "Strategy Agent",
    hitlCheckpoint: "strategy_review",
    isTerminal: false,
    allowedTransitions: ["CALCULATION", "ERROR"],
  },
  CALCULATION: {
    phase: "CALCULATION",
    order: 6,
    displayName: "Calcul Prix",
    shortName: "Prix",
    description: "Calcul des prix et remplissage du BPU",
    icon: "Calculator",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-300",
    estimatedDuration: "1 - 3min",
    agentName: "Calculation Agent",
    hitlCheckpoint: "price_review",
    isTerminal: false,
    allowedTransitions: ["GENERATION", "ERROR"],
  },
  GENERATION: {
    phase: "GENERATION",
    order: 7,
    displayName: "Génération",
    shortName: "Génér",
    description: "Génération des documents de réponse",
    icon: "FileOutput",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    borderColor: "border-teal-300",
    estimatedDuration: "2 - 5min",
    agentName: "Generation Agent",
    isTerminal: false,
    allowedTransitions: ["VALIDATION", "ERROR"],
  },
  VALIDATION: {
    phase: "VALIDATION",
    order: 8,
    displayName: "Validation",
    shortName: "Valid",
    description: "Vérification de conformité des documents",
    icon: "CheckCircle",
    color: "text-lime-600",
    bgColor: "bg-lime-100",
    borderColor: "border-lime-300",
    estimatedDuration: "1 - 2min",
    agentName: "Validation Agent",
    hitlCheckpoint: "tech_review",
    isTerminal: false,
    allowedTransitions: ["PACKAGING", "ERROR"],
  },
  PACKAGING: {
    phase: "PACKAGING",
    order: 9,
    displayName: "Packaging",
    shortName: "Pack",
    description: "Assemblage final et signature",
    icon: "Package",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
    estimatedDuration: "30s - 1min",
    agentName: "Packaging Agent",
    isTerminal: false,
    allowedTransitions: ["COMPLETED", "ERROR"],
  },
  COMPLETED: {
    phase: "COMPLETED",
    order: 10,
    displayName: "Termine",
    shortName: "Termine",
    description: "Dossier complet, pret a soumettre",
    icon: "CheckCircle2",
    color: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    estimatedDuration: "-",
    agentName: "System",
    isTerminal: true,
    allowedTransitions: [],
  },
  REJECTED: {
    phase: "REJECTED",
    order: 11,
    displayName: "Rejeté",
    shortName: "Rejeté",
    description: "Dossier rejeté suite à décision NO-GO",
    icon: "XCircle",
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    estimatedDuration: "-",
    agentName: "System",
    isTerminal: true,
    allowedTransitions: [],
  },
  ERROR: {
    phase: "ERROR",
    order: 12,
    displayName: "Erreur",
    shortName: "Erreur",
    description: "Une erreur est survenue dans le traitement",
    icon: "AlertTriangle",
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    estimatedDuration: "-",
    agentName: "System",
    isTerminal: true,
    allowedTransitions: [
      "INGESTION",
      "EXTRACTION",
      "MATCHING",
      "RISK_ANALYSIS",
      "STRATEGY",
      "CALCULATION",
      "GENERATION",
      "VALIDATION",
      "PACKAGING",
    ],
  },
};

// ============================================
// Constants: Workflow Actions
// ============================================

export const WORKFLOW_ACTIONS: Record<WorkflowActionType, WorkflowAction> = {
  start: {
    type: "start",
    label: "Demarrer",
    icon: "Play",
    description: "Demarrer le traitement du dossier",
    requiresConfirmation: false,
    allowedStatuses: ["paused"],
    allowedPhases: ["CREATED"],
  },
  pause: {
    type: "pause",
    label: "Pause",
    icon: "Pause",
    description: "Mettre le traitement en pause",
    requiresConfirmation: false,
    allowedStatuses: ["running"],
  },
  resume: {
    type: "resume",
    label: "Reprendre",
    icon: "Play",
    description: "Reprendre le traitement",
    requiresConfirmation: false,
    allowedStatuses: ["paused", "waiting_hitl"],
  },
  cancel: {
    type: "cancel",
    label: "Annuler",
    icon: "X",
    description: "Annuler le traitement du dossier",
    requiresConfirmation: true,
    allowedStatuses: ["running", "paused", "waiting_hitl"],
    dangerous: true,
  },
  retry: {
    type: "retry",
    label: "Reessayer",
    icon: "RotateCcw",
    description: "Reessayer la phase en erreur",
    requiresConfirmation: true,
    allowedStatuses: ["failed"],
  },
  skip: {
    type: "skip",
    label: "Passer",
    icon: "SkipForward",
    description: "Passer a la phase suivante",
    requiresConfirmation: true,
    allowedStatuses: ["waiting_hitl", "failed"],
    dangerous: true,
  },
  rollback: {
    type: "rollback",
    label: "Revenir",
    icon: "Undo",
    description: "Revenir a une phase precedente",
    requiresConfirmation: true,
    allowedStatuses: ["running", "paused", "waiting_hitl", "failed"],
    dangerous: true,
  },
  force_complete: {
    type: "force_complete",
    label: "Forcer terminaison",
    icon: "CheckCircle",
    description: "Forcer la terminaison du workflow",
    requiresConfirmation: true,
    allowedStatuses: ["running", "paused", "waiting_hitl", "failed"],
    dangerous: true,
  },
};

// ============================================
// Helper Functions
// ============================================

export function getPhaseConfig(phase: WorkflowPhase): WorkflowPhaseConfig {
  return WORKFLOW_PHASE_CONFIG[phase];
}

export function getPhaseOrder(phase: WorkflowPhase): number {
  return WORKFLOW_PHASE_CONFIG[phase].order;
}

export function isTerminalPhase(phase: WorkflowPhase): boolean {
  return WORKFLOW_PHASE_CONFIG[phase].isTerminal;
}

export function getNextPhases(phase: WorkflowPhase): WorkflowPhase[] {
  return WORKFLOW_PHASE_CONFIG[phase].allowedTransitions;
}

export function getAvailableActions(
  status: WorkflowStatus,
  phase: WorkflowPhase
): WorkflowAction[] {
  return Object.values(WORKFLOW_ACTIONS).filter((action) => {
    const statusAllowed = action.allowedStatuses.includes(status);
    const phaseAllowed =
      !action.allowedPhases || action.allowedPhases.includes(phase);
    return statusAllowed && phaseAllowed;
  });
}
