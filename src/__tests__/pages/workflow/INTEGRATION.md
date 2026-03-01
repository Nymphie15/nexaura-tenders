# Intégration des Tests Workflow

Guide d'intégration des tests workflow dans le projet.

## Scripts NPM

Ajoutez ces scripts dans `package.json` :

```json
{
  "scripts": {
    "test": "vitest",
    "test:workflow": "vitest src/__tests__/pages/workflow",
    "test:workflow:list": "vitest src/__tests__/pages/workflow/workflows-list.test.tsx",
    "test:workflow:detail": "vitest src/__tests__/pages/workflow/workflow-detail.test.tsx",
    "test:workflow:hitl": "vitest src/__tests__/pages/workflow/hitl-components.test.tsx",
    "test:workflow:phases": "vitest src/__tests__/pages/workflow/phase-display.test.tsx",
    "test:workflow:progress": "vitest src/__tests__/pages/workflow/progress-indicators.test.tsx",
    "test:workflow:watch": "vitest --watch src/__tests__/pages/workflow",
    "test:workflow:coverage": "vitest --coverage src/__tests__/pages/workflow",
    "test:workflow:ui": "vitest --ui src/__tests__/pages/workflow"
  }
}
```

## Utilisation

### Exécuter tous les tests workflow

```bash
npm run test:workflow
```

### Exécuter un fichier de test spécifique

```bash
npm run test:workflow:list      # Tests de la liste
npm run test:workflow:detail    # Tests de la page détail
npm run test:workflow:hitl      # Tests HITL
npm run test:workflow:phases    # Tests d'affichage des phases
npm run test:workflow:progress  # Tests des indicateurs de progression
```

### Mode watch (surveillance continue)

```bash
npm run test:workflow:watch
```

### Avec couverture de code

```bash
npm run test:workflow:coverage
```

### Interface UI interactive

```bash
npm run test:workflow:ui
```

## Scripts Shell

### Linux/macOS/WSL

```bash
# Tous les tests
./scripts/test-workflow.sh -a

# Tests spécifiques
./scripts/test-workflow.sh -l          # Liste
./scripts/test-workflow.sh -d          # Détail
./scripts/test-workflow.sh -h          # HITL
./scripts/test-workflow.sh -p          # Phases
./scripts/test-workflow.sh -i          # Indicateurs

# Avec options
./scripts/test-workflow.sh -l -w       # Liste en mode watch
./scripts/test-workflow.sh -d -c       # Détail avec couverture
./scripts/test-workflow.sh -a -c -w    # Tous, couverture, watch
```

### Windows PowerShell

```powershell
# Tous les tests
.\scripts\test-workflow.ps1 -All

# Tests spécifiques
.\scripts\test-workflow.ps1 -List          # Liste
.\scripts\test-workflow.ps1 -Detail        # Détail
.\scripts\test-workflow.ps1 -Hitl          # HITL
.\scripts\test-workflow.ps1 -Phases        # Phases
.\scripts\test-workflow.ps1 -Indicators    # Indicateurs

# Avec options
.\scripts\test-workflow.ps1 -List -Watch      # Liste en mode watch
.\scripts\test-workflow.ps1 -Detail -Coverage # Détail avec couverture
.\scripts\test-workflow.ps1 -All -Coverage    # Tous avec couverture
```

## Configuration Vitest

Si vous utilisez un fichier `vitest.config.ts`, assurez-vous d'avoir :

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
      exclude: [
        "**/__tests__/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

## Fichier de Setup

Créez `src/__tests__/setup.ts` si nécessaire :

```typescript
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (needed for responsive components)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;
```

## Intégration CI/CD

### GitHub Actions

```yaml
name: Workflow Tests

on:
  push:
    branches: [main, develop]
    paths:
      - "web-client/src/app/(dashboard)/workflows/**"
      - "web-client/src/__tests__/pages/workflow/**"
      - "web-client/src/hooks/use-workflows.ts"
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: web-client/package-lock.json

      - name: Install dependencies
        working-directory: web-client
        run: npm ci

      - name: Run workflow tests
        working-directory: web-client
        run: npm run test:workflow

      - name: Generate coverage
        working-directory: web-client
        run: npm run test:workflow:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./web-client/coverage/coverage-final.json
          flags: workflow-tests
```

### GitLab CI

```yaml
workflow-tests:
  stage: test
  image: node:18
  only:
    changes:
      - web-client/src/app/(dashboard)/workflows/**
      - web-client/src/__tests__/pages/workflow/**
      - web-client/src/hooks/use-workflows.ts
  script:
    - cd web-client
    - npm ci
    - npm run test:workflow:coverage
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: web-client/coverage/cobertura-coverage.xml
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
```

## Pre-commit Hook

Ajoutez dans `.husky/pre-commit` :

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run workflow tests on workflow-related changes
if git diff --cached --name-only | grep -E "web-client/src/(app/\(dashboard\)/workflows|__tests__/pages/workflow|hooks/use-workflows)"; then
  echo "Running workflow tests..."
  cd web-client && npm run test:workflow
fi
```

## VS Code

### Configuration de tâches (`.vscode/tasks.json`)

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Test: Workflow (All)",
      "type": "npm",
      "script": "test:workflow",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Test: Workflow (Watch)",
      "type": "npm",
      "script": "test:workflow:watch",
      "isBackground": true,
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Test: Workflow (Coverage)",
      "type": "npm",
      "script": "test:workflow:coverage",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    }
  ]
}
```

### Snippets de test (`.vscode/workflow-test.code-snippets`)

```json
{
  "Workflow Test Suite": {
    "prefix": "wftest",
    "body": [
      "import { describe, it, expect, beforeEach, vi } from 'vitest';",
      "import { render, screen, waitFor } from '@testing-library/react';",
      "import userEvent from '@testing-library/user-event';",
      "import { QueryClient, QueryClientProvider } from '@tanstack/react-query';",
      "",
      "describe('${1:ComponentName}', () => {",
      "  let queryClient: QueryClient;",
      "",
      "  beforeEach(() => {",
      "    queryClient = new QueryClient({",
      "      defaultOptions: {",
      "        queries: { retry: false },",
      "        mutations: { retry: false },",
      "      },",
      "    });",
      "    vi.clearAllMocks();",
      "  });",
      "",
      "  it('${2:should do something}', () => {",
      "    $0",
      "  });",
      "});"
    ]
  }
}
```

## Rapports de Couverture

### Visualisation locale

Après avoir exécuté les tests avec couverture :

```bash
npm run test:workflow:coverage
```

Ouvrez le rapport HTML :

```bash
# Linux/macOS
open web-client/coverage/index.html

# Windows
start web-client/coverage/index.html
```

### Objectifs de couverture

Configuration recommandée dans `vitest.config.ts` :

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
}
```

## Documentation Auto-générée

### TypeDoc pour les composants

```bash
npm install --save-dev typedoc

# Générer la doc
npx typedoc --entryPoints src/app/(dashboard)/workflows --out docs/workflow
```

### Storybook

```bash
npm install --save-dev @storybook/react @storybook/addon-essentials

# Démarrer Storybook
npm run storybook
```

## Monitoring en Production

### Sentry

Ajoutez le tracking des erreurs :

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### Analytics

Suivez l'utilisation des workflows :

```typescript
import { track } from "@/lib/analytics";

track("workflow_viewed", {
  workflow_id: caseId,
  phase: currentPhase,
  status: status,
});
```

---

**Dernière mise à jour**: 2026-01-25
