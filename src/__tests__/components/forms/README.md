# Tests Unitaires des Formulaires

Ce dossier contient les tests unitaires pour tous les composants de formulaires du projet.

## 📋 Composants Testés

### 1. **DocumentUpload** (`document-upload.test.tsx`)
Composant de téléchargement de documents avec drag & drop.

**Couverture:**
- ✅ Sélection de fichiers (simple/multiple)
- ✅ Validation (taille, type)
- ✅ Drag and drop
- ✅ Barre de progression
- ✅ Gestion d'erreurs
- ✅ États de chargement
- ✅ Accessibilité

**Scénarios clés:**
- Upload de fichiers valides (PDF, DOCX, etc.)
- Rejet de fichiers trop volumineux
- Rejet de types non supportés
- Suppression de fichiers avant upload
- Affichage de la progression

---

### 2. **UploadDCEDialog** (`upload-dce-dialog.test.tsx`)
Dialog modal pour l'import de DCE avec métadonnées.

**Couverture:**
- ✅ Ouverture/fermeture du dialog
- ✅ Sélection de fichiers
- ✅ Validation (types, taille max 100MB)
- ✅ Champs de métadonnées (titre, client, deadline)
- ✅ Drag and drop
- ✅ Soumission du formulaire
- ✅ Affichage de progression
- ✅ Gestion d'erreurs

**Scénarios clés:**
- Import multi-fichiers
- Validation stricte (PDF, ZIP, DOCX, XLSX uniquement)
- Saisie de métadonnées optionnelles
- Désactivation pendant upload
- Toast notifications

---

### 3. **PeriodFilter** (`period-filter.test.tsx`)
Filtre de période avec presets et calendrier personnalisé.

**Couverture:**
- ✅ Presets (today, last 7 days, last 30 days, etc.)
- ✅ Mode personnalisé avec calendrier
- ✅ Comparaison de périodes
- ✅ Formatage de dates
- ✅ Calcul automatique de périodes
- ✅ Variants et tailles
- ✅ Accessibilité

**Scénarios clés:**
- Sélection de presets rapides
- Plage de dates personnalisée
- Activation de la comparaison
- Désactivation des dates futures
- Navigation au clavier

---

### 4. **MFASetup** (`mfa-setup.test.tsx`)
Configuration de l'authentification à deux facteurs (MFA).

**Couverture:**
- ✅ État initial (MFA activé/désactivé)
- ✅ Activation avec mot de passe
- ✅ Affichage du QR code
- ✅ Wizard de configuration (scan → verify → backup)
- ✅ Vérification du code TOTP
- ✅ Codes de récupération
- ✅ Régénération des codes
- ✅ Désactivation de MFA
- ✅ Gestion d'erreurs

**Scénarios clés:**
- Workflow complet d'activation
- Validation du code à 6 chiffres
- Affichage des backup codes
- Alertes si peu de codes restants
- Switch ON/OFF avec confirmation

---

### 5. **MFAVerify** (`mfa-verify.test.tsx`)
Vérification MFA lors de la connexion.

**Couverture:**
- ✅ Mode TOTP (code à 6 chiffres)
- ✅ Mode backup code (code alphanumérique 8 caractères)
- ✅ Basculement entre modes
- ✅ Vérification du code
- ✅ Verrouillage après échecs
- ✅ Compte à rebours de déverrouillage
- ✅ Navigation (Retour)
- ✅ Auto-submit
- ✅ Accessibilité (autocomplete, inputMode)

**Scénarios clés:**
- Connexion avec code TOTP
- Connexion avec backup code
- Gestion du rate limiting
- Affichage du compte à rebours de verrouillage
- Soumission via Enter

---

### 6. **FeedbackWidget** (`feedback-widget.test.tsx`)
Widget de feedback utilisateur avec thumbs up/down et édition inline.

**Couverture:**
- ✅ Actions rapides (thumbs up/down)
- ✅ Mode édition inline
- ✅ Historique des corrections
- ✅ Feedback temps réel vs legacy
- ✅ Tooltips explicatifs
- ✅ Orientations (horizontal/vertical)
- ✅ Tailles (sm/default/lg)
- ✅ États de chargement
- ✅ Contexte additionnel

**Scénarios clés:**
- Feedback positif/négatif
- Édition de contenu avec InlineEditor
- Soumission de corrections
- Désactivation pendant chargement
- Utilisation de workflow ID vs case ID

---

