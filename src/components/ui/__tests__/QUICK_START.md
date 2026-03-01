# Tests UI - Quick Start

Guide de démarrage rapide pour les tests de composants UI.

## Installation

Les dépendances sont déjà installées. Si besoin:

```bash
npm install
```

## Exécuter les Tests

### Tous les tests UI

```bash
npm run test:ui-components
```

**Résultat attendu:**
```
✓ src/components/ui/__tests__/button.test.tsx (39 tests)
✓ src/components/ui/__tests__/input.test.tsx (61 tests)
✓ src/components/ui/__tests__/card.test.tsx (37 tests)
✓ src/components/ui/__tests__/badge.test.tsx (28 tests)
✓ src/components/ui/__tests__/dialog.test.tsx (27 tests)

Test Files  5 passed (5)
     Tests  192 passed (192)
```

### Mode Watch (Développement)

```bash
npm run test:ui-components:watch
```

Relance automatiquement les tests à chaque modification.

### Test Spécifique

```bash
# Un seul composant
npm test button.test.tsx

# Tous les tests
npm test
```

### Avec Coverage

```bash
npm run test:ui-components:coverage
```

Génère un rapport dans `coverage/index.html`.

## Structure des Tests

Chaque fichier de test suit cette structure:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  describe('Rendering', () => {
    it('renders correctly', () => {
      render(<Component>Text</Component>);
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles click', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Component onClick={handleClick} />);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA', () => {
      render(<Component aria-label="Test" />);
      expect(screen.getByLabelText('Test')).toBeInTheDocument();
    });
  });
});
```

## Queries Recommandées

Ordre de priorité (du plus accessible au moins):

```typescript
// 1. Par rôle (meilleur)
screen.getByRole('button', { name: /submit/i })

// 2. Par label
screen.getByLabelText('Email')

// 3. Par placeholder
screen.getByPlaceholderText('Enter text')

// 4. Par texte
screen.getByText('Heading')

// 5. Test ID (dernier recours)
screen.getByTestId('custom-element')
```

## User Events

Toujours utiliser `userEvent` (async):

```typescript
const user = userEvent.setup();

// Click
await user.click(button);

// Type
await user.type(input, 'Hello world');

// Keyboard
await user.keyboard('{Enter}');
await user.tab();

// Clear input
await user.clear(input);
```

## Assertions Courantes

```typescript
// Présence dans le DOM
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Visibilité
expect(element).toBeVisible();

// Disabled
expect(element).toBeDisabled();
expect(element).not.toBeDisabled();

// Attributs
expect(element).toHaveAttribute('type', 'email');
expect(element).toHaveClass('bg-primary');

// Focus
expect(element).toHaveFocus();

// Valeur
expect(input).toHaveValue('text');
```

## Async Testing

Pour les opérations asynchrones:

```typescript
import { waitFor } from '@testing-library/react';

await user.click(button);

await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

## Debugging

### Afficher le DOM

```typescript
import { screen } from '@testing-library/react';

screen.debug(); // Affiche tout le DOM
screen.debug(element); // Affiche un élément spécifique
```

### Lister les Rôles

```typescript
import { logRoles } from '@testing-library/react';

const { container } = render(<Component />);
logRoles(container);
```

### Mode Verbose

```bash
npm test -- --reporter=verbose
```

## Mocks

### Mock d'une fonction

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue('result');
mockFn.mockResolvedValue('async result');
```

### Mock d'un module

```typescript
vi.mock('@/lib/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'test' })),
}));
```

## Composants Testés

| Composant | Tests | Focus |
|-----------|-------|-------|
| Button | 39 | Variants, états, interactions |
| Input | 61 | Types, validation, events |
| Card | 37 | Structure, layout |
| Badge | 28 | Variants, asChild |
| Dialog | 27 | Modal, accessibilité |

## Checklist Test

Avant de soumettre:

- [ ] Tests passent (`npm run test:ui-components`)
- [ ] Pas d'erreurs critiques
- [ ] Coverage suffisant
- [ ] Tests d'accessibilité inclus
- [ ] Tests de keyboard inclus
- [ ] Documentation mise à jour

## Ressources

### Documentation Complète

- `README.md` - Guide des tests
- `TEST_SUMMARY.md` - Récapitulatif détaillé
- `../../../docs/TESTING_GUIDE.md` - Guide complet
- `../../../TESTING_IMPLEMENTATION.md` - Implémentation

### Liens Externes

- [React Testing Library](https://testing-library.com/react)
- [Vitest](https://vitest.dev)
- [User Event](https://testing-library.com/docs/user-event/intro)
- [Jest DOM](https://github.com/testing-library/jest-dom)

## Support

En cas de problème:

1. Vérifier `docs/TESTING_GUIDE.md` section Dépannage
2. Nettoyer: `rm -rf node_modules && npm install`
3. Vérifier la config: `vitest.config.ts`

---

**Prêt à tester? Lancez:** `npm run test:ui-components:watch`
