# Tests Unitaires - API Client

Ce répertoire contient les tests unitaires pour le client API et les endpoints.

## Structure

```
src/__tests__/
├── lib/
│   └── api/
│       ├── client.test.ts      # Tests du client axios (intercepteurs, retry, erreurs)
│       └── endpoints.test.ts   # Tests de tous les endpoints API
└── setup.ts                    # Configuration globale des tests
```

## Exécution des Tests

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode watch
npm test -- --watch

# Exécuter les tests avec couverture
npm run test:coverage

# Exécuter uniquement les tests API
npm test -- src/__tests__/lib/api
```

## Couverture des Tests

### client.test.ts

Tests du client axios (`src/lib/api/client.ts`):

**Configuration:**
- ✅ Instance axios avec base URL, timeout, headers

**Intercepteur de Requête:**
- ✅ Ajout du header Authorization avec token
- ✅ Pas de header Authorization si pas de token
- ✅ Génération et ajout du X-Trace-Id
- ✅ Réutilisation du X-Trace-Id existant
- ✅ Génération unique du X-Request-Id par requête

**Intercepteur de Réponse - Gestion d'Erreurs:**
- ✅ 400 Bad Request avec toast
- ✅ 401 Unauthorized avec refresh token automatique
- ✅ 401 avec échec du refresh et redirection login
- ✅ 401 sans retry multiple (flag _retry)
- ✅ 403 Forbidden avec toast
- ✅ 404 Not Found sans toast (géré par composants)
- ✅ 422 Validation Error avec array d'erreurs
- ✅ 422 Validation Error avec string
- ✅ 429 Too Many Requests avec retry-after
- ✅ 500 Server Error avec toast
- ✅ 502 Bad Gateway avec toast
- ✅ 503 Service Unavailable avec toast
- ✅ Erreurs réseau (pas de response)
- ✅ Timeout (ECONNABORTED)
- ✅ Status codes inconnus
- ✅ Logging des erreurs avec trace ID

**Réponses Réussies:**
- ✅ Passage transparent des réponses 2xx

### endpoints.test.ts

Tests de tous les endpoints API (`src/lib/api/endpoints.ts`):

**authApi (6 endpoints):**
- ✅ login() - POST /auth/login
- ✅ register() - POST /auth/register
- ✅ me() - GET /auth/me
- ✅ changePassword() - POST /auth/change-password
- ✅ refresh() - POST /auth/refresh
- ✅ logout() - POST /auth/logout

**tendersApi (11 endpoints):**
- ✅ list() - GET /tenders avec params
- ✅ listRelevant() - GET /tenders/relevant
- ✅ count() - GET /tenders/count
- ✅ search() - POST /tenders/search
- ✅ upload() - POST /tenders/upload (FormData)
- ✅ get() - GET /tenders/:id
- ✅ process() - POST /tenders/:id/process
- ✅ getStatus() - GET /tenders/:id/status
- ✅ getMatchingResults() - GET /tenders/:id/results/matching
- ✅ getComplianceResults() - GET /tenders/:id/results/compliance
- ✅ listDocuments() - GET /tenders/:id/documents
- ✅ downloadDocument() - GET /tenders/:id/documents/:filename (blob)

**workflowApi (10 endpoints):**
- ✅ listCases() - GET /workflow/cases
- ✅ getCase() - GET /workflow/cases/:id
- ✅ getCaseHistory() - GET /workflow/cases/:id/history
- ✅ resumeCase() - POST /workflow/cases/:id/resume
- ✅ cancelCase() - POST /workflow/cases/:id/cancel
- ✅ retryPhase() - POST /workflow/cases/:id/retry/:phase
- ✅ getStats() - GET /workflow/stats
- ✅ getPhaseDetails() - GET /workflow/cases/:id/phases/:phase
- ✅ getTransitions() - GET /workflow/cases/:id/transitions
- ✅ skipPhase() - POST /workflow/cases/:id/skip/:phase

**hitlApi (3 endpoints):**
- ✅ getPending() - GET /workflow/hitl/pending
- ✅ getCheckpoint() - GET /workflow/hitl/:caseId/:checkpoint
- ✅ submitDecision() - POST /workflow/hitl/:caseId/:checkpoint

**companyApi (4 endpoints):**
- ✅ get() - GET /company/me
- ✅ update() - PUT /company/:siret
- ✅ getBySiret() - GET /company/:siret
- ✅ create() - POST /company

**healthApi (3 endpoints):**
- ✅ check() - GET /health
- ✅ ready() - GET /health/ready
- ✅ detailed() - GET /health/detailed

**feedbackApi (3 endpoints):**
- ✅ submitInlineFeedback() - POST /feedback/inline
- ✅ getRealtimeMetrics() - GET /feedback/metrics
- ✅ submitCorrection() - POST /learning/corrections

**costAnalyticsApi (3 endpoints):**
- ✅ getReport() - GET /analytics/costs/report
- ✅ getBudgetStatus() - GET /analytics/costs/budget
- ✅ trackCall() - POST /analytics/costs/track

**Gestion d'Erreurs:**
- ✅ Propagation des erreurs réseau
- ✅ Propagation des erreurs API

**Formatage des Requêtes:**
- ✅ FormData pour uploads de fichiers
- ✅ Query params correctement formatés
- ✅ responseType: 'blob' pour téléchargements
- ✅ Timeout augmenté pour gros uploads (300s)
- ✅ Timeout augmenté pour tests LLM (120s)

**Transformation des Réponses:**
- ✅ Extraction directe de response.data
- ✅ Gestion des réponses void
- ✅ Gestion des réponses Blob
- ✅ Gestion des réponses Array

## Statistiques de Couverture

**Total:** 64 tests (tous passent ✅)

- **client.test.ts:** 23 tests
- **endpoints.test.ts:** 41 tests

**Endpoints couverts:** 33/33 (100%)
**Modules couverts:** 8/8 (authApi, tendersApi, workflowApi, hitlApi, companyApi, healthApi, feedbackApi, costAnalyticsApi)

**Scénarios testés:**
- ✅ Requêtes réussies
- ✅ Gestion d'erreurs HTTP (400, 401, 403, 404, 422, 429, 500, 502, 503)
- ✅ Erreurs réseau
- ✅ Timeouts
- ✅ Refresh token automatique
- ✅ FormData pour uploads
- ✅ Blob downloads
- ✅ Query parameters
- ✅ Headers (Authorization, X-Trace-Id, X-Request-Id)
- ✅ Response transformation

## Technologies

- **Framework:** Vitest
- **Test Utils:** @testing-library/react, @testing-library/jest-dom
- **Mocking:** vi.mock(), vi.fn()
- **Environment:** jsdom

## Bonnes Pratiques

1. **Isolation:** Chaque test est isolé avec `beforeEach()` et `afterEach()`
2. **Mocks:** Tous les modules externes sont mockés (axios, sonner)
3. **Assertions:** Utilisation de `expect()` pour vérifier les comportements
4. **Coverage:** Tests exhaustifs de tous les cas (success, error, edge cases)
5. **Type Safety:** TypeScript pour garantir la cohérence avec les types réels

## Commandes Utiles

```bash
# Tests en mode watch (redémarre automatiquement)
npm test -- --watch

