/**
 * Mock WebSocket réutilisable pour les tests
 *
 * Fournit une implémentation complète de WebSocket pour les tests
 * avec helpers pour simuler différents scénarios.
 */

export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  private messageHandlers: Set<(event: MessageEvent) => void> = new Set();
  private sentMessages: string[] = [];
  private connectionDelay: number;

  constructor(url: string, connectionDelay = 10) {
    this.url = url;
    this.connectionDelay = connectionDelay;

    // Simuler connexion async
    setTimeout(() => {
      if (this.readyState === MockWebSocket.CONNECTING) {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.(new Event('open'));
      }
    }, connectionDelay);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    if (this.readyState !== MockWebSocket.CLOSED) {
      this.readyState = MockWebSocket.CLOSED;
      const event = new CloseEvent('close', {
        code: code || 1000,
        reason: reason || ''
      });
      this.onclose?.(event);
    }
  }

  addEventListener(type: string, handler: (event: MessageEvent) => void): void {
    if (type === 'message') {
      this.messageHandlers.add(handler);
    }
  }

  removeEventListener(type: string, handler: (event: MessageEvent) => void): void {
    if (type === 'message') {
      this.messageHandlers.delete(handler);
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Simuler la réception d'un message
   */
  simulateMessage(data: unknown): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      console.warn('Cannot simulate message: WebSocket is not open');
      return;
    }

    const event = new MessageEvent('message', {
      data: JSON.stringify(data)
    });
    this.onmessage?.(event);
    this.messageHandlers.forEach(handler => handler(event));
  }

  /**
   * Simuler une erreur de connexion
   */
  simulateError(): void {
    this.onerror?.(new Event('error'));
  }

  /**
   * Obtenir tous les messages envoyés (parsés en JSON)
   */
  getSentMessages(): unknown[] {
    return this.sentMessages.map(msg => {
      try {
        return JSON.parse(msg);
      } catch {
        return msg;
      }
    });
  }

  /**
   * Obtenir le dernier message envoyé (parsé en JSON)
   */
  getLastSentMessage(): unknown | null {
    if (this.sentMessages.length === 0) return null;
    try {
      return JSON.parse(this.sentMessages[this.sentMessages.length - 1]);
    } catch {
      return this.sentMessages[this.sentMessages.length - 1];
    }
  }

  /**
   * Filtrer les messages envoyés par type
   */
  getSentMessagesByType(type: string): unknown[] {
    return this.getSentMessages().filter(
      (msg: any) => msg?.type === type
    );
  }

  /**
   * Effacer l'historique des messages envoyés
   */
  clearSentMessages(): void {
    this.sentMessages = [];
  }

  /**
   * Vérifier si un message a été envoyé
   */
  hasSentMessage(predicate: (msg: unknown) => boolean): boolean {
    return this.getSentMessages().some(predicate);
  }

  /**
   * Attendre qu'un message soit envoyé (pour tests async)
   */
  async waitForMessage(
    predicate: (msg: unknown) => boolean,
    timeout = 1000
  ): Promise<unknown> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const message = this.getSentMessages().find(predicate);
      if (message) return message;
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    throw new Error('Timeout waiting for message');
  }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Créer une instance de MockWebSocket avec configuration personnalisée
 */
export function createMockWebSocket(options?: {
  url?: string;
  connectionDelay?: number;
  autoConnect?: boolean;
}): MockWebSocket {
  const url = options?.url || 'ws://localhost/test';
  const connectionDelay = options?.autoConnect === false ? Number.MAX_SAFE_INTEGER : (options?.connectionDelay ?? 10);

  return new MockWebSocket(url, connectionDelay);
}

/**
 * Créer un mock qui échoue toujours à se connecter
 */
export function createFailingMockWebSocket(url?: string): MockWebSocket {
  const ws = new MockWebSocket(url || 'ws://localhost/test', 10);

  setTimeout(() => {
    ws.readyState = MockWebSocket.CLOSED;
    ws.simulateError();
    ws.close(1006, 'Connection failed');
  }, 15);

  return ws;
}

/**
 * Créer un mock qui se déconnecte après un délai
 */
