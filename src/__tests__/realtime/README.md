# Tests WebSocket / Temps Réel

Suite de tests unitaires complète pour les fonctionnalités WebSocket et notifications temps réel.

## Structure

```
src/__tests__/realtime/
├── README.md                              # Ce fichier
├── websocket-mock.ts                      # Mock WebSocket réutilisable + builders
├── use-realtime-notifications.test.ts     # Tests pour notifications temps réel
└── use-assistant-websocket.test.ts        # Tests pour WebSocket assistant
```

## Fichiers de Tests

### `use-realtime-notifications.test.ts`

Tests pour le hook `useRealtimeNotifications` qui gère les notifications temps réel via WebSocket.

**Couverture:**
- ✅ Connexion/déconnexion automatique et manuelle
- ✅ Reconnexion automatique avec backoff exponentiel
- ✅ Gestion de tous les types d'événements:
  - `connected` - Connexion établie
  - `hitl_decision_required` - Décision HITL requise
  - `hitl_decision_made` - Décision HITL prise
  - `workflow_update` - Mise à jour workflow
  - `notification` - Notification générale
  - `extension_sync` - Synchronisation extension
  - `error` - Erreur serveur
  - `pong` - Réponse keepalive
- ✅ Système de souscription aux événements
- ✅ Intégration avec le notification store (Zustand)
- ✅ Sons de notification (activables/désactivables)
- ✅ Keepalive ping toutes les 30s
- ✅ Gestion des erreurs et timeouts
- ✅ Limite de tentatives de reconnexion

**Groupes de tests:**
1. **Connection Management** - 5 tests
2. **Reconnection Logic** - 3 tests
3. **Message Handling** - 11 tests
4. **Event Subscription** - 2 tests
5. **Keepalive** - 2 tests
6. **Sound Notifications** - 2 tests

**Total: 25 tests**

### `use-assistant-websocket.test.ts`

Tests pour le hook `useAssistantWebSocket` qui gère les conversations avec l'assistant IA.

**Couverture:**
- ✅ Connexion/déconnexion automatique
- ✅ Création automatique de conversation
- ✅ Envoi et réception de messages
- ✅ Gestion du typing indicator
- ✅ Mise à jour du contexte conversationnel
- ✅ Reconnexion automatique (délai fixe 3s)
- ✅ Timeout des messages (30s)
- ✅ Keepalive ping toutes les 30s
- ✅ Gestion des erreurs
- ✅ Cleanup des ressources

**Groupes de tests:**
1. **Connection Management** - 5 tests
2. **Reconnection Logic** - 3 tests
3. **Message Handling** - 8 tests
4. **Context Management** - 3 tests
5. **Keepalive** - 2 tests
6. **Utilities** - 2 tests
7. **Edge Cases** - 4 tests

**Total: 27 tests**

### `websocket-mock.ts`

Mock WebSocket réutilisable avec helpers pour les tests.

**Classes:**
- `MockWebSocket` - Implémentation complète de WebSocket pour tests

**Factory Functions:**
- `createMockWebSocket()` - Instance standard
- `createFailingMockWebSocket()` - Mock qui échoue toujours
- `createAutoDisconnectMockWebSocket()` - Mock qui se déconnecte automatiquement

**Message Builders:**
- `createConnectedEvent()`
- `createHITLDecisionRequiredEvent()`
- `createHITLDecisionMadeEvent()`
- `createWorkflowUpdateEvent()`
- `createNotificationEvent()`
- `createExtensionSyncEvent()`
- `createErrorEvent()`
- `createConversationCreatedEvent()`
- `createTypingEvent()`
- `createResponseEvent()`
- `createPongEvent()`

## Lancer les Tests

```bash
# Tous les tests realtime
npm run test src/__tests__/realtime

# Un fichier spécifique
npm run test src/__tests__/realtime/use-realtime-notifications.test.ts

# Avec coverage
npm run test:coverage src/__tests__/realtime

# En mode watch
npm run test:watch src/__tests__/realtime

# Tests UI interactifs
npm run test:ui
```

## Technologies

- **Vitest** - Framework de test
- **@testing-library/react** - Utilitaires pour tester React hooks
- **@testing-library/user-event** - Simulation d'interactions utilisateur
- **vi.useFakeTimers()** - Gestion du temps pour les tests async

## Patterns de Test Utilisés

### 1. Mock WebSocket

```typescript
class MockWebSocket {
  // Simulation complète de WebSocket
  simulateMessage(data: unknown): void {
    const event = new MessageEvent('message', {
      data: JSON.stringify(data)
    });
    this.onmessage?.(event);
  }
}
```

