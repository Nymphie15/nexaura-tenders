# Documentation Accessibilite - Web Client

Ce document decrit les fonctionnalites d'accessibilite implementees dans le projet web-client, conformement aux directives WCAG 2.1 niveau AA.

## Table des matieres

1. [Vue d'ensemble](#vue-densemble)
2. [Composants accessibles](#composants-accessibles)
3. [ARIA Labels](#aria-labels)
4. [Navigation clavier](#navigation-clavier)
5. [Contraste et couleurs](#contraste-et-couleurs)
6. [Gestion du focus](#gestion-du-focus)
7. [Lecteurs d'ecran](#lecteurs-decran)
8. [Bonnes pratiques](#bonnes-pratiques)

---

## Vue d'ensemble

L'application implemente les standards d'accessibilite suivants:

- **WCAG 2.1 AA** - Conformite complete
- **Section 508** - Compatible
- **EN 301 549** - Compatible (norme europeenne)

### Principes POUR (WCAG)

| Principe | Description | Implementation |
|----------|-------------|----------------|
| **Perceptible** | L'information doit etre presentable aux utilisateurs | Textes alternatifs, contrastes, annonces SR |
| **Utilisable** | Les composants doivent etre utilisables | Navigation clavier complete |
| **Comprehensible** | L'information doit etre comprehensible | Labels clairs, messages d'erreur explicites |
| **Robuste** | Le contenu doit etre interprete de maniere fiable | HTML semantique, ARIA valide |

---

## Composants accessibles

### AccessibleTable (`accessible-table.tsx`)

Table de donnees avec accessibilite complete.

**Fonctionnalites:**
- Navigation clavier par fleches dans les cellules
- Tri annonce aux lecteurs d'ecran
- Entetes de colonnes avec `aria-sort`
- Selection de lignes avec feedback visuel et ARIA

**Utilisation:**
```tsx
import { AccessibleTable } from "@/components/ui/accessible-table";

<AccessibleTable
  data={data}
  columns={columns}
  caption="Liste des appels d'offres"
  ariaLabel="Tableau des appels d'offres en cours"
  onSort={(columnId, direction) => handleSort(columnId, direction)}
  sortColumn="date"
  sortDirection="desc"
/>
```

**Props ARIA:**
- `role="grid"` sur la table
- `role="row"` sur chaque ligne
- `role="columnheader"` sur les entetes
- `role="gridcell"` sur les cellules
- `aria-sort` sur les colonnes triables
- `aria-selected` sur les lignes selectionnees

### FocusTrap (`focus-trap.tsx`)

Piege le focus dans les modales et dialogues.

**Fonctionnalites:**
- Empeche le focus de sortir du conteneur
- Supporte Tab et Shift+Tab
- Retourne le focus a l'element precedent a la fermeture
- Focus automatique sur le premier element

**Utilisation:**
```tsx
import { FocusTrap } from "@/components/ui/focus-trap";

<FocusTrap active={isOpen} returnFocus>
  <Dialog>
    <DialogContent>...</DialogContent>
  </Dialog>
</FocusTrap>
```

### SkipLink (`skip-link.tsx`)

Lien de saut au contenu principal (WCAG 2.4.1).

**Fonctionnalites:**
- Cache visuellement mais visible au focus
- Permet de sauter directement au contenu
- Animation de transition fluide

**Utilisation:**
```tsx
import { SkipLink } from "@/components/ui/skip-link";

// Dans le layout principal
<SkipLink targetId="main-content">
  Aller au contenu principal
</SkipLink>

// Cible
<main id="main-content">...</main>
```

### ScreenReaderOnly (`screen-reader-only.tsx`)

Texte visible uniquement par les lecteurs d'ecran.

**Fonctionnalites:**
- Style sr-only conforme aux bonnes pratiques
- Support des live regions
- Variante focusable pour les liens

**Utilisation:**
```tsx
import { ScreenReaderOnly, LiveAnnouncer } from "@/components/ui/screen-reader-only";

// Texte cache
<ScreenReaderOnly>
  Informations supplementaires pour les lecteurs d'ecran
</ScreenReaderOnly>

// Annonces dynamiques
<LiveAnnouncer message={statusMessage} priority="polite" />
```

---

## ARIA Labels

### Attributs utilises

| Attribut | Utilisation | Exemple |
|----------|-------------|---------|
| `aria-label` | Label descriptif | `aria-label="Fermer la modal"` |
| `aria-labelledby` | Reference a un element label | `aria-labelledby="dialog-title"` |
| `aria-describedby` | Description supplementaire | `aria-describedby="help-text"` |
| `aria-live` | Annonces dynamiques | `aria-live="polite"` |
| `aria-expanded` | Etat ouvert/ferme | `aria-expanded="true"` |
| `aria-selected` | Element selectionne | `aria-selected="true"` |
| `aria-sort` | Direction du tri | `aria-sort="ascending"` |
| `aria-disabled` | Element desactive | `aria-disabled="true"` |
| `aria-busy` | Chargement en cours | `aria-busy="true"` |
| `aria-current` | Element actuel | `aria-current="page"` |

### Labels de statut

La fonction `getAriaLabel()` traduit les statuts en texte accessible:

```typescript
import { getAriaLabel } from "@/lib/accessibility";

getAriaLabel("pending");     // "En attente"
getAriaLabel("processing");  // "En cours de traitement"
getAriaLabel("completed");   // "Termine"
getAriaLabel("failed");      // "Echoue"
```

---

## Navigation clavier

### Raccourcis globaux

| Touche | Action |
|--------|--------|
| `Tab` | Passer a l'element focusable suivant |
| `Shift + Tab` | Passer a l'element focusable precedent |
| `Enter` / `Space` | Activer l'element |
| `Escape` | Fermer modal/dropdown |

### Navigation dans les tables

| Touche | Action |
|--------|--------|
| `Fleches` | Naviguer entre les cellules |
| `Home` | Aller au debut de la ligne |
| `End` | Aller a la fin de la ligne |
| `Ctrl + Home` | Aller a la premiere cellule |
| `Ctrl + End` | Aller a la derniere cellule |
| `Enter` | Activer le tri / Selectionner la ligne |

### Navigation dans les listes

Le hook `useKeyboardNavigation` fournit:

```typescript
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";

const {
  activeIndex,
  containerProps,
  getItemProps,
} = useKeyboardNavigation({
  items: menuItems,
  onSelect: (item) => handleSelect(item),
  onEscape: () => closeMenu(),
  orientation: "vertical",
  loop: true,
  typeahead: true, // Recherche par caractere
});
```

| Touche | Action |
|--------|--------|
| `Arrow Up/Down` | Navigation verticale |
| `Arrow Left/Right` | Navigation horizontale |
| `Home` | Premier element |
| `End` | Dernier element |
| `Enter` / `Space` | Selectionner |
| `Escape` | Fermer / Annuler |
| `Caractere` | Recherche typeahead |

---

## Contraste et couleurs

### Ratios de contraste WCAG

| Niveau | Texte normal | Texte large |
|--------|-------------|-------------|
| **AA** | 4.5:1 minimum | 3:1 minimum |
| **AAA** | 7:1 minimum | 4.5:1 minimum |

### Verification du contraste

```typescript
import { getContrastRatio, meetsWCAGAA, meetsWCAGAAA } from "@/lib/accessibility";

const ratio = getContrastRatio("#000000", "#ffffff"); // 21
meetsWCAGAA(ratio);       // true (texte normal)
meetsWCAGAA(ratio, true); // true (texte large)
meetsWCAGAAA(ratio);      // true
```

### Couleurs utilisees

Les couleurs du design system respectent les ratios de contraste:

| Element | Couleur | Fond | Ratio |
|---------|---------|------|-------|
| Texte principal | `#020817` | `#ffffff` | 18.8:1 |
| Texte secondaire | `#64748b` | `#ffffff` | 4.7:1 |
| Liens | `#0f172a` | `#ffffff` | 16.8:1 |
| Erreurs | `#dc2626` | `#ffffff` | 4.5:1 |

### Mouvement reduit

```typescript
import { prefersReducedMotion, onReducedMotionChange } from "@/lib/accessibility";

if (prefersReducedMotion()) {
  // Desactiver les animations
}

// Ecouter les changements
onReducedMotionChange((reduced) => {
  setAnimationsEnabled(!reduced);
});
```

---

## Gestion du focus

### Focus visible

Tous les elements interactifs ont un indicateur de focus visible:

```css
/* Style de focus par defaut */
.focus-visible:focus {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Focus trap

```typescript
import { trapFocus, createFocusGuard } from "@/lib/accessibility";

// Pieger le focus
const cleanup = trapFocus(modalElement);

// Liberer
cleanup();

// Sauvegarder et restaurer le focus
const focusGuard = createFocusGuard();
focusGuard.save();   // Sauvegarder le focus actuel
// ... operations ...
focusGuard.restore(); // Restaurer le focus
```

### Elements focusables

Liste des elements consideres comme focusables:

```typescript
const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  "[tabindex]:not([tabindex='-1'])",
];
```

---

## Lecteurs d'ecran

### Annonces dynamiques

```typescript
import { announceToScreenReader } from "@/lib/accessibility";

// Annonce normale (attend que l'utilisateur soit inactif)
announceToScreenReader("Formulaire soumis avec succes");

// Annonce urgente (interrompt l'utilisateur)
announceToScreenReader("Erreur: champ requis", "assertive");
```

### Live regions

Pour les mises a jour dynamiques du contenu:

```tsx
import { LiveAnnouncer, useLiveAnnouncer } from "@/components/ui/screen-reader-only";

// Composant
<LiveAnnouncer message={statusMessage} priority="polite" />

// Hook
const { announce, LiveRegion } = useLiveAnnouncer();

announce("3 nouveaux resultats");
<LiveRegion priority="polite" />
```

### Texte alternatif

- Toutes les images ont un attribut `alt`
- Les icones decoratives ont `aria-hidden="true"`
- Les icones fonctionnelles ont un `aria-label`

---

## Bonnes pratiques

### Checklist d'accessibilite

- [ ] Tous les elements interactifs sont accessibles au clavier
- [ ] Le focus est visible sur tous les elements focusables
- [ ] L'ordre de tabulation est logique
- [ ] Les modales piegent le focus
- [ ] Les images ont des textes alternatifs
- [ ] Les formulaires ont des labels associes
- [ ] Les erreurs sont annoncees aux lecteurs d'ecran
- [ ] Les contrastes respectent WCAG AA
- [ ] Les animations respectent `prefers-reduced-motion`
- [ ] Le site fonctionne sans JavaScript (degradation gracieuse)

### Structure semantique

```html
<header role="banner">
  <nav role="navigation" aria-label="Menu principal">...</nav>
</header>

<main role="main" id="main-content">
  <h1>Titre de la page</h1>
  <article>...</article>
</main>

<aside role="complementary">...</aside>

<footer role="contentinfo">...</footer>
```

### Formulaires accessibles

```tsx
<form aria-labelledby="form-title">
  <h2 id="form-title">Creer un compte</h2>

  <div>
    <label htmlFor="email">Email *</label>
    <input
      id="email"
      type="email"
      aria-required="true"
      aria-describedby="email-hint"
      aria-invalid={hasError}
    />
    <span id="email-hint">
      Nous ne partagerons jamais votre email
    </span>
    {hasError && (
      <span role="alert" aria-live="polite">
        Veuillez entrer un email valide
      </span>
    )}
  </div>

  <button type="submit">
    Creer le compte
  </button>
</form>
```

---

## Ressources

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [A11y Project](https://www.a11yproject.com/)

### Outils de test

- **axe DevTools** - Extension navigateur
- **WAVE** - Evaluateur d'accessibilite
- **Lighthouse** - Audit d'accessibilite
- **NVDA/JAWS** - Lecteurs d'ecran (test manuel)

### Contact

Pour signaler un probleme d'accessibilite ou suggerer une amelioration, contactez l'equipe de developpement.

---

*Document mis a jour le: Janvier 2026*
*Conformite: WCAG 2.1 AA*

---

## Nouveaux Composants WCAG 2.2 (Janvier 2026)

Les composants suivants ont ete ajoutes pour ameliorer l'accessibilite.

### AccessibleSkeleton

Skeleton de chargement avec annonces pour lecteurs d'ecran.

```tsx
import { AccessibleSkeleton, TableSkeleton, DashboardSkeleton } from "@/components/ui/accessible-skeleton"

// Skeleton simple
<AccessibleSkeleton label="Chargement des donnees" variant="text" />

// Skeleton tableau
<TableSkeleton rows={5} columns={4} label="Chargement du tableau" />

// Skeleton dashboard
<DashboardSkeleton />
```

**Attributs ARIA:**
- `role="status"` - Identifie la region de statut
- `aria-live="polite"` - Annonce les changements
- `aria-busy="true"` - Indique le chargement en cours
- `aria-label` - Description pour lecteurs d'ecran

**Fichier:** `src/components/ui/accessible-skeleton.tsx`

---

### AccessibleButton

Bouton avec etats de chargement accessibles.

```tsx
import { AccessibleButton } from "@/components/ui/accessible-button"

<AccessibleButton
  loading={isLoading}
  loadingText="Envoi en cours..."
  variant="default"
  size="md"
>
  Envoyer
</AccessibleButton>
```

**Attributs ARIA:**
- `aria-disabled` - Desactive le bouton pendant chargement
- `aria-busy` - Indique l'action en cours
- Spinner anime avec texte pour SR

**Fichier:** `src/components/ui/accessible-button.tsx`

---

### SkipLinks

Liens de navigation rapide pour utilisateurs clavier.

```tsx
import { SkipLinks } from "@/components/layout/skip-links"

// Dans le layout principal
<SkipLinks />
<main id="main-content">...</main>
<nav id="main-navigation">...</nav>
```

**Fonctionnalites:**
- Invisible par defaut, visible au focus
- Liens: "Aller au contenu principal", "Aller a la navigation"
- Conformite WCAG 2.4.1 (Bypass Blocks)

**Fichier:** `src/components/layout/skip-links.tsx`

---

### ResponsiveSidebar

Sidebar responsive avec menu hamburger accessible.

```tsx
import { ResponsiveSidebar } from "@/components/mobile/responsive-sidebar"

<ResponsiveSidebar>
  <nav>...</nav>
</ResponsiveSidebar>
```

**Fonctionnalites:**
- Fermeture avec touche Escape
- `aria-expanded` pour etat ouvert/ferme
- `aria-controls` lie au panneau
- Blocage scroll body quand ouvert
- Overlay cliquable pour fermer

**Fichier:** `src/components/mobile/responsive-sidebar.tsx`

---

## Conformite WCAG 2.2 Implementee

| Critere | Description | Composant |
|---------|-------------|-----------|
| **2.4.1** | Bypass Blocks | SkipLinks |
| **4.1.2** | Name, Role, Value | Tous les composants |
| **1.3.1** | Info and Relationships | AccessibleSkeleton |
| **2.1.1** | Keyboard | ResponsiveSidebar (Escape) |
| **4.1.3** | Status Messages | AccessibleSkeleton (aria-live) |

---

## Test d'Accessibilite

```bash
# Lighthouse audit
npm run lighthouse

# axe-core tests
npm run test:a11y

# Manuel avec lecteur d'ecran
# - NVDA (Windows)
# - VoiceOver (Mac)
# - Orca (Linux)
```
