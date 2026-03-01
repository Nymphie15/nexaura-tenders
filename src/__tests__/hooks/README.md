# Tests des Hooks React

Tests unitaires complets pour les hooks personnalisés de l'application.

## Structure

```
src/__tests__/hooks/
├── use-tenders.test.ts          # Tests pour la gestion des appels d'offres
├── use-auth.test.ts             # Tests pour l'authentification
├── use-notifications.test.ts    # Tests pour les notifications
├── use-workflow.test.ts         # Tests pour les requêtes workflow
├── use-workflow-progress.test.ts # Tests pour la progression WebSocket
├── use-workflow-actions.test.ts # Tests pour les actions workflow
└── README.md                    # Ce fichier
```

## Coverage

### use-tenders.test.ts

Teste tous les hooks liés aux appels d'offres:

- ✅ `useTenders` - Liste des tenders avec filtres
- ✅ `useTendersCount` - Comptage des tenders
- ✅ `useRelevantTenders` - Tenders pertinents avec auto-refetch
- ✅ `useTender` - Détails d'un tender
- ✅ `useTenderDocuments` - Documents d'un tender
- ✅ `useSearchTenders` - Recherche de tenders
- ✅ `useUploadDCE` - Upload de fichiers DCE
- ✅ `useProcessTender` - Lancement du traitement
- ✅ `useTenderStatus` - Statut avec polling
- ✅ `useDownloadDocument` - Téléchargement de documents
- ✅ `useTenderMatchingResults` - Résultats de matching
- ✅ `useTenderComplianceResults` - Résultats de compliance

**Tests couverts:**
- ✅ Loading states
- ✅ Success states
- ✅ Error handling
- ✅ Query parameters
- ✅ Polling intervals
- ✅ Query invalidation
- ✅ Mutation callbacks
- ✅ Blob download simulation

### use-auth.test.ts

Teste le store d'authentification (Zustand):

- ✅ `login` - Connexion utilisateur
- ✅ `register` - Inscription utilisateur
- ✅ `logout` - Déconnexion
- ✅ `refreshAccessToken` - Rafraîchissement du token
- ✅ `checkAuth` - Vérification d'authentification
- ✅ `setUser` - Mise à jour utilisateur
- ✅ Persistence localStorage

**Tests couverts:**
- ✅ Login success/error
- ✅ Register success/error
- ✅ Logout cleanup
- ✅ Token refresh
- ✅ Auto-logout on refresh failure
- ✅ Auth check optimization
- ✅ LocalStorage synchronization
- ✅ Loading states
- ✅ Zustand persistence

### use-notifications.test.ts

Teste la gestion des notifications:

- ✅ `useNotifications` - Hook principal
- ✅ `useHITLNotifications` - Notifications HITL uniquement
- ✅ `useWorkflowNotifications` - Notifications par workflow

**Tests couverts:**
- ✅ Initialization
- ✅ Actions (markAsRead, markAllAsRead, remove, clearAll)
- ✅ Grouping by priority (urgent, high, normal)
- ✅ Grouping by workflow
- ✅ HITL actions (approve, reject)
- ✅ Push notification permissions
- ✅ Push subscription
- ✅ Filters (type, priority, workflow)
- ✅ WebSocket integration
- ✅ Service worker integration

### use-workflow.test.ts

Teste les requêtes workflow (react-query):

- ✅ `useWorkflow` - Workflow par case ID
- ✅ `useWorkflowHistory` - Historique des phases
- ✅ `useWorkflowTransitions` - Transitions de phases
- ✅ `useWorkflowPhaseDetails` - Détails d'une phase
- ✅ `useWorkflows` - Liste de tous les workflows
- ✅ `useWorkflowStats` - Statistiques
- ✅ `useWorkflowLive` - Polling temps réel

**Tests couverts:**
- ✅ Query keys consistency
- ✅ Enabled/disabled queries
- ✅ Stale time configuration
- ✅ Refetch intervals
- ✅ Error handling
- ✅ Loading states
- ✅ Data transformation
- ✅ Filter parameters

### use-workflow-progress.test.ts

Teste la progression WebSocket:

- ✅ `useWorkflowProgress` - Hook WebSocket principal

**Tests couverts:**
- ✅ WebSocket connection
- ✅ Auto-connect
- ✅ Disconnect on unmount
- ✅ Subscribe to case
- ✅ Progress messages
- ✅ Phase complete messages
- ✅ HITL required messages
- ✅ Completion messages
- ✅ Error messages
- ✅ Computed values (currentPhase, completedPhases, totalDuration)
- ✅ Timeline data transformation
- ✅ Status flags (isRunning, isWaitingHITL, isCompleted, isFailed)
- ✅ Reconnection logic
- ✅ Max reconnect attempts
- ✅ Helper functions (getPhaseData, hasPhaseErrors)

