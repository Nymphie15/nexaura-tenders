# Tests Dashboard Page

Tests unitaires complets pour la page Dashboard de l'application.

## Structure des Tests

```
tests/unit/pages/dashboard/
├── dashboard-page.test.tsx    # Tests principaux de la page
├── kpi-cards.test.tsx          # Tests des cartes KPI
├── charts.test.tsx             # Tests des graphiques
├── responsive.test.tsx         # Tests responsive
├── interactions.test.tsx       # Tests des interactions utilisateur
└── README.md                   # Ce fichier
```

## Couverture des Tests

### 1. dashboard-page.test.tsx
Tests généraux de la page dashboard :
- Layout et structure
- Sections principales (banner, KPI, graphiques, décisions, opportunités)
- États de chargement
- États vides
- Gestion des erreurs
- Actions rapides

### 2. kpi-cards.test.tsx
Tests des 4 cartes KPI principales :
- Formatage des valeurs (monétaire, pourcentage, numérique)
- Indicateurs de tendance (hausse, baisse, neutre)
- États de chargement (squelettes)
- Transitions d'état
- Éléments visuels (icônes, couleurs)
- Comportement responsive
- Accessibilité

### 3. charts.test.tsx
Tests des graphiques du dashboard :
- Graphique d'activité (AreaChart)
- Distribution des sources (DonutChart)
- Top catégories (BarList)
- Données de fallback
- Gestion des données vides
- Layout des graphiques
- Accessibilité

### 4. responsive.test.tsx
Tests du comportement responsive :
- Grilles responsive (mobile, tablette, desktop)
- Espacement et gaps
- Taille des cartes
- Troncature du texte
- Comportement de scroll
- Largeur des conteneurs
- Flexbox et alignement

### 5. interactions.test.tsx
Tests des interactions utilisateur :
- Liens de navigation
- Effets hover
- Badges et labels
- Indicateurs de progression
- Clicks sur les boutons
- Feedback visuel
- Avatars

## Exécution des Tests

```bash
# Tous les tests du dashboard
npm test tests/unit/pages/dashboard

# Un fichier spécifique
npm test tests/unit/pages/dashboard/dashboard-page.test.tsx

# Avec couverture
npm test:coverage
```

## Mocks Utilisés

### Hooks
- `useDashboardStats` : Statistiques du dashboard
- `useRecentTenders` : Appels d'offres récents
- `useHITLPending` : Décisions en attente
- `useSourceDistribution` : Distribution des sources
- `useMonthlyPerformance` : Performance mensuelle

### Stores
- `useAuthStore` : Informations utilisateur

### Composants
- `AreaChart` : Graphique d'activité
- `DonutChart` : Graphique en donut
- `BarList` : Liste de barres

## Scénarios de Test

### Données Chargées ✓
- Affichage normal avec toutes les données
- Formatage correct des valeurs
- Liens fonctionnels

### État de Chargement ✓
- Squelettes affichés
- Transitions fluides
- Pas de flash de contenu

### État Vide ✓
- Messages appropriés
- Icônes d'état vide
- Boutons d'action

### Erreurs ✓
- Gestion gracieuse des erreurs
- Pas de crash
- Fallbacks appropriés

### Responsive ✓
- Mobile (320px+)
- Tablette (768px+)
- Desktop (1024px+)

### Interactions ✓
- Navigation
- Hover effects
- Click handlers
- Keyboard navigation

## Métriques de Couverture Attendues

- **Lignes** : > 80%
- **Branches** : > 70%
- **Fonctions** : > 80%
- **Statements** : > 80%

## Notes Importantes

1. **Mocks de Graphiques** : Les composants Tremor sont mockés pour éviter les problèmes de rendering SVG en tests
2. **Next.js Link** : Le composant Link est mocké pour simplifier les tests de navigation
3. **Framer Motion** : Mocké dans setup.ts pour éviter les problèmes d'animation
4. **Dates** : date-fns est utilisé pour le formatage des dates

## Améliorations Futures

- [ ] Tests E2E avec Playwright
- [ ] Tests de performance (temps de rendu)
- [ ] Tests d'accessibilité automatisés (axe-core)
- [ ] Tests de compatibilité navigateur
- [ ] Tests de charge des données
- [ ] Tests de synchronisation temps réel

## Dépendances de Test

- `vitest` : Runner de tests
- `@testing-library/react` : Utilitaires de test React
- `@testing-library/jest-dom` : Matchers personnalisés
- `@testing-library/user-event` : Simulation d'événements utilisateur
- `@tanstack/react-query` : Gestion d'état async (besoin du QueryClientProvider)

## Conventions

- ✅ **DO** : Tester le comportement, pas l'implémentation
- ✅ **DO** : Utiliser des queries accessibles (getByRole, getByLabelText)
- ✅ **DO** : Tester les cas limites (données vides, erreurs)
- ❌ **DON'T** : Tester les détails d'implémentation internes
- ❌ **DON'T** : Tester les composants tiers (Radix UI, Tremor)
- ❌ **DON'T** : Utiliser des snapshots pour le HTML complet
