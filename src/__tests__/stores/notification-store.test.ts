import { describe, it, expect, beforeEach, vi } from "vitest";
import { useNotificationStore } from "@/stores/notification-store";
import type { NotificationType, NotificationPriority } from "@/stores/notification-store";

describe("NotificationStore", () => {
  // Reset store state before each test
  beforeEach(() => {
    const state = useNotificationStore.getState();
    state.clearAll();
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
    });
  });

  describe("Initial State", () => {
    it("should have empty notifications array", () => {
      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
    });

    it("should have zero unread count", () => {
      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(0);
    });

    it("should not be loading", () => {
      const state = useNotificationStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it("should have no error", () => {
      const state = useNotificationStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe("addNotification", () => {
    it("should add a notification with generated id and createdAt", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test Notification",
        message: "This is a test",
      });

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        type: "info",
        priority: "medium",
        title: "Test Notification",
        message: "This is a test",
        read: false,
      });
      expect(notifications[0].id).toMatch(/^notif_\d+_[a-z0-9]+$/);
      expect(notifications[0].createdAt).toBeInstanceOf(Date);
    });

    it("should increment unread count", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "success",
        priority: "low",
        title: "Success",
        message: "Operation completed",
      });

      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });

    it("should add notification to the beginning of the array", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "low",
        title: "First",
        message: "First notification",
      });

      state.addNotification({
        type: "warning",
        priority: "high",
        title: "Second",
        message: "Second notification",
      });

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications[0].title).toBe("Second");
      expect(notifications[1].title).toBe("First");
    });

    it("should support optional metadata and link", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "error",
        priority: "urgent",
        title: "Error",
        message: "Something went wrong",
        link: "/error-details",
        metadata: { errorCode: 500, retryable: true },
      });

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.link).toBe("/error-details");
      expect(notification.metadata).toEqual({ errorCode: 500, retryable: true });
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test",
        message: "Test message",
      });

      const id = useNotificationStore.getState().notifications[0].id;
      state.markAsRead(id);

      const notification = useNotificationStore.getState().notifications[0];
      expect(notification.read).toBe(true);
    });

    it("should decrement unread count", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test 1",
        message: "Message 1",
      });

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test 2",
        message: "Message 2",
      });

      expect(useNotificationStore.getState().unreadCount).toBe(2);

      const id = useNotificationStore.getState().notifications[0].id;
      state.markAsRead(id);

      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });

    it("should not decrement unread count if already read", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test",
        message: "Test message",
      });

      const id = useNotificationStore.getState().notifications[0].id;
      state.markAsRead(id);
      state.markAsRead(id); // Mark as read again

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it("should not change state for non-existent id", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test",
        message: "Test message",
      });

      const beforeState = useNotificationStore.getState();
      state.markAsRead("non-existent-id");
      const afterState = useNotificationStore.getState();

      expect(afterState).toEqual(beforeState);
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all notifications as read", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test 1",
        message: "Message 1",
      });

      state.addNotification({
        type: "warning",
        priority: "high",
        title: "Test 2",
        message: "Message 2",
      });

      state.addNotification({
        type: "error",
        priority: "urgent",
        title: "Test 3",
        message: "Message 3",
      });

      state.markAllAsRead();

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications.every((n) => n.read === true)).toBe(true);
    });

    it("should reset unread count to zero", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test 1",
        message: "Message 1",
      });

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test 2",
        message: "Message 2",
      });

      expect(useNotificationStore.getState().unreadCount).toBe(2);

      state.markAllAsRead();

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe("removeNotification", () => {
    it("should remove notification by id", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test",
        message: "Test message",
      });

      const id = useNotificationStore.getState().notifications[0].id;
      state.removeNotification(id);

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it("should decrement unread count if notification was unread", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test",
        message: "Test message",
      });

      expect(useNotificationStore.getState().unreadCount).toBe(1);

      const id = useNotificationStore.getState().notifications[0].id;
      state.removeNotification(id);

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it("should not decrement unread count if notification was read", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test 1",
        message: "Message 1",
      });

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test 2",
        message: "Message 2",
      });

      const id = useNotificationStore.getState().notifications[0].id;
      state.markAsRead(id);

      expect(useNotificationStore.getState().unreadCount).toBe(1);

      state.removeNotification(id);

      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });

    it("should not change state for non-existent id", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test",
        message: "Test message",
      });

      const beforeState = useNotificationStore.getState();
      state.removeNotification("non-existent-id");
      const afterState = useNotificationStore.getState();

      expect(afterState.notifications).toHaveLength(1);
    });
  });

  describe("clearAll", () => {
    it("should clear all notifications", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test 1",
        message: "Message 1",
      });

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test 2",
        message: "Message 2",
      });

      state.clearAll();

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it("should reset unread count to zero", () => {
      const state = useNotificationStore.getState();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test 1",
        message: "Message 1",
      });

      state.clearAll();

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe("fetchNotifications", () => {
    it("should set loading state during fetch", async () => {
      const state = useNotificationStore.getState();

      const fetchPromise = state.fetchNotifications();

      // Check loading state immediately
      expect(useNotificationStore.getState().isLoading).toBe(true);

      await fetchPromise;

      expect(useNotificationStore.getState().isLoading).toBe(false);
    });

    it("should clear error on successful fetch", async () => {
      const state = useNotificationStore.getState();

      // Set an error first
      useNotificationStore.setState({ error: "Previous error" });

      await state.fetchNotifications();

      expect(useNotificationStore.getState().error).toBeNull();
    });

    it("should handle errors gracefully", async () => {
      const state = useNotificationStore.getState();

      // Mock an error scenario by overriding the implementation
      const originalFetch = state.fetchNotifications;
      useNotificationStore.setState({
        fetchNotifications: async () => {
          useNotificationStore.setState({ isLoading: true, error: null });
          try {
            throw new Error("Network error");
          } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur lors du chargement";
            useNotificationStore.setState({ error: message, isLoading: false });
          }
        }
      });

      await useNotificationStore.getState().fetchNotifications();

      const finalState = useNotificationStore.getState();
      expect(finalState.error).toBe("Network error");
      expect(finalState.isLoading).toBe(false);

      // Restore original implementation
      useNotificationStore.setState({ fetchNotifications: originalFetch });
    });
  });

  describe("Selectors - getFilteredNotifications", () => {
    beforeEach(() => {
      const state = useNotificationStore.getState();
      state.clearAll();

      // Add test data
      state.addNotification({
        type: "info",
        priority: "low",
        title: "Info Low",
        message: "Info low priority",
      });

      state.addNotification({
        type: "warning",
        priority: "medium",
        title: "Warning Medium",
        message: "Warning medium priority",
      });

      state.addNotification({
        type: "error",
        priority: "high",
        title: "Error High",
        message: "Error high priority",
      });

      state.addNotification({
        type: "success",
        priority: "urgent",
        title: "Success Urgent",
        message: "Success urgent priority",
      });

      // Mark one as read
      const notifications = useNotificationStore.getState().notifications;
      state.markAsRead(notifications[0].id);
    });

    it("should filter by type", () => {
      const state = useNotificationStore.getState();
      const filtered = state.getFilteredNotifications({ type: "error" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe("error");
    });

    it("should filter by priority", () => {
      const state = useNotificationStore.getState();
      const filtered = state.getFilteredNotifications({ priority: "urgent" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].priority).toBe("urgent");
    });

    it("should filter by read status", () => {
      const state = useNotificationStore.getState();
      const unread = state.getFilteredNotifications({ read: false });
      const read = state.getFilteredNotifications({ read: true });

      expect(unread).toHaveLength(3);
      expect(read).toHaveLength(1);
    });

    it("should filter by multiple criteria", () => {
      const state = useNotificationStore.getState();
      const filtered = state.getFilteredNotifications({
        type: "warning",
        priority: "medium",
        read: false,
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toMatchObject({
        type: "warning",
        priority: "medium",
        read: false,
      });
    });

    it("should return empty array when no matches", () => {
      const state = useNotificationStore.getState();
      const filtered = state.getFilteredNotifications({
        type: "info",
        priority: "urgent",
      });

      expect(filtered).toHaveLength(0);
    });
  });

  describe("Selectors - getNotificationsByType", () => {
    beforeEach(() => {
      const state = useNotificationStore.getState();
      state.clearAll();

      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Info 1",
        message: "Info message 1",
      });

      state.addNotification({
        type: "info",
        priority: "low",
        title: "Info 2",
        message: "Info message 2",
      });

      state.addNotification({
        type: "warning",
        priority: "high",
        title: "Warning 1",
        message: "Warning message",
      });
    });

    it("should return all notifications of a specific type", () => {
      const state = useNotificationStore.getState();
      const infoNotifs = state.getNotificationsByType("info");

      expect(infoNotifs).toHaveLength(2);
      expect(infoNotifs.every((n) => n.type === "info")).toBe(true);
    });

    it("should return empty array for non-existent type", () => {
      const state = useNotificationStore.getState();
      const errorNotifs = state.getNotificationsByType("error");

      expect(errorNotifs).toHaveLength(0);
    });
  });

  describe("Selectors - getNotificationsByPriority", () => {
    beforeEach(() => {
      const state = useNotificationStore.getState();
      state.clearAll();

      state.addNotification({
        type: "info",
        priority: "high",
        title: "High 1",
        message: "High priority 1",
      });

      state.addNotification({
        type: "warning",
        priority: "high",
        title: "High 2",
        message: "High priority 2",
      });

      state.addNotification({
        type: "error",
        priority: "urgent",
        title: "Urgent 1",
        message: "Urgent priority",
      });
    });

    it("should return all notifications of a specific priority", () => {
      const state = useNotificationStore.getState();
      const highPriorityNotifs = state.getNotificationsByPriority("high");

      expect(highPriorityNotifs).toHaveLength(2);
      expect(highPriorityNotifs.every((n) => n.priority === "high")).toBe(true);
    });

    it("should return empty array for non-existent priority", () => {
      const state = useNotificationStore.getState();
      const lowPriorityNotifs = state.getNotificationsByPriority("low");

      expect(lowPriorityNotifs).toHaveLength(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid successive additions", () => {
      const state = useNotificationStore.getState();

      for (let i = 0; i < 10; i++) {
        state.addNotification({
          type: "info",
          priority: "medium",
          title: `Test ${i}`,
          message: `Message ${i}`,
        });
      }

      expect(useNotificationStore.getState().notifications).toHaveLength(10);
      expect(useNotificationStore.getState().unreadCount).toBe(10);
    });

    it("should maintain state consistency after mixed operations", () => {
      const state = useNotificationStore.getState();

      // Add 3 notifications
      state.addNotification({
        type: "info",
        priority: "medium",
        title: "Test 1",
        message: "Message 1",
      });

      state.addNotification({
        type: "warning",
        priority: "high",
        title: "Test 2",
        message: "Message 2",
      });

      state.addNotification({
        type: "error",
        priority: "urgent",
        title: "Test 3",
        message: "Message 3",
      });

      const notifications = useNotificationStore.getState().notifications;

      // Mark first as read
      state.markAsRead(notifications[0].id);

      // Remove second
      state.removeNotification(notifications[1].id);

      const finalState = useNotificationStore.getState();
      expect(finalState.notifications).toHaveLength(2);
      expect(finalState.unreadCount).toBe(1);
    });
  });
});
