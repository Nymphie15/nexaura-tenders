import { create } from "zustand";

// Types
export type NotificationType = "info" | "success" | "warning" | "error";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  fetchNotifications: () => Promise<void>;
  
  // Filtering
  getFilteredNotifications: (filters: NotificationFilters) => Notification[];
  getNotificationsByType: (type: NotificationType) => Notification[];
  getNotificationsByPriority: (priority: NotificationPriority) => Notification[];
}

// Helper to generate unique IDs
const generateId = () => `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      read: false,
      createdAt: new Date(),
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.read) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;

      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors du chargement";
      set({ error: message, isLoading: false });
    }
  },

  getFilteredNotifications: (filters: NotificationFilters) => {
    const { notifications } = get();
    return notifications.filter((n) => {
      if (filters.type && n.type !== filters.type) return false;
      if (filters.priority && n.priority !== filters.priority) return false;
      if (filters.read !== undefined && n.read !== filters.read) return false;
      return true;
    });
  },

  getNotificationsByType: (type: NotificationType) => {
    return get().notifications.filter((n) => n.type === type);
  },

  getNotificationsByPriority: (priority: NotificationPriority) => {
    return get().notifications.filter((n) => n.priority === priority);
  },
}));
