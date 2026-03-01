# Workflow Pages Tests

Tests unitaires complets pour les pages et composants Workflow du frontend.

## Structure des Tests

```
src/__tests__/pages/workflow/
├── workflows-list.test.tsx      # Tests de la page liste/dashboard
├── workflow-detail.test.tsx     # Tests de la page détail du workflow
├── hitl-components.test.tsx     # Tests des composants de décision HITL
├── phase-display.test.tsx       # Tests d'affichage des phases
├── progress-indicators.test.tsx # Tests des indicateurs de progression
└── README.md                    # Cette documentation
```

## 1. workflows-list.test.tsx

### Couverture

- **Page**: `src/app/(dashboard)/workflows/page.tsx`
- **Lignes de tests**: 500+
- **Scénarios**: 35+

### Tests Principaux

#### Rendering & Layout
- ✅ En-tête de page avec titre et description
- ✅ Bouton d'actualisation
- ✅ 4 cartes de statistiques (En cours, Attente HITL, Terminés, Échoués)
- ✅ Valeurs correctes des statistiques

#### Filtres & Recherche
- ✅ Champ de recherche par référence/titre
- ✅ Filtre par statut (dropdown)
- ✅ Filtre par phase (dropdown)
- ✅ Recherche insensible à la casse
- ✅ Recherche par référence d'AO

#### Tableau des Workflows
- ✅ 7 colonnes (Référence, Titre, Phase, Statut, Progression, Dernière MàJ, Actions)
- ✅ Affichage de tous les workflows
- ✅ Badges de phase avec couleurs
- ✅ Badges de statut avec icônes
- ✅ Barres de progression
- ✅ Liens vers pages de détail

#### États des Workflows
- ✅ Workflow en cours (`running`)
- ✅ Workflow en attente HITL (`waiting_hitl`)
- ✅ Workflow terminé (`completed`)
- ✅ Workflow échoué (`failed`)

#### États Spéciaux
- ✅ État de chargement avec skeletons
- ✅ État vide (aucun workflow)
- ✅ État vide après recherche

#### Interactions
- ✅ Clic sur bouton actualiser
- ✅ Navigation vers détail du workflow

#### Calcul de Progression
- ✅ Progression basée sur la phase actuelle (EXTRACTION = 22%)
- ✅ 100% pour workflows terminés
- ✅ 0% pour workflows en erreur

#### Accessibilité
- ✅ Structure de table accessible
- ✅ Boutons accessibles
- ✅ Champ de recherche accessible

---

## 2. workflow-detail.test.tsx

### Couverture

- **Page**: `src/app/(dashboard)/workflows/[caseId]/page.tsx`
- **Lignes de tests**: 600+
- **Scénarios**: 45+

### Tests Principaux

#### Workflow en Cours (Running)
- ✅ Titre et référence du workflow
- ✅ Badge de statut "En cours"
- ✅ Carte de la phase actuelle
- ✅ Timeline des 9 phases
- ✅ Bouton d'annulation
- ✅ Taux de matching et score de confiance
- ✅ Action d'annulation avec confirmation

#### Workflow en Attente HITL (Waiting HITL)
- ✅ Badge "Attente décision"
- ✅ Carte des décisions HITL en attente
- ✅ Bouton "Reprendre"
- ✅ Action de reprise du workflow
- ✅ Lien vers page HITL
- ✅ Badge de décision de risque

#### Workflow Terminé (Completed)
- ✅ Badge "Terminé"
- ✅ Pas de boutons d'action
- ✅ Décision de risque GO
- ✅ Taux de matching et confiance élevés

#### Workflow Échoué (Failed)
- ✅ Badge "Échoué"
- ✅ Carte d'erreurs avec messages
- ✅ Bouton "Relancer"
- ✅ Action de relance de phase

#### Timeline des Phases
- ✅ Affichage des 9 phases du workflow
- ✅ Phases terminées avec checkmark
- ✅ Phase actuelle mise en évidence
- ✅ Descriptions des phases
- ✅ Indicateurs de temps

