# Changelog: WebSocket & API Endpoints Extension

**Date:** 2026-01-22
**Project:** appel-offre-automation/web-client
**Server:** hostinger (VPS)

---

## Summary

Extended the WebSocket system and API endpoints to support real-time notifications, document management, and additional workflow operations.

---

## New Files Created

### 1. `src/hooks/use-realtime-notifications.ts`

**Purpose:** Hook for real-time notifications via WebSocket

**Features:**
- Connects to `/ws/notifications` WebSocket endpoint
- Supports 5 event types:
  - `hitl_decision_required`: New HITL decision needed
  - `hitl_decision_made`: HITL decision was made
  - `workflow_update`: Workflow status changes
  - `notification`: General notifications
  - `extension_sync`: Chrome extension synchronization

**Key Exports:**
```typescript
// Main hook
export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions): UseRealtimeNotificationsReturn

// Convenience hooks
export function useHITLNotifications(options) // HITL-focused notifications
export function useWorkflowNotifications(options) // Workflow-focused notifications
```

**Options Interface:**
```typescript
interface UseRealtimeNotificationsOptions {
  getToken: () => string | null;
  onHITLRequired?: (event: HITLDecisionRequiredEvent) => void;
  onHITLDecided?: (event: HITLDecisionMadeEvent) => void;
  onWorkflowUpdate?: (event: WorkflowUpdateEvent) => void;
  onExtensionSync?: (event: ExtensionSyncEvent) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;  // default: true
  enableSound?: boolean;  // default: true
}
```

**Return Interface:**
```typescript
interface UseRealtimeNotificationsReturn {
  isConnected: boolean;
  connectionId: string | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (eventType: string, handler: (event) => void) => () => void;
}
```

**Features:**
- Auto-reconnect with exponential backoff (up to 10 attempts)
- Notification sounds for urgent/high priority events
- Integration with notification-store (Zustand)
- Keepalive ping every 30 seconds

---

## Modified Files

### 2. `src/lib/api/endpoints.ts`

**Changes:**

#### A. Extended `workflowApi` with 3 new methods:

```typescript
// Get detailed phase information
workflowApi.getPhaseDetails(caseId: string, phase: string): Promise<{
  phase: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  errors?: Array<{ message: string; timestamp: string }>;
  metrics?: {
    llm_calls?: number;
    tokens_used?: number;
    api_calls?: number;
  };
}>

// Get workflow transitions history
workflowApi.getTransitions(caseId: string): Promise<{
  transitions: Array<{
    from_phase: string;
    to_phase: string;
    triggered_at: string;
    trigger: "auto" | "manual" | "hitl" | "error";
    metadata?: Record<string, unknown>;
  }>;
}>

// Skip a workflow phase
workflowApi.skipPhase(caseId: string, phase: string, reason?: string): Promise<{
  skipped: boolean;
  next_phase: string;
}>
```

#### B. Added new `documentsApi`:

```typescript
export const documentsApi = {
  list(tenderId, params?): Promise<DocumentInfo[]>,
  get(tenderId, docId): Promise<DocumentInfo>,
  upload(tenderId, files, category?): Promise<{ uploaded, errors? }>,
  download(tenderId, docId): Promise<Blob>,
  downloadBatch(tenderId, docIds[]): Promise<Blob>,
  delete(tenderId, docId): Promise<void>,

  // Annotations
  listAnnotations(docId): Promise<DocumentAnnotation[]>,
  addAnnotation(docId, annotation): Promise<DocumentAnnotation>,
  updateAnnotation(docId, annotationId, data): Promise<DocumentAnnotation>,
  deleteAnnotation(docId, annotationId): Promise<void>,
}
```

**Types:**
```typescript
interface DocumentInfo {
  id: string;
  tender_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  category: "dce" | "rc" | "cctp" | "bpu" | "dpgf" | "acte_engagement" | "other";
  extracted_text?: boolean;
  page_count?: number;
  annotations_count: number;
  created_at: string;
  updated_at?: string;
}

interface DocumentAnnotation {
  id: string;
  document_id: string;
  user_id: string;
  type: "highlight" | "comment" | "flag" | "requirement";
  content: string;
  position?: { page, x, y, width?, height? };
  created_at: string;
  updated_at?: string;
}
```

#### C. Added new `notificationsApi`:

```typescript
export const notificationsApi = {
  list(params?): Promise<{ notifications, total, unread_count }>,
  get(id): Promise<NotificationItem>,
  markAsRead(ids[]): Promise<{ updated: number }>,
  markAllAsRead(category?): Promise<{ updated: number }>,
  delete(id): Promise<void>,
  deleteAll(params?): Promise<{ deleted: number }>,

  // Preferences
  getPreferences(): Promise<NotificationPreferences>,
  updatePreferences(prefs): Promise<NotificationPreferences>,

  // Lightweight polling endpoint
  getUnreadCount(): Promise<{ count, by_category }>,
}
```

