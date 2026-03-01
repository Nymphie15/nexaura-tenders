# Guide de Démarrage Rapide - Tests Workflow

Guide ultra-rapide pour commencer à utiliser les tests des pages Workflow.

## 🚀 Démarrage en 30 Secondes

```bash
# 1. Installer les dépendances (si pas déjà fait)
cd web-client
npm install

# 2. Exécuter tous les tests workflow
npm run test:workflow

# 3. Voir les résultats
# ✓ Les tests devraient tous passer!
```

## 📋 Commandes Essentielles

| Commande | Description |
|----------|-------------|
| `npm run test:workflow` | Tous les tests workflow |
| `npm run test:workflow:watch` | Mode surveillance (auto-refresh) |
| `npm run test:workflow:coverage` | Avec rapport de couverture |

## 🎯 Tests Disponibles

### 1. Liste des Workflows (`workflows-list.test.tsx`)
```bash
npm run test:workflow:list
```
**Teste**: Dashboard, tableau, filtres, recherche (35+ tests)

### 2. Détail du Workflow (`workflow-detail.test.tsx`)
```bash
npm run test:workflow:detail
```
**Teste**: Timeline, actions, HITL, états (45+ tests)

### 3. Composants HITL (`hitl-components.test.tsx`)
```bash
npm run test:workflow:hitl
```
**Teste**: Décisions, checkpoints, recommandations IA (40+ tests)

### 4. Affichage des Phases (`phase-display.test.tsx`)
```bash
npm run test:workflow:phases
```
**Teste**: 9 phases, états, durées, couleurs (35+ tests)

### 5. Indicateurs de Progression (`progress-indicators.test.tsx`)
```bash
npm run test:workflow:progress
```
**Teste**: Barres de progression, calculs, transitions (40+ tests)

## 🔍 Déboguer un Test qui Échoue

### Étape 1: Isoler le test
```bash
# Exécuter seulement le fichier qui échoue
npm run test:workflow:list
```

### Étape 2: Mode watch
```bash
# Surveiller les changements
npm run test:workflow:watch
```

### Étape 3: Vérifier les logs
```bash
# Les erreurs s'affichent dans la console
# Exemple:
# ✗ should display workflow title
#   Expected: "AO-2025-001"
#   Received: null
```

### Étape 4: Corriger et re-tester
```bash
# Le test se relance automatiquement en mode watch
# Ou manuellement:
npm run test:workflow:list
```

## 📊 Voir le Rapport de Couverture

```bash
# 1. Générer le rapport
npm run test:workflow:coverage

# 2. Ouvrir le rapport HTML
# Linux/macOS:
open coverage/index.html

# Windows:
start coverage/index.html
```

## 🛠️ Scripts Shell (Optionnel)

### Linux/macOS/WSL
```bash
# Rendre exécutable (une seule fois)
chmod +x scripts/test-workflow.sh

# Exécuter
./scripts/test-workflow.sh -a          # Tous les tests
./scripts/test-workflow.sh -l -w       # Liste en mode watch
./scripts/test-workflow.sh --help      # Aide
```

### Windows PowerShell
```powershell
# Exécuter directement
.\scripts\test-workflow.ps1 -All       # Tous les tests
.\scripts\test-workflow.ps1 -List -Watch
.\scripts\test-workflow.ps1 -Help      # Aide
```

## 🎨 Interface UI Interactive (Vitest UI)

```bash
# Démarrer l'interface web
npm run test:workflow:ui

# Ouvre http://localhost:51204/__vitest__/
# Interface graphique pour explorer les tests
```

## 📖 Documentation Complète

| Fichier | Contenu |
|---------|---------|
| [README.md](./README.md) | Documentation complète des tests |
| [INTEGRATION.md](./INTEGRATION.md) | Guide d'intégration CI/CD |
| [SUMMARY.md](./SUMMARY.md) | Résumé et statistiques |

## 🐛 Problèmes Courants

### Problème: Tests échouent avec "Cannot find module"
**Solution**:
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Problème: "ReferenceError: document is not defined"
**Solution**: Vérifier que `vitest.config.ts` a `environment: 'jsdom'`

### Problème: Tests très lents
**Solution**:
```bash
# Exécuter seulement les tests modifiés
npm run test:workflow -- --changed
```

### Problème: Mock ne fonctionne pas
**Solution**: Vérifier que `vi.clearAllMocks()` est dans `beforeEach()`

## ✅ Checklist Avant de Commit

```bash
# 1. Tous les tests passent
npm run test:workflow

# 2. Couverture > 80%
npm run test:workflow:coverage

# 3. Pas de console.log ou debugger
grep -r "console.log\|debugger" src/__tests__/pages/workflow

# 4. Formatage correct
npm run format

# 5. Lint OK
npm run lint
```

## 🚦 Status des Tests

Après chaque exécution, vous verrez:

```
✓ src/__tests__/pages/workflow/workflows-list.test.tsx (35 tests)
✓ src/__tests__/pages/workflow/workflow-detail.test.tsx (45 tests)
✓ src/__tests__/pages/workflow/hitl-components.test.tsx (40 tests)
✓ src/__tests__/pages/workflow/phase-display.test.tsx (35 tests)
✓ src/__tests__/pages/workflow/progress-indicators.test.tsx (40 tests)

Test Files  5 passed (5)
     Tests  195 passed (195)
  Duration  15.32s
```

## 🎓 Exemple: Ajouter un Nouveau Test

```typescript
// Dans workflows-list.test.tsx

it('should filter by new status', async () => {
  const user = userEvent.setup();
  renderPage();

  // Ouvrir le filtre
  const statusFilter = screen.getByRole('combobox');
  await user.click(statusFilter);

  // Sélectionner le nouveau statut
  const option = screen.getByText('Mon Nouveau Statut');
  await user.click(option);

  // Vérifier le résultat
  await waitFor(() => {
    expect(screen.getByText('Workflow avec nouveau statut')).toBeInTheDocument();
  });
});
```

## 🔗 Ressources Utiles

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 💡 Tips Pro

### Tip 1: Utiliser le mode watch pour développer
```bash
npm run test:workflow:watch
# Les tests se relancent automatiquement à chaque modification
```

### Tip 2: Filtrer les tests par nom
```bash
npm run test:workflow -- -t "should display workflow title"
# Exécute seulement les tests contenant ce texte
```

### Tip 3: Voir les tests qui passent
```bash
npm run test:workflow -- --reporter=verbose
# Affiche chaque test individuellement
```

### Tip 4: Déboguer avec console.log
```typescript
it('should do something', () => {
  renderPage();

  // Afficher le HTML actuel
  screen.debug();

  // Ou un élément spécifique
  const element = screen.getByTestId('my-element');
  console.log(element.innerHTML);
});
```

### Tip 5: Skip temporaire
```typescript
// Skip un test qui échoue
it.skip('should fix this later', () => {
  // ...
});

// Skip tout un groupe
describe.skip('Feature not ready', () => {
  // ...
});
```

---

**Prêt à coder?** Lancez `npm run test:workflow:watch` et commencez à développer! 🚀
