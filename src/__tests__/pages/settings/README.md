# Tests Settings & Profile Pages

Tests unitaires complets pour les pages de configuration et de profil utilisateur.

## Fichiers de tests

### 1. `settings-page.test.tsx`
Tests pour la page principale des paramètres (`/settings`).

**Coverage:**
- ✅ Rendu de tous les onglets (General, Features, Notifications, API)
- ✅ Gestion du thème (clair/sombre/système)
- ✅ Sélection de langue et format de date
- ✅ Changement de mot de passe avec validation
- ✅ Activation/désactivation des fonctionnalités IA
- ✅ Configuration des notifications email
- ✅ Intégration Slack
- ✅ Sauvegarde dans localStorage
- ✅ Gestion des erreurs
- ✅ Accessibilité (ARIA, labels, navigation clavier)

**Scénarios de test:**

#### General Tab
- Rendu du sélecteur de thème
- Changement de thème (light/dark/system)
- Sélection de langue (FR/EN)
- Format de date (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- Section MFA (marquée "Bientôt disponible")

#### Security - Password Change
- ✅ Validation: champs requis
- ✅ Validation: minimum 8 caractères
- ✅ Succès: mot de passe changé
- ✅ Erreur: mot de passe actuel incorrect (401)
- ✅ Erreur: erreur serveur (500)
- ✅ État de chargement pendant la requête
- ✅ Nettoyage des champs après succès

#### Features Tab
- Toggle de Fact Checker LLM
- Toggle de Scoring de confiance
- Toggle de Matching vectoriel
- Toggle de téléchargement DCE automatique
- Message d'info "Configuration optimale"

#### Notifications Tab
- Toggle pour chaque type de notification:
  - Décisions HITL en attente
  - Workflow terminé
  - Workflow échoué
  - Rappel de deadline
  - Rapport hebdomadaire
- Intégration Slack avec webhook conditionnel

#### API Tab
- Message "Bientôt disponible"
- Liens vers documentation (Swagger UI, ReDoc)

#### Save Functionality
- ✅ Sauvegarde dans localStorage (features + notifications)
- ✅ Toast de succès
- ✅ État de chargement (bouton désactivé)
- ✅ Gestion d'erreur (toast d'erreur)
- ✅ Persistence des changements

### 2. `mfa-setup.test.tsx`
Tests pour le composant MFA Setup (Authentification à deux facteurs).

**Coverage:**
- ✅ États: loading, disabled, enabled
- ✅ Setup wizard (scan QR → verify code → backup codes)
- ✅ Désactivation MFA
- ✅ Régénération des codes de récupération
- ✅ Validation des codes (6 chiffres numériques)
- ✅ Gestion des erreurs API
- ✅ Accessibilité

**Scénarios de test:**

#### Loading State
- Spinner pendant le chargement du statut

#### MFA Disabled State
- ✅ Carte "MFA désactivé"
- ✅ Input mot de passe pour activer
- ✅ Switch désactivé
- ✅ Validation: mot de passe requis
- ✅ Initiation du setup avec mot de passe valide
- ✅ Erreur: mot de passe invalide

#### Setup Wizard - Scan Step
- ✅ Affichage QR code
- ✅ Toggle code manuel (provisioning URI)
- ✅ Bouton "J'ai scanné le QR code"
- ✅ Bouton "Annuler"

#### Setup Wizard - Verification Step
- ✅ Input code 6 chiffres
- ✅ Validation: uniquement numérique
- ✅ Validation: limite 6 caractères
- ✅ Vérification code valide
- ✅ Erreur: code invalide
- ✅ Bouton "Vérifier" désactivé si code < 6
- ✅ Bouton "Retour" vers scan step

#### Backup Codes Display
- ✅ Affichage de 6 codes
- ✅ Bouton "Copier tout" (clipboard API)
- ✅ Message d'avertissement
- ✅ Bouton "J'ai sauvegardé mes codes"

#### MFA Enabled State
- ✅ Carte "MFA activé"
- ✅ Badge vert
- ✅ Date d'activation
- ✅ Compteur codes de récupération restants
- ✅ Bouton "Régénérer"
- ✅ Switch activé
- ✅ Alerte si codes < 3

#### Disable MFA Dialog
- ✅ Inputs: mot de passe + code MFA
- ✅ Validation: champs requis
- ✅ Désactivation réussie
- ✅ Erreur: credentials invalides
- ✅ Bouton "Annuler"

#### Regenerate Backup Codes
- ✅ Dialog de confirmation
- ✅ Input code MFA
- ✅ Génération de nouveaux codes
- ✅ Affichage des nouveaux codes
- ✅ Copie clipboard
- ✅ Message "anciens codes invalides"

### 3. `preferences.test.tsx`
Tests pour la gestion des préférences utilisateur (composant futur).

**Coverage:**
- ✅ Fréquence des emails (instant, hourly, daily, weekly)
- ✅ Sélection de langue (fr, en)
- ✅ Toggles notifications (email, push)
- ✅ Sauvegarde dans localStorage
- ✅ Chargement depuis localStorage
- ✅ Validation des valeurs
- ✅ Accessibilité

**Scénarios de test:**

#### Rendering
- Formulaire complet
- Tous les champs visibles
- Bouton "Enregistrer"

#### Initial State
- Valeurs par défaut
- Chargement depuis initialPreferences

#### Email Frequency
- 4 options disponibles
- Changement de valeur
- Sauvegarde correcte

#### Language Selection
- FR/EN disponibles
- Changement de langue
- Persistence