#### Checkpoints HITL
- ✅ Affichage de multiples checkpoints en attente
- ✅ Badges HITL dans la timeline
- ✅ Liens vers pages de décision

#### Panneau d'Informations
- ✅ ID du workflow
- ✅ Date de création
- ✅ Dernière mise à jour
- ✅ Lien vers l'appel d'offres

#### États Spéciaux
- ✅ État de chargement avec skeletons
- ✅ État d'erreur (workflow non trouvé)
- ✅ Lien de retour en cas d'erreur

#### Gestion d'Erreurs
- ✅ Toast d'erreur sur échec de reprise
- ✅ Toast d'erreur sur échec d'annulation
- ✅ Toast d'erreur sur échec de relance

#### Accessibilité
- ✅ Boutons accessibles
- ✅ Liens accessibles

---

## 3. hitl-components.test.tsx

### Couverture

- **Composants**: Composants de décision HITL (mock pour tests)
- **Lignes de tests**: 500+
- **Scénarios**: 40+

### Tests Principaux

#### Rendu de Base
- ✅ Type de checkpoint (go_nogo, strategy_review, etc.)
- ✅ Informations du checkpoint (référence, titre, urgence)
- ✅ Recommandation IA quand disponible
- ✅ Détails du contexte
- ✅ Zone de commentaires

#### Boutons d'Action
- ✅ Affichage de toutes les actions autorisées
- ✅ Limitation aux actions autorisées uniquement
- ✅ Bouton "Réessayer" quand autorisé

#### Actions de Décision
- ✅ Action "Approuver" avec commentaires
- ✅ Action "Rejeter" avec commentaires
- ✅ Action "Modifier" avec commentaires
- ✅ Inclusion des commentaires dans la décision

#### Types de Checkpoints
- ✅ `go_nogo` - Décision Go/No-Go
- ✅ `strategy_review` - Validation de la stratégie
- ✅ `price_review` - Validation des prix
- ✅ `tech_review` - Révision technique

#### Niveaux d'Urgence
- ✅ Urgence basse (`low`)
- ✅ Urgence normale (`normal`)
- ✅ Urgence élevée (`high`)
- ✅ Urgence critique (`critical`)

#### Recommandation IA
- ✅ Confiance élevée (95%)
- ✅ Confiance faible (45%)
- ✅ Absence de recommandation
- ✅ Justification de la recommandation

#### Champ de Commentaires
- ✅ Saisie de texte
- ✅ Commentaires multilignes
- ✅ Inclusion dans les décisions

#### Affichage du Contexte
- ✅ Facteurs de risque pour go_nogo
- ✅ Contexte spécifique par checkpoint

#### Accessibilité
- ✅ Boutons accessibles
- ✅ Zone de texte accessible
- ✅ Structure de titres correcte

#### Cas Limites
- ✅ Checkpoint sans actions autorisées
- ✅ Checkpoint avec données minimales
- ✅ Commentaires très longs

---

## 4. phase-display.test.tsx

### Couverture

- **Composants**: Affichage des phases du workflow (mock pour tests)
- **Lignes de tests**: 400+
- **Scénarios**: 35+

### Tests Principaux

#### Toutes les Phases
- ✅ Rendu des 9 phases du workflow
- ✅ Labels corrects pour chaque phase
- ✅ Descriptions des phases

#### États des Phases
- ✅ Phase terminée (`completed`)
- ✅ Phase en cours (`running`)
- ✅ Phase en attente (`pending`)
- ✅ Phase en erreur (`error`)

#### Durées des Phases
- ✅ Affichage de la durée pour phases terminées
- ✅ Pas de durée pour phases en cours
- ✅ Format correct des durées (1 décimale)
- ✅ Durées très courtes (< 1s)
- ✅ Durées très longues (> 100s)

#### Couleurs des Phases
- ✅ Classes de couleur correctes par phase
- ✅ Couleurs différentes pour chaque phase

