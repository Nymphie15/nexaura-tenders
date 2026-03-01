// ============================================================================
// JARVIS - Notifications Types
// Types pour le systeme de notifications temps reel
// ============================================================================

// ----------------------------------------------------------------------------
// Notification Types
// ----------------------------------------------------------------------------

/**
 * Types de notifications
 */
export type NotificationType =
  | 'info'               // Information generale
  | 'success'            // Succes d une operation
  | 'warning'            // Avertissement
  | 'error'              // Erreur
  | 'alert'              // Alerte importante
  | 'reminder'           // Rappel
  | 'task'               // Tache a faire
  | 'mention'            // Mention utilisateur
  | 'update'             // Mise a jour
  | 'deadline'           // Echeance
  | 'hitl'               // Human-in-the-loop
  | 'system';            // Notification systeme

/**
 * Niveaux de priorite des notifications
 */
export type NotificationPriority =
  | 'low'                // Basse priorite
  | 'medium'             // Priorite moyenne
  | 'high'               // Haute priorite
  | 'critical';          // Critique - action immediate requise

/**
 * Statut de la notification
 */
export type NotificationStatus =
  | 'unread'             // Non lue
  | 'read'               // Lue
  | 'actioned'           // Action effectuee
  | 'dismissed'          // Rejetee
  | 'expired';           // Expiree

/**
 * Notification standard
 */
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;

  // Contenu
  title: string;
  message: string;
  summary?: string;       // Version courte pour les toasts

  // Metadonnees
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;

  // Source
  source: {
    type: 'system' | 'user' | 'agent' | 'workflow' | 'integration';
    id?: string;
    name?: string;
  };

  // Cible
  target?: {
    type: 'tender' | 'document' | 'task' | 'user' | 'project';
    id: string;
    name: string;
    url?: string;
  };

  // Destinataires
  recipients: {
    userId?: string;
    roleId?: string;
    teamId?: string;
    broadcast?: boolean;  // Pour tous les utilisateurs
  };

  // Actions disponibles
  actions?: NotificationAction[];

  // Donnees supplementaires
  data?: Record<string, unknown>;

  // Groupement
  groupId?: string;       // Pour regrouper les notifications similaires
  isGrouped?: boolean;
  groupCount?: number;

  // Affichage
  display?: {
    icon?: string;
    color?: string;
    sound?: boolean;
    vibrate?: boolean;
    persistent?: boolean;  // Reste affichee jusqu a action
  };
}

// ----------------------------------------------------------------------------
// Notification Actions
// ----------------------------------------------------------------------------

/**
 * Action disponible sur une notification
 */
export interface NotificationAction {
  id: string;
  label: string;
  icon?: string;
  style?: 'primary' | 'secondary' | 'danger' | 'ghost';

  // Type d action
  actionType:
    | 'navigate'          // Navigation vers une URL
    | 'api_call'          // Appel API
    | 'dismiss'           // Rejeter la notification
    | 'snooze'            // Reporter
    | 'custom';           // Action personnalisee

  // Configuration selon le type
  config?: {
    url?: string;                   // Pour navigate
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';  // Pour api_call
    endpoint?: string;              // Pour api_call
    payload?: Record<string, unknown>;  // Pour api_call
    snoozeDuration?: number;        // Pour snooze (en minutes)
    customHandler?: string;         // Pour custom
  };

  // Confirmation requise
  requireConfirmation?: boolean;
  confirmationMessage?: string;
}

// ----------------------------------------------------------------------------
// HITL (Human-in-the-Loop) Notifications
// ----------------------------------------------------------------------------

/**
 * Types de decisions HITL
 */
export type HITLDecisionType =
  | 'approval'            // Approbation requise
  | 'review'              // Revue demandee
  | 'validation'          // Validation de donnees
  | 'selection'           // Selection parmi des options
  | 'input'               // Saisie d information
  | 'confirmation'        // Confirmation d action
  | 'escalation';         // Escalade suite a echec

/**
 * Notification HITL specifique
 */
export interface HITLNotification extends Notification {
  type: 'hitl';

  // Contexte HITL
  hitl: {
    decisionType: HITLDecisionType;
    workflowId: string;
    stepId: string;

    // Contexte de la decision
    context: {
      description: string;
      background?: string;
      constraints?: string[];
      recommendations?: string[];
    };

    // Options de decision
    options?: Array<{
      id: string;
      label: string;
      description?: string;
      recommended?: boolean;
      consequences?: string;
    }>;

    // Pour les inputs
    inputSchema?: {
      fields: Array<{
        name: string;
        type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';
        label: string;
        required: boolean;
        placeholder?: string;
        options?: Array<{ value: string; label: string }>;
        validation?: {
          min?: number;
          max?: number;
          pattern?: string;
          message?: string;
        };
      }>;
    };

    // Timeout et delegation
    timeout?: {
      duration: number;     // en minutes
      autoAction?: string;  // Action automatique si timeout
      escalateTo?: string;  // Escalader vers
    };

    // Historique des decisions precedentes
    previousDecisions?: Array<{
      userId: string;
      userName: string;
      decision: string;
      timestamp: Date;
      comment?: string;
    }>;

    // Delegation
    canDelegate: boolean;
    delegatedFrom?: {
      userId: string;
      userName: string;
      reason?: string;
    };
  };
}

