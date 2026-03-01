# Tests des Pages Tenders - Index

Bienvenue dans la suite de tests pour les pages Tenders!

## Navigation Rapide

### 📖 Documentation
- **[README.md](./README.md)** - Documentation complète (500+ lignes)
- **[QUICK_START.md](./QUICK_START.md)** - Guide de démarrage rapide
- **[TEST_SUMMARY.md](./TEST_SUMMARY.md)** - Résumé exécutif

### 🧪 Fichiers de Test
- **[tenders-list.test.tsx](./tenders-list.test.tsx)** - Page liste (50+ tests)
- **[tender-detail.test.tsx](./tender-detail.test.tsx)** - Page détail (40+ tests)
- **[tenders-loading.test.tsx](./tenders-loading.test.tsx)** - État loading (7 tests)
- **[tenders-error.test.tsx](./tenders-error.test.tsx)** - Page erreur (20+ tests)

### 🔧 Utilitaires
- **[fixtures.ts](./fixtures.ts)** - Données de test réutilisables
- **[test-helpers.ts](./test-helpers.ts)** - Fonctions helper
- **[run-tests.sh](./run-tests.sh)** - Script bash
- **[package.json](./package.json)** - Scripts npm

## Démarrage Rapide

### Installation
Aucune installation nécessaire - les dépendances sont déjà installées.

### Exécution
```bash
# Tous les tests
npm test -- tenders

# Un fichier spécifique
npm test -- tenders-list.test.tsx

# Avec couverture
npm run test:coverage -- tenders

# Mode watch
npm test -- tenders --watch
```

## Structure du Projet

```
tenders/
├── index.md                    # Ce fichier
├── README.md                   # Documentation complète
├── QUICK_START.md             # Guide rapide
├── TEST_SUMMARY.md            # Résumé
│
├── fixtures.ts                # Données de test
├── test-helpers.ts            # Utilitaires
│
├── tenders-list.test.tsx      # Tests page liste
├── tender-detail.test.tsx     # Tests page détail
├── tenders-loading.test.tsx   # Tests loading
├── tenders-error.test.tsx     # Tests erreur
│
├── run-tests.sh               # Script bash
└── package.json               # Scripts npm
```

## Statistiques

- **Total de tests**: 117+
- **Lignes de code**: 2,500+
- **Fixtures**: 15+
- **Helpers**: 15+
- **Temps d'exécution**: ~5-6s

## Couverture

### Pages Testées
- ✅ Liste des tenders (`/tenders`)
- ✅ Détail d'un tender (`/tenders/[id]`)
- ✅ État de chargement (`loading.tsx`)
- ✅ Page d'erreur (`error.tsx`)

### Fonctionnalités Testées
- ✅ Rendu initial et états
- ✅ Filtrage et recherche
- ✅ Pagination
- ✅ Actions utilisateur
- ✅ Navigation entre onglets
- ✅ Mutations (traitement, téléchargement)
- ✅ Gestion d'erreurs
- ✅ Accessibilité

## Commandes Courantes

### Test d'un fichier
```bash
npm test -- tenders-list.test.tsx
```

### Test spécifique
```bash
npm test -- tenders -t "affiche le titre"
```

### Mode debug
```bash
npm test -- tenders --inspect-brk
```

### Mode UI (interface graphique)
```bash
npm test -- tenders --ui
```

### Coverage détaillé
```bash
npm run test:coverage -- tenders
open coverage/index.html
```

## Workflow de Développement

### 1. Modifier le code source
```bash
# Éditer le composant
vim src/app/(dashboard)/tenders/page.tsx
```

### 2. Lancer les tests en mode watch
```bash
npm test -- tenders --watch
```

### 3. Voir les résultats en temps réel
Les tests se relancent automatiquement à chaque modification.

### 4. Vérifier la couverture
```bash
npm run test:coverage -- tenders
```

### 5. Commit et push
```bash
git add .
git commit -m "feat: amélioration des tenders"
git push
```

## Patterns de Test

### Mock des hooks
```typescript
import { vi } from 'vitest';

const { useTenders } = vi.mocked(require('@/hooks/use-tenders'));
useTenders.mockReturnValue({ data: mockTenders, isLoading: false });
```

### Render avec QueryClient
```typescript
import { renderWithQueryClient } from './test-helpers';

renderWithQueryClient(<TendersPage />);
```

### Interactions utilisateur
```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.click(button);
await user.type(input, 'search term');
```

### Assertions asynchrones
```typescript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

## Ressources Utiles

### Documentation
- [README complet](./README.md) - Documentation détaillée
- [Quick Start](./QUICK_START.md) - Commandes rapides
- [Test Summary](./TEST_SUMMARY.md) - Vue d'ensemble

### Liens Externes
- [Vitest](https://vitest.dev/) - Framework de test
- [Testing Library](https://testing-library.com/react) - Utilitaires de test React
- [User Event](https://testing-library.com/docs/user-event/intro) - Simulation d'interactions

### Code Source
- [Page liste](../../../src/app/(dashboard)/tenders/page.tsx)
- [Page détail](../../../src/app/(dashboard)/tenders/[id]/page.tsx)
- [Hooks](../../../src/hooks/use-tenders.ts)

## Support

### Problèmes Courants
1. **Tests qui échouent** → Voir [QUICK_START.md](./QUICK_START.md#résolution-de-problèmes)
2. **Mocks ne fonctionnent pas** → Vérifier `beforeEach(() => vi.clearAllMocks())`
3. **Erreurs async** → Utiliser `waitFor()` ou `findBy*`
4. **Import errors** → Vérifier les alias `@/` dans `vitest.config.ts`

### Obtenir de l'Aide
1. Consulter la documentation
2. Voir les tests existants pour des exemples
3. Vérifier la documentation de Testing Library
4. Créer une issue sur le repo

## Contribution

### Ajouter un Nouveau Test
1. Identifier le comportement à tester
2. Créer un test dans le fichier approprié
3. Utiliser les fixtures et helpers existants
4. Vérifier que le test passe
5. Vérifier la couverture

### Modifier un Test Existant
1. Comprendre le test actuel
2. Faire les modifications nécessaires
3. Vérifier que tous les tests passent
4. Mettre à jour la documentation si nécessaire

## Maintenance

### Mise à Jour des Fixtures
```typescript
// fixtures.ts
export const newFixture = {
  // ...données
};
```

### Mise à Jour des Helpers
```typescript
// test-helpers.ts
export function newHelper() {
  // ...logique
}
```

### Mise à Jour de la Documentation
Mettre à jour README.md et QUICK_START.md après des changements majeurs.

---

**Dernière mise à jour**: 2026-01-25
**Version**: 1.0.0
**Statut**: ✅ Production Ready

Pour commencer, consultez le [QUICK_START.md](./QUICK_START.md)!