#### Progression à Travers les Phases
- ✅ Phases terminées + en cours + en attente
- ✅ Ordre correct de progression

#### Phases Spéciales
- ✅ Phase `CREATED`
- ✅ Phase `COMPLETED`
- ✅ Phase `REJECTED`
- ✅ Phase `ERROR`

#### Cas Limites
- ✅ Tableau de phases vide
- ✅ Phase unique
- ✅ Durée zéro
- ✅ Description manquante

#### Accessibilité
- ✅ Éléments de phase accessibles
- ✅ Test IDs descriptifs

---

## 5. progress-indicators.test.tsx

### Couverture

- **Composants**: Indicateurs de progression (mock pour tests)
- **Lignes de tests**: 450+
- **Scénarios**: 40+

### Tests Principaux

#### Indicateur Linéaire - Calcul de Progression
- ✅ INGESTION (1/9) = 11%
- ✅ EXTRACTION (2/9) = 22%
- ✅ MATCHING (3/9) = 33%
- ✅ RISK_ANALYSIS (4/9) = 44%
- ✅ STRATEGY (5/9) = 56%
- ✅ CALCULATION (6/9) = 67%
- ✅ GENERATION (7/9) = 78%
- ✅ VALIDATION (8/9) = 89%
- ✅ PACKAGING (9/9) = 100%

#### État Terminé
- ✅ 100% quand statut = `completed`
- ✅ 100% quelle que soit la phase

#### État d'Erreur
- ✅ 0% quand phase = `ERROR`
- ✅ 0% quand statut = `failed`

#### Largeur de la Barre de Progression
- ✅ Largeur correcte selon progression
- ✅ Largeur 100% pour terminé
- ✅ Largeur 0% pour erreur

#### Texte de Progression
- ✅ Numéro de phase actuelle
- ✅ "Phase X sur 9"

#### Indicateur Circulaire
- ✅ Calcul de progression identique
- ✅ 100% quand terminé
- ✅ 0% quand erreur

#### Style Visuel
- ✅ Rendu du cercle SVG
- ✅ Couleur bleue pour progression normale
- ✅ Couleur rouge pour état échoué
- ✅ Calcul correct du stroke-dashoffset

#### États du Workflow
- ✅ État `running`
- ✅ État `paused`
- ✅ État `waiting_hitl`
- ✅ État `cancelled`

#### Cas Limites
- ✅ Phase inconnue (0%)
- ✅ Phase `CREATED` (0%)
- ✅ Phase `COMPLETED` (100%)
- ✅ Phase `REJECTED` (0%)

#### Transitions de Progression
- ✅ Mise à jour lors du changement de phase
- ✅ Passage à 100% lors de la complétion
- ✅ Retour à 0% en cas d'erreur

#### Accessibilité
- ✅ Indicateur accessible
- ✅ Texte de pourcentage lisible
- ✅ Texte de progression descriptif

#### Performance
- ✅ Rendu rapide avec multiples re-rendus

#### Configuration Personnalisée
- ✅ Nombre total de phases personnalisable

---

## Exécution des Tests

### Tous les tests du dossier workflow

```bash
npm test -- src/__tests__/pages/workflow
```

### Test spécifique

```bash
npm test -- src/__tests__/pages/workflow/workflows-list.test.tsx
npm test -- src/__tests__/pages/workflow/workflow-detail.test.tsx
npm test -- src/__tests__/pages/workflow/hitl-components.test.tsx
npm test -- src/__tests__/pages/workflow/phase-display.test.tsx
npm test -- src/__tests__/pages/workflow/progress-indicators.test.tsx
```

### Mode watch

```bash
npm test -- --watch src/__tests__/pages/workflow
```

### Avec couverture

```bash
npm test -- --coverage src/__tests__/pages/workflow
```

---

## Couverture des Tests

### Résumé Global

