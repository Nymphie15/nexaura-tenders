/**
 * Tests for use-notifications hook
 * Tests notification management, WebSocket, push notifications, HITL actions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications, useHITLNotifications, useWorkflowNotifications } from '@/hooks/use-notifications';
import { useNotificationStore } from '@/stores/notification-store';
import { pushNotificationService } from '@/services/push-notification-service';

// Mock dependencies
vi.mock('@/stores/notification-store', () => ({
  useNotificationStore: vi.fn(),
}));

vi.mock('@/hooks/use-realtime-notifications', () => ({
  useRealtimeNotifications: vi.fn(() => ({
    isConnected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-hitl', () => ({
  useSubmitDecision: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/services/push-notification-service', () => ({
  pushNotificationService: {
    initialize: vi.fn(),
    getPermissionStatus: vi.fn(() => 'default'),
    isSubscribed: vi.fn(() => false),
    isSupported: vi.fn(() => true),
    requestPermission: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    getPreferences: vi.fn(() => ({
      enabled: true,
      sound: true,
      vibrate: true,
      showOnLockScreen: true,
    })),
    updatePreferences: vi.fn(),
    showHITLNotification: vi.fn(),
    showWorkflowNotification: vi.fn(),
  },
}));

// Mock data
const mockNotification = {
  id: 'notif-1',
  type: 'info' as const,
  priority: 'normal' as const,
  title: 'Test Notification',
  message: 'This is a test',
  read: false,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  metadata: {},
};

const mockHITLNotification = {
  id: 'notif-hitl-1',
  type: 'warning' as const,
  priority: 'urgent' as const,
  title: 'HITL Decision Required',
  message: 'Please review GO/NOGO decision',
  read: false,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  metadata: {
    type: 'hitl_decision_required',
    case_id: 'case-1',
    checkpoint: 'GO_NOGO',
  },
};

const mockWorkflowNotification = {
  id: 'notif-workflow-1',
  type: 'success' as const,
  priority: 'normal' as const,
  title: 'Workflow Completed',
  message: 'Case case-1 completed successfully',
  read: false,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  metadata: {
    case_id: 'case-1',
    phase: 'PACKAGING',
  },
};

describe('useNotifications', () => {
  const mockGetToken = vi.fn(() => 'test-token');
  const mockNotificationStore = {
    notifications: [mockNotification],
    unreadCount: 1,
    isLoading: false,
    addNotification: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    removeNotification: vi.fn(),
    clearAll: vi.fn(),
    getFilteredNotifications: vi.fn((filter) => [mockNotification]),
    getNotificationsByType: vi.fn((type) => [mockNotification]),
    getNotificationsByPriority: vi.fn((priority) => [mockNotification]),
  };

  beforeEach(() => {
    vi.mocked(useNotificationStore).mockReturnValue(mockNotificationStore as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('devrait initialiser avec les bonnes valeurs par defaut', () => {
      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      expect(result.current.notifications).toEqual([mockNotification]);
      expect(result.current.unreadCount).toBe(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isPushSupported).toBe(true);
    });

    it('devrait initialiser push notifications si enablePush=true', async () => {
      renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
          enablePush: true,
        })
      );

      await waitFor(() => {
        expect(pushNotificationService.initialize).toHaveBeenCalled();
        expect(pushNotificationService.getPermissionStatus).toHaveBeenCalled();
        expect(pushNotificationService.isSubscribed).toHaveBeenCalled();
      });
    });

    it('ne devrait pas initialiser push si enablePush=false', () => {
      renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
          enablePush: false,
        })
      );

      expect(pushNotificationService.initialize).not.toHaveBeenCalled();
    });
  });

  describe('actions', () => {
    it('devrait marquer une notification comme lue', () => {
      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      act(() => {
        result.current.markAsRead('notif-1');
      });

      expect(mockNotificationStore.markAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('devrait marquer toutes les notifications comme lues', () => {
      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      act(() => {
        result.current.markAllAsRead();
      });

      expect(mockNotificationStore.markAllAsRead).toHaveBeenCalled();
    });

    it('devrait supprimer une notification', () => {
      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      act(() => {
        result.current.removeNotification('notif-1');
      });

      expect(mockNotificationStore.removeNotification).toHaveBeenCalledWith('notif-1');
    });

    it('devrait vider toutes les notifications', () => {
      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      act(() => {
        result.current.clearAll();
      });

      expect(mockNotificationStore.clearAll).toHaveBeenCalled();
    });
  });

  describe('groupedByPriority', () => {
    it('devrait grouper les notifications par priorite', () => {
      const notifications = [
        { ...mockNotification, id: '1', priority: 'urgent' as const, read: false },
        { ...mockNotification, id: '2', priority: 'high' as const, read: false },
        { ...mockNotification, id: '3', priority: 'medium' as const, read: false },
        { ...mockNotification, id: '4', priority: 'low' as const, read: false },
      ];

      vi.mocked(useNotificationStore).mockReturnValue({
        ...mockNotificationStore,
        notifications,
      } as any);

      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      expect(result.current.groupedByPriority.urgent).toHaveLength(1);
      expect(result.current.groupedByPriority.high).toHaveLength(1);
      expect(result.current.groupedByPriority.normal).toHaveLength(2); // medium + low
    });

    it('ne devrait inclure que les non-lues', () => {
      const notifications = [
        { ...mockNotification, id: '1', priority: 'urgent' as const, read: false },
        { ...mockNotification, id: '2', priority: 'urgent' as const, read: true },
      ];

      vi.mocked(useNotificationStore).mockReturnValue({
        ...mockNotificationStore,
        notifications,
      } as any);

      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      expect(result.current.groupedByPriority.urgent).toHaveLength(1);
      expect(result.current.groupedByPriority.urgent[0].id).toBe('1');
    });
  });

  describe('groupedByWorkflow', () => {
    it('devrait grouper les notifications par workflow', () => {
      const notifications = [
        { ...mockWorkflowNotification, id: '1', metadata: { case_id: 'case-1' } },
        { ...mockWorkflowNotification, id: '2', metadata: { case_id: 'case-1' } },
        { ...mockWorkflowNotification, id: '3', metadata: { case_id: 'case-2' } },
      ];

      vi.mocked(useNotificationStore).mockReturnValue({
        ...mockNotificationStore,
        notifications,
      } as any);

      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      expect(result.current.groupedByWorkflow).toHaveLength(2);
      expect(result.current.groupedByWorkflow[0].caseId).toBeTruthy();
      expect(result.current.groupedByWorkflow[0].type).toBe('workflow');
    });

    it('devrait grouper les notifications tender', () => {
      const notifications = [
        {
          ...mockNotification,
          type: 'info' as const,
          metadata: { type: 'extension_sync' },
        },
      ];

      vi.mocked(useNotificationStore).mockReturnValue({
        ...mockNotificationStore,
        notifications,
      } as any);

      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      const tenderGroup = result.current.groupedByWorkflow.find((g) => g.type === 'tender');
      expect(tenderGroup).toBeDefined();
      expect(tenderGroup?.key).toBe('tender-detection');
    });
  });

  describe('HITL actions', () => {
    it('devrait approuver une decision HITL', async () => {
      const { useSubmitDecision } = await import('@/hooks/use-hitl');
      const mockMutateAsync = vi.fn().mockResolvedValue({});

      vi.mocked(useSubmitDecision).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as any);

      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      await act(async () => {
        await result.current.approveHITL(mockHITLNotification);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        caseId: 'case-1',
        checkpoint: 'GO_NOGO',
        decision: {
          action: 'approve',
          comments: 'Approved via notification center',
        },
      });

      expect(mockNotificationStore.markAsRead).toHaveBeenCalledWith('notif-hitl-1');
    });

    it('devrait rejeter une decision HITL', async () => {
      const { useSubmitDecision } = await import('@/hooks/use-hitl');
      const mockMutateAsync = vi.fn().mockResolvedValue({});

      vi.mocked(useSubmitDecision).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as any);

      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      await act(async () => {
        await result.current.rejectHITL(mockHITLNotification);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        caseId: 'case-1',
        checkpoint: 'GO_NOGO',
        decision: {
          action: 'reject',
          comments: 'Rejected via notification center',
        },
      });
    });
  });

  describe('push notification permissions', () => {
    it('devrait demander la permission', async () => {
      vi.mocked(pushNotificationService.requestPermission).mockResolvedValue('granted');

      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
          enablePush: true,
        })
      );

      let permission: string = '';
      await act(async () => {
        permission = await result.current.requestPushPermission();
      });

      expect(pushNotificationService.requestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    it('devrait activer les push notifications', async () => {
      vi.mocked(pushNotificationService.subscribe).mockResolvedValue({} as any);

      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
          enablePush: true,
        })
      );

      let enabled: boolean = false;
      await act(async () => {
        enabled = await result.current.enablePush();
      });

      expect(pushNotificationService.subscribe).toHaveBeenCalled();
      expect(enabled).toBe(true);
    });

    it('devrait desactiver les push notifications', async () => {
      vi.mocked(pushNotificationService.unsubscribe).mockResolvedValue(true);

      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
          enablePush: true,
        })
      );

      let disabled: boolean = false;
      await act(async () => {
        disabled = await result.current.disablePush();
      });

      expect(pushNotificationService.unsubscribe).toHaveBeenCalled();
      expect(disabled).toBe(true);
    });
  });

  describe('filters', () => {
    it('devrait filtrer par type', () => {
      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      const infoNotifs = result.current.filterByType('info');
      expect(mockNotificationStore.getNotificationsByType).toHaveBeenCalledWith('info');
    });

    it('devrait filtrer par priorite', () => {
      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      const urgentNotifs = result.current.filterByPriority('urgent');
      expect(mockNotificationStore.getNotificationsByPriority).toHaveBeenCalledWith('urgent');
    });

    it('devrait filtrer par workflow', () => {
      const notifications = [
        { ...mockWorkflowNotification, metadata: { case_id: 'case-1' } },
        { ...mockWorkflowNotification, metadata: { case_id: 'case-2' } },
      ];

      vi.mocked(useNotificationStore).mockReturnValue({
        ...mockNotificationStore,
        notifications,
      } as any);

      const { result } = renderHook(() =>
        useNotifications({
          getToken: mockGetToken,
        })
      );

      const workflowNotifs = result.current.filterByWorkflow('case-1');
      expect(workflowNotifs).toHaveLength(1);
      expect(workflowNotifs[0].metadata?.case_id).toBe('case-1');
    });
  });
});

describe('useHITLNotifications', () => {
  const mockGetToken = vi.fn(() => 'test-token');

  beforeEach(() => {
    const mockStore = {
      notifications: [mockHITLNotification],
      unreadCount: 1,
      isLoading: false,
      markAsRead: vi.fn(),
      addNotification: vi.fn(),
      markAllAsRead: vi.fn(),
      removeNotification: vi.fn(),
      clearAll: vi.fn(),
      getFilteredNotifications: vi.fn(),
      getNotificationsByType: vi.fn(),
      getNotificationsByPriority: vi.fn(),
    };
    vi.mocked(useNotificationStore).mockReturnValue(mockStore as any);
  });

  it('devrait filtrer uniquement les notifications HITL', () => {
    const { result } = renderHook(() => useHITLNotifications(mockGetToken));

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].metadata?.type).toBe('hitl_decision_required');
  });

  it('devrait compter uniquement les HITL non lues', () => {
    const notifications = [
      { ...mockHITLNotification, id: '1', read: false },
      { ...mockHITLNotification, id: '2', read: true },
    ];

    vi.mocked(useNotificationStore).mockReturnValue({
      notifications,
      unreadCount: 1,
      isLoading: false,
      markAsRead: vi.fn(),
      addNotification: vi.fn(),
      markAllAsRead: vi.fn(),
      removeNotification: vi.fn(),
      clearAll: vi.fn(),
      getFilteredNotifications: vi.fn(),
      getNotificationsByType: vi.fn(),
      getNotificationsByPriority: vi.fn(),
    } as any);

    const { result } = renderHook(() => useHITLNotifications(mockGetToken));

    expect(result.current.unreadCount).toBe(1);
  });
});

describe('useWorkflowNotifications', () => {
  const mockGetToken = vi.fn(() => 'test-token');

  beforeEach(() => {
    const notifications = [
      { ...mockWorkflowNotification, id: '1', metadata: { case_id: 'case-1' }, read: false },
      { ...mockWorkflowNotification, id: '2', metadata: { case_id: 'case-2' }, read: false },
    ];

    vi.mocked(useNotificationStore).mockReturnValue({
      notifications,
      unreadCount: 2,
      isLoading: false,
      markAsRead: vi.fn(),
      addNotification: vi.fn(),
      markAllAsRead: vi.fn(),
      removeNotification: vi.fn(),
      clearAll: vi.fn(),
      getFilteredNotifications: vi.fn(),
      getNotificationsByType: vi.fn(),
      getNotificationsByPriority: vi.fn(),
    } as any);
  });

  it('devrait filtrer les notifications par case_id', () => {
    const { result } = renderHook(() => useWorkflowNotifications('case-1', mockGetToken));

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].metadata?.case_id).toBe('case-1');
  });

  it('devrait compter uniquement les non-lues du workflow', () => {
    const { result } = renderHook(() => useWorkflowNotifications('case-1', mockGetToken));

    expect(result.current.unreadCount).toBe(1);
  });

  it('devrait marquer toutes les notifications du workflow comme lues', () => {
    const mockMarkAsRead = vi.fn();
    vi.mocked(useNotificationStore).mockReturnValue({
      notifications: [
        { ...mockWorkflowNotification, id: '1', metadata: { case_id: 'case-1' }, read: false },
      ],
      unreadCount: 1,
      isLoading: false,
      markAsRead: mockMarkAsRead,
      addNotification: vi.fn(),
      markAllAsRead: vi.fn(),
      removeNotification: vi.fn(),
      clearAll: vi.fn(),
      getFilteredNotifications: vi.fn(),
      getNotificationsByType: vi.fn(),
      getNotificationsByPriority: vi.fn(),
    } as any);

    const { result } = renderHook(() => useWorkflowNotifications('case-1', mockGetToken));

    act(() => {
      result.current.markAllAsRead();
    });

    expect(mockMarkAsRead).toHaveBeenCalledWith('1');
  });
});
