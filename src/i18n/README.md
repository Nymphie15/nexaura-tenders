# i18n - Internationalization System

## Structure

```
src/i18n/
├── config.ts           # Configuration i18next
├── index.ts            # Export et utilities
├── README.md           # Documentation
└── locales/
    ├── fr/             # Traductions françaises (default)
    │   ├── common.json      # UI générale
    │   ├── validation.json  # Messages de validation
    │   └── workflow.json    # Workflow appels d'offres
    └── en/             # English translations
        ├── common.json
        ├── validation.json
        └── workflow.json

src/hooks/
└── use-translation.ts  # Hook React personnalisé
```

## Usage

### Basic Usage

```tsx
import { useTranslation } from "@/hooks/use-translation";

function MyComponent() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div>
      <h1>{t("nav.dashboard")}</h1>
      <button onClick={() => setLanguage("en")}>English</button>
    </div>
  );
}
```

### With Specific Namespace

```tsx
import { useValidationTranslation } from "@/hooks/use-translation";

function FormComponent() {
  const { t } = useValidationTranslation();

  return <span className="error">{t("required")}</span>;
}
```

### With Interpolation

```tsx
const { t } = useTranslation("workflow");

// workflow.json: "daysRemaining": "{{count}} days remaining"
<span>{t("tender.daysRemaining", { count: 5 })}</span>
// Output: "5 days remaining"
```

### Language Switcher Component

```tsx
import { useTranslation } from "@/hooks/use-translation";

function LanguageSwitcher() {
  const { language, setLanguage, languages, languageNames } = useTranslation();

  return (
    <select 
      value={language} 
      onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
    >
      {languages.map((lang) => (
        <option key={lang} value={lang}>
          {languageNames[lang]}
        </option>
      ))}
    </select>
  );
}
```

## Namespaces

| Namespace | Description | Usage |
|-----------|-------------|-------|
| `common` | General UI elements | Navigation, actions, status, errors |
| `validation` | Form validation | Error messages, field requirements |
| `workflow` | Tender workflow | Stages, priorities, documents, timeline |

## Adding New Translations

1. Add key to both `fr/*.json` and `en/*.json`
2. Use consistent naming: `category.subcategory.key`
3. Use interpolation for dynamic values: `{{variable}}`

## Configuration

- **Default language:** French (fr)
- **Fallback:** French (fr)
- **Detection order:** localStorage > navigator > htmlTag
- **Storage:** localStorage (key: `i18nextLng`)

## Dependencies

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

## Type Safety

Types are exported from `src/i18n/index.ts`:

```typescript
import type { SupportedLanguage, TranslationNamespace } from "@/i18n";
```
