# Test Infrastructure Documentation

Infrastructure de tests pour le frontend Next.js du projet appel-offre-automation.

## Stack de Tests

- **Framework**: Vitest (rapide, compatible avec Vite)
- **Testing Library**: React Testing Library
- **DOM Matchers**: @testing-library/jest-dom
- **Environment**: jsdom

## Structure des Dossiers

```
tests/
├── unit/                 # Tests unitaires
│   ├── components/       # Tests de composants React
│   ├── hooks/           # Tests de hooks personnalisés
│   └── lib/             # Tests de fonctions utilitaires
├── e2e/                 # Tests end-to-end (Playwright)
├── utils/               # Utilitaires de tests
│   ├── test-utils.tsx   # Render custom + helpers
│   ├── mock-data.ts     # Données de test centralisées
│   ├── test-server.ts   # Mock API avec fetch
│   └── index.ts         # Point d'entrée
└── setup.ts             # Configuration globale Vitest
```

## Commandes

```bash
# Lancer tous les tests
npm test

# Mode watch
npm test -- --watch

# Avec coverage
npm run test:coverage

# Un fichier spécifique
npm test tests/unit/components/example.test.tsx

# Mode UI (interface graphique)
npm test -- --ui

# Mode debug
npm test -- --inspect-brk
```

## Utilisation

### Import des Utilitaires

```tsx
import {
  render,                    // Render avec providers
  screen,                    // Queries RTL
  waitFor,                   // Attendre conditions async
  userEvent,                 // Simuler interactions utilisateur
  mockFetchResponse,         // Mock fetch response
  mockLocalStorage,          // Mock localStorage
  testDataFactories,         // Factories de données
  setupMockFetch,           // Setup fetch mock
  mockApiHandlers,          // Handlers API prédéfinis
  testIds,                   // Test IDs type-safe
} from '../utils';
```

### Test Simple

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils';
import { MyComponent } from '@/components/my-component';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Hello" />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Test avec Providers

```tsx
import { renderWithProviders, createTestQueryClient } from '../utils';

it('should work with QueryClient', () => {
  const queryClient = createTestQueryClient();

  renderWithProviders(<MyComponent />, { queryClient });

  // Component a accès à QueryClient
});
```

### Test avec API Mock

```tsx
import { setupMockFetch, mockApiHandlers } from '../utils';

beforeEach(() => {
  setupMockFetch();
});

it('should fetch data', async () => {
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
  mockFetch.mockImplementation(() => mockApiHandlers.getTenders());

  const response = await fetch('/api/v1/tenders');
  const data = await response.json();

  expect(data.data).toBeInstanceOf(Array);
});
```

### Test avec Interactions Utilisateur

```tsx
import { userEvent } from '../utils';

it('should handle user click', async () => {
  const handleClick = vi.fn();
  const user = userEvent.setup();

  render(<button onClick={handleClick}>Click</button>);

  await user.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Test avec Mock Data

```tsx
import { testDataFactories, mockTenders } from '../utils';

it('should use mock data', () => {
  // Factory avec overrides
  const user = testDataFactories.user({ email: 'custom@test.com' });

  // Données complètes pré-définies
  const tender = mockTenders.open;

  expect(user.email).toBe('custom@test.com');
  expect(tender.status).toBe('open');
});
```

### Test avec localStorage

```tsx
import { mockLocalStorage } from '../utils';

beforeEach(() => {
  mockLocalStorage();
});

it('should use localStorage', () => {
  localStorage.setItem('token', 'abc123');

  expect(localStorage.getItem('token')).toBe('abc123');
});
```

## Mocks Globaux

Configurés automatiquement dans `setup.ts`:

- `window.matchMedia` - Pour les media queries
- `IntersectionObserver` - Pour les observateurs d'intersection
- `ResizeObserver` - Pour les observateurs de redimensionnement
- `window.scrollTo` - Pour le scroll
- `crypto.randomUUID` - Pour les IDs
- `next/navigation` - Router, pathname, params, etc.
- `framer-motion` - Motion components (désactivés en tests)

## Test IDs Type-Safe

```tsx
import { testIds } from '../utils';

// Dans le composant
<button data-testid={testIds.submitButton}>Submit</button>