### use-workflow-actions.test.ts

Teste les mutations workflow:

- ✅ `startPhase` - Démarrage d'une phase
- ✅ `pausePhase` - Pause d'une phase
- ✅ `resume` - Reprise du workflow
- ✅ `cancel` - Annulation du workflow
- ✅ `retryPhase` - Relance d'une phase
- ✅ `skipPhase` - Ignorer une phase

**Tests couverts:**
- ✅ Success mutations
- ✅ Error handling
- ✅ Loading states
- ✅ Combined states (isLoading, currentAction)
- ✅ Toast notifications
- ✅ onSuccess callbacks
- ✅ onError callbacks
- ✅ Reset functions
- ✅ Optimistic updates
- ✅ Query invalidation
- ✅ Case ID validation

## Lancer les Tests

### Tous les tests
```bash
npm test
```

### Tests des hooks uniquement
```bash
npm test hooks
```

### Un fichier spécifique
```bash
npm test use-tenders
```

### Avec coverage
```bash
npm run test:coverage
```

### En mode watch
```bash
npm test -- --watch
```

## Conventions de Test

### Structure d'un test

```typescript
describe('hookName', () => {
  beforeEach(() => {
    // Setup mocks
    vi.clearAllMocks();
  });

  describe('feature', () => {
    it('devrait faire quelque chose', async () => {
      // Arrange
      const mockData = { ... };
      vi.mocked(api.method).mockResolvedValue(mockData);

      // Act
      const { result } = renderHook(() => useHook(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
    });
  });
});
```

### Mocks

- API endpoints: `vi.mock('@/lib/api/endpoints')`
- React Query: Wrapper avec QueryClientProvider
- Toast: `vi.mock('sonner')`
- LocalStorage: Mock personnalisé
- WebSocket: Mock class personnalisée

### Assertions

- Loading states: `expect(result.current.isLoading).toBe(true)`
- Success: `await waitFor(() => expect(result.current.isSuccess).toBe(true))`
- Error: `await waitFor(() => expect(result.current.isError).toBe(true))`
- Data: `expect(result.current.data).toEqual(expectedData)`
- Calls: `expect(apiMethod).toHaveBeenCalledWith(params)`

## Dépendances de Test

```json
{
  "@testing-library/react": "^16.3.2",
  "@testing-library/jest-dom": "^6.9.1",
  "@vitejs/plugin-react": "^5.1.2",
  "vitest": "^4.0.17",
  "jsdom": "^27.4.0"
}
```

## Configuration Vitest

Voir `vitest.config.ts`:

```typescript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./tests/setup.ts'],
  include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
}
```

## Mocking Best Practices

### 1. Mock au niveau du module

```typescript
vi.mock('@/lib/api/endpoints', () => ({
  tendersApi: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));
```

### 2. Reset mocks dans beforeEach

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 3. Mock des valeurs de retour

```typescript
vi.mocked(tendersApi.list).mockResolvedValue([mockTender]);
vi.mocked(tendersApi.get).mockRejectedValue(new Error('Not found'));
```

### 4. Wrapper React Query

```typescript
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

## Hooks de Test Utiles

### renderHook
```typescript
const { result } = renderHook(() => useHook(), {
  wrapper: createWrapper(),
});
```

### waitFor
```typescript
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});
```

### act
```typescript
act(() => {
  result.current.mutate(data);
});
```

## Troubleshooting

### "Cannot access X before initialization"

Vérifier que le mock est défini avant l'import:

```typescript
vi.mock('@/lib/api/endpoints', () => ({ ... }));
import { useHook } from '@/hooks/use-hook';
```

### "Query failed with error"

Désactiver les retries dans QueryClient:

```typescript
new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});
```

### "WebSocket is not defined"

Créer un mock WebSocket:

```typescript
class MockWebSocket {
  constructor(public url: string) {}
  close() {}
  send(data: string) {}
}
global.WebSocket = MockWebSocket as any;
```

## Métriques de Coverage

Pour voir le coverage détaillé:

```bash
npm run test:coverage
```

Ouvrir `coverage/index.html` dans un navigateur.

**Objectifs de coverage:**
- Lines: 80%+
- Functions: 80%+
- Branches: 70%+
- Statements: 80%+

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [TanStack Query Testing](https://tanstack.com/query/latest/docs/react/guides/testing)
- [Testing Zustand Stores](https://docs.pmnd.rs/zustand/guides/testing)

---

**Dernière mise à jour:** 2026-01-25
