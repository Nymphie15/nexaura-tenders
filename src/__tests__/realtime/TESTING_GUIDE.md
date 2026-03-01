# Guide de Testing WebSocket/Realtime

Guide complet pour développer, exécuter et maintenir les tests WebSocket.

## Table des Matières

1. [Installation](#installation)
2. [Exécution des Tests](#exécution-des-tests)
3. [Écriture de Nouveaux Tests](#écriture-de-nouveaux-tests)
4. [Debugging](#debugging)
5. [Best Practices](#best-practices)
6. [FAQ](#faq)

---

## Installation

Les dépendances de test sont déjà installées. Si besoin de réinstaller :

```bash
cd web-client
npm install
```

**Dépendances utilisées:**
- `vitest` - Framework de test
- `@testing-library/react` - Utilitaires React
- `@testing-library/jest-dom` - Matchers additionnels
- `@vitest/coverage-v8` - Couverture de code

---

## Exécution des Tests

### Commandes Rapides

```bash
# Tous les tests realtime (une fois)
npm run test:realtime

# Mode watch (redémarre à chaque changement)
npm run test:realtime:watch

# Avec couverture de code
npm run test:realtime:coverage

# Interface UI interactive
npm run test:realtime:ui
```

### Tests Spécifiques

```bash
# Un seul fichier
npm run test src/__tests__/realtime/use-realtime-notifications.test.ts

# Avec pattern
npm run test -- --grep "connection"

# Un seul test
npm run test -- --grep "should connect automatically"
```

### Options Utiles

```bash
# Verbose output
npm run test:realtime -- --reporter=verbose

# Bail on first failure
npm run test:realtime -- --bail

# Update snapshots
npm run test:realtime -- -u

# Run in single thread (pour debugging)
npm run test:realtime -- --no-threads
```

---

## Écriture de Nouveaux Tests

### 1. Structure de Base

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockWebSocket } from './websocket-mock';

describe('MonComposant', () => {
  let mockWs: MockWebSocket | null = null;

  beforeEach(() => {
    vi.clearAllMocks();

    global.WebSocket = vi.fn((url: string) => {
      mockWs = new MockWebSocket(url);
      return mockWs;
    }) as any;

    vi.useFakeTimers();
  });

  afterEach(() => {
    mockWs = null;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should do something', async () => {
    // Test implementation
  });
});
```

### 2. Tester une Connexion WebSocket

```typescript
it('should connect to WebSocket', async () => {
  const getToken = vi.fn(() => 'test-token');

  const { result } = renderHook(() =>
    useRealtimeNotifications({ getToken })
  );

  // Attendre connexion async
  await act(async () => {
    vi.advanceTimersByTime(120);
  });

  await waitFor(() => {
    expect(result.current.isConnected).toBe(true);
  });
});
```

### 3. Simuler un Message

```typescript
it('should handle incoming message', async () => {
  // ... setup ...

  act(() => {
    mockWs?.simulateMessage({
      type: 'notification',
      data: { message: 'Test' }
    });
  });

  await waitFor(() => {
    expect(result.current.notifications).toHaveLength(1);
  });
});
```

### 4. Tester une Reconnexion

```typescript
it('should reconnect after disconnect', async () => {
  // ... connect ...

  // Simuler déconnexion
  act(() => {
    mockWs?.close(1006, 'Network error');
  });

  await waitFor(() => {
    expect(result.current.isConnected).toBe(false);
  });

  // Avancer le délai de reconnexion
  await act(async () => {
    vi.advanceTimersByTime(1100);
  });

  await waitFor(() => {
    expect(result.current.isConnected).toBe(true);
  });
});
```

### 5. Utiliser les Message Builders

```typescript
import {
  createHITLDecisionRequiredEvent,
  createWorkflowUpdateEvent
} from './websocket-mock';

it('should handle HITL event', async () => {
  const event = createHITLDecisionRequiredEvent({
    caseId: 'case-123',
    checkpoint: 'GO_NOGO',
    urgency: 'high'
  });

  act(() => {
    mockWs?.simulateMessage(event);
  });

  // ... assertions ...
});
```

---

## Debugging

### 1. Activer les Logs

Dans votre test, commenter les mocks de console :

```typescript
beforeEach(() => {
  // vi.spyOn(console, 'log').mockImplementation(() => {});
  // vi.spyOn(console, 'error').mockImplementation(() => {});
});
```

### 2. Inspecter les Messages Envoyés

```typescript
const messages = mockWs?.getSentMessages();
console.log('Messages envoyés:', JSON.stringify(messages, null, 2));

const lastMessage = mockWs?.getLastSentMessage();
console.log('Dernier message:', lastMessage);
```

### 3. Breakpoints avec Chrome DevTools

```bash
# Démarrer en mode debug
npm run test:debug src/__tests__/realtime/use-realtime-notifications.test.ts

# Ouvrir chrome://inspect dans Chrome
# Cliquer sur "inspect" dans la section "Remote Target"
```

Ajouter `debugger;` dans votre test où vous voulez un breakpoint.

### 4. UI Mode Interactif

```bash
npm run test:realtime:ui
```

Interface graphique avec:
- Vue d'ensemble des tests
- Logs détaillés
- Reruns automatiques
- Filtres et recherche

### 5. Isoler un Test

```typescript
it.only('should test this specific case', async () => {
  // Seul ce test sera exécuté
});
```

Ou:

```bash
npm run test -- --grep "test this specific case"
```

---

## Best Practices

### ✅ À Faire

#### 1. Toujours Nettoyer

```typescript
afterEach(() => {
  mockWs = null;
  vi.restoreAllMocks();
  vi.useRealTimers();
});
```

#### 2. Utiliser act() pour les Mises à Jour d'État

```typescript
// ✅ Correct
act(() => {
  result.current.connect();
});

// ❌ Incorrect
result.current.connect();
```

#### 3. Utiliser waitFor() pour les Assertions Async

```typescript
// ✅ Correct
await waitFor(() => {
  expect(result.current.isConnected).toBe(true);
});

// ❌ Incorrect
expect(result.current.isConnected).toBe(true);
```

#### 4. Tester les Cas d'Erreur

```typescript
it('should handle connection error', async () => {
  const getToken = vi.fn(() => null);
  const onError = vi.fn();

  renderHook(() =>
    useRealtimeNotifications({ getToken, onError })
  );

  await waitFor(() => {
    expect(onError).toHaveBeenCalled();
  });
});
```

#### 5. Isoler les Tests

Chaque test doit pouvoir s'exécuter indépendamment.

```typescript
// ✅ Correct - État local
it('test 1', () => {
  const localState = {};
  // ...
});

it('test 2', () => {
  const localState = {};
  // ...
});

// ❌ Incorrect - État partagé
let sharedState = {};

it('test 1', () => {
  sharedState.value = 'test1';
});

it('test 2', () => {
  // Dépend de test 1
  expect(sharedState.value).toBe('test1');
});
```

### ❌ À Éviter

#### 1. Timeouts Arbitraires

```typescript
// ❌ Incorrect
await new Promise(resolve => setTimeout(resolve, 1000));
expect(result.current.isConnected).toBe(true);

// ✅ Correct
await waitFor(() => {
  expect(result.current.isConnected).toBe(true);
}, { timeout: 1000 });
```

#### 2. Tests qui Dépendent de l'Ordre

```typescript
// ❌ Incorrect
describe('MyTests', () => {
  let ws: MockWebSocket;

  it('should connect', () => {
    ws = new MockWebSocket('ws://test');
  });

  it('should send message', () => {
    // Dépend du test précédent
    ws.send('hello');
  });
});
```

#### 3. Ne Pas Nettoyer les Mocks

```typescript
// ❌ Incorrect
beforeEach(() => {
  vi.fn(); // Pas de nettoyage
});

// ✅ Correct
beforeEach(() => {
  vi.clearAllMocks();
});
```

#### 4. Tester l'Implémentation au Lieu du Comportement

```typescript
// ❌ Incorrect - Teste l'implémentation
it('should call reconnect function', () => {
  expect(reconnectSpy).toHaveBeenCalled();
});

// ✅ Correct - Teste le comportement
it('should reconnect after disconnect', async () => {
  // Simuler déconnexion
  act(() => mockWs?.close());

  // Vérifier reconnexion
  await waitFor(() => {
    expect(result.current.isConnected).toBe(true);
  });
});
```

---

## Patterns Communs

### Pattern: Test d'un Hook avec Timers

```typescript
it('should do something after delay', async () => {
  const { result } = renderHook(() => useMyHook());

  await act(async () => {
    vi.advanceTimersByTime(5000);
  });

  await waitFor(() => {
    expect(result.current.someValue).toBe(expected);
  });
});
```

### Pattern: Test d'un Flux Complet

```typescript
it('should handle complete workflow', async () => {
  // 1. Setup
  const { result } = renderHook(() => useMyHook());

  await act(async () => {
    vi.advanceTimersByTime(120);
  });

  // 2. Action initiale
  act(() => {
    mockWs?.simulateMessage(event1);
  });

  await waitFor(() => {
    expect(result.current.step).toBe(1);
  });

  // 3. Action suivante
  act(() => {
    mockWs?.simulateMessage(event2);
  });

  await waitFor(() => {
    expect(result.current.step).toBe(2);
  });

  // 4. Vérification finale
  expect(result.current.completed).toBe(true);
});
```

### Pattern: Test avec Store Zustand

```typescript
const mockStore = {
  addNotification: vi.fn(),
  notifications: [],
};

vi.mock('@/stores/notification-store', () => ({
  useNotificationStore: vi.fn(() => mockStore),
}));

it('should add notification to store', async () => {
  // ... déclencher événement ...

  await waitFor(() => {
    expect(mockStore.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        message: 'Test'
      })
    );
  });
});
```

---

## FAQ

### Q: Les tests sont lents, comment les accélérer ?

**R:** Utilisez `vi.useFakeTimers()` pour contrôler le temps :

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

// Dans le test
await act(async () => {
  vi.advanceTimersByTime(30000); // 30s instantané
});
```

### Q: Mon test échoue de manière aléatoire (flaky)

**R:** Causes communes :
1. Pas d'utilisation de `waitFor()` pour assertions async
2. Timeouts trop courts
3. État partagé entre tests
4. Race conditions non gérées

Solution :
```typescript
// Au lieu de
expect(result.current.value).toBe(expected);

// Utiliser
await waitFor(() => {
  expect(result.current.value).toBe(expected);
}, { timeout: 2000 });
```

### Q: Comment tester un timeout ?

**R:** Utilisez `vi.advanceTimersByTime()` :

```typescript
it('should timeout after 30s', async () => {
  const promise = result.current.sendMessage('test');

  await act(async () => {
    vi.advanceTimersByTime(30100); // Légèrement plus que le timeout
  });

  await expect(promise).rejects.toThrow('timeout');
});
```

### Q: Comment tester plusieurs connexions WebSocket ?

**R:** Utilisez des variables séparées :

```typescript
let notificationWs: MockWebSocket | null = null;
let assistantWs: MockWebSocket | null = null;

global.WebSocket = vi.fn((url: string) => {
  const ws = new MockWebSocket(url);

  if (url.includes('/notifications')) {
    notificationWs = ws;
  } else if (url.includes('/assistant')) {
    assistantWs = ws;
  }

  return ws;
}) as any;
```

### Q: Comment tester la gestion de mémoire ?

**R:** Vérifiez le nettoyage des ressources :

```typescript
it('should cleanup on unmount', async () => {
  const { unmount } = renderHook(() => useMyHook());

  // ... connexion ...

  unmount();

  // Vérifier que les ressources sont libérées
  expect(mockWs?.readyState).toBe(MockWebSocket.CLOSED);
});
```

### Q: Comment obtenir un rapport de couverture détaillé ?

**R:**
```bash
npm run test:realtime:coverage

# Ouvrir le rapport HTML
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

---

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Hooks](https://react-hooks-testing-library.com/)
- [Vitest UI](https://vitest.dev/guide/ui.html)

---

**Dernière mise à jour:** 2026-01-25
