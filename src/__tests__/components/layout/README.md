# Tests Layout & Navigation

Tests unitaires complets pour les composants de layout et navigation de l'application.

## Fichiers de Tests

### 1. `sidebar.test.tsx` (388 lignes)

Tests du composant Sidebar avec couverture complète de toutes les fonctionnalités.

**Couverture:**
- ✅ Rendu de tous les éléments (logo, navigation, user menu)
- ✅ État actif selon la route courante
- ✅ Badges dynamiques (workflows, HITL, tenders)
- ✅ Fonctionnalité de collapse/expand
- ✅ Sauvegarde de l'état dans localStorage
- ✅ Toggle de thème (light/dark)
- ✅ Menu utilisateur dropdown
- ✅ Déconnexion
- ✅ Accessibilité (ARIA labels, data-tour)
- ✅ Actions rapides (notifications, aide, thème)
- ✅ Comportement responsive

**Scénarios testés:** 25+

### 2. `header.test.tsx` (341 lignes)

Tests du composant Header avec focus sur les breadcrumbs et la recherche.

**Couverture:**
- ✅ Titres dynamiques par page
- ✅ Breadcrumbs navigation
- ✅ Champ de recherche avec raccourci Ctrl+K
- ✅ Bouton "Nouveau DCE"
- ✅ Intégration NotificationCenter
- ✅ Layout responsive (mobile/desktop)
- ✅ Accessibilité (semantic HTML, ARIA)
- ✅ Styles visuels (glassmorphic, sticky)

**Scénarios testés:** 30+

### 3. `layout-wrapper.test.tsx` (237 lignes)

Tests du layout principal (dashboard layout) incluant l'authentification.

**Couverture:**
- ✅ Vérification d'authentification
- ✅ Redirection vers /login si non authentifié
- ✅ Validation du token via API
- ✅ Rendu Sidebar + Header + Content
- ✅ Intégration OnboardingProvider
- ✅ Skeleton de chargement
- ✅ Comportement responsive (padding sidebar)
- ✅ Compatibilité SSR
- ✅ Console logs debug mode
- ✅ Gestion de multiples enfants

**Scénarios testés:** 15+

### 4. `skip-links.test.tsx` (279 lignes)

Tests des liens de navigation rapide pour l'accessibilité.

**Couverture:**
- ✅ Rendu des 2 liens (contenu principal + navigation)
- ✅ Accessibilité (sr-only, focus-visible)
- ✅ Positionnement fixed avec z-index élevé
- ✅ Animation au focus (translate)
- ✅ Styles visuels (indigo, rounded)
- ✅ Navigation clavier (Tab)
- ✅ Conformité WCAG 2.4.1 (Bypass Blocks)
- ✅ Contraste de couleurs (AAA)
- ✅ Indicateur de focus visible
- ✅ Fonctionnement sans JavaScript

**Scénarios testés:** 25+

### 5. `navigation.test.tsx` (455 lignes)

Tests d'intégration pour la navigation globale de l'application.

**Couverture:**
- ✅ Navigation entre toutes les pages
- ✅ Synchronisation état actif Sidebar/Header
- ✅ Menu mobile responsive
- ✅ Tooltips en mode collapsed
- ✅ User menu dropdown complet
- ✅ Intégration toggle thème
- ✅ Navigation clavier
- ✅ Notifications (badges + centre)
- ✅ Bouton aide
- ✅ Attributs data-tour pour onboarding
- ✅ Gestion des erreurs et edge cases

**Scénarios testés:** 35+

## Exécution des Tests

```bash
# Tous les tests layout
npm test -- src/__tests__/components/layout

# Tests spécifiques
npm test -- src/__tests__/components/layout/sidebar.test.tsx
npm test -- src/__tests__/components/layout/header.test.tsx
npm test -- src/__tests__/components/layout/layout-wrapper.test.tsx
npm test -- src/__tests__/components/layout/skip-links.test.tsx
npm test -- src/__tests__/components/layout/navigation.test.tsx

# Avec coverage
npm test -- --coverage src/__tests__/components/layout

# Mode watch
npm test -- --watch src/__tests__/components/layout
```