### 2. Timers Simulés

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

// Dans le test
await act(async () => {
  vi.advanceTimersByTime(30000); // Avancer de 30s
});
```

### 3. Testing Hooks

```typescript
const { result } = renderHook(() =>
  useRealtimeNotifications({ getToken })
);

await waitFor(() => {
  expect(result.current.isConnected).toBe(true);
});
```

### 4. Assertions Asynchrones

```typescript
await waitFor(() => {
  expect(result.current.messages).toHaveLength(2);
});
```

### 5. Event Simulation

```typescript
act(() => {
  mockWebSocket?.simulateMessage({
    type: 'hitl_decision_required',
    data: { case_id: 'case-123' }
  });
});
```

## Scénarios Testés

### Connexion WebSocket

- ✅ Connexion automatique au mount
- ✅ Connexion manuelle avec `connect()`
- ✅ Déconnexion propre avec `disconnect()`
- ✅ Erreur si pas de token
- ✅ Cleanup au unmount

### Reconnexion

- ✅ Reconnexion automatique après déconnexion
- ✅ Backoff exponentiel (notifications)
- ✅ Délai fixe de 3s (assistant)
- ✅ Limite de tentatives (5-10)
- ✅ Arrêt après limite atteinte

### Messages

- ✅ Réception de tous les types d'événements
- ✅ Envoi de messages utilisateur
- ✅ Parsing JSON
- ✅ Gestion des erreurs de parsing
- ✅ Timeout après 30s (assistant)

### Notifications

- ✅ Ajout au store Zustand
- ✅ Mapping urgence → priorité
- ✅ Création de liens vers pages
- ✅ Sons pour notifications urgentes
- ✅ Désactivation des sons

### Assistant

- ✅ Création automatique de conversation
- ✅ Typing indicator
- ✅ Suggestions d'actions
- ✅ Mise à jour du contexte
- ✅ Clear messages

### Keepalive

- ✅ Ping toutes les 30s
- ✅ Pas de ping si déconnecté
- ✅ Réponse pong ignorée

## Edge Cases Testés

- ✅ JSON malformé
- ✅ Type de message inconnu
- ✅ WebSocket non connecté lors de l'envoi
- ✅ Conversation non créée lors de l'envoi
- ✅ Déconnexion pendant un envoi
- ✅ Messages multiples du même type
- ✅ Souscription/désouscription d'événements
- ✅ Tentative de création de conversation multiple

## Métriques de Couverture Attendues

- **Branches:** > 90%
- **Functions:** > 95%
- **Lines:** > 95%
- **Statements:** > 95%

## Bonnes Pratiques

### ✅ À Faire

- Utiliser `act()` pour les mises à jour d'état
- Utiliser `waitFor()` pour les assertions async
- Nettoyer les timers avec `vi.useRealTimers()`
- Nettoyer les mocks avec `vi.restoreAllMocks()`
- Tester les cas d'erreur et edge cases
- Isoler chaque test (pas de partage d'état)

### ❌ À Éviter

- Tests qui dépendent de l'ordre d'exécution
- Timeouts arbitraires (utiliser `waitFor`)
- Partage d'état entre tests
- Tests flaky (instables)
- Assertions sans `waitFor` pour code async

## Debugging

### Activer les Logs

Commenter les `vi.spyOn(console, ...)` dans `beforeEach()` :

```typescript
beforeEach(() => {
  // vi.spyOn(console, 'log').mockImplementation(() => {});
  // vi.spyOn(console, 'error').mockImplementation(() => {});
});
```

### Inspecter les Messages Envoyés

```typescript
const messages = mockWebSocket?.getSentMessages();
console.log('Messages envoyés:', messages);
```

### Breakpoint dans Vitest

```bash
npm run test:debug src/__tests__/realtime/use-realtime-notifications.test.ts
```

Puis ouvrir `chrome://inspect` dans Chrome.

## Maintenance

### Ajouter un Nouveau Type d'Événement

1. Créer un builder dans `websocket-mock.ts`
2. Ajouter un test dans `use-realtime-notifications.test.ts`
3. Vérifier la couverture

### Modifier un Hook

1. Mettre à jour les tests correspondants
2. Ajouter des tests pour nouvelles fonctionnalités
3. Vérifier que tous les tests passent

### Refactoring

1. Lancer les tests AVANT
2. Effectuer le refactoring
3. Vérifier que tous les tests passent APRÈS
4. Pas de baisse de couverture

## Ressources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Hooks](https://react-hooks-testing-library.com/)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

**Dernière mise à jour:** 2026-01-25
**Total tests:** 52 tests (25 + 27)
**Couverture:** > 95%
