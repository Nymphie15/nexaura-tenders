# Quick Start - Tests WebSocket/Realtime

Guide de démarrage rapide pour exécuter et comprendre les tests.

## Exécution Rapide

```bash
# Tous les tests (une fois)
npm run test:realtime

# Mode watch (redémarre automatiquement)
npm run test:realtime:watch

# Avec couverture de code
npm run test:realtime:coverage

# Interface UI interactive
npm run test:realtime:ui
```

## Structure des Fichiers

```
src/__tests__/realtime/
├── use-realtime-notifications.test.ts    # 25 tests
├── use-assistant-websocket.test.ts       # 27 tests
├── websocket-integration.test.ts         # 25 tests
├── websocket-mock.ts                     # Mock réutilisable
├── setup.ts                              # Configuration globale
├── vitest.config.ts                      # Config Vitest
├── README.md                             # Documentation complète
├── TESTING_GUIDE.md                      # Guide pratique
├── SUMMARY.md                            # Résumé détaillé
└── QUICK_START.md                        # Ce fichier
```

## Exemple de Test Simple

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { MockWebSocket } from './websocket-mock';

describe('Mon Test', () => {
  let mockWs: MockWebSocket | null = null;

  beforeEach(() => {
    vi.useFakeTimers();

    global.WebSocket = vi.fn((url: string) => {
      mockWs = new MockWebSocket(url);
      return mockWs;
    }) as any;
  });

  it('devrait se connecter', async () => {
    const getToken = vi.fn(() => 'test-token');

    const { result } = renderHook(() =>
      useRealtimeNotifications({ getToken })
    );

    await act(async () => {
      vi.advanceTimersByTime(120);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });
});
```

## Concepts Clés

### 1. Mock WebSocket
```typescript
// Créer un mock
const mockWs = new MockWebSocket('ws://test');

// Simuler un message
mockWs.simulateMessage({
  type: 'notification',
  data: { message: 'Hello' }
});

// Vérifier messages envoyés
const messages = mockWs.getSentMessages();
expect(messages).toContainEqual({ type: 'ping' });
```

### 2. Fake Timers
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

// Avancer le temps de 30 secondes
await act(async () => {
  vi.advanceTimersByTime(30000);
});
```

### 3. Testing Hooks
```typescript
const { result } = renderHook(() => useMyHook());

// Attendre une mise à jour
await waitFor(() => {
  expect(result.current.value).toBe(expected);
});
```

### 4. Message Builders
```typescript
import {
  createHITLDecisionRequiredEvent,
  createWorkflowUpdateEvent
} from './websocket-mock';

const event = createHITLDecisionRequiredEvent({
  caseId: 'case-123',
  checkpoint: 'GO_NOGO',
  urgency: 'high'
});

mockWs.simulateMessage(event);
```

## Types de Tests

### Test de Connexion
```typescript
it('should connect to WebSocket', async () => {
  const getToken = vi.fn(() => 'test-token');
  const { result } = renderHook(() => useRealtimeNotifications({ getToken }));

  await act(async () => { vi.advanceTimersByTime(120); });

  await waitFor(() => {
    expect(result.current.isConnected).toBe(true);
  });
});
```

### Test de Message
```typescript
it('should handle message', async () => {
  // ... setup connexion ...

  act(() => {
    mockWs?.simulateMessage({
      type: 'notification',
      data: { title: 'Test', message: 'Hello' }
    });
  });

  await waitFor(() => {
    expect(addNotificationMock).toHaveBeenCalled();
  });
});
```

### Test de Reconnexion
```typescript
it('should reconnect after disconnect', async () => {
  // ... setup connexion ...

  act(() => {
    mockWs?.close(1006, 'Network error');
  });

  await waitFor(() => {
    expect(result.current.isConnected).toBe(false);
  });

  await act(async () => {
    vi.advanceTimersByTime(1100); // Délai de reconnexion
  });

  await waitFor(() => {
    expect(result.current.isConnected).toBe(true);
  });
});
```

### Test d'Erreur
```typescript
it('should handle error', async () => {
  const getToken = vi.fn(() => null);
  const onError = vi.fn();

  renderHook(() => useRealtimeNotifications({ getToken, onError }));

  await waitFor(() => {
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('No authentication token')
    );
  });
});
```

## Debugging

### Voir les Logs
```typescript
beforeEach(() => {
  // Commenter ces lignes pour voir les logs
  // vi.spyOn(console, 'log').mockImplementation(() => {});
  // vi.spyOn(console, 'error').mockImplementation(() => {});
});
```

### Inspecter Messages
```typescript
const messages = mockWs?.getSentMessages();
console.log('Messages:', JSON.stringify(messages, null, 2));
```

### Breakpoint
```bash
npm run test:debug src/__tests__/realtime/my-test.test.ts

# Ouvrir chrome://inspect
# Ajouter debugger; dans le code
```

### UI Interactive
```bash
npm run test:realtime:ui

# Ouvre une interface graphique avec:
# - Liste des tests
# - Logs détaillés
# - Reruns automatiques
```

## Commandes Utiles

```bash
# Un seul fichier
npm run test src/__tests__/realtime/use-realtime-notifications.test.ts

# Avec pattern
npm run test -- --grep "connection"

# Un seul test
npm run test -- --grep "should connect automatically"

# Mode verbose
npm run test:realtime -- --reporter=verbose

# Bail on first failure
npm run test:realtime -- --bail

# Couverture avec seuil
npm run test:realtime:coverage -- --coverage.lines=95
```

## Résolution de Problèmes

### Test Flaky ?
```typescript
// Utiliser waitFor() au lieu d'attendre directement
await waitFor(() => {
  expect(condition).toBe(true);
}, { timeout: 2000 });
```

### Timeout ?
```typescript
// Augmenter le timeout
await waitFor(() => {
  expect(condition).toBe(true);
}, { timeout: 5000 });
```

### État Partagé ?
```typescript
// Toujours nettoyer entre les tests
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
```

## Couverture de Code

```bash
# Générer rapport
npm run test:realtime:coverage

# Ouvrir dans navigateur
# Windows
start coverage/index.html

# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html
```

## Checklist Nouveau Test

- [ ] Import de `renderHook`, `waitFor`, `act`
- [ ] Import de `describe`, `it`, `expect`, `vi`, `beforeEach`
- [ ] Setup de `MockWebSocket` dans `beforeEach`
- [ ] Setup de `vi.useFakeTimers()`
- [ ] Cleanup dans `afterEach`
- [ ] Utilisation de `act()` pour mises à jour d'état
- [ ] Utilisation de `waitFor()` pour assertions async
- [ ] Test du cas nominal
- [ ] Test des cas d'erreur
- [ ] Test des edge cases

## Resources Rapides

- **Documentation complète:** [README.md](./README.md)
- **Guide détaillé:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Résumé complet:** [SUMMARY.md](./SUMMARY.md)
- **Mock WebSocket:** [websocket-mock.ts](./websocket-mock.ts)

## Aide Rapide

```bash
# Lister tous les tests
npm run test:realtime -- --list

# Voir la couverture en temps réel
npm run test:realtime:coverage -- --watch

# Filtrer par nom de fichier
npm run test -- use-realtime-notifications

# Filtrer par nom de test
npm run test -- --grep "should handle HITL"
```

---

**Prêt à tester ?** Lancez `npm run test:realtime` !