# Tests avec UI interactive
npm test -- --ui

# Couverture détaillée par fichier
npm run test:coverage

# Tester un seul fichier
npm test -- client.test.ts

# Mode debug
npm test -- --inspect-brk
```

## Ajout de Nouveaux Tests

Pour ajouter des tests pour un nouvel endpoint:

1. Ajouter le test dans `endpoints.test.ts`:

```typescript
describe("newApi", () => {
  it("should call endpoint correctly", async () => {
    const mockResponse = { data: "test" };
    mockApi.get.mockResolvedValueOnce({ data: mockResponse });

    const result = await newApi.someMethod();

    expect(mockApi.get).toHaveBeenCalledWith("/path/to/endpoint");
    expect(result).toEqual(mockResponse);
  });
});
```

2. Tester les cas d'erreur:

```typescript
it("should handle errors", async () => {
  const error = { response: { status: 500 } };
  mockApi.get.mockRejectedValueOnce(error);

  await expect(newApi.someMethod()).rejects.toEqual(error);
});
```

3. Exécuter les tests et vérifier la couverture:

```bash
npm run test:coverage
```

## Maintenance

- Mettre à jour les tests lors de modifications de l'API
- Maintenir la couverture > 80% pour les fichiers critiques
- Ajouter des tests pour chaque nouveau endpoint
- Vérifier que tous les cas d'erreur sont testés

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
