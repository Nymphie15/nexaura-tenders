# Zustand Store Tests

Tests unitaires complets pour tous les stores Zustand de l'application.

## Stores Testés

### 1. **notification-store.test.ts**
Tests pour le store de gestion des notifications.

**Couverture:**
- ✅ État initial (notifications vides, unreadCount à 0)
- ✅ Actions:
  - `addNotification` - Ajout de notifications avec génération d'ID et timestamp
  - `markAsRead` - Marquage comme lu avec décrémentation du compteur
  - `markAllAsRead` - Marquage de toutes les notifications comme lues
  - `removeNotification` - Suppression avec gestion du compteur non-lu
  - `clearAll` - Nettoyage complet
  - `fetchNotifications` - Chargement avec gestion loading/error
- ✅ Sélecteurs:
  - `getFilteredNotifications` - Filtrage par type/priorité/statut de lecture
  - `getNotificationsByType` - Filtrage par type uniquement
  - `getNotificationsByPriority` - Filtrage par priorité uniquement
- ✅ Edge cases (opérations multiples, cohérence d'état)

**Total:** 40+ cas de test

---

### 2. **auth-store.test.ts**
Tests pour le store d'authentification avec persistence.

**Couverture:**
- ✅ État initial (non authentifié, tokens null)
- ✅ Actions:
  - `login` - Connexion avec stockage tokens (store + localStorage)
  - `register` - Inscription avec création de compte
  - `logout` - Déconnexion avec nettoyage (même si API fail)
  - `refreshAccessToken` - Renouvellement du token d'accès
  - `setUser` - Mise à jour des données utilisateur
  - `checkAuth` - Vérification d'authentification
  - `setHasHydrated` - Gestion de l'état d'hydratation
- ✅ Gestion des erreurs (login failed, refresh failed)
- ✅ Persistence (partialize - user, tokens, isAuthenticated)
- ✅ SSR-safe storage (gestion server-side rendering)
- ✅ Edge cases (concurrent login, state consistency)

**Total:** 25+ cas de test

---

### 3. **extension-store.test.ts**
Tests pour le store de communication avec l'extension navigateur.

**Couverture:**
- ✅ État initial (non connecté, pas d'imports)
- ✅ Actions:
  - `setConnected` - Mise à jour statut connexion + version
  - `addPendingImport` - Ajout d'import en attente avec ID unique
  - `removePendingImport` - Suppression par ID
  - `clearPendingImports` - Nettoyage complet
  - `updateLastSync` - Mise à jour timestamp sync
  - `syncWithExtension` - Communication avec extension Chrome
- ✅ Sélecteurs:
  - `useIsExtensionConnected` - Hook statut connexion
  - `usePendingImports` - Hook liste imports
  - `usePendingImportsCount` - Hook compteur imports
- ✅ Gestion chrome.runtime (avec/sans extension)
- ✅ Persistence (pendingImports, lastSync uniquement)
- ✅ Edge cases (rapid additions, Date objects)

**Total:** 30+ cas de test

---

### 4. **preferences-store.test.ts**
Tests pour le store de préférences utilisateur.

**Couverture:**
- ✅ État initial (valeurs par défaut)
- ✅ Actions:
  - `updateNotificationPrefs` - Mise à jour préférences notifications
    - email, push, inApp
    - digest (none, daily, weekly)
    - types (newTenders, deadlines, analysis, system)
  - `setLanguage` - Changement langue (fr/en)
  - `setDateFormat` - Format de date (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
  - `resetAllPreferences` - Reset complet aux valeurs par défaut
- ✅ Merge intelligent des préférences (sans écraser)
- ✅ Persistence (toutes les préférences)
- ✅ SSR-safe storage
- ✅ Edge cases (rapid updates, mixed operations)

**Total:** 35+ cas de test

---

## Lancer les Tests

### Tous les tests stores

```bash
cd web-client
npm test -- stores
```

### Test spécifique

```bash
# Notification store
npm test -- notification-store.test.ts

# Auth store
npm test -- auth-store.test.ts

# Extension store
npm test -- extension-store.test.ts

# Preferences store
npm test -- preferences-store.test.ts
```

### Mode watch (développement)

```bash
npm test -- stores --watch
```

### Avec coverage

```bash
npm test -- stores --coverage
```

---

## Structure des Tests

Chaque fichier de test suit cette structure:

```typescript
describe("StoreName", () => {
  beforeEach(() => {
    // Reset store state
    // Clear localStorage
    // Clear mocks
  });

  describe("Initial State", () => {
    // Tests de l'état initial
  });

  describe("actionName", () => {
    // Tests pour chaque action
    it("should do something", () => {
      // Arrange
      // Act
      // Assert
    });
  });

  describe("Selectors", () => {
    // Tests des sélecteurs
  });

  describe("Edge Cases", () => {
    // Tests de cas limites
  });
});
```

---

## Bonnes Pratiques Appliquées

### 1. **Isolation des Tests**
- Chaque test commence avec un store réinitialisé
- `beforeEach` reset le state complet
- `localStorage` est mocké et nettoyé

### 2. **Mocking**
- API endpoints mockés (`vi.mock`)
- `localStorage` mocké pour éviter side effects
- `crypto.randomUUID` mocké pour tests déterministes

### 3. **Coverage Complète**
- ✅ Happy paths (scénarios normaux)
- ✅ Error paths (gestion d'erreurs)
- ✅ Edge cases (cas limites)
- ✅ State persistence
- ✅ SSR compatibility

### 4. **Assertions Robustes**
- Vérification de l'état avant/après
- Tests de non-régression
- Validation des side effects (localStorage, API calls)

---

## Dépendances

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

---

## Résultats Attendus

**Coverage cible:** 95%+

- Branches: 95%+
- Functions: 100%
- Lines: 95%+
- Statements: 95%+

---

## Debugging

### Voir les logs pendant les tests

```bash
npm test -- stores --reporter=verbose
```

### Mode UI interactif

```bash
npm test -- --ui
# Ouvre http://localhost:51204/__vitest__/
```

### Tester un cas spécifique

```typescript
it.only("should test this specific case", () => {
  // Ce test sera le seul à s'exécuter
});
```

---

## Maintenance

### Ajouter un nouveau test

1. Identifiez le store à tester
2. Ajoutez un `describe` ou `it` dans le fichier correspondant
3. Suivez le pattern AAA (Arrange, Act, Assert)
4. Assurez-vous du reset dans `beforeEach`

### Modifier un store

Quand vous modifiez un store:
1. ✅ Mettez à jour les tests correspondants
2. ✅ Ajoutez des tests pour les nouveaux comportements
3. ✅ Vérifiez que tous les tests passent
4. ✅ Vérifiez le coverage

---

## Notes Importantes

### SSR (Server-Side Rendering)

Tous les stores utilisent `safeStorage` pour gérer SSR:

```typescript
const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(name);
  },
  // ...
};
```

Les tests vérifient ce comportement.

### Persistence (Zustand)

Certains stores utilisent `persist` middleware:
- `auth-store`: partialize (user, tokens, isAuthenticated)
- `extension-store`: partialize (pendingImports, lastSync)
- `preferences-store`: partialize (toutes les préférences)

Les tests vérifient que seuls les champs configurés sont persistés.

---

## Troubleshooting

### "localStorage is not defined"

Les tests mockent `localStorage`. Si vous voyez cette erreur:
- Vérifiez que le mock est bien défini dans le test
- Assurez-vous que `beforeEach` est bien exécuté

### "Cannot read property 'getState' of undefined"

Le store n'est pas importé correctement:
- Vérifiez le chemin d'import (`@/stores/...`)
- Assurez-vous que le store est bien exporté

### Tests qui passent isolément mais échouent ensemble

Problème d'isolation:
- Vérifiez que `beforeEach` reset bien TOUT l'état
- Clearez les mocks avec `vi.clearAllMocks()`
- Assurez-vous que `localStorage` est bien nettoyé

---

**Dernière mise à jour:** 2026-01-25
