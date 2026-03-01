# Tests - Pages Tenders

Suite de tests complète pour les pages de gestion des appels d'offres (tenders).

## Structure

```
tenders/
├── tenders-list.test.tsx        # Tests de la page liste
├── tender-detail.test.tsx       # Tests de la page détail
├── tenders-loading.test.tsx     # Tests de l'état de chargement
└── tenders-error.test.tsx       # Tests de la page d'erreur
```

## Couverture des Tests

### tenders-list.test.tsx (Page de liste)

#### Rendu Initial
- ✅ Squelette de chargement
- ✅ Cartes de statistiques (Total AO, En traitement, Pipeline, Deadline proche)
- ✅ Nombre total de tenders

#### Liste des Tenders
- ✅ Affichage de tous les tenders
- ✅ Informations clés (référence, client, statut)
- ✅ Message "Aucune opportunité trouvée"

#### Filtrage et Recherche
- ✅ Contrôles de filtrage (barre de recherche, filtres status/source)
- ✅ Recherche par titre
- ✅ Filtrage des résultats
- ✅ Recherche client-side pour vue "Pertinentes"

#### Modes de Vue
- ✅ Onglets "Pertinentes" / "Toutes"
- ✅ Basculement entre les vues
- ✅ Badge de score de pertinence
- ✅ Tri par pertinence

#### Actions
- ✅ Bouton "Importer DCE"
- ✅ Dialogue d'upload
- ✅ Menu d'actions par tender
- ✅ Lancer le traitement d'un tender
- ✅ Lien vers la source externe

#### Pagination
- ✅ Contrôles de pagination
- ✅ Bouton précédent désactivé sur première page
- ✅ Affichage du nombre de résultats
- ✅ Navigation entre les pages

#### Accessibilité
- ✅ Liens accessibles vers les détails
- ✅ Rôles ARIA appropriés (table, combobox)
- ✅ Labels descriptifs

#### Gestion d'Erreurs
- ✅ Erreurs de chargement sans crash
- ✅ Fallback gracieux

### tender-detail.test.tsx (Page de détail)

#### Chargement et États
- ✅ Squelette de chargement
- ✅ Message d'erreur si tender inexistant
- ✅ Bouton retour à la liste

#### En-tête
- ✅ Titre du tender
- ✅ Référence et statut
- ✅ Client et deadline
- ✅ Boutons d'action (Lancer traitement, Voir source)

#### Cartes de Score
- ✅ 4 cartes (Score global, Score risque, Budget, Deadline)
- ✅ Valeurs correctes
- ✅ Barres de progression

#### Onglets
- ✅ 6 onglets visibles
- ✅ Basculement entre les onglets
- ✅ Compteurs dans les titres (Lots, Exigences, Documents)

#### Onglet Vue d'ensemble
- ✅ Description du tender
- ✅ Informations acheteur (nom, adresse, contact)
- ✅ Critères de jugement avec pondération
- ✅ Délais (dépôt, exécution, garantie)

#### Onglet Lots
- ✅ Liste de tous les lots
- ✅ Budget de chaque lot
- ✅ Numéro et description

#### Onglet Exigences
- ✅ Liste des exigences
- ✅ Badge "Obligatoire" pour exigences mandatory
- ✅ Score par exigence
- ✅ Type (TECHNIQUE, ADMINISTRATIVE, COMMERCIAL)

#### Onglet Matching
- ✅ Taux de matching global
- ✅ Liste des produits matchés
- ✅ Score par produit
- ✅ Message si pas de résultats

#### Onglet Conformité
- ✅ Score de conformité
- ✅ Liste des checks
- ✅ Statut Valide/Échec
- ✅ Détails de chaque check

#### Onglet Documents
- ✅ Liste des documents
- ✅ Boutons de téléchargement
- ✅ Taille des fichiers

#### Actions
- ✅ Lancer le traitement
- ✅ État de chargement pendant traitement
- ✅ Téléchargement de documents
- ✅ Toast de succès/erreur

#### Navigation
- ✅ Lien retour vers la liste
- ✅ Fil d'ariane

### tenders-loading.test.tsx (État de chargement)

- ✅ Affichage de skeletons
- ✅ Skeleton pour l'en-tête
- ✅ Skeletons pour 6 cartes de tenders
- ✅ Skeleton pour les filtres
- ✅ Skeleton pour la pagination
- ✅ Classes CSS appropriées
- ✅ Accessibilité

### tenders-error.test.tsx (Page d'erreur)