/**
 * Reponse a une notification HITL
 */
export interface HITLResponse {
  notificationId: string;
  workflowId: string;
  stepId: string;

  // Decision
  decision: {
    optionId?: string;          // Pour les selections
    approved?: boolean;         // Pour les approbations
    inputData?: Record<string, unknown>;  // Pour les inputs
    comment?: string;
  };

  // Delegation
  delegateTo?: {
    userId: string;
    reason?: string;
  };

  // Metadata
  respondedAt: Date;
  respondedBy: {
    userId: string;
    userName: string;
  };
}

// ----------------------------------------------------------------------------
// Notification Filters
// ----------------------------------------------------------------------------

/**
 * Filtres pour les notifications
 */
export interface NotificationFilter {
  // Filtres de base
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  statuses?: NotificationStatus[];

  // Filtres temporels
  dateRange?: {
    start: Date;
    end: Date;
  };

  // Filtres de source
  sourceTypes?: Array<'system' | 'user' | 'agent' | 'workflow' | 'integration'>;
  sourceIds?: string[];

  // Filtres de cible
  targetTypes?: Array<'tender' | 'document' | 'task' | 'user' | 'project'>;
  targetIds?: string[];

  // Recherche
  searchQuery?: string;

  // Groupement
  grouped?: boolean;

  // Pagination
  page?: number;
  pageSize?: number;

  // Tri
  sortBy?: 'createdAt' | 'priority' | 'type';
  sortOrder?: 'asc' | 'desc';
}

// ----------------------------------------------------------------------------
// Notification Preferences
// ----------------------------------------------------------------------------

/**
 * Preferences de notification utilisateur
 */
export interface NotificationPreferences {
  userId: string;

  // Preferences globales
  global: {
    enabled: boolean;
    quietHours?: {
      enabled: boolean;
      start: string;  // HH:MM
      end: string;    // HH:MM
      timezone: string;
    };
    soundEnabled: boolean;
    vibrateEnabled: boolean;
    badgeEnabled: boolean;
  };

  // Preferences par type
  byType: Record<NotificationType, {
    enabled: boolean;
    channels: {
      inApp: boolean;
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    minPriority?: NotificationPriority;
    digest?: {
      enabled: boolean;
      frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
      preferredTime?: string;  // HH:MM pour daily/weekly
    };
  }>;

  // Preferences par source
  bySource?: Record<string, {
    enabled: boolean;
    minPriority?: NotificationPriority;
  }>;

  // Mots-cles a surveiller
  watchedKeywords?: Array<{
    keyword: string;
    priority: NotificationPriority;
    notifyImmediately: boolean;
  }>;

  // Exclusions
  mutedTargets?: Array<{
    type: string;
    id: string;
    until?: Date;
  }>;

  // Delegation automatique
  autoDelegate?: {
    enabled: boolean;
    delegateTo: string;
    startDate?: Date;
    endDate?: Date;
    notificationTypes?: NotificationType[];
  };
}

// ----------------------------------------------------------------------------
// WebSocket Types for Real-time
// ----------------------------------------------------------------------------

/**
 * Message WebSocket pour les notifications
 */
export interface NotificationWebSocketMessage {
  type:
    | 'notification_new'
    | 'notification_update'
    | 'notification_delete'
    | 'notification_read'
    | 'notification_batch'
    | 'connection_status'
    | 'ping'
    | 'pong';

  payload: {
    notification?: Notification | HITLNotification;
    notifications?: Array<Notification | HITLNotification>;
    notificationId?: string;
    notificationIds?: string[];
    status?: 'connected' | 'disconnected' | 'reconnecting';
    unreadCount?: number;
  };

  // Metadata
  timestamp: Date;
  correlationId?: string;
}

/**
 * Configuration de la connexion WebSocket
 */
export interface NotificationWebSocketConfig {
  url: string;
  reconnect: {
    enabled: boolean;
    maxAttempts: number;
    delay: number;           // en ms
    backoffMultiplier: number;
  };
  heartbeat: {
    enabled: boolean;
    interval: number;        // en ms
    timeout: number;         // en ms
  };
  auth: {
    token?: string;
    refreshToken?: () => Promise<string>;
  };
}

/**
 * Etat de la connexion WebSocket
 */
export interface NotificationWebSocketState {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
  reconnectAttempts: number;
  error?: {
    code: string;
    message: string;
  };
}

// ----------------------------------------------------------------------------
// Notification Center State
// ----------------------------------------------------------------------------

/**
 * Etat du centre de notifications
 */
export interface NotificationCenterState {
  // Notifications
  notifications: Array<Notification | HITLNotification>;

  // Compteurs
  counts: {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
  };

  // Etat UI
  isOpen: boolean;
  activeTab: 'all' | 'unread' | 'hitl' | 'archived';
  activeFilter: NotificationFilter;

  // WebSocket
  webSocket: NotificationWebSocketState;

  // Chargement
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;

  // Preferences
  preferences?: NotificationPreferences;

  // Erreurs
  error?: {
    message: string;
    timestamp: Date;
  };
}
