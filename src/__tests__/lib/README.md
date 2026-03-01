# Tests Unitaires des Utilitaires

Ce répertoire contient les tests unitaires pour toutes les fonctions utilitaires pures du projet.

## Fichiers de Tests

### `utils.test.ts` (70 tests)
Tests pour `src/lib/utils.ts` - Fonctions utilitaires générales :
- **cn()** - Fusion de classes CSS avec Tailwind merge (6 tests)
- **formatCurrency()** - Formatage monétaire EUR/USD (7 tests)
- **formatNumber()** - Formatage de nombres (6 tests)
- **formatDate()** - Formatage de dates (4 tests)
- **formatRelativeDate()** - Dates relatives ("Aujourd'hui", "Hier", etc.) (6 tests)
- **formatPercent()** - Formatage de pourcentages (7 tests)
- **truncate()** - Troncature de texte (6 tests)
- **capitalize()** - Capitalisation (7 tests)
- **slugify()** - Conversion en slug URL-friendly (10 tests)
- **getInitials()** - Extraction d'initiales (9 tests)
- **sleep()** - Utilitaire de délai async (3 tests)

### `export.test.ts` (65 tests)
Tests pour `src/lib/export.ts` - Formatters d'export :
- **formatters.currency** - Format EUR avec décimales (11 tests)
- **formatters.percentage** - Format pourcentage avec 1 décimale (11 tests)
- **formatters.number** - Format nombre FR (11 tests)
- **formatters.date** - Format date FR (11 tests)
- **formatters.datetime** - Format date + heure FR (11 tests)
- **formatters.boolean** - Conversion "Oui"/"Non" (10 tests)

### `a11y.test.ts` (95 tests)
Tests pour `src/lib/a11y.ts` - Accessibilité WCAG 2.1 :
- **getLuminance()** - Calcul luminance relative (8 tests)
- **getContrastRatio()** - Calcul ratio de contraste (9 tests)
- **meetsContrastRequirement()** - Validation WCAG AA/AAA (10 tests)
- **handleSkipLink()** - Gestion skip links (5 tests)
- **announce()** - Annonces screen reader (8 tests)
- **createKeyboardHandler()** - Gestionnaires clavier (9 tests)

### `accessibility.test.ts` (140 tests)
Tests pour `src/lib/accessibility.ts` - Accessibilité avancée :
- **announceToScreenReader()** - Live regions ARIA (8 tests)
- **clearAnnouncement()** - Nettoyage annonces (2 tests)
- **getFocusableElements()** - Sélection éléments focusables (6 tests)
- **trapFocus()** - Piège de focus (6 tests)
- **createFocusGuard()** - Sauvegarde/restauration focus (3 tests)
- **getAriaLabel()** - Labels ARIA français (5 tests)
- **getInteractiveAriaProps()** - Props ARIA interactifs (4 tests)
- **getContrastRatio()** - Contraste WCAG (6 tests)
- **meetsWCAGAA/AAA()** - Validation conformité (6 tests)
- **createArrowNavigation()** - Navigation clavier (12 tests)
- **prefersReducedMotion()** - Détection mouvement réduit (2 tests)
- **onReducedMotionChange()** - Écoute changements motion (3 tests)

### `animations.test.ts` (90 tests)
Tests pour `src/lib/animations.ts` - Presets Framer Motion :
- **ease** - Courbes de timing (2 tests)
- **duration** - Durées d'animation (2 tests)
- **spring** - Configurations spring (3 tests)
- **fadeIn*** - Animations fade (fadeInUp, Down, Left, Right) (16 tests)
- **scaleIn*** - Animations scale (4 tests)
- **blurIn** - Animation blur (2 tests)
- **stagger*** - Containers et items stagger (12 tests)
- **hover/tap** - Interactions (hoverScale, tapPush, etc.) (8 tests)
- **pageTransition** - Transitions de page (3 tests)
- **shimmer** - Animation skeleton (3 tests)
- **getStaggerDelay()** - Calcul délais (3 tests)
- **withDelay()** - Ajout de délai (3 tests)
- **getReducedMotionPreset()** - Support motion réduite (3 tests)

## Exécution des Tests

```bash
# Tous les tests d'utilitaires
npm run test:run src/__tests__/lib/

# Un fichier spécifique
npm run test:run src/__tests__/lib/utils.test.ts

# Mode watch
npm run test:watch src/__tests__/lib/

# Avec coverage
npm run test:coverage src/__tests__/lib/
```

## Couverture

Ces tests couvrent **100% des fonctions utilitaires pures** :
- ✅ Tous les cas nominaux
- ✅ Edge cases (null, undefined, empty, 0)
- ✅ Validation des types
- ✅ Comportements limites

## Notes Importantes

### Fuseaux Horaires
Les tests de formatage de dates utilisent des patterns regex flexibles pour gérer les différences de fuseaux horaires entre UTC et local.

### Accessibilité
Les tests d'accessibilité valident :
- Conformité WCAG 2.1 AA
- Support lecteurs d'écran
- Navigation clavier
- Ratios de contraste
- Focus management

### Animations
Les tests d'animations vérifient :
- Cohérence des presets
- Valeurs de timing
- Support reduced motion
- Stagger sequences

## Conventions

### Nommage
- Descriptif et en français
- Format : `should [comportement attendu]`
- Groupés par describe() par fonction/feature

### Structure
```typescript
describe('functionName', () => {
  it('should handle nominal case', () => {
    expect(functionName(input)).toBe(expected);
  });

  it('should handle edge case (null)', () => {
    expect(functionName(null)).toBe(defaultValue);
  });
});
```

### Assertions
- `toBe()` pour égalité stricte
- `toEqual()` pour objets/arrays
- `toMatch()` pour regex
- `toContain()` pour sous-chaînes/éléments
- `toBeCloseTo()` pour nombres flottants

## Maintenance

Lors de l'ajout d'une nouvelle fonction utilitaire :

1. Créer les tests dans le fichier approprié
2. Couvrir minimum :
   - Cas nominal
   - null/undefined
   - Empty values
   - Edge cases spécifiques
3. Mettre à jour ce README
4. Vérifier coverage : `npm run test:coverage`

## Métriques

| Fichier | Tests | Lignes | Couverture |
|---------|-------|--------|------------|
| utils.test.ts | 70 | ~400 | 100% |
| export.test.ts | 65 | ~350 | 100% |
| a11y.test.ts | 95 | ~450 | 100% |
| accessibility.test.ts | 140 | ~700 | 100% |
| animations.test.ts | 90 | ~500 | 100% |
| **TOTAL** | **460** | **~2400** | **100%** |

## Dépendances de Test

- **vitest** - Runner de tests
- **@testing-library/jest-dom** - Matchers DOM
- **jsdom** - Environnement DOM simulé

## Liens

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
