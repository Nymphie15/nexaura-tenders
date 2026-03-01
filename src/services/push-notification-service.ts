/**
 * Service de notifications push pour l'application
 *
 * Gere:
 * - Enregistrement du Service Worker
 * - Abonnement aux notifications push
 * - Affichage de notifications locales
 * - Preferences utilisateur
 * - Communication avec le backend
 *
 * @module push-notification-service
 * @version 1.0.0
 */

import { Notification as StoreNotification, NotificationPriority, NotificationType } from '@/stores/notification-store';

// ============================================
// Types
// ============================================

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  types: {
    hitl_decision_required: boolean;
    hitl_decision_made: boolean;
    workflow_update: boolean;
    extension_sync: boolean;
    system: boolean;
  };
  priorities: {
    urgent: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
  };
}

export interface LocalNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  link?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  requireInteraction?: boolean;
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

// ============================================
// Constants
// ============================================

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  sound: true,
  vibration: true,
  types: {
    hitl_decision_required: true,
    hitl_decision_made: true,
    workflow_update: true,
    extension_sync: true,
    system: true,
  },
  priorities: {
    urgent: true,
    high: true,
    medium: true,
    low: false,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

const PREFERENCES_STORAGE_KEY = 'ao-notification-preferences';
const SUBSCRIPTION_STORAGE_KEY = 'ao-push-subscription';

// ============================================
// Push Notification Service
// ============================================

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private vapidPublicKey: string | null = null;
  private isInitialized = false;

  /**
   * Initialise le service de notifications
   */
  async initialize(vapidPublicKey?: string): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    // Verifier si les notifications sont supportees
    if (!this.isSupported()) {
      console.warn('[PushService] Push notifications not supported');
      return false;
    }

    this.vapidPublicKey = vapidPublicKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;

    // Charger les preferences
    this.loadPreferences();

    // Enregistrer le Service Worker
    try {
      this.registration = await this.registerServiceWorker();

      if (this.registration) {
        // Recuperer l'abonnement existant
        this.subscription = await this.registration.pushManager.getSubscription();

        // Configurer les listeners pour les messages du SW
        this.setupServiceWorkerListeners();

        // Envoyer la cle VAPID au SW
        if (this.vapidPublicKey) {
          this.sendMessageToSW({ type: 'SET_VAPID_KEY', data: { key: this.vapidPublicKey } });
        }

        this.isInitialized = true;
        return true;
      }
    } catch (error) {
      console.error('[PushService] Initialization failed:', error);
    }

    return false;
  }

  /**
   * Verifie si les notifications push sont supportees
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Retourne le statut de la permission de notification
   */
  getPermissionStatus(): NotificationPermissionStatus {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionStatus;
  }

  /**
   * Demande la permission de notification
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermissionStatus;
    } catch (error) {
      console.error('[PushService] Permission request failed:', error);
      return 'denied';
    }
  }

  /**
   * S'abonne aux notifications push
   */
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.registration || !this.vapidPublicKey) {
      console.warn('[PushService] Cannot subscribe: not initialized or no VAPID key');
      return null;
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      console.warn('[PushService] Permission not granted');
      return null;
    }

    try {
      // Convertir la cle VAPID
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

      // S'abonner
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      const subscriptionData = this.subscription.toJSON() as PushSubscriptionData;

      // Sauvegarder localement
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscriptionData));

      // Envoyer au serveur
      await this.syncSubscriptionWithServer(subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('[PushService] Subscription failed:', error);
      return null;
    }
  }

  /**
   * Se desabonne des notifications push
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);

      // Notifier le serveur
      await this.removeSubscriptionFromServer();

      return true;
    } catch (error) {
      console.error('[PushService] Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Verifie si l'utilisateur est abonne
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  /**
   * Retourne l'abonnement actuel
   */
  getSubscription(): PushSubscriptionData | null {
    if (!this.subscription) {
      return null;
    }
    return this.subscription.toJSON() as PushSubscriptionData;
  }

  /**
   * Affiche une notification locale (via le SW)
   */
  async showLocalNotification(options: LocalNotificationOptions): Promise<boolean> {
    // Verifier les preferences
    if (!this.shouldShowNotification(options)) {
      return false;
    }

    // Verifier la permission
    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      console.warn('[PushService] Cannot show notification: permission not granted');
      return false;
    }

    // Envoyer au Service Worker
    if (this.registration) {
      this.sendMessageToSW({
        type: 'SHOW_LOCAL_NOTIFICATION',
        data: {
          title: options.title,
          body: options.body,
          icon: options.icon || '/icon.svg',
          badge: options.badge || '/icon.svg',
          tag: options.tag || `local-${Date.now()}`,
          data: {
            type: options.type || 'info',
            priority: options.priority || 'medium',
            link: options.link,
            ...options.data,
          },
          actions: options.actions,
          requireInteraction: options.requireInteraction ||
            options.priority === 'urgent' ||
            options.priority === 'high',
        },
      });
      return true;
    }

    // Fallback: utiliser l'API Notification directement
    try {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon.svg',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction,
      });
      return true;
    } catch (error) {
      console.error('[PushService] Failed to show notification:', error);
      return false;
    }
  }

  /**
   * Affiche une notification pour un evenement HITL
   */
  async showHITLNotification(data: {
    caseId: string;
    checkpoint: string;
    tenderReference?: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<boolean> {
    const urgencyToPriority: Record<string, NotificationPriority> = {
      critical: 'urgent',
      high: 'high',
      medium: 'medium',
      low: 'low',
    };

    return this.showLocalNotification({
      title: 'Decision requise',
      body: `Checkpoint ${data.checkpoint} pour ${data.tenderReference || data.caseId}`,
      type: 'warning',
      priority: urgencyToPriority[data.urgency] || 'medium',
      link: `/workflow/${data.caseId}/hitl/${data.checkpoint}`,
      tag: `hitl-${data.caseId}-${data.checkpoint}`,
      actions: [
        { action: 'view', title: 'Voir' },
        { action: 'approve', title: 'Approuver' },
        { action: 'reject', title: 'Rejeter' },
      ],
      requireInteraction: ['critical', 'high'].includes(data.urgency),
      data: {
        type: 'hitl_decision_required',
        case_id: data.caseId,
        checkpoint: data.checkpoint,
      },
    });
  }

  /**
   * Affiche une notification pour une mise a jour workflow
   */
  async showWorkflowNotification(data: {
    caseId: string;
    phase: string;
    status: 'completed' | 'failed';
    message?: string;
  }): Promise<boolean> {
    return this.showLocalNotification({
      title: data.status === 'failed' ? 'Workflow échoué' : 'Workflow terminé',
      body: data.message || `Phase ${data.phase}`,
      type: data.status === 'failed' ? 'error' : 'success',
      priority: data.status === 'failed' ? 'high' : 'low',
      link: `/workflow/${data.caseId}`,
      tag: `workflow-${data.caseId}`,
      data: {
        type: 'workflow_update',
        case_id: data.caseId,
      },
    });
  }

  // ============================================
  // Preferences
  // ============================================

  /**
   * Retourne les preferences de notification
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Met a jour les preferences
   */
  updatePreferences(updates: Partial<NotificationPreferences>): NotificationPreferences {
    this.preferences = {
      ...this.preferences,
      ...updates,
      types: {
        ...this.preferences.types,
        ...(updates.types || {}),
      },
      priorities: {
        ...this.preferences.priorities,
        ...(updates.priorities || {}),
      },
      quietHours: {
        ...this.preferences.quietHours,
        ...(updates.quietHours || {}),
      },
    };

    this.savePreferences();
    return this.getPreferences();
  }

  /**
   * Reinitialise les preferences par defaut
   */
  resetPreferences(): NotificationPreferences {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
    return this.getPreferences();
  }

  // ============================================
  // Event Listeners
  // ============================================

  /**
   * Ajoute un listener pour un type d'evenement
   */
  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retourne une fonction pour se desabonner
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Retire un listener
   */
  off(event: string, callback: (data: unknown) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  // ============================================
  // Private Methods
  // ============================================

  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Attendre que le SW soit actif
      if (registration.installing) {
        await new Promise<void>((resolve) => {
          registration.installing!.addEventListener('statechange', function handler(this: ServiceWorker) {
            if (this.state === 'activated') {
              this.removeEventListener('statechange', handler);
              resolve();
            }
          });
        });
      }

      return registration;
    } catch (error) {
      console.error('[PushService] Service Worker registration failed:', error);
      return null;
    }
  }

  private setupServiceWorkerListeners(): void {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, ...data } = event.data || {};

      // Notifier les listeners
      const handlers = this.listeners.get(type);
      if (handlers) {
        handlers.forEach((handler) => handler(data));
      }

      // Traiter les messages specifiques
      switch (type) {
        case 'SUBSCRIPTION_RESULT':
          this.subscription = data.subscription;
          break;

        case 'NOTIFICATION_CLOSED':
          this.emit('notification_closed', data);
          break;
      }
    });
  }

  private sendMessageToSW(message: { type: string; data?: unknown }): void {
    if (this.registration?.active) {
      this.registration.active.postMessage(message);
    }
  }

  private emit(event: string, data: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  private shouldShowNotification(options: LocalNotificationOptions): boolean {
    // Verifier si les notifications sont activees
    if (!this.preferences.enabled) {
      return false;
    }

    // Verifier le type
    const type = options.data?.type as string;
    if (type && this.preferences.types[type as keyof typeof this.preferences.types] === false) {
      return false;
    }

    // Verifier la priorite
    const priority = options.priority || 'medium';
    if (!this.preferences.priorities[priority]) {
      return false;
    }

    // Verifier les heures calmes
    if (this.preferences.quietHours.enabled && this.isQuietHours()) {
      // Permettre quand meme les notifications urgentes
      if (priority !== 'urgent') {
        return false;
      }
    }

    return true;
  }

  private isQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = this.preferences.quietHours.start.split(':').map(Number);
    const [endH, endM] = this.preferences.quietHours.end.split(':').map(Number);

    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    // Gerer le cas ou la periode passe minuit
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          types: { ...DEFAULT_PREFERENCES.types, ...parsed.types },
          priorities: { ...DEFAULT_PREFERENCES.priorities, ...parsed.priorities },
          quietHours: { ...DEFAULT_PREFERENCES.quietHours, ...parsed.quietHours },
        };
      }
    } catch {
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(this.preferences));
    } catch {
      // Ignore storage errors
    }
  }

  private async syncSubscriptionWithServer(subscription: PushSubscriptionData): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.warn('[PushService] No auth token, skipping server sync');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const apiPrefix = baseUrl.endsWith('/api/v2') ? baseUrl : `${baseUrl}/api/v2`;
      await fetch(`${apiPrefix}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error('[PushService] Failed to sync subscription with server:', error);
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const apiPrefix = baseUrl.endsWith('/api/v2') ? baseUrl : `${baseUrl}/api/v2`;
      await fetch(`${apiPrefix}/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('[PushService] Failed to remove subscription from server:', error);
    }
  }

  private getAuthToken(): string | null {
    // Essaie de recuperer le token depuis le localStorage ou les cookies
    try {
      const stored = localStorage.getItem('auth_token');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.access_token || parsed;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Singleton export
export const pushNotificationService = new PushNotificationService();

// Named exports for convenience
export const {
  initialize,
  isSupported,
  getPermissionStatus,
  requestPermission,
  subscribe,
  unsubscribe,
  isSubscribed,
  getSubscription,
  showLocalNotification,
  showHITLNotification,
  showWorkflowNotification,
  getPreferences,
  updatePreferences,
  resetPreferences,
  on,
  off,
} = {
  initialize: pushNotificationService.initialize.bind(pushNotificationService),
  isSupported: pushNotificationService.isSupported.bind(pushNotificationService),
  getPermissionStatus: pushNotificationService.getPermissionStatus.bind(pushNotificationService),
  requestPermission: pushNotificationService.requestPermission.bind(pushNotificationService),
  subscribe: pushNotificationService.subscribe.bind(pushNotificationService),
  unsubscribe: pushNotificationService.unsubscribe.bind(pushNotificationService),
  isSubscribed: pushNotificationService.isSubscribed.bind(pushNotificationService),
  getSubscription: pushNotificationService.getSubscription.bind(pushNotificationService),
  showLocalNotification: pushNotificationService.showLocalNotification.bind(pushNotificationService),
  showHITLNotification: pushNotificationService.showHITLNotification.bind(pushNotificationService),
  showWorkflowNotification: pushNotificationService.showWorkflowNotification.bind(pushNotificationService),
  getPreferences: pushNotificationService.getPreferences.bind(pushNotificationService),
  updatePreferences: pushNotificationService.updatePreferences.bind(pushNotificationService),
  resetPreferences: pushNotificationService.resetPreferences.bind(pushNotificationService),
  on: pushNotificationService.on.bind(pushNotificationService),
  off: pushNotificationService.off.bind(pushNotificationService),
};

export default pushNotificationService;