**Types:**
```typescript
interface NotificationItem {
  id: string;
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  priority: "low" | "medium" | "high" | "urgent";
  category: "hitl" | "workflow" | "tenders" | "system";
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  read_at?: string;
}

interface NotificationPreferences {
  email_enabled: boolean;
  email_frequency: "instant" | "hourly" | "daily" | "weekly";
  push_enabled: boolean;
  sound_enabled: boolean;
  categories: { hitl, workflow, tenders, system: boolean };
  quiet_hours?: { enabled, start, end, timezone };
}
```

#### D. Updated `endpoints` export:

```typescript
export const endpoints = {
  auth: authApi,
  tenders: tendersApi,
  workflow: workflowApi,
  hitl: hitlApi,
  company: companyApi,
  health: healthApi,
  tests: testsApi,
  realLLMTests: realLLMTestsApi,
  documents: documentsApi,      // NEW
  notifications: notificationsApi,  // NEW
};
```

---

## Backend Requirements

The following API endpoints need to be implemented on the backend:

### WebSocket
- `GET /ws/notifications?token=<jwt>` - Real-time notifications WebSocket

### Workflow
- `GET /workflow/cases/{caseId}/phases/{phase}` - Phase details
- `GET /workflow/cases/{caseId}/transitions` - Transition history
- `POST /workflow/cases/{caseId}/skip/{phase}` - Skip phase

### Documents
- `GET /documents/{tenderId}` - List documents
- `GET /documents/{tenderId}/{docId}` - Get document info
- `POST /documents/{tenderId}/upload` - Upload documents (multipart)
- `GET /documents/{tenderId}/{docId}/download` - Download single
- `POST /documents/{tenderId}/download-batch` - Download multiple as ZIP
- `DELETE /documents/{tenderId}/{docId}` - Delete document
- `GET /documents/annotations/{docId}` - List annotations
- `POST /documents/annotations/{docId}` - Add annotation
- `PUT /documents/annotations/{docId}/{annotationId}` - Update annotation
- `DELETE /documents/annotations/{docId}/{annotationId}` - Delete annotation

### Notifications
- `GET /notifications` - List notifications
- `GET /notifications/{id}` - Get notification
- `POST /notifications/mark-read` - Mark as read
- `POST /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/{id}` - Delete notification
- `DELETE /notifications` - Delete all
- `GET /notifications/preferences` - Get preferences
- `PUT /notifications/preferences` - Update preferences
- `GET /notifications/unread-count` - Get unread count

---

## Usage Examples

### Real-time Notifications Hook

```typescript
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { useAuthStore } from '@/stores/auth-store';

function NotificationCenter() {
  const { accessToken } = useAuthStore();

  const { isConnected, subscribe } = useRealtimeNotifications({
    getToken: () => accessToken,
    onHITLRequired: (event) => {
      console.log('HITL decision needed:', event.data.checkpoint);
    },
    onWorkflowUpdate: (event) => {
      console.log('Workflow update:', event.data.status);
    },
    enableSound: true,
  });

  // Custom subscription
  useEffect(() => {
    const unsubscribe = subscribe('custom_event', (event) => {
      console.log('Custom event:', event);
    });
    return unsubscribe;
  }, [subscribe]);

  return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
}
```

### Documents API

```typescript
import { documentsApi } from '@/lib/api/endpoints';

// Upload documents
const result = await documentsApi.upload(tenderId, files, 'dce');

// Download batch as ZIP
const blob = await documentsApi.downloadBatch(tenderId, ['doc1', 'doc2']);
const url = URL.createObjectURL(blob);

// Add annotation
await documentsApi.addAnnotation(docId, {
  type: 'comment',
  content: 'This requirement needs clarification',
  position: { page: 1, x: 100, y: 200 }
});
```

### Notifications API

```typescript
import { notificationsApi } from '@/lib/api/endpoints';

// Get unread notifications
const { notifications, unread_count } = await notificationsApi.list({
  unread_only: true,
  limit: 10
});

// Mark as read
await notificationsApi.markAsRead(['notif1', 'notif2']);

// Update preferences
await notificationsApi.updatePreferences({
  sound_enabled: false,
  quiet_hours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'Europe/Paris'
  }
});
```

---

## File Statistics

| File | Lines | Size |
|------|-------|------|
| `use-realtime-notifications.ts` | 463 | ~15KB |
| `endpoints.ts` | 878 | ~28KB |

---

## Notes

1. Sound files should be placed at:
   - `/public/sounds/notification-urgent.mp3`
   - `/public/sounds/notification-high.mp3`
   - `/public/sounds/notification.mp3`

2. The WebSocket URL defaults to `ws://168.231.81.53:8000` but can be configured via `NEXT_PUBLIC_WS_URL` environment variable.

3. The notification store (`notification-store.ts`) already exists and is compatible with these changes.