export function createAutoDisconnectMockWebSocket(
  url?: string,
  disconnectDelay = 100,
  code = 1006,
  reason = 'Auto disconnect'
): MockWebSocket {
  const ws = new MockWebSocket(url || 'ws://localhost/test', 10);

  setTimeout(() => {
    if (ws.readyState === MockWebSocket.OPEN) {
      ws.close(code, reason);
    }
  }, disconnectDelay);

  return ws;
}

// ============================================
// Message Builders
// ============================================

/**
 * Créer un événement "connected"
 */
export function createConnectedEvent(connectionId: string) {
  return {
    type: 'connected',
    timestamp: new Date().toISOString(),
    data: { connection_id: connectionId }
  };
}

/**
 * Créer un événement "hitl_decision_required"
 */
export function createHITLDecisionRequiredEvent(options: {
  caseId: string;
  checkpoint: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  tenderReference?: string;
  deadline?: string;
}) {
  return {
    type: 'hitl_decision_required',
    timestamp: new Date().toISOString(),
    data: {
      case_id: options.caseId,
      checkpoint: options.checkpoint,
      urgency: options.urgency || 'medium',
      tender_reference: options.tenderReference,
      deadline: options.deadline
    }
  };
}

/**
 * Créer un événement "hitl_decision_made"
 */
export function createHITLDecisionMadeEvent(options: {
  caseId: string;
  checkpoint: string;
  decision: 'approved' | 'rejected' | 'modified';
  decidedBy: string;
}) {
  return {
    type: 'hitl_decision_made',
    timestamp: new Date().toISOString(),
    data: {
      case_id: options.caseId,
      checkpoint: options.checkpoint,
      decision: options.decision,
      decided_by: options.decidedBy
    }
  };
}

/**
 * Créer un événement "workflow_update"
 */
export function createWorkflowUpdateEvent(options: {
  caseId: string;
  phase: string;
  status: 'started' | 'completed' | 'failed' | 'paused';
  progress?: number;
  message?: string;
}) {
  return {
    type: 'workflow_update',
    timestamp: new Date().toISOString(),
    data: {
      case_id: options.caseId,
      phase: options.phase,
      status: options.status,
      progress: options.progress,
      message: options.message
    }
  };
}

/**
 * Créer un événement "notification"
 */
export function createNotificationEvent(options: {
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notificationType?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}) {
  return {
    type: 'notification',
    timestamp: new Date().toISOString(),
    data: {
      title: options.title,
      message: options.message,
      priority: options.priority || 'medium',
      notification_type: options.notificationType || 'info',
      link: options.link
    }
  };
}

/**
 * Créer un événement "extension_sync"
 */
export function createExtensionSyncEvent(options: {
  action: 'tender_detected' | 'page_analyzed' | 'extraction_complete';
  url?: string;
  tenderData?: Record<string, unknown>;
}) {
  return {
    type: 'extension_sync',
    timestamp: new Date().toISOString(),
    data: {
      action: options.action,
      url: options.url,
      tender_data: options.tenderData
    }
  };
}

/**
 * Créer un événement "error"
 */
export function createErrorEvent(message: string) {
  return {
    type: 'error',
    timestamp: new Date().toISOString(),
    data: { message }
  };
}

/**
 * Créer un événement "conversation_created" (pour assistant)
 */
export function createConversationCreatedEvent(conversationId: string) {
  return {
    type: 'conversation_created',
    conversation_id: conversationId
  };
}

/**
 * Créer un événement "typing" (pour assistant)
 */
export function createTypingEvent() {
  return {
    type: 'typing'
  };
}

/**
 * Créer un événement "response" (pour assistant)
 */
export function createResponseEvent(options: {
  message: string;
  confidence?: number;
  suggestedActions?: Array<{
    label: string;
    description?: string;
    type?: 'primary' | 'secondary' | 'warning';
    data?: Record<string, any>;
  }>;
}) {
  return {
    type: 'response',
    timestamp: new Date().toISOString(),
    data: {
      message: options.message,
      confidence: options.confidence,
      suggested_actions: options.suggestedActions
    }
  };
}

/**
 * Créer un événement "pong"
 */
export function createPongEvent() {
  return {
    type: 'pong',
    timestamp: new Date().toISOString(),
    data: {}
  };
}
