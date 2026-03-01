# Guide de Contribution - Tests d'Authentification

Ce guide vous aidera à ajouter de nouveaux tests d'authentification au projet.

---

## Table des Matières

1. [Structure des Tests](#structure-des-tests)
2. [Conventions de Nommage](#conventions-de-nommage)
3. [Écrire un Nouveau Test](#écrire-un-nouveau-test)
4. [Helpers Disponibles](#helpers-disponibles)
5. [Bonnes Pratiques](#bonnes-pratiques)
6. [Exemples Complets](#exemples-complets)
7. [Débogage](#débogage)
8. [Checklist Avant PR](#checklist-avant-pr)

---

## Structure des Tests

```
src/__tests__/auth/
├── login-page.test.tsx         # Tests de la page de connexion
├── auth-store.test.ts          # Tests du store Zustand
├── token-refresh.test.ts       # Tests des intercepteurs API
├── protected-routes.test.tsx   # Tests de protection des routes
├── token-storage.test.ts       # Tests de stockage des tokens
├── auth-utils.test.ts          # Tests des utilitaires
├── test-helpers.ts             # Helpers et fixtures
├── README.md                   # Documentation
├── TEST_REPORT.md             # Rapport de tests
└── CONTRIBUTING.md            # Ce fichier
```

---

## Conventions de Nommage

### Fichiers de Test

```typescript
// ✅ Bon
login-page.test.tsx
auth-store.test.ts
token-refresh.test.ts

// ❌ Mauvais
LoginPage.test.tsx
authStore.spec.ts
token_refresh_test.ts
```

### Describe Blocks

```typescript
// ✅ Bon - Nom du composant/fonctionnalité
describe("LoginPage", () => {
  describe("Form Validation", () => {
    it("should validate email format", () => {});
  });
});

// ❌ Mauvais - Pas assez descriptif
describe("Tests", () => {
  it("test1", () => {});
});
```

### Test Cases

```typescript
// ✅ Bon - Description claire du comportement attendu
it("should redirect to /tenders after successful login", () => {});
it("should show error toast when login fails", () => {});

// ❌ Mauvais - Trop vague
it("should work", () => {});
it("test login", () => {});
```

---

## Écrire un Nouveau Test

### 1. Créer le Fichier

```bash
# Créer un nouveau fichier de test
touch src/__tests__/auth/new-feature.test.ts
```

### 2. Template de Base

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
// Importer les helpers
import { createMockUser, clearAuthStorage } from "./test-helpers";

// Mocker les dépendances
vi.mock("@/lib/api/endpoints", () => ({
  authApi: {
    login: vi.fn(),
    // ... autres méthodes
  },
}));

describe("Ma Nouvelle Fonctionnalité", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthStorage();
  });

  afterEach(() => {
    clearAuthStorage();
  });

  describe("Groupe de Tests", () => {
    it("should do something specific", async () => {
      // Arrange
      const mockData = createMockUser();

      // Act
      await act(async () => {
        // Action à tester
      });

      // Assert
      expect(mockData).toBeDefined();
    });
  });
});
```

### 3. Tests de Composants React

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("MonComposant", () => {
  it("should render correctly", () => {
    // Arrange
    render(<MonComposant />);

    // Assert
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle user interaction", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<MonComposant />);

    // Act
    const button = screen.getByRole("button", { name: /submit/i });
    await user.click(button);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Success")).toBeInTheDocument();
    });
  });
});
```

### 4. Tests de Hooks (Zustand Store)

```typescript
import { renderHook, act } from "@testing-library/react";

describe("useMonHook", () => {
  it("should update state correctly", async () => {
    // Arrange
    const { result } = renderHook(() => useMonHook());

    // Act
    await act(async () => {
      await result.current.updateData("new value");
    });

    // Assert
    expect(result.current.data).toBe("new value");
  });
});
```

---

## Helpers Disponibles

### Créer des Données de Test

```typescript
import {
  createMockUser,
  createMockAuthResponse,
  createMockAdminUser,
  createMockInactiveUser,
} from "./test-helpers";

// Créer un utilisateur standard
const user = createMockUser();

// Créer un utilisateur avec propriétés personnalisées
const admin = createMockUser({ role: "admin", email: "admin@test.com" });

// Créer une réponse d'authentification complète
const authResponse = createMockAuthResponse();
```

### Gérer le Storage

```typescript
import { setupAuthStorage, clearAuthStorage, assertTokensStored } from "./test-helpers";

// Setup auth dans localStorage
setupAuthStorage("access-token", "refresh-token", mockUser);

// Nettoyer le storage
clearAuthStorage();

// Vérifier que les tokens sont stockés
assertTokensStored("expected-access-token", "expected-refresh-token");
```

### Créer des Erreurs API

```typescript
import { mockApiErrors } from "./test-helpers";

// Erreur 401 Unauthorized
const unauthorizedError = mockApiErrors.unauthorized();

// Erreur 500 Server Error
const serverError = mockApiErrors.serverError();

// Token expiré
const expiredError = mockApiErrors.tokenExpired();
```

### Générer des JWTs de Test

```typescript
import { generateMockJWT, generateExpiredMockJWT } from "./test-helpers";

// JWT valide
const validToken = generateMockJWT({ sub: "user-123", role: "admin" });

// JWT expiré
const expiredToken = generateExpiredMockJWT();
```

### Mock Router

```typescript
import { createMockRouter } from "./test-helpers";

const router = createMockRouter();

// Utiliser dans le test
router.push("/dashboard");

// Vérifier la redirection
router.assertRedirectedTo("/dashboard");
router.assertNotRedirected();
```

---

## Bonnes Pratiques

### 1. Pattern AAA (Arrange-Act-Assert)

```typescript
it("should do something", async () => {
  // ✅ Arrange - Préparer les données
  const mockUser = createMockUser();
  vi.mocked(authApi.login).mockResolvedValueOnce({ user: mockUser });

  // ✅ Act - Exécuter l'action
  await act(async () => {
    await login("test@example.com", "password");
  });

  // ✅ Assert - Vérifier le résultat
  expect(authApi.login).toHaveBeenCalled();
  expect(localStorage.getItem("access_token")).toBeTruthy();
});
```

### 2. Toujours Nettoyer

```typescript
describe("Mon Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

### 3. Utiliser `waitFor` pour Async

```typescript
// ✅ Bon
await waitFor(() => {
  expect(screen.getByText("Success")).toBeInTheDocument();
});

// ❌ Mauvais - Peut échouer si async
expect(screen.getByText("Success")).toBeInTheDocument();
```

### 4. Wrapper Actions dans `act()`

```typescript
// ✅ Bon
await act(async () => {
  await result.current.login("email", "password");
});

// ❌ Mauvais - Warning "act(...)" en console
await result.current.login("email", "password");
```

### 5. Tester les Cas d'Erreur

```typescript
it("should handle network error", async () => {
  // Simuler une erreur réseau
  vi.mocked(authApi.login).mockRejectedValueOnce(mockApiErrors.networkError());

  // Tester que l'erreur est gérée
  await expect(login("test@example.com", "password")).rejects.toThrow();

  // Vérifier l'état après erreur
  expect(isAuthenticated).toBe(false);
});
```

### 6. Éviter les Tests Flaky

```typescript
// ✅ Bon - Utiliser waitFor pour async
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 3000 });

// ❌ Mauvais - setTimeout arbitraire
await new Promise((resolve) => setTimeout(resolve, 1000));
expect(element).toBeInTheDocument();
```

---

## Exemples Complets

### Exemple 1: Tester un Formulaire

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/components/LoginForm";

describe("LoginForm", () => {
  it("should submit form with valid data", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    // Act
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /submit/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });
});
```

### Exemple 2: Tester un Store Zustand

```typescript
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    });
  });

  it("should login successfully", async () => {
    // Arrange
    const mockUser = createMockUser();
    vi.mocked(authApi.login).mockResolvedValueOnce(
      createMockAuthResponse({ user: mockUser })
    );

    const { result } = renderHook(() => useAuthStore());

    // Act
    await act(async () => {
      await result.current.login("test@example.com", "password");
    });

    // Assert
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });
});
```

### Exemple 3: Tester un Intercepteur Axios

```typescript
import { api } from "@/lib/api/client";
import { createAxiosError } from "./test-helpers";

describe("Token Refresh Interceptor", () => {
  beforeEach(() => {
    localStorage.setItem("refresh_token", "valid-refresh");
  });

  it("should refresh token on 401", async () => {
    // Arrange
    const error = createAxiosError(401, { detail: "Token expired" });
    const mockRefresh = vi.fn().mockResolvedValue({
      data: { access_token: "new-token" },
    });

    vi.spyOn(api, "post").mockImplementation(mockRefresh);

    // Act
    const interceptor = api.interceptors.response.handlers[0];
    await interceptor.rejected(error);

    // Assert
    expect(mockRefresh).toHaveBeenCalledWith("/auth/refresh", {
      refresh_token: "valid-refresh",
    });
    expect(localStorage.getItem("access_token")).toBe("new-token");
  });
});
```

---

## Débogage

### Problème: Tests Flaky

```typescript
// ❌ Problème - Test échoue aléatoirement
it("flaky test", () => {
  render(<Component />);
  expect(screen.getByText("Text")).toBeInTheDocument(); // Peut échouer
});

// ✅ Solution - Utiliser waitFor
it("stable test", async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
});
```

### Problème: Act Warning

```typescript
// ❌ Warning: "An update to Component inside a test was not wrapped in act(...)"
const { result } = renderHook(() => useStore());
result.current.updateState();

// ✅ Solution
const { result } = renderHook(() => useStore());
await act(async () => {
  await result.current.updateState();
});
```

### Problème: Mock ne Fonctionne Pas

```typescript
// ❌ Mock après import
import { authApi } from "@/lib/api/endpoints";
vi.mock("@/lib/api/endpoints");

// ✅ Mock avant import
vi.mock("@/lib/api/endpoints", () => ({
  authApi: {
    login: vi.fn(),
  },
}));
import { authApi } from "@/lib/api/endpoints";
```

### Debug avec screen.debug()

```typescript
it("debug test", () => {
  render(<Component />);

  // Afficher le DOM complet
  screen.debug();

  // Afficher un élément spécifique
  const button = screen.getByRole("button");
  screen.debug(button);
});
```

### Voir les Queries Disponibles

```typescript
render(<Component />);

// Afficher toutes les queries disponibles
screen.logTestingPlaygroundURL();
```

---

## Checklist Avant PR

### ✅ Code Quality

- [ ] Tous les tests passent localement
- [ ] Pas de `console.log` ou `debugger`
- [ ] Pas de `it.only` ou `describe.only`
- [ ] Pas de `it.skip` sans justification
- [ ] Code formaté (Prettier)
- [ ] Pas de warnings ESLint

### ✅ Test Quality

- [ ] Chaque test a un nom descriptif
- [ ] Tests isolés (pas d'interdépendances)
- [ ] Cleanup effectué (beforeEach/afterEach)
- [ ] Mocks appropriés et réinitialisés
- [ ] Assertions claires et précises
- [ ] Cas d'erreur testés

### ✅ Documentation

- [ ] README.md mis à jour si nécessaire
- [ ] Commentaires pour logique complexe
- [ ] Helpers documentés
- [ ] TEST_REPORT.md actualisé

### ✅ Performance

- [ ] Pas de `setTimeout` arbitraires
- [ ] Utilisation de `waitFor` avec timeout raisonnable
- [ ] Pas de tests excessivement lents (> 5s)

### ✅ Coverage

- [ ] Couverture > 85% pour nouveaux fichiers
- [ ] Branches principales testées
- [ ] Cas edge testés

---

## Commandes Utiles

```bash
# Lancer tous les tests
npm test auth/

# Mode watch (développement)
npm test -- --watch auth/login-page.test.tsx

# Avec couverture
npm run test:coverage -- auth/

# Mode verbose (debug)
npm test -- --reporter=verbose auth/

# Filtrer par nom de test
npm test -- -t "should login successfully"

# Voir les tests disponibles
npm test -- --list auth/
```

---

## Ressources

### Documentation

- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Events](https://testing-library.com/docs/user-event/intro)
- [Zustand Testing](https://docs.pmnd.rs/zustand/guides/testing)

### Guides Internes

- [README.md](./README.md) - Vue d'ensemble
- [TEST_REPORT.md](./TEST_REPORT.md) - Rapport détaillé
- [test-helpers.ts](./test-helpers.ts) - Code source des helpers

### Aide

- Problème avec les tests? Vérifier le [TEST_REPORT.md](./TEST_REPORT.md)
- Besoin d'un helper? Vérifier [test-helpers.ts](./test-helpers.ts)
- Question générale? Consulter le [README.md](./README.md)

---

**Bon testing ! 🧪**

**Mainteneur:** Claude Code
**Version:** 1.0.0
**Dernière MAJ:** 2026-01-25
