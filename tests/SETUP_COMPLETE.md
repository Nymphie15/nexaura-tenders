# Test Infrastructure Setup - Complete ✅

L'infrastructure de tests pour le frontend Next.js est maintenant complètement configurée et prête à l'emploi.

## 📦 Ce qui a été installé

Tous les packages nécessaires sont déjà installés dans `package.json`:

- ✅ `vitest` - Framework de test moderne et rapide
- ✅ `@testing-library/react` - Test de composants React
- ✅ `@testing-library/jest-dom` - Matchers DOM personnalisés
- ✅ `@testing-library/user-event` - Simulation d'interactions utilisateur
- ✅ `jsdom` - Environnement DOM pour les tests
- ✅ `@vitest/coverage-v8` - Génération de rapports de coverage
- ✅ `@vitejs/plugin-react` - Support React pour Vitest

## 📁 Fichiers créés

### Configuration

```
web-client/
├── vitest.config.ts          ✅ Configuration Vitest améliorée
├── tsconfig.test.json         ✅ Configuration TypeScript pour tests
├── .gitignore                 ✅ Mis à jour pour exclure coverage/reports
└── package.json               ✅ Scripts de test ajoutés
```

### Utilitaires de test

```
tests/
├── utils/
│   ├── test-utils.tsx         ✅ Render custom + helpers
│   ├── mock-data.ts           ✅ Données de test centralisées
│   ├── test-server.ts         ✅ Mock API avec fetch
│   ├── query-helpers.ts       ✅ Helpers React Query
│   └── index.ts               ✅ Exports centralisés
```

### Documentation

```
tests/
├── README.md                  ✅ Documentation complète
├── TESTING.md (racine)        ✅ Guide de démarrage rapide
└── SETUP_COMPLETE.md          ✅ Ce fichier
```

### Templates

```
tests/templates/
├── component.test.template.tsx  ✅ Template pour tests de composants
└── hook.test.template.tsx       ✅ Template pour tests de hooks
```

### Exemples

```
tests/unit/
├── components/
│   └── example.test.tsx       ✅ Exemples de tests de composants
└── hooks/
    └── example-query.test.tsx ✅ Exemples de tests React Query
```

### CI/CD

```
.github/workflows/
└── test.yml                   ✅ Pipeline GitHub Actions
```

## 🚀 Commandes disponibles

Nouvelles commandes npm ajoutées:

```bash
npm test                    # Mode watch (développement)
npm run test:run           # Une seule fois (CI)
npm run test:watch         # Mode watch explicite
npm run test:ui            # Interface graphique
npm run test:coverage      # Génération de coverage
npm run test:coverage:watch # Coverage en mode watch
npm run test:unit          # Seulement les tests unitaires
npm run test:e2e           # Tests end-to-end (Playwright)
npm run test:e2e:ui        # E2E avec interface
npm run test:debug         # Mode debug avec breakpoints
npm run test:typecheck     # Vérification des types
npm run test:ci            # Pour CI/CD
```

## ✨ Fonctionnalités

### 1. Test Utilities (test-utils.tsx)

- ✅ `render()` - Render automatique avec tous les providers
- ✅ `renderWithProviders()` - Render avec QueryClient custom
- ✅ `createTestQueryClient()` - QueryClient optimisé pour tests
- ✅ `mockFetchResponse()` - Mock réponses fetch
- ✅ `mockFetchError()` - Mock erreurs fetch
- ✅ `mockLocalStorage()` - Mock localStorage
- ✅ `mockSessionStorage()` - Mock sessionStorage
- ✅ `mockRouter()` - Mock Next.js router
- ✅ `createMockFile()` - Créer fichiers mock
- ✅ `flushPromises()` - Flush promises en attente
- ✅ `testDataFactories` - Factories de données
- ✅ Re-export de tous les helpers RTL

### 2. Mock Data (mock-data.ts)

- ✅ `mockUsers` - Utilisateurs (admin, user, viewer)
- ✅ `mockTenders` - Appels d'offre (open, closed, awarded)
- ✅ `mockWorkflows` - Workflows (inProgress, completed, paused, error)
- ✅ `mockCheckpoints` - Checkpoints HITL
- ✅ `mockDocuments` - Documents (DCE, specs, responses)
- ✅ `mockNotifications` - Notifications
- ✅ `mockApiResponses` - Réponses API complètes
- ✅ `mockEnv` - Variables d'environnement

### 3. Test Server (test-server.ts)

- ✅ `setupMockFetch()` - Setup fetch mock global
- ✅ `createFetchResponse()` - Créer réponse fetch
- ✅ `createFetchError()` - Créer erreur fetch
- ✅ `mockEndpoint()` - Mock un endpoint spécifique
- ✅ `mockEndpoints()` - Mock plusieurs endpoints
- ✅ `apiMockPresets` - Presets pré-configurés
- ✅ `mockApiHandlers` - Handlers pour endpoints communs

### 4. Query Helpers (query-helpers.ts)

