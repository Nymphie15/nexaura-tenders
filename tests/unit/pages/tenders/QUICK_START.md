# Guide de Démarrage Rapide - Tests Tenders

## Installation

Aucune installation supplémentaire nécessaire. Les dépendances de test sont déjà installées dans le projet principal.

## Exécution Rapide

### Tous les tests
```bash
npm test -- tenders
```

### Un fichier spécifique
```bash
npm test -- tenders-list.test.tsx
npm test -- tender-detail.test.tsx
npm test -- tenders-loading.test.tsx
npm test -- tenders-error.test.tsx
```

### Avec couverture
```bash
npm run test:coverage -- tenders
```

### Mode watch (développement)
```bash
npm test -- tenders --watch
```

## Structure des Tests

```
tenders/
├── README.md                    # Documentation complète
├── QUICK_START.md              # Ce fichier
├── fixtures.ts                 # Données de test
├── test-helpers.ts             # Utilitaires de test
├── tenders-list.test.tsx       # Tests page liste
├── tender-detail.test.tsx      # Tests page détail
├── tenders-loading.test.tsx    # Tests loading
└── tenders-error.test.tsx      # Tests erreur
```

## Commandes Utiles

### Exécuter un test spécifique
```bash
npm test -- tenders -t "affiche le titre du tender"
```

### Mode debug
```bash
npm test -- tenders --inspect-brk
```

### Mode UI (interface graphique)
```bash
npm test -- tenders --ui
```

### Reporter verbeux
```bash
npm test -- tenders --reporter=verbose
```

### Sans couverture (plus rapide)
```bash
npm test -- tenders --no-coverage
```

## Écrire un Nouveau Test

### 1. Utiliser les fixtures
```typescript
import { mockTenders, mockTenderDetail } from './fixtures';
```

### 2. Utiliser les helpers
```typescript
import { renderWithQueryClient, mockTenderHooks } from './test-helpers';

// Mock tous les hooks en une fois
mockTenderHooks({
  tenders: mockTenders,
  count: 3,
});

// Render avec QueryClient
renderWithQueryClient(<TendersPage />);
```

### 3. Tester les interactions
```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
const button = screen.getByRole('button', { name: /Réessayer/i });
await user.click(button);
```

### 4. Attendre les résultats
```typescript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

## Patterns Courants

### Test de chargement
```typescript
it('affiche le skeleton pendant le chargement', () => {
  mockTenderHooks({ isLoading: true });
  renderWithQueryClient(<TendersPage />);

  expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0);
});
```

### Test d'erreur
```typescript
it('affiche une erreur', async () => {
  mockTenderHooks({
    error: new Error('Network error'),
    tenders: []
  });

  renderWithQueryClient(<TendersPage />);

  await waitFor(() => {
    expect(screen.getByText(/erreur/i)).toBeInTheDocument();
  });
});
```

### Test de mutation
```typescript
it('lance le traitement', async () => {
  const mockMutate = vi.fn().mockResolvedValue({});

  const { useProcessTender } = vi.mocked(require('@/hooks/use-tenders'));
  useProcessTender.mockReturnValue({
    mutateAsync: mockMutate,
    isPending: false
  });

  renderWithQueryClient(<TendersPage />);

  const button = await screen.findByText('Lancer le traitement');
  await user.click(button);

  expect(mockMutate).toHaveBeenCalledWith({ id: '1' });
});
```

### Test de filtrage
```typescript
it('filtre les résultats', async () => {
  mockTenderHooks({ tenders: mockTenders });
  renderWithQueryClient(<TendersPage />);

  const searchInput = screen.getByPlaceholderText(/Rechercher/i);
  await user.type(searchInput, 'informatique');

  await waitFor(() => {
    expect(screen.getByText('Fourniture de matériel informatique')).toBeInTheDocument();
    expect(screen.queryByText('Maintenance des espaces verts')).not.toBeInTheDocument();
  });
});
```

## Debugging

### Console.log dans les tests
```typescript
import { screen, debug } from '@testing-library/react';

// Afficher le DOM complet
debug();

// Afficher un élément spécifique
debug(screen.getByRole('button'));
```

### Breakpoint
```typescript
// Ajouter debugger dans votre test
it('test', () => {
  debugger; // Le test s'arrêtera ici si lancé avec --inspect-brk
  expect(true).toBe(true);
});
```

### Voir les queries disponibles
```typescript
import { screen } from '@testing-library/react';

// Si un élément n'est pas trouvé, Testing Library suggère des queries
screen.getByText('Texte inexistant'); // Affichera les queries disponibles
```

## Bonnes Pratiques

### ✅ À FAIRE
- Utiliser `screen.getByRole()` en priorité (meilleure accessibilité)
- Utiliser `userEvent` au lieu de `fireEvent`
- Attendre avec `waitFor()` pour les opérations asynchrones
- Mocker au niveau des hooks, pas au niveau de l'API
- Nettoyer les mocks avec `beforeEach(() => vi.clearAllMocks())`
- Tester le comportement utilisateur, pas l'implémentation

### ❌ À ÉVITER
- Ne pas tester les détails d'implémentation
- Ne pas utiliser `querySelector` (préférer les queries de Testing Library)
- Ne pas oublier d'attendre les opérations async
- Ne pas mocker Next.js Image (utiliser le mock global dans setup.ts)
- Ne pas tester les styles CSS (utiliser les tests visuels pour ça)

## Résolution de Problèmes

### "Cannot find module"
```bash
# Vérifier que vous êtes à la racine du projet
cd /path/to/web-client
npm test
```

### "Act warning"
```typescript
// Utiliser waitFor pour les mises à jour d'état
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### "Query failed"
```typescript
// Utiliser queryBy* pour les éléments qui peuvent ne pas exister
expect(screen.queryByText('Optional')).not.toBeInTheDocument();

// Utiliser findBy* pour les éléments qui apparaissent après un délai
const element = await screen.findByText('Async');
```

### Tests lents
```bash
# Désactiver la couverture
npm test -- tenders --no-coverage

# Exécuter en parallèle
npm test -- tenders --pool=threads
```

## CI/CD

Les tests sont automatiquement exécutés dans la CI lors des pull requests et des pushs vers main.

Configuration GitHub Actions:
```yaml
- name: Run Tenders Tests
  run: npm test -- tests/unit/pages/tenders --coverage
```

## Métriques de Couverture

Objectifs:
- **Lines**: 80%+
- **Functions**: 75%+
- **Branches**: 70%+
- **Statements**: 80%+

Voir le rapport de couverture:
```bash
npm run test:coverage -- tenders
open coverage/index.html
```

## Ressources

- [Documentation complète](./README.md)
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

## Support

Pour toute question ou problème:
1. Consulter le [README.md](./README.md)
2. Consulter les tests existants pour des exemples
3. Vérifier la documentation de Testing Library
4. Créer une issue sur le repo