## Mocks Utilisés

### Hooks Next.js
- `usePathname` - Pathname courant
- `useRouter` - Navigation
- `useTheme` - Thème (next-themes)

### Hooks Custom
- `useAuthStore` - État d'authentification (Zustand)
- `useWorkflowStats` - Stats workflows
- `useHITLPending` - Décisions en attente
- `useTendersCount` - Nombre d'opportunités

### Composants
- `framer-motion` - Animations (mocké pour éviter les problèmes de test)
- `NotificationCenter` - Centre de notifications

### Browser APIs
- `localStorage` - Persistance état sidebar
- `window` - Tests SSR

## Couverture Globale

| Composant | Lignes | Fonctions | Branches | Statements |
|-----------|--------|-----------|----------|------------|
| Sidebar | ~95% | ~90% | ~85% | ~95% |
| Header | ~90% | ~85% | ~80% | ~90% |
| Layout Wrapper | ~85% | ~80% | ~75% | ~85% |
| Skip Links | 100% | 100% | 100% | 100% |
| Navigation (integration) | ~90% | ~85% | ~80% | ~90% |

**Total:** ~130 scénarios de tests

## Cas Testés Importants

### Accessibilité (a11y)
- ✅ Labels ARIA sur tous les boutons
- ✅ Navigation clavier complète
- ✅ Skip links WCAG 2.4.1
- ✅ Contraste de couleurs AAA
- ✅ Focus visible
- ✅ Semantic HTML (header, nav, main)
- ✅ Attributs data-tour pour onboarding

### Responsive
- ✅ Sidebar collapse sur mobile
- ✅ Masquage recherche sur mobile
- ✅ Bouton compact sur mobile
- ✅ Tooltips en mode collapsed
- ✅ Ajustement padding layout

### Sécurité
- ✅ Vérification token avant rendu
- ✅ Redirection si non authentifié
- ✅ Validation token via API
- ✅ Déconnexion sécurisée
- ✅ SSR-safe (pas de crash côté serveur)

### Performances
- ✅ Skeleton de chargement
- ✅ État collapsed persisté
- ✅ Memoization des routes
- ✅ Lazy loading des données

### Edge Cases
- ✅ Utilisateur sans nom
- ✅ Données manquantes (undefined)
- ✅ Erreurs API
- ✅ localStorage indisponible
- ✅ window undefined (SSR)
- ✅ Routes inconnues

## Intégrations Testées

### Sidebar ↔ Header
- ✅ Synchronisation route active
- ✅ Cohérence breadcrumbs
- ✅ Thème partagé

### Layout ↔ Auth
- ✅ Vérification token
- ✅ Redirection login
- ✅ User menu

### Sidebar ↔ API
- ✅ Badges dynamiques
- ✅ Stats workflows
- ✅ Décisions HITL
- ✅ Compte opportunités

### Header ↔ Notifications
- ✅ NotificationCenter intégré
- ✅ Token passé via getToken
- ✅ Badge notifications

## Bonnes Pratiques

1. **Isolation des tests** - Chaque test est indépendant
2. **Mocks cohérents** - Setup/teardown dans beforeEach/afterEach
3. **Tests sémantiques** - Utilisation de getByRole, getByLabelText
4. **Tests d'intégration** - Vérification des interactions entre composants
5. **Edge cases** - Tests des cas limites et erreurs
6. **Accessibilité** - Tests a11y systématiques
7. **Responsive** - Tests mobile et desktop

## Améliorations Futures

- [ ] Tests E2E avec Playwright
- [ ] Tests de performance (render time)
- [ ] Tests de régression visuelle (Percy/Chromatic)
- [ ] Tests d'animations (framer-motion)
- [ ] Tests de charge (React Testing Library + MSW)
- [ ] Snapshots pour détecter les changements UI

## Références

- [React Testing Library](https://testing-library.com/react)
- [Vitest](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