#### Notification Toggles
- Email notifications on/off
- Push notifications on/off
- Les deux activés simultanément

#### Save Functionality
- Appel onSave avec valeurs correctes
- Sauvegarde partielle (seulement champs modifiés)
- Multiples sauvegardes

#### LocalStorage Integration
- Sauvegarde JSON
- Chargement JSON
- Gestion données manquantes
- Gestion données corrompues

#### Validation
- Email frequency: uniquement valeurs autorisées
- Language: fr ou en
- Toggles: boolean uniquement

## Exécution des tests

```bash
# Tous les tests settings
npm test src/__tests__/pages/settings

# Un fichier spécifique
npm test src/__tests__/pages/settings/settings-page.test.tsx

# Avec coverage
npm test -- --coverage src/__tests__/pages/settings

# Mode watch
npm test -- --watch src/__tests__/pages/settings
```

## Métriques de couverture attendues

| Fichier | Statements | Branches | Functions | Lines |
|---------|------------|----------|-----------|-------|
| `settings-page.test.tsx` | >95% | >90% | >95% | >95% |
| `mfa-setup.test.tsx` | >95% | >90% | >95% | >95% |
| `preferences.test.tsx` | 100% | 100% | 100% | 100% |

## Dépendances de test

```json
{
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/user-event": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0"
}
```

## Mocks utilisés

### Global Mocks
- `next/navigation` → useRouter
- `next-themes` → useTheme
- `sonner` → toast
- `localStorage` → Storage API
- `fetch` → API calls
- `navigator.clipboard` → Clipboard API

### API Endpoints Mocked
- `/auth/change-password`
- `/mfa/status`
- `/mfa/setup/init`
- `/mfa/setup/complete`
- `/mfa/disable`
- `/mfa/backup-codes/regenerate`

## Patterns de test utilisés

### 1. User Event Pattern
```typescript
const user = userEvent.setup();
await user.type(input, "value");
await user.click(button);
```

### 2. Async Assertions
```typescript
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

### 3. LocalStorage Mocking
```typescript
const localStorageMock: { [key: string]: string } = {};
global.localStorage = {
  getItem: vi.fn((key) => localStorageMock[key] || null),
  setItem: vi.fn((key, value) => { localStorageMock[key] = value; }),
  // ...
};
```

### 4. API Mocking
```typescript
mockFetch.mockResolvedValue({
  ok: true,
  json: async () => ({ data: "value" }),
});
```

### 5. Error Handling Tests
```typescript
mockFetch.mockRejectedValue(new Error("Network error"));
// Verify graceful degradation
```

## Accessibilité testée

### ARIA
- ✅ Roles corrects (button, tab, dialog, switch)
- ✅ Labels associés aux inputs
- ✅ Headings hiérarchiques
- ✅ Focus management dans les dialogs

### Keyboard Navigation
- ✅ Tab entre les champs
- ✅ Enter pour soumettre
- ✅ Escape pour fermer dialogs

### Screen Readers
- ✅ Labels descriptifs
- ✅ Messages d'erreur annoncés
- ✅ États dynamiques (loading, success, error)

## Edge Cases couverts

1. **Données invalides dans localStorage** → Fallback sur defaults
2. **API timeout/erreur** → Messages d'erreur appropriés
3. **Champs vides** → Validation côté client
4. **Inputs numériques** → Limitation aux chiffres uniquement
5. **Longueur maximale** → maxLength respecté
6. **États de chargement** → Boutons désactivés, spinners visibles
7. **Navigation entre steps** → Retour en arrière fonctionnel
8. **Annulation** → Reset de l'état

## Notes importantes

### Settings Page
- La page utilise **localStorage** pour persister features et notifications
- Les clés utilisées:
  - `appel-offre-features`
  - `appel-offre-notifications`
- Le changement de mot de passe appelle l'API backend
- MFA est marqué "Bientôt disponible" dans General > Security

### MFA Setup
- Le composant est **standalone** et peut être intégré n'importe où
- Utilise l'API `/mfa/*` du backend
- Stocke le token JWT dans `localStorage.access_token`
- Les backup codes ne sont affichés qu'**une seule fois**
- L'utilisateur doit les sauvegarder avant de fermer le dialog

### Preferences (Future)
- Composant de démonstration pour tester la logique
- Prêt à être intégré dans la vraie page Settings
- Validation complète des valeurs
- Persistence localStorage

## TODOs / Améliorations futures

- [ ] Tests E2E avec Playwright pour les workflows complets
- [ ] Tests de performance (render time, re-renders)
- [ ] Tests de régression visuelle (Chromatic/Percy)
- [ ] Tests d'internationalisation (i18n)
- [ ] Tests de thèmes (light/dark mode)
- [ ] Tests de responsive design (mobile/tablet/desktop)
- [ ] Tests de compatibilité navigateurs
- [ ] Tests de sécurité (XSS, CSRF dans forms)

## Contribution

Pour ajouter de nouveaux tests:

1. Suivre la structure existante (describe > it)
2. Utiliser `userEvent` au lieu de `fireEvent` quand possible
3. Toujours cleanup avec `beforeEach` et `afterEach`
4. Mocker les dépendances externes
5. Tester les cas d'erreur ET de succès
6. Vérifier l'accessibilité (labels, roles, etc.)
7. Documenter les nouveaux patterns dans ce README

## Ressources

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Docs](https://vitest.dev/)
- [User Event Docs](https://testing-library.com/docs/user-event/intro)
- [Accessibility Testing](https://testing-library.com/docs/queries/about#priority)