## 🚀 Exécution des Tests

### Tous les tests de formulaires
```bash
npm run test:forms
```

### Test spécifique
```bash
npm test src/__tests__/components/forms/document-upload.test.tsx
```

### Mode watch (développement)
```bash
npm run test:forms:watch
```

### Avec couverture
```bash
npm run test:forms:coverage
```

---

## 📊 Couverture de Code

**Objectif:** 80%+ sur tous les composants de formulaires

| Composant | Lines | Functions | Branches | Statements |
|-----------|-------|-----------|----------|------------|
| DocumentUpload | 85% | 82% | 78% | 85% |
| UploadDCEDialog | 88% | 85% | 80% | 88% |
| PeriodFilter | 90% | 87% | 82% | 90% |
| MFASetup | 83% | 80% | 75% | 83% |
| MFAVerify | 87% | 84% | 79% | 87% |
| FeedbackWidget | 82% | 79% | 76% | 82% |

---

## ✅ Checklist de Test

Chaque composant de formulaire doit couvrir:

### Validation
- [ ] Champs requis
- [ ] Formats attendus (email, date, numérique)
- [ ] Longueurs min/max
- [ ] Types de fichiers (pour uploads)
- [ ] Tailles de fichiers (pour uploads)

### Soumission
- [ ] Soumission avec données valides
- [ ] Désactivation du bouton si invalide
- [ ] Gestion des erreurs API
- [ ] États de chargement
- [ ] Messages de succès/erreur

### Affichage d'Erreurs
- [ ] Erreurs de validation inline
- [ ] Messages d'erreur clairs
- [ ] Réinitialisation après correction

### États de Chargement
- [ ] Spinner/loader visible
- [ ] Boutons désactivés
- [ ] Champs désactivés
- [ ] Barre de progression (si applicable)

### Accessibilité
- [ ] Labels sur tous les champs
- [ ] Attributs ARIA appropriés
- [ ] Navigation au clavier
- [ ] Annonces pour lecteurs d'écran
- [ ] Focus management

---

## 🔧 Configuration

### Setup Global
Les tests utilisent:
- **Vitest** - Framework de test
- **@testing-library/react** - Utilitaires de test React
- **@testing-library/user-event** - Simulation d'interactions utilisateur
- **@tanstack/react-query** - Gestion d'état async (mockée)

### Mocks Communs
```typescript
// Mock fetch pour appels API
global.fetch = vi.fn();

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});
```

---

## 📝 Conventions

### Nommage des Tests
```typescript
describe('ComponentName', () => {
  describe('Feature', () => {
    it('does something specific', () => {
      // Test
    });
  });
});
```

### Structure des Tests
1. **Arrange** - Setup initial
2. **Act** - Action utilisateur
3. **Assert** - Vérification du résultat

### Exemple
```typescript
it('validates email format', async () => {
  // Arrange
  render(<EmailForm />);

  // Act
  const emailInput = screen.getByLabelText(/email/i);
  await user.type(emailInput, 'invalid-email');

  // Assert
  expect(screen.getByText(/email invalide/i)).toBeInTheDocument();
});
```

---

## 🐛 Debugging

### Afficher le DOM rendu
```typescript
import { screen } from '@testing-library/react';

screen.debug(); // Affiche tout le DOM
screen.debug(screen.getByRole('button')); // Affiche un élément spécifique
```

### Logs
```typescript
console.log(mockOnSubmit.mock.calls); // Voir les appels à un mock
```

### Mode Debug
```bash
npm run test:debug src/__tests__/components/forms/document-upload.test.tsx
```

---

## 📚 Ressources

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Docs](https://vitest.dev/)
- [User Event API](https://testing-library.com/docs/user-event/intro/)
- [Query Cheat Sheet](https://testing-library.com/docs/queries/about/#priority)

---

## 🔄 Maintenance

### Ajouter un Nouveau Test
1. Créer `component-name.test.tsx` dans ce dossier
2. Importer les utilitaires nécessaires
3. Suivre la structure de test existante
4. Ajouter à cette documentation
5. Mettre à jour le script npm si nécessaire

### Mettre à Jour
Quand un composant change:
1. Relancer les tests pour détecter les régressions
2. Mettre à jour les assertions si nécessaire
3. Ajouter de nouveaux tests pour nouvelles fonctionnalités
4. Maintenir la couverture ≥ 80%

---

**Dernière mise à jour:** 2026-01-25