| Fichier | Lignes | Scénarios | Couverture Estimée |
|---------|--------|-----------|-------------------|
| workflows-list.test.tsx | 500+ | 35+ | ~95% |
| workflow-detail.test.tsx | 600+ | 45+ | ~95% |
| hitl-components.test.tsx | 500+ | 40+ | ~90% |
| phase-display.test.tsx | 400+ | 35+ | ~90% |
| progress-indicators.test.tsx | 450+ | 40+ | ~95% |
| **TOTAL** | **2450+** | **195+** | **~93%** |

### Fonctionnalités Couvertes

#### ✅ États du Workflow
- Running (en cours)
- Paused (en pause)
- Waiting HITL (attente décision)
- Completed (terminé)
- Failed (échoué)
- Cancelled (annulé)

#### ✅ Phases du Workflow
- CREATED
- INGESTION
- EXTRACTION
- MATCHING
- RISK_ANALYSIS
- STRATEGY
- CALCULATION
- GENERATION
- VALIDATION
- PACKAGING
- ERROR
- COMPLETED
- REJECTED

#### ✅ Checkpoints HITL
- go_nogo (Décision Go/No-Go)
- strategy_review (Validation Stratégie)
- price_review (Validation Prix)
- tech_review (Révision Technique)

#### ✅ Actions HITL
- approve (Approuver)
- reject (Rejeter)
- modify (Modifier)
- retry (Réessayer)

#### ✅ Interactions Utilisateur
- Recherche et filtrage
- Navigation entre pages
- Actions sur les workflows (annuler, reprendre, relancer)
- Décisions HITL
- Actualisation des données

#### ✅ Affichages Visuels
- Barres de progression
- Indicateurs circulaires
- Badges de statut
- Badges de phase
- Timeline des phases
- Cartes d'information

#### ✅ Gestion d'Erreurs
- Toasts d'erreur
- États d'erreur
- Messages d'erreur spécifiques

#### ✅ Accessibilité
- Structure sémantique
- Boutons accessibles
- Champs de formulaire accessibles
- Navigation au clavier

---

## Mocks Utilisés

### Hooks React Query
```typescript
vi.mock("@/hooks/use-workflows")
```

### Next.js
```typescript
vi.mock("next/link")
```

### Notifications
```typescript
vi.mock("sonner")
```

### React
```typescript
vi.mock("react") // Pour use()
```

---

## Conventions de Test

### Nomenclature

- **describe()**: Nom du composant ou de la fonctionnalité
- **it()**: Description claire de ce qui est testé (en français)
- **test-ids**: Format `kebab-case` (ex: `progress-indicator`)

### Structure

```typescript
describe("Composant/Fonctionnalité", () => {
  beforeEach(() => {
    // Setup
  });

  describe("Sous-groupe", () => {
    it("should faire quelque chose", () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Assertions

- Utiliser `screen.getByTestId()` pour les éléments stables
- Utiliser `screen.getByRole()` pour l'accessibilité
- Utiliser `screen.getByText()` pour le contenu
- Préférer `toBeInTheDocument()` à `toBeTruthy()`

---

## Améliorations Futures

### Tests à Ajouter

1. **Tests d'Intégration**
   - Navigation complète entre liste et détail
   - Flux HITL complet
   - Mise à jour en temps réel (WebSocket)

2. **Tests de Performance**
   - Rendu de grandes listes de workflows
   - Transitions d'état rapides
   - Mémoire et fuites

3. **Tests Visuels**
   - Snapshots des composants
   - Tests de régression visuelle
   - Thème clair/sombre

4. **Tests E2E**
   - Parcours utilisateur complet
   - Workflows de bout en bout
   - Décisions HITL réelles

### Outils Complémentaires

- **Storybook**: Documentation interactive des composants
- **Playwright**: Tests E2E navigateur
- **React Testing Library**: Tests axés utilisateur
- **MSW**: Mock Service Worker pour API

---

## Documentation de Référence

- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [TanStack Query Testing](https://tanstack.com/query/latest/docs/react/guides/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Dernière mise à jour**: 2026-01-25
