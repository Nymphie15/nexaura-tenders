/**
 * Notifications Hook Tests
 * Tests for the unified notification management hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock stores and services
const mockNotifications: any[] = [];
const mockAddNotification = vi.fn();
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockRemoveNotification = vi.fn();
const mockClearAll = vi.fn();
const mockGetFilteredNotifications = vi.fn(() => mockNotifications);
const mockGetNotificationsByType = vi.fn(() => mockNotifications);
const mockGetNotificationsByPriority = vi.fn(() => mockNotifications);

vi.mock('@/stores/notification-store', () => ({
  useNotificationStore: () => ({
    notifications: mockNotifications,
    unreadCount: mockNotifications.filter((n) => !n.read).length,
    isLoading: false,
    addNotification: mockAddNotification,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    removeNotification: mockRemoveNotification,
    clearAll: mockClearAll,
    getFilteredNotifications: mockGetFilteredNotifications,
    getNotificationsByType: mockGetNotificationsByType,
    getNotificationsByPriority: mockGetNotificationsByPriority,
  }),
  Notification: {},
  NotificationPriority: {},
  NotificationType: {},
}));

// Mock realtime notifications hook
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('@/hooks/use-realtime-notifications', () => ({
  useRealtimeNotifications: () => ({
    isConnected: true,
    connect: mockConnect,
    disconnect: mockDisconnect,
  }),
  HITLDecisionRequiredEvent: {},
  WorkflowUpdateEvent: {},
}));

// Mock push notification service
const mockInitialize = vi.fn();
const mockRequestPermission = vi.fn();
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockGetPreferences = vi.fn(() => ({
  sound: true,
  desktop: true,
  email: false,
}));
const mockUpdatePreferences = vi.fn();
const mockShowHITLNotification = vi.fn();
const mockShowWorkflowNotification = vi.fn();

vi.mock('@/services/push-notification-service', () => ({
  pushNotificationService: {
    initialize: () => mockInitialize(),
    requestPermission: () => mockRequestPermission(),
    subscribe: () => mockSubscribe(),
    unsubscribe: () => mockUnsubscribe(),
    getPreferences: () => mockGetPreferences(),
    updatePreferences: (updates: any) => mockUpdatePreferences(updates),
    showHITLNotification: (data: any) => mockShowHITLNotification(data),
    showWorkflowNotification: (data: any) => mockShowWorkflowNotification(data),
    isSupported: () => true,
    isSubscribed: () => false,
    getPermissionStatus: () => 'default' as const,
  },
  NotificationPreferences: {},
  NotificationPermissionStatus: {},
}));

// Mock HITL hook
const mockSubmitDecision = vi.fn();

vi.mock('@/hooks/use-hitl', () => ({
  useSubmitDecision: () => ({
    mutateAsync: mockSubmitDecision,
  }),
}));

import { useNotifications, useHITLNotifications, useWorkflowNotifications } from '@/hooks/use-notifications';

describe('useNotifications', () => {
  const mockGetToken = vi.fn(() => 'test-token');

  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications.length = 0;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial notification state', () => {
      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('returns push notification state', () => {
      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      expect(result.current.pushPermission).toBe('default');
      expect(result.current.isPushSupported).toBe(true);
      expect(result.current.isPushEnabled).toBe(false);
    });

    it('returns preferences', () => {
      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      expect(result.current.preferences).toEqual({
        sound: true,
        desktop: true,
        email: false,
      });
    });
  });

  describe('Grouped Notifications', () => {
    it('groups notifications by priority', () => {
      mockNotifications.push(
        { id: '1', priority: 'urgent', read: false },
        { id: '2', priority: 'high', read: false },
        { id: '3', priority: 'medium', read: false },
        { id: '4', priority: 'low', read: false }
      );

      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      expect(result.current.groupedByPriority.urgent).toHaveLength(1);
      expect(result.current.groupedByPriority.high).toHaveLength(1);
      expect(result.current.groupedByPriority.normal).toHaveLength(2);
    });

    it('filters urgent notifications correctly', () => {
      mockNotifications.push(
        { id: '1', priority: 'urgent', read: false },
        { id: '2', priority: 'high', read: false },
        { id: '3', priority: 'medium', read: false },
        { id: '4', priority: 'urgent', read: true }
      );

      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      expect(result.current.urgentNotifications).toHaveLength(2);
    });

    it('groups notifications by workflow', () => {
      mockNotifications.push(
        { id: '1', metadata: { case_id: 'case-1' } },
        { id: '2', metadata: { case_id: 'case-1' } },
        { id: '3', metadata: { case_id: 'case-2' } },
        { id: '4', type: 'info', metadata: { type: 'extension_sync' } },
        { id: '5', type: 'info', metadata: {} }
      );

      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      const workflowGroups = result.current.groupedByWorkflow;
      expect(workflowGroups.length).toBeGreaterThan(0);
    });
  });

  describe('Actions', () => {
    it('marks notification as read', () => {
      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      act(() => {
        result.current.markAsRead('notification-1');
      });

      expect(mockMarkAsRead).toHaveBeenCalledWith('notification-1');
    });

    it('marks all notifications as read', () => {
      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      act(() => {
        result.current.markAllAsRead();
      });

      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });

    it('removes notification', () => {
      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      act(() => {
        result.current.removeNotification('notification-1');
      });

      expect(mockRemoveNotification).toHaveBeenCalledWith('notification-1');
    });

    it('clears all notifications', () => {
      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      act(() => {
        result.current.clearAll();
      });

      expect(mockClearAll).toHaveBeenCalled();
    });
  });

  describe('HITL Actions', () => {
    it('approves HITL notification', async () => {
      mockSubmitDecision.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      const notification = {
        id: 'notif-1',
        metadata: {
          case_id: 'case-123',
          checkpoint: 'review',
        },
      };

      await act(async () => {
        await result.current.approveHITL(notification as any);
      });

      expect(mockSubmitDecision).toHaveBeenCalledWith({
        caseId: 'case-123',
        checkpoint: 'review',
        decision: {
          action: 'approve',
          comments: 'Approved via notification center',
        },
      });
      expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('rejects HITL notification', async () => {
      mockSubmitDecision.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      const notification = {
        id: 'notif-1',
        metadata: {
          case_id: 'case-123',
          checkpoint: 'review',
        },
      };

      await act(async () => {
        await result.current.rejectHITL(notification as any);
      });

      expect(mockSubmitDecision).toHaveBeenCalledWith({
        caseId: 'case-123',
        checkpoint: 'review',
        decision: {
          action: 'reject',
          comments: 'Rejected via notification center',
        },
      });
    });

    it('handles missing metadata for HITL', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      const notification = {
        id: 'notif-1',
        metadata: {},
      };

      await act(async () => {
        await result.current.approveHITL(notification as any);
      });

      expect(mockSubmitDecision).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Push Notifications', () => {
    it('requests push permission', async () => {
      mockRequestPermission.mockResolvedValueOnce('granted');

      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      let permission;
      await act(async () => {
        permission = await result.current.requestPushPermission();
      });

      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('enables push notifications', async () => {
      mockSubscribe.mockResolvedValueOnce({ endpoint: 'test' });

      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      let enabled;
      await act(async () => {
        enabled = await result.current.enablePush();
      });

      expect(mockSubscribe).toHaveBeenCalled();
    });

    it('disables push notifications', async () => {
      mockUnsubscribe.mockResolvedValueOnce(true);

      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      await act(async () => {
        await result.current.disablePush();
      });

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Preferences', () => {
    it('updates notification preferences', () => {
      mockUpdatePreferences.mockReturnValueOnce({
        sound: false,
        desktop: true,
        email: false,
      });

      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      act(() => {
        result.current.updatePreferences({ sound: false });
      });

      expect(mockUpdatePreferences).toHaveBeenCalledWith({ sound: false });
    });
  });

  describe('Filters', () => {
    it('filters by type', () => {
      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      result.current.filterByType('info' as any);
      expect(mockGetNotificationsByType).toHaveBeenCalledWith('info');
    });

    it('filters by priority', () => {
      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      result.current.filterByPriority('urgent' as any);
      expect(mockGetNotificationsByPriority).toHaveBeenCalledWith('urgent');
    });

    it('filters by workflow', () => {
      mockNotifications.push(
        { id: '1', metadata: { case_id: 'case-123' } },
        { id: '2', metadata: { caseId: 'case-123' } },
        { id: '3', metadata: { case_id: 'case-456' } }
      );

      const { result } = renderHook(() =>
        useNotifications({ getToken: mockGetToken })
      );

      const filtered = result.current.filterByWorkflow('case-123');
      expect(filtered).toHaveLength(2);
    });
  });
});

describe('useHITLNotifications', () => {
  const mockGetToken = vi.fn(() => 'test-token');

  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications.length = 0;
  });

  it('filters only HITL notifications', () => {
    mockNotifications.push(
      {
        id: '1',
        type: 'warning',
        metadata: { type: 'hitl_decision_required' },
      },
      { id: '2', type: 'warning', metadata: { checkpoint: 'review' } },
      { id: '3', type: 'info', metadata: {} }
    );

    const { result } = renderHook(() => useHITLNotifications(mockGetToken));

    expect(result.current.notifications).toHaveLength(2);
  });

  it('returns connection status', () => {
    const { result } = renderHook(() => useHITLNotifications(mockGetToken));

    expect(result.current.isConnected).toBe(true);
  });
});

describe('useWorkflowNotifications', () => {
  const mockGetToken = vi.fn(() => 'test-token');

  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications.length = 0;
  });

  it('filters notifications for specific workflow', () => {
    mockNotifications.push(
      { id: '1', read: false, metadata: { case_id: 'case-123' } },
      { id: '2', read: true, metadata: { case_id: 'case-123' } },
      { id: '3', read: false, metadata: { case_id: 'other' } }
    );

    const { result } = renderHook(() =>
      useWorkflowNotifications('case-123', mockGetToken)
    );

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it('marks all workflow notifications as read', () => {
    mockNotifications.push(
      { id: '1', read: false, metadata: { case_id: 'case-123' } },
      { id: '2', read: false, metadata: { case_id: 'case-123' } }
    );

    const { result } = renderHook(() =>
      useWorkflowNotifications('case-123', mockGetToken)
    );

    act(() => {
      result.current.markAllAsRead();
    });

    expect(mockMarkAsRead).toHaveBeenCalledTimes(2);
  });
});