- ✅ Message d'erreur principal
- ✅ Message d'explication
- ✅ Icône d'alerte
- ✅ Suggestions de résolution
- ✅ Bouton "Réessayer"
- ✅ Callback reset() au clic
- ✅ Bouton "Retour au tableau de bord"
- ✅ Navigation vers le dashboard
- ✅ Affichage du message d'erreur en dev
- ✅ Affichage du digest d'erreur
- ✅ Pas de détail en production
- ✅ Classes CSS d'erreur
- ✅ Aria-labels sur les boutons
- ✅ Icônes sur les boutons
- ✅ Centrage du contenu
- ✅ Log de l'erreur dans la console
- ✅ Gestion d'erreurs sans message
- ✅ Responsive mobile

## Exécuter les Tests

```bash
# Tous les tests tenders
npm test -- tenders

# Un fichier spécifique
npm test -- tenders-list.test.tsx

# Avec couverture
npm run test:coverage -- tenders

# Mode watch
npm test -- tenders --watch
```

## Mocks et Utilitaires

### Hooks Mockés
- `useTenders` - Liste des tenders avec filtres
- `useTendersCount` - Compteur total
- `useRelevantTenders` - Tenders pertinents avec scores
- `useTender` - Détail d'un tender
- `useTenderDocuments` - Documents d'un tender
- `useTenderMatchingResults` - Résultats de matching
- `useTenderComplianceResults` - Résultats de conformité
- `useProcessTender` - Mutation pour lancer le traitement
- `useDownloadDocument` - Mutation pour télécharger

### Composants Mockés
- `UploadDCEDialog` - Dialogue d'upload
- `toast` (sonner) - Notifications

### Next.js Mocks
- `useRouter` - Navigation
- `useParams` - Paramètres de route
- `usePathname` - Chemin actuel
- `useSearchParams` - Paramètres de recherche

## Données de Test

### mockTenders
- 3 tenders avec différents status (NEW, ANALYZING, SCORED)
- Sources variées (BOAMP, TED, PLACE)
- Budgets et deadlines réalistes

### mockRelevantTenders
- Extends mockTenders avec scores de pertinence
- Détails de matching (domain, cpv, geo, budget, certifications)
- Recommandations (excellent, bon, moyen)
- Mots-clés matchés

### mockTender (détail)
- Tender complet avec toutes les propriétés
- 3 lots avec budgets
- 4 exigences (3 obligatoires, 1 optionnelle)
- 3 documents PDF
- Critères de jugement avec pondération
- Informations acheteur complètes

### mockMatchingResults
- Taux de matching à 78.5%
- 3 produits matchés avec scores

### mockComplianceResults
- Score de conformité à 88%
- 3 checks (2 réussis, 1 échoué)

## Patterns de Test

### Render avec QueryClient

```typescript
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

### Mock de hooks

```typescript
const { useTenders, useProcessTender } = vi.mocked(require('@/hooks/use-tenders'));

useTenders.mockReturnValue({ data: mockTenders, isLoading: false });
useProcessTender.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
```

### Interactions utilisateur

```typescript
const user = userEvent.setup();
const searchInput = await screen.findByPlaceholderText(/Rechercher/i);
await user.type(searchInput, 'informatique');
```

### Attente de rendu asynchrone

```typescript
await waitFor(() => {
  expect(screen.getByText('Fourniture de matériel')).toBeInTheDocument();
});
```

## Statistiques de Couverture

### Objectifs
- **Lignes**: 80%+
- **Fonctions**: 75%+
- **Branches**: 70%+
- **Statements**: 80%+

### Zones Testées
- ✅ Rendu conditionnel (loading, error, empty, success)
- ✅ Filtrage et recherche client-side
- ✅ Pagination et navigation
- ✅ Interactions utilisateur (clics, saisie)
- ✅ Mutations et side-effects
- ✅ États de chargement et erreur
- ✅ Accessibilité (ARIA, keyboard)
- ✅ Responsive design

### Zones Non Testées (Intentionnel)
- ❌ Styles CSS (visual regression tests)
- ❌ Animations framer-motion (mockées)
- ❌ WebSocket real-time (tests d'intégration)
- ❌ Navigation Next.js réelle (mockée)

## Maintenance

### Ajouter un Test
1. Identifier le comportement à tester
2. Créer un describe() approprié
3. Mocker les dépendances nécessaires
4. Écrire le test avec AAA (Arrange, Act, Assert)
5. Vérifier la couverture

### Debugging
```bash
# Mode debug
npm test -- tenders --no-coverage --reporter=verbose

# Un seul test
npm test -- tenders -t "affiche le titre du tender"

# Avec logs
DEBUG=* npm test -- tenders
```

### CI/CD
Les tests sont exécutés automatiquement sur chaque PR et push vers main.

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Events](https://testing-library.com/docs/user-event/intro)
- [Next.js Testing](https://nextjs.org/docs/testing/vitest)
