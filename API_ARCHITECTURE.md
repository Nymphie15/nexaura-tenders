# Architecture API Frontend - appel-offre-automation

Documentation complète des connexions API du frontend Next.js 16 / React 19.

**Date:** 2026-01-27
**Version:** 2.0.0
**Stack:** Next.js 16, React 19, Axios, React Query, WebSocket

---

## Table des Matières

1. [Configuration & Base](#1-configuration--base)
2. [Architecture Client API](#2-architecture-client-api)
3. [Endpoints par Domaine](#3-endpoints-par-domaine)
4. [WebSocket & Temps Réel](#4-websocket--temps-réel)
5. [Hooks React Query](#5-hooks-react-query)
6. [Gestion d'Erreurs](#6-gestion-derreurs)
7. [Sécurité & Auth](#7-sécurité--auth)
8. [Performance & Cache](#8-performance--cache)
9. [Bonnes Pratiques](#9-bonnes-pratiques)

---

## 1. Configuration & Base

### Variables d'Environnement

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://168.231.81.53:8000
NEXT_PUBLIC_WS_URL=ws://168.231.81.53:8000
```

### Client Axios (`src/lib/api/client.ts`)

**Features:**
- ✅ Auto-retry (3 tentatives, exponential backoff)
- ✅ Token refresh automatique (401 → refresh → retry)
- ✅ Trace ID & Request ID (corrélation logs)
- ✅ Gestion erreurs unifiée (toasts Sonner)
- ✅ Timeout: 30s (configurable par endpoint)

```typescript
// Instance Axios configurée
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
});

// Auto-retry sur erreurs réseau/503/502
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 503 ||
    error.response?.status === 502
});
```

**Request Interceptor:**
```typescript
// Ajout automatique:
// - Authorization: Bearer <token>
// - X-Trace-Id: <session_trace_id>
// - X-Request-Id: <unique_request_id>
```

**Response Interceptor:**
```typescript
// Gestion automatique:
// - 401: Refresh token → Retry request
// - 400/422: Toast erreur validation
// - 403: Toast accès refusé
// - 429: Toast rate limit
// - 500/502/503: Toast erreur serveur
// - Network: Toast erreur réseau
```

---

## 2. Architecture Client API

### Structure des Endpoints (`src/lib/api/endpoints.ts`)

**1417 lignes** - 14 domaines d'API organisés:

```typescript
export const endpoints = {
  auth,              // Authentification
  tenders,           // Appels d'offres
  workflow,          // Workflows LangGraph
  hitl,              // Human-in-the-loop
  company,           // Profil entreprise
  health,            // Health checks
  tests,             // Tests (admin)
  realLLMTests,      // Tests LLM réels
  llmTests,          // Tests prompts directs
  documents,         // Gestion docs
  notifications,     // Notifications
  feedback,          // Feedback & Learning
  costAnalytics,     // Analytics coûts LLM
};
```

---

## 3. Endpoints par Domaine

### 3.1 Auth (`authApi`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/auth/login` | Login (email/pwd) → JWT | ❌ |
| `POST` | `/auth/register` | Inscription | ❌ |
| `GET` | `/auth/me` | Profil utilisateur | ✅ |
| `POST` | `/auth/change-password` | Changer mot de passe | ✅ |
| `POST` | `/auth/refresh` | Refresh access token | ✅ |
| `POST` | `/auth/logout` | Déconnexion | ✅ |

**Exemple:**
```typescript
import { authApi } from "@/lib/api/endpoints";

const login = async (email: string, password: string) => {
  const { access_token, refresh_token, user } = await authApi.login({
    email,
    password
  });

  localStorage.setItem("access_token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
  return user;
};
```

---

### 3.2 Tenders (`tendersApi`)

**13 endpoints** - Gestion des appels d'offres

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/tenders` | Liste tenders (filtres: status, source, domain) |
| `GET` | `/tenders/relevant` | Tenders pertinents (score relevance) |
| `GET` | `/tenders/count` | Compter tenders |
| `POST` | `/tenders/search` | Recherche (keywords, domains, CPV) |
| `POST` | `/tenders/upload` | Upload DCE (multipart/form-data) |
| `GET` | `/tenders/{id}` | Détails tender |
| `POST` | `/tenders/{id}/process` | Lancer workflow |
| `GET` | `/tenders/{id}/status` | Status traitement |
| `GET` | `/tenders/{id}/results/matching` | Résultats matching |
| `GET` | `/tenders/{id}/results/compliance` | Résultats conformité |
| `GET` | `/tenders/{id}/documents` | Liste documents |
| `GET` | `/tenders/{id}/documents/{filename}` | Download doc (blob) |

**Types:**
```typescript
interface Tender {
  id: string;
  reference: string;
  title: string;
  client: string;
  deadline?: string;
  budget?: number;
  status: "new" | "processing" | "completed" | "error";
  source: "boamp" | "ted" | "upload";
  domain?: string;
  created_at: string;
}

interface TenderWithRelevance extends Tender {
  relevance_score: number;
  relevance_details?: {
    domain_match: number;
    cpv_match: number;
    geo_match: number;
    budget_match: number;
    cert_match: number;
  };
  recommendation?: "excellent" | "bon" | "moyen" | "faible";
  matched_keywords?: string[];
}
```

**Upload DCE:**
```typescript
const uploadDCE = async (files: File[], metadata?: {
  title?: string;
  client?: string;
  deadline?: string;
}) => {
  const tender = await tendersApi.upload(files, metadata);
  // Lancer workflow automatiquement
  const { case_id } = await tendersApi.process(tender.id);
  return { tender, case_id };
};
```

---

### 3.3 Workflow (`workflowApi`)

**10 endpoints** - Gestion workflows LangGraph

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/workflow/cases` | Liste workflows (filtres: status, phase, hitl) |
| `GET` | `/workflow/cases/{caseId}` | Détails workflow |
| `GET` | `/workflow/cases/{caseId}/history` | Historique phases |
| `POST` | `/workflow/cases/{caseId}/resume` | Reprendre workflow |
| `POST` | `/workflow/cases/{caseId}/cancel` | Annuler workflow |
| `POST` | `/workflow/cases/{caseId}/retry/{phase}` | Retry phase |
| `GET` | `/workflow/stats` | Statistiques globales |
| `GET` | `/workflow/cases/{caseId}/phases/{phase}` | Détails phase |
| `GET` | `/workflow/cases/{caseId}/transitions` | Transitions workflow |
| `POST` | `/workflow/cases/{caseId}/skip/{phase}` | Skip phase |

**Types:**
```typescript
interface WorkflowState {
  case_id: string;
  reference: string;
  current_phase: WorkflowPhase;
  status: "pending" | "running" | "waiting_hitl" | "completed" | "error";
  progress: number;
  created_at: string;
  updated_at: string;
  // Phase-specific data
  requirements?: Requirement[];
  matched_products?: MatchResult[];
  risk_assessment?: RiskAssessment;
  pricing?: PricingDetails;
  documents?: GeneratedDocument[];
}

type WorkflowPhase =
  | "CREATED" | "INGESTION" | "EXTRACTION" | "MATCHING"
  | "RISK_ANALYSIS" | "STRATEGY" | "CALCULATION"
  | "GENERATION" | "VALIDATION" | "PACKAGING"
  | "ERROR";
```

---

### 3.4 HITL (`hitlApi`)

**3 endpoints** - Human-in-the-loop checkpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/workflow/hitl/pending` | Liste checkpoints en attente |
| `GET` | `/workflow/hitl/{caseId}/{checkpoint}` | Détails checkpoint |
| `POST` | `/workflow/hitl/{caseId}/{checkpoint}` | Soumettre décision |

**Checkpoints:**
- `GO_NOGO` - Décision go/no-go après risk analysis
- `STRATEGY_REVIEW` - Validation stratégie réponse
- `PRICE_REVIEW` - Validation prix
- `TECH_REVIEW` - Validation technique finale

**Types:**
```typescript
interface HITLCheckpointInfo {
  case_id: string;
  checkpoint: HITLCheckpoint;
  status: "pending" | "approved" | "rejected";
  data: {
    reference: string;
    client: string;
    // Checkpoint-specific data
    risk_score?: number;
    pricing?: PricingDetails;
    strategy?: StrategyDetails;
    validation_report?: ValidationReport;
  };
  created_at: string;
}

interface HITLDecision {
  action: "APPROVE" | "REJECT" | "MODIFY" | "RETRY";
  comment?: string;
  modifications?: Record<string, any>;
}
```

**Exemple:**
```typescript
const submitHITLDecision = async (
  caseId: string,
  checkpoint: string,
  action: "APPROVE" | "REJECT"
) => {
  await hitlApi.submitDecision(caseId, checkpoint, {
    action,
    comment: action === "REJECT" ? "Risque trop élevé" : undefined
  });
};
```

---

### 3.5 Documents (`documentsApi`)

**10 endpoints** - Gestion documents & annotations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/documents/{tenderId}` | Liste documents |
| `GET` | `/documents/{tenderId}/{docId}` | Info document |
| `POST` | `/documents/{tenderId}/upload` | Upload docs |
| `GET` | `/documents/{tenderId}/{docId}/download` | Download (blob) |
| `POST` | `/documents/{tenderId}/download-batch` | Download multiple (zip) |
| `DELETE` | `/documents/{tenderId}/{docId}` | Supprimer doc |
| `GET` | `/documents/annotations/{docId}` | Liste annotations |
| `POST` | `/documents/annotations/{docId}` | Ajouter annotation |
| `PUT` | `/documents/annotations/{docId}/{annotationId}` | MAJ annotation |
| `DELETE` | `/documents/annotations/{docId}/{annotationId}` | Supprimer annotation |

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
}

interface DocumentAnnotation {
  id: string;
  document_id: string;
  user_id: string;
  type: "highlight" | "comment" | "flag" | "requirement";
  content: string;
  position?: { page: number; x: number; y: number };
  created_at: string;
}
```

---

### 3.6 Notifications (`notificationsApi`)

**11 endpoints** - Notifications temps réel

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/notifications` | Liste notifications (pagination) |
| `GET` | `/notifications/{id}` | Détails notification |
| `POST` | `/notifications/mark-read` | Marquer lues (batch) |
| `POST` | `/notifications/mark-all-read` | Tout marquer lu |
| `DELETE` | `/notifications/{id}` | Supprimer notification |
| `DELETE` | `/notifications` | Supprimer (bulk) |
| `GET` | `/notifications/preferences` | Préférences utilisateur |
| `PUT` | `/notifications/preferences` | MAJ préférences |
| `GET` | `/notifications/unread-count` | Compteur non lues |

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
  categories: {
    hitl: boolean;
    workflow: boolean;
    tenders: boolean;
    system: boolean;
  };
  quiet_hours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;
    timezone: string;
  };
}
```

---

### 3.7 Feedback & Learning (`feedbackApi`)

**17 endpoints** - Feedback loop & apprentissage

**Real-time Inline Feedback (NEW):**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/feedback/inline` | Thumbs up/down/edit temps réel |
| `GET` | `/feedback/metrics` | Métriques temps réel |
| `GET` | `/feedback/workflow/{workflowId}` | Feedback d'un workflow |
| `GET` | `/feedback/element` | Feedback d'un élément |
| `GET` | `/feedback/learning/triggers` | Triggers apprentissage |
| `POST` | `/feedback/learning/complete` | Marquer apprentissage fait |
| `GET` | `/feedback/dashboard` | Dashboard feedback global |

**Legacy Corrections:**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/learning/feedback/quick` | Thumbs up/down legacy |
| `POST` | `/learning/corrections` | Soumettre correction |
| `POST` | `/learning/corrections/batch` | Corrections batch |
| `GET` | `/learning/corrections` | Historique corrections |
| `GET` | `/learning/stats` | Stats corrections |
| `GET` | `/learning/preferences` | Préférences apprises |
| `POST` | `/learning/train` | Trigger apprentissage |

**Types:**
```typescript
interface InlineFeedbackRequest {
  workflow_id: string;
  phase: string;
  element_id: string;
  feedback_type: "thumbs_up" | "thumbs_down" | "edit";
  original_value: string;
  corrected_value?: string; // Si edit
  metadata?: Record<string, unknown>;
}

interface RealtimeFeedbackMetrics {
  total_count: number;
  thumbs_up_count: number;
  thumbs_down_count: number;
  edit_count: number;
  approval_rate: number; // %
  negative_rate: number; // %
  edit_rate: number; // %
  trend_last_24h: number; // +/- %
  by_phase: Record<string, Record<string, number>>;
  learning_triggered: boolean;
}
```

---

### 3.8 Cost Analytics (`costAnalyticsApi`)

**8 endpoints** - Analytics coûts LLM

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/analytics/costs/report` | Rapport détaillé |
| `GET` | `/analytics/costs/budget` | Status budget |
| `GET` | `/analytics/costs/by-model` | Coûts par modèle LLM |
| `GET` | `/analytics/costs/by-phase` | Coûts par phase workflow |
| `GET` | `/analytics/costs/by-company` | Coûts par entreprise |
| `GET` | `/analytics/costs/pricing` | Table pricing |
| `GET` | `/analytics/costs/summary` | Résumé rapide |
| `POST` | `/analytics/costs/track` | Track appel LLM manuel |

**Types:**
```typescript
interface CostReportResponse {
  company_id: string | null;
  period_start: string;
  period_end: string;
  total_cost_usd: number;
  total_tokens: number;
  total_calls: number;
  avg_cost_per_call: number;
  by_model: Record<string, CostBreakdown>;
  by_phase: Record<string, CostBreakdown>;
  top_workflows: Array<{
    workflow_id: string;
    cost_usd: number;
    tokens: number;
    calls: number;
  }>;
}

interface BudgetStatusResponse {
  current_month_cost_usd: number;
  monthly_budget_usd: number;
  usage_percent: number;
  remaining_usd: number;
  projected_month_end_usd: number;
  days_elapsed: number;
  alert: {
    level: "warning" | "critical";
    message: string;
    recommendations: string[];
  } | null;
}
```

---

### 3.9 Tests (Admin) (`testsApi`, `realLLMTestsApi`, `llmTestsApi`)

**30+ endpoints** - Tests & benchmarking

**Tests Secteur:**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/tests/sectors` | Liste secteurs disponibles |
| `POST` | `/tests/run-sectors` | Lancer tests secteurs |
| `GET` | `/tests/{testId}/status` | Status test |
| `GET` | `/tests/{testId}/results` | Résultats test |
| `POST` | `/tests/{testId}/cancel` | Annuler test |
| `GET` | `/tests/history` | Historique tests |
| `GET` | `/tests/{testId}/download/{sector}` | Download docs (zip) |
| `GET` | `/tests/existing-results` | Résultats existants |

**Tests LLM Réels:**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/tests/run-real-llm` | Test workflow complet LLM |
| `GET` | `/tests/real-llm/{testId}/status` | Status test LLM |
| `GET` | `/tests/real-llm/{testId}/results` | Résultats + metrics |
| `POST` | `/tests/real-llm/{testId}/cancel` | Annuler test |

**Tests Prompts Directs:**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/tests/llm/models` | Liste modèles disponibles |
| `POST` | `/tests/llm/prompt` | Test prompt direct |
| `POST` | `/tests/llm/compare` | Comparer modèles |
| `GET` | `/tests/llm/metrics` | Métriques LLM globales |

---

### 3.10 Company (`companyApi`)

**4 endpoints** - Profil entreprise

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/company/me` | Profil entreprise utilisateur |
| `GET` | `/company/{siret}` | Profil par SIRET |
| `POST` | `/company` | Créer profil |
| `PUT` | `/company/{siret}` | MAJ profil |

---

### 3.11 Health (`healthApi`)

**3 endpoints** - Health checks

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/health` | Health simple |
| `GET` | `/health/ready` | Readiness check |
| `GET` | `/health/detailed` | Health + services |

---

## 4. WebSocket & Temps Réel

### 4.1 Assistant WebSocket

**URL:** `ws://168.231.81.53:8000/ws/assistant?token=<jwt>`

**Hook:** `useAssistantWebSocket()`

**Messages:**
```typescript
// Client → Server
{
  type: "create_conversation",
  case_id: string,
  initial_context: { case_id: string }
}

{
  type: "message",
  message: string,
  context?: Record<string, any>
}

{
  type: "ping"
}

// Server → Client
{
  type: "conversation_created",
  conversation_id: string,
  case_id: string
}

{
  type: "assistant_response",
  message: string,
  suggestions?: AssistantSuggestion[],
  confidence?: number,
  timestamp: string
}

{
  type: "typing_start" | "typing_end"
}

{
  type: "error",
  error: string
}

{
  type: "pong"
}
```

**Features:**
- ✅ Auto-reconnect (5 tentatives, 3s delay)
- ✅ Heartbeat ping/pong (30s)
- ✅ Context-aware conversations
- ✅ Typing indicators

---

### 4.2 Realtime Notifications WebSocket

**URL:** `ws://168.231.81.53:8000/ws/notifications?token=<jwt>`

**Hook:** `useRealtimeNotifications()`

**Messages:**
```typescript
// Server → Client
{
  type: "notification",
  id: string,
  priority: "low" | "medium" | "high" | "urgent",
  category: "hitl" | "workflow" | "tenders" | "system",
  title: string,
  message: string,
  link?: string,
  timestamp: string
}

{
  type: "count_update",
  unread_count: number,
  by_category: Record<string, number>
}
```

---

### 4.3 Workflow Progress WebSocket

**URL:** `ws://168.231.81.53:8000/ws/workflow/{caseId}?token=<jwt>`

**Hook:** `useWorkflowProgress(caseId)`

**Messages:**
```typescript
{
  type: "phase_start" | "phase_complete" | "phase_error",
  phase: string,
  case_id: string,
  progress: number,
  timestamp: string
}

{
  type: "hitl_required",
  checkpoint: string,
  case_id: string
}
```

---

## 5. Hooks React Query

### 5.1 Convention Hooks

Tous les hooks suivent le pattern React Query:

```typescript
// Queries (GET)
export function useTenders(params?: TendersListParams) {
  return useQuery({
    queryKey: ["tenders", params],
    queryFn: () => tendersApi.list(params),
    staleTime: 30_000, // 30s
  });
}

// Mutations (POST/PUT/DELETE)
export function useUploadTender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { files: File[]; metadata?: TenderMetadata }) =>
      tendersApi.upload(data.files, data.metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      toast.success("DCE uploadé avec succès");
    },
  });
}
```

---

### 5.2 Hooks Disponibles

**Tenders (`use-tenders.ts`):**
- `useTenders(params?)` - Liste tenders
- `useTender(id)` - Détails tender
- `useUploadTender()` - Upload DCE
- `useProcessTender()` - Lancer workflow

**Workflows (`use-workflow.ts`, `use-workflows.ts`):**
- `useWorkflows(params?)` - Liste workflows
- `useWorkflow(caseId)` - Détails workflow
- `useWorkflowHistory(caseId)` - Historique phases
- `useResumeWorkflow()` - Reprendre workflow
- `useCancelWorkflow()` - Annuler workflow

**HITL (`use-hitl.ts`):**
- `usePendingHITL()` - Liste checkpoints pending
- `useHITLCheckpoint(caseId, checkpoint)` - Détails checkpoint
- `useSubmitHITLDecision()` - Soumettre décision

**Feedback (`use-feedback.ts`):**
- `useSubmitInlineFeedback()` - Feedback temps réel
- `useFeedbackMetrics()` - Métriques feedback
- `useFeedbackDashboard()` - Dashboard feedback

**Tests (`use-tests.ts`, `use-llm-testing.ts`):**
- `useTestSectors()` - Liste secteurs
- `useStartTest()` - Lancer test secteur
- `useLLMModels()` - Liste modèles LLM
- `useTestPrompt()` - Test prompt direct

**Documents (`use-documents.ts`):**
- `useDocuments(tenderId)` - Liste documents
- `useUploadDocuments()` - Upload documents
- `useDownloadDocument()` - Download document

**Notifications (`use-notifications.ts`):**
- `useNotifications(params?)` - Liste notifications
- `useUnreadCount()` - Compteur non lues
- `useMarkAsRead()` - Marquer lues

**Analytics (`use-dashboard.ts`):**
- `useCostReport(params?)` - Rapport coûts
- `useBudgetStatus()` - Status budget
- `useCostsByModel()` - Coûts par modèle
- `useCostsByPhase()` - Coûts par phase

---

## 6. Gestion d'Erreurs

### 6.1 Error Interceptor

Toutes les erreurs API sont interceptées et affichées via **Sonner toasts**:

```typescript
// 400 - Bad Request
toast.error("Requête invalide", {
  description: "Les données envoyées sont incorrectes."
});

// 401 - Unauthorized
// → Token refresh automatique
// → Si échec: Redirect /login

// 403 - Forbidden
toast.error("Accès refusé", {
  description: "Vous n'avez pas les droits."
});

// 404 - Not Found
// → Pas de toast (géré par composants)

// 422 - Validation Error
toast.error("Erreur de validation", {
  description: "field.path : Message d'erreur"
});

// 429 - Rate Limit
toast.error("Trop de requêtes", {
  description: "Veuillez patienter 60 secondes."
});

// 500/502/503 - Server Error
toast.error("Erreur serveur", {
  description: "Nos équipes ont été notifiées."
});

// Network Error
toast.error("Erreur réseau", {
  description: "Impossible de contacter le serveur."
});
```

---

### 6.2 Error Boundaries

```typescript
// app/error.tsx - Global error boundary
// app/(dashboard)/error.tsx - Dashboard error boundary
// components/error-boundary.tsx - Component error boundary
```

---

### 6.3 Loading States

**Suspense boundaries:**
```typescript
// app/(dashboard)/loading.tsx
export default function DashboardLoading() {
  return <Skeleton />;
}
```

**React Query loading:**
```typescript
const { data, isLoading, isError, error } = useTenders();

if (isLoading) return <Spinner />;
if (isError) return <Error message={error.message} />;
```

---

## 7. Sécurité & Auth

### 7.1 Token Management

**Storage:**
```typescript
// localStorage
localStorage.setItem("access_token", token);
localStorage.setItem("refresh_token", refreshToken);
localStorage.setItem("user", JSON.stringify(user));
```

**Refresh Flow:**
```typescript
// Auto-refresh sur 401
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;

  const refreshToken = localStorage.getItem("refresh_token");
  const { access_token } = await authApi.refresh(refreshToken);

  localStorage.setItem("access_token", access_token);
  originalRequest.headers.Authorization = `Bearer ${access_token}`;

  return api(originalRequest); // Retry
}
```

---

### 7.2 Protected Routes

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");

  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
```

---

### 7.3 Request Tracing

**Trace ID:** Session-level (persiste dans `sessionStorage`)
**Request ID:** Request-level (unique par requête)

```typescript
// Ajouté automatiquement par interceptor
headers: {
  "X-Trace-Id": "abc-123-session",
  "X-Request-Id": "def-456-request"
}
```

**Usage:**
- Corrélation logs frontend ↔ backend
- Debug erreurs spécifiques
- Tracking user journey

---

## 8. Performance & Cache

### 8.1 React Query Cache

**Configuration:**
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s
      cacheTime: 5 * 60 * 1000, // 5min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Invalidation:**
```typescript
// Après mutation
queryClient.invalidateQueries({ queryKey: ["tenders"] });

// Optimistic update
queryClient.setQueryData(["tender", id], (old) => ({
  ...old,
  status: "processing"
}));
```

---

### 8.2 Axios Retry

**Config:**
- Retries: 3
- Delay: Exponential backoff (1s, 2s, 4s)
- Conditions: Network errors, 503, 502

---

### 8.3 WebSocket Reconnect

**Config:**
- Max attempts: 5
- Delay: 3s fixed
- Heartbeat: 30s

---

## 9. Bonnes Pratiques

### 9.1 Utilisation Hooks

✅ **FAIRE:**
```typescript
const { data, isLoading, error } = useTenders();

// Afficher loading
if (isLoading) return <Spinner />;

// Gérer erreur
if (error) return <Error message={error.message} />;

// Utiliser data
return <TenderList tenders={data} />;
```

❌ **NE PAS FAIRE:**
```typescript
// Appels API directs sans hooks
const tenders = await tendersApi.list(); // Pas de cache, pas de retry
```

---

### 9.2 Mutations

✅ **FAIRE:**
```typescript
const uploadMutation = useUploadTender();

const handleUpload = async (files: File[]) => {
  await uploadMutation.mutateAsync({ files });
  // Success toast automatique
};

return (
  <button
    onClick={handleUpload}
    disabled={uploadMutation.isLoading}
  >
    {uploadMutation.isLoading ? "Uploading..." : "Upload"}
  </button>
);
```

---

### 9.3 Error Handling

✅ **FAIRE:**
```typescript
// Laisser interceptor gérer les toasts globaux
// Gérer les erreurs spécifiques au composant
const { error } = useTenders();

if (error?.response?.status === 404) {
  return <EmptyState message="Aucun tender trouvé" />;
}
```

❌ **NE PAS FAIRE:**
```typescript
// Dupliquer la gestion d'erreurs
try {
  await tendersApi.list();
} catch (error) {
  toast.error("Erreur"); // Déjà géré par interceptor
}
```

---

### 9.4 Timeouts

✅ **FAIRE:**
```typescript
// Augmenter timeout pour endpoints lents
const { data } = await tendersApi.upload(files, metadata); // 120s
const { data } = await documentsApi.upload(tender_id, files); // 300s
```

---

### 9.5 WebSocket Cleanup

✅ **FAIRE:**
```typescript
useEffect(() => {
  const ws = connect();

  return () => {
    ws.close(); // Cleanup on unmount
  };
}, []);
```

---

## Résumé Architecture

**Total:** 150+ endpoints REST + 3 WebSocket

**Domaines:**
- 🔐 Auth: 6 endpoints
- 📋 Tenders: 13 endpoints
- 🔄 Workflow: 10 endpoints
- 👤 HITL: 3 endpoints
- 📄 Documents: 10 endpoints
- 🔔 Notifications: 11 endpoints
- 💬 Feedback: 17 endpoints
- 💰 Cost Analytics: 8 endpoints
- 🧪 Tests: 30+ endpoints (admin)
- 🏢 Company: 4 endpoints
- 💚 Health: 3 endpoints

**Technologies:**
- Axios (HTTP client)
- axios-retry (auto-retry)
- React Query (cache & state)
- WebSocket (temps réel)
- Sonner (toasts)

**Features:**
- ✅ Auto-retry (3x exponential)
- ✅ Token refresh auto
- ✅ Request tracing (Trace ID + Request ID)
- ✅ Error handling unifié
- ✅ WebSocket auto-reconnect
- ✅ React Query cache
- ✅ TypeScript strict

---

**Dernière mise à jour:** 2026-01-27
**Mainteneur:** Billy (billy@nexaura.fr)