- ✅ `waitForQueriesToSettle()` - Attendre toutes les queries
- ✅ `getQueryState()` - Obtenir état d'une query
- ✅ `expectQueryState()` - Assert sur état query
- ✅ `mockSuccessfulQuery()` - Mock query success
- ✅ `mockFailedQuery()` - Mock query error
- ✅ `mockLoadingQuery()` - Mock query loading
- ✅ `createMockQueryFn()` - Créer query function mock
- ✅ `createMockMutationFn()` - Créer mutation function mock
- ✅ `spyOnQueryClient()` - Spy sur QueryClient
- ✅ `logQueryStates()` - Debug query states

### 5. Test IDs (test-utils.tsx)

Type-safe test IDs pour éviter les erreurs:

```tsx
import { testIds } from '@/tests/utils';

// Dans le composant
<button data-testid={testIds.submitButton}>Submit</button>

// Dans le test
screen.getByTestId(testIds.submitButton);
```

## 📊 Configuration

### Vitest (vitest.config.ts)

- ✅ Environnement jsdom
- ✅ Globals activés (pas besoin d'imports)
- ✅ Setup files configurés
- ✅ Coverage V8 avec seuils
- ✅ Typecheck activé
- ✅ Alias `@/` configuré
- ✅ Isolation des tests (clearMocks, mockReset, restoreMocks)
- ✅ Threads multiples pour performance
- ✅ Reporters configurés (verbose, junit pour CI)
- ✅ Timeouts configurés (10s)

### Setup (tests/setup.ts)

Mocks globaux déjà configurés:

- ✅ `window.matchMedia`
- ✅ `IntersectionObserver`
- ✅ `ResizeObserver`
- ✅ `window.scrollTo`
- ✅ `crypto.randomUUID`
- ✅ `next/navigation` (router, pathname, params)
- ✅ `framer-motion` (désactivé en tests)

### TypeScript (tsconfig.test.json)

- ✅ Types Vitest
- ✅ Types Testing Library
- ✅ Includes tests/**
- ✅ Excludes e2e/**

### Coverage

Fichiers inclus:
- `src/lib/**/*.ts`
- `src/hooks/**/*.ts`
- `src/stores/**/*.ts`
- `src/components/premium/cards/**/*.tsx`

Seuils:
- Lines: 60%
- Functions: 60%
- Branches: 50%
- Statements: 60%

## 🎯 Prochaines étapes

1. **Écrire les premiers tests**
   ```bash
   # Copier un template
   cp tests/templates/component.test.template.tsx tests/unit/components/my-component.test.tsx

   # Adapter le template
   # Lancer les tests
   npm test
   ```

2. **Supprimer les exemples**
   ```bash
   # Une fois que vous avez écrit vos vrais tests
   rm tests/unit/components/example.test.tsx
   rm tests/unit/hooks/example-query.test.tsx
   ```

3. **Ajouter des tests pour les composants critiques**
   - Composants de formulaire
   - Composants de navigation
   - Composants premium/cards
   - Hooks personnalisés
   - Stores Zustand

4. **Configurer CI/CD**
   - Le fichier `.github/workflows/test.yml` est prêt
   - Tests s'exécuteront automatiquement sur PR/push

## 📚 Ressources

- **Documentation complète**: `tests/README.md`
- **Guide rapide**: `TESTING.md` (racine)
- **Templates**: `tests/templates/`
- **Exemples**: `tests/unit/`

## 🐛 Debugging

Si vous rencontrez des problèmes:

1. **Lire la doc**: `tests/README.md` section Troubleshooting
2. **Vérifier les mocks**: Ordre des imports, setup correct
3. **Mode UI**: `npm run test:ui` pour interface graphique
4. **Mode debug**: `npm run test:debug` pour breakpoints
5. **Logs**: Les console.log s'affichent automatiquement

## ✅ Checklist

Avant de commencer à écrire des tests, vérifier:

- [x] Packages installés (`npm install` déjà fait)
- [x] Configuration Vitest créée
- [x] Setup file créé avec mocks globaux
- [x] Utilitaires de test créés
- [x] Mock data créé
- [x] Templates disponibles
- [x] Scripts npm configurés
- [x] Documentation écrite
- [x] Exemples fournis
- [x] CI/CD configuré

**Tout est prêt! Vous pouvez commencer à écrire des tests.** 🎉

## 💡 Conseils

1. **Commencer petit**: Testez d'abord les composants simples
2. **Utiliser les templates**: Copiez et adaptez les templates
3. **Utiliser les exemples**: Référez-vous aux exemples pour la syntaxe
4. **Tester le comportement**: Pas l'implémentation
5. **Utiliser queries accessibles**: getByRole, getByLabelText
6. **Attendre les updates async**: toujours utiliser waitFor
7. **Mode watch**: Gardez les tests en mode watch pendant le dev

---

**Setup créé le**: 2026-01-25
**Statut**: ✅ Complet et prêt à l'emploi

Pour toute question, consultez `tests/README.md` ou `TESTING.md`.
