# Authentication Tests

Suite complète de tests unitaires pour le système d'authentification de l'application.

## Structure des Tests

```
src/__tests__/auth/
├── login-page.test.tsx         # Tests de la page de connexion
├── auth-store.test.ts          # Tests du store d'authentification (Zustand)
├── token-refresh.test.ts       # Tests du rafraîchissement automatique des tokens
├── protected-routes.test.tsx   # Tests des routes protégées
├── token-storage.test.ts       # Tests du stockage et gestion des tokens
└── README.md                   # Cette documentation
```

## Tests Couverts

### 1. Login Page (`login-page.test.tsx`)

**Ce qui est testé:**
- ✅ Rendu du formulaire avec tous les champs
- ✅ Validation des champs (email, mot de passe requis)
- ✅ Toggle de visibilité du mot de passe
- ✅ Switch "Se souvenir de moi"
- ✅ Flux de connexion réussi
- ✅ Gestion des erreurs de connexion
- ✅ État de chargement pendant la connexion
- ✅ Redirection vers /tenders après connexion
- ✅ Affichage des toasts de succès/erreur
- ✅ Accessibilité (labels, types d'input)
- ✅ Sécurité (prévention de soumission par défaut)

**Commande:**
```bash
npm test login-page.test.tsx
```

### 2. Auth Store (`auth-store.test.ts`)

**Ce qui est testé:**
- ✅ État initial du store
- ✅ Login: appel API, mise à jour du state, stockage tokens
- ✅ Register: création de compte et authentification
- ✅ Logout: nettoyage du state et localStorage
- ✅ Token refresh: renouvellement du token d'accès
- ✅ Check auth: vérification de session valide
- ✅ Gestion des erreurs (login failed, refresh failed)
- ✅ État de chargement (isLoading)
- ✅ Persistence (auth-storage dans localStorage)
- ✅ Hydration (SSR compatibility)

**Commande:**
```bash
npm test auth-store.test.ts
```

### 3. Token Refresh (`token-refresh.test.ts`)

**Ce qui est testé:**
- ✅ Intercepteur de requêtes (ajout du token Bearer)
- ✅ Ajout des headers Trace-ID et Request-ID
- ✅ Détection automatique du 401
- ✅ Tentative de refresh sur 401
- ✅ Retry de la requête originale avec nouveau token
- ✅ Prévention des tentatives multiples simultanées
- ✅ Redirection vers /login si refresh échoue
- ✅ Nettoyage des tokens sur échec
- ✅ Gestion des tokens expirés
- ✅ Gestion des requêtes concurrentes

**Commande:**
```bash
npm test token-refresh.test.ts
```

### 4. Protected Routes (`protected-routes.test.tsx`)

**Ce qui est testé:**
- ✅ Affichage du loading pendant l'hydration
- ✅ Redirection vers /login si non authentifié
- ✅ Affichage du contenu si authentifié
- ✅ Pas de redirection depuis la page login
- ✅ Vérification du token au montage du composant
- ✅ Gestion des échecs de vérification
- ✅ Attente de l'hydration avant check auth
- ✅ Restauration de session depuis le storage
- ✅ Gestion des données de session corrompues
- ✅ Protection de multiples routes
- ✅ Contrôle d'accès basé sur les rôles

**Commande:**
```bash
npm test protected-routes.test.tsx
```

### 5. Token Storage (`token-storage.test.ts`)

**Ce qui est testé:**
- ✅ Stockage des tokens au login
- ✅ Stockage double format (direct + auth-storage)
- ✅ Suppression des tokens au logout
- ✅ Mise à jour du token au refresh
- ✅ Pas de stockage des mots de passe
- ✅ Compatibilité SSR (window undefined)
- ✅ Nettoyage complet sur breach de sécurité
- ✅ Gestion des données localStorage corrompues
- ✅ Synchronisation entre formats de stockage
- ✅ Gestion du quota exceeded
- ✅ Synchronisation multi-onglets

**Commande:**
```bash
npm test token-storage.test.ts
```

## Exécution des Tests

### Tous les tests d'authentification
```bash
npm test auth/
```

### Test spécifique
```bash
npm test auth/login-page.test.tsx
```

### Avec couverture
```bash
npm run test:coverage -- auth/
```

### En mode watch
```bash
npm test -- --watch auth/
```

## Couverture des Tests

### Objectifs de Couverture

| Composant | Statements | Branches | Functions | Lines |
|-----------|-----------|----------|-----------|-------|
| Login Page | > 90% | > 85% | > 90% | > 90% |
| Auth Store | > 95% | > 90% | > 95% | > 95% |
| API Client | > 85% | > 80% | > 85% | > 85% |
| **Total** | **> 90%** | **> 85%** | **> 90%** | **> 90%** |

## Scénarios de Test Critiques

### 1. Flux de Connexion Complet
```typescript
test("login flow", async () => {
  1. Utilisateur entre email + password
  2. Submit du formulaire
  3. Appel API login
  4. Stockage des tokens (localStorage + store)
  5. Mise à jour du state (user, isAuthenticated)
  6. Affichage du toast de succès
  7. Redirection vers /tenders
});
```

### 2. Refresh Automatique des Tokens
```typescript
test("token refresh", async () => {
  1. Requête API avec token expiré → 401
  2. Intercepteur détecte le 401
  3. Appel API /auth/refresh avec refresh token
  4. Réception nouveau access token
  5. Mise à jour localStorage
  6. Retry de la requête originale avec nouveau token
});
```

### 3. Expiration de Session
```typescript
test("session expiration", async () => {
  1. Token refresh échoue (refresh token expiré)
  2. Nettoyage des tokens (localStorage + store)
  3. Mise à jour state (user = null, isAuthenticated = false)
  4. Affichage toast "Session expirée"
  5. Redirection vers /login après délai
});
```

### 4. Restauration de Session
```typescript
test("session restore", async () => {
  1. Utilisateur ferme et rouvre l'onglet
  2. Zustand restore depuis localStorage (hydration)
  3. Vérification du token via /auth/me
  4. Si valide: rester authentifié
  5. Si invalide: logout + redirect
});
```

## Mocks & Setup

### Dépendances Mockées

```typescript
// Next.js
vi.mock("next/navigation");

// Sonner (toasts)
vi.mock("sonner");

// API endpoints
vi.mock("@/lib/api/endpoints");

// Axios (pour les tests d'intercepteurs)
vi.mock("axios");
```

### Setup Commun

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();

  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    _hasHydrated: true,
  });
});
```

## Bonnes Pratiques

### 1. Utiliser `act()` pour les Actions Asynchrones
```typescript
await act(async () => {
  await result.current.login("email@example.com", "password");
});
```

### 2. Attendre les Mises à Jour UI
```typescript
await waitFor(() => {
  expect(screen.getByText("Success")).toBeInTheDocument();
});
```

### 3. Nettoyer Après Chaque Test
```typescript
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});
```

### 4. Tester les Cas Limites
- Tokens expirés
- Réseau indisponible
- Données corrompues
- Quota localStorage dépassé
- Multi-onglets

## Maintenance

### Ajouter un Nouveau Test

1. Créer le fichier dans `src/__tests__/auth/`
2. Importer les dépendances nécessaires
3. Mocker les modules externes
4. Écrire les tests avec `describe` / `it`
5. Ajouter la documentation dans ce README
6. Vérifier la couverture: `npm run test:coverage`

### Mettre à Jour un Test Existant

1. Vérifier que le test échoue d'abord (TDD)
2. Modifier le code ou le test
3. Vérifier que tous les tests passent
4. Mettre à jour la documentation si nécessaire
5. Vérifier la non-régression

## Dépannage

### Tests qui Échouent

**Erreur: "window is not defined"**
```typescript
// Solution: Mock window
beforeEach(() => {
  global.window = { ...global.window };
});
```

**Erreur: "localStorage is not defined"**
```typescript
// Solution: Déjà géré par jsdom, mais vérifier le cleanup
afterEach(() => {
  localStorage.clear();
});
```

**Erreur: "act() warning"**
```typescript
// Solution: Wrapper toutes les mises à jour d'état dans act()
await act(async () => {
  await someAsyncAction();
});
```

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Events](https://testing-library.com/docs/user-event/intro)
- [Zustand Testing Guide](https://docs.pmnd.rs/zustand/guides/testing)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing/vitest)

## Contribution

Pour ajouter de nouveaux tests d'authentification:

1. Identifier la fonctionnalité à tester
2. Créer un fichier de test approprié
3. Suivre les conventions de nommage (`*.test.ts` ou `*.test.tsx`)
4. Ajouter des descriptions claires (`describe` / `it`)
5. Atteindre au minimum 85% de couverture
6. Documenter dans ce README
7. Soumettre une PR avec les tests

---

**Dernière mise à jour:** 2026-01-25
**Mainteneur:** Claude Code
**Framework:** Vitest + React Testing Library