// Dans le test
const button = screen.getByTestId(testIds.submitButton);
```

## Mock Data Disponibles

### Users
- `mockUsers.admin` - Utilisateur admin
- `mockUsers.user` - Utilisateur normal
- `mockUsers.viewer` - Utilisateur viewer

### Tenders
- `mockTenders.open` - Appel d'offre ouvert
- `mockTenders.closed` - Appel d'offre fermé
- `mockTenders.awarded` - Appel d'offre attribué

### Workflows
- `mockWorkflows.inProgress` - Workflow en cours
- `mockWorkflows.completed` - Workflow terminé
- `mockWorkflows.paused` - Workflow en pause
- `mockWorkflows.error` - Workflow en erreur

### Checkpoints
- `mockCheckpoints.goNoGo` - Checkpoint GO/NOGO
- `mockCheckpoints.strategyReview` - Revue stratégie
- `mockCheckpoints.priceReview` - Revue prix

### Documents
- `mockDocuments.dce` - Document DCE
- `mockDocuments.technicalSpec` - Spécifications techniques
- `mockDocuments.response` - Réponse générée

## API Mock Presets

```tsx
import { apiMockPresets } from '../utils';

// Toutes les API fonctionnent
apiMockPresets.allSuccess();

// Auth échoue
apiMockPresets.authFailed();

// Erreur réseau
apiMockPresets.networkError();

// Réponses lentes (pour tests de loading)
apiMockPresets.slowResponses(1000); // 1 seconde
```

## Bonnes Pratiques

### 1. Nommer les tests clairement

```tsx
// ✅ BON
it('should display error message when login fails', () => {});

// ❌ MAUVAIS
it('test login', () => {});
```

### 2. Utiliser les queries sémantiques

```tsx
// ✅ BON - Par rôle (accessible)
screen.getByRole('button', { name: /submit/i });

// ✅ BON - Par label (accessible)
screen.getByLabelText(/email/i);

// ⚠️ À ÉVITER - Par test ID (non sémantique)
screen.getByTestId('submit-button');
```

### 3. Tester le comportement, pas l'implémentation

```tsx
// ✅ BON - Teste ce que l'utilisateur voit
expect(screen.getByText('Success!')).toBeInTheDocument();

// ❌ MAUVAIS - Teste les détails d'implémentation
expect(component.state.isSuccess).toBe(true);
```

### 4. Nettoyer après chaque test

```tsx
// Automatique avec afterEach(cleanup) dans setup.ts
// Pas besoin de cleanup manuel
```

### 5. Utiliser userEvent au lieu de fireEvent

```tsx
// ✅ BON - Plus proche du comportement utilisateur
const user = userEvent.setup();
await user.click(button);

// ❌ MAUVAIS - Trop bas niveau
fireEvent.click(button);
```

### 6. Attendre les mises à jour async

```tsx
// ✅ BON
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// ❌ MAUVAIS - Ne fonctionne pas avec async
expect(screen.getByText('Loaded')).toBeInTheDocument();
```

## Coverage

Seuils configurés dans `vitest.config.ts`:

- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 50%
- **Statements**: 60%

Fichiers inclus dans le coverage:
- `src/lib/**/*.ts`
- `src/hooks/**/*.ts`
- `src/stores/**/*.ts`
- `src/components/premium/cards/**/*.tsx`

Exclusions:
- Fichiers `.d.ts`
- Fichiers `.stories.tsx`
- Fichiers `index.ts`

## Debugging

### Mode UI

```bash
npm test -- --ui
```

Ouvre une interface graphique pour visualiser et debugger les tests.

### Console Logs

Les console.logs dans les tests s'affichent normalement. Pour les supprimer:

```tsx
// Dans setup.ts (déjà commenté)
vi.spyOn(console, 'error').mockImplementation(() => {});
```

### Breakpoints

```bash
npm test -- --inspect-brk
```

Puis ouvrir Chrome DevTools avec `chrome://inspect`.

## Ressources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Troubleshooting

### "Cannot find module '@/...'"

Vérifier que `vitest.config.ts` a l'alias configuré:

```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### "window is not defined"

Vérifier que `vitest.config.ts` a:

```ts
test: {
  environment: 'jsdom',
}
```

### Tests lents

Utiliser `.only` pour isoler:

```tsx
it.only('should test this one', () => {});
```

### Mocks ne fonctionnent pas

Vérifier l'ordre des imports - les mocks doivent être avant les imports du composant:

```tsx
// ✅ BON
vi.mock('@/lib/api');
import { MyComponent } from '@/components/my-component';

// ❌ MAUVAIS
import { MyComponent } from '@/components/my-component';
vi.mock('@/lib/api');
```

---

**Documentation créée le**: 2026-01-25
**Dernière mise à jour**: 2026-01-25
