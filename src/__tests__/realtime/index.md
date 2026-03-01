# Index - Tests WebSocket/Realtime

Documentation complète de la suite de tests WebSocket/Realtime pour l'application Appel d'Offre Automation.

---

## 🚀 Démarrage Rapide

**Nouveau dans les tests ?** → [QUICK_START.md](./QUICK_START.md)

```bash
npm run test:realtime
```

---

## 📚 Documentation

### Pour Commencer
- [QUICK_START.md](./QUICK_START.md) - Démarrage en 5 minutes
- [README.md](./README.md) - Vue d'ensemble complète

### Guides Détaillés
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Guide pratique complet
  - Installation
  - Exécution des tests
  - Écriture de nouveaux tests
  - Debugging
  - Best Practices
  - FAQ

### Référence
- [SUMMARY.md](./SUMMARY.md) - Résumé détaillé
  - Statistiques
  - Fichiers créés
  - Métriques de qualité
  - Prochaines étapes

---

## 🧪 Fichiers de Tests

### Tests Unitaires

#### [use-realtime-notifications.test.ts](./use-realtime-notifications.test.ts)
**25 tests** - Hook de notifications temps réel

**Couverture:**
- Connection Management
- Reconnection Logic (backoff exponentiel)
- Message Handling (8 types d'événements)
- Event Subscription
- Keepalive (ping/pong)
- Sound Notifications

**Événements testés:**
- `connected`, `hitl_decision_required`, `hitl_decision_made`
- `workflow_update`, `notification`, `extension_sync`
- `error`, `pong`

#### [use-assistant-websocket.test.ts](./use-assistant-websocket.test.ts)
**27 tests** - Hook WebSocket pour l'assistant IA

**Couverture:**
- Connection Management
- Reconnection Logic (délai fixe 3s)
- Message Handling
- Context Management
- Keepalive
- Utilities (clear messages)
- Edge Cases

**Fonctionnalités testées:**
- Création auto de conversation
- Envoi/réception messages
- Typing indicator
- Suggestions d'actions
- Timeout 30s

### Tests d'Intégration

#### [websocket-integration.test.ts](./websocket-integration.test.ts)
**25 tests** - Intégration entre les hooks

**Scénarios:**
- Multiple Connections (simultanées)
- Cross-Hook Communication
- Error Handling (panne réseau, token expiré)
- Performance (haute fréquence, memory leaks)
- Real-World Scenarios (workflow HITL complet)

---

## 🛠️ Fichiers de Support

### [websocket-mock.ts](./websocket-mock.ts)
Mock WebSocket réutilisable

**Contenu:**
- `MockWebSocket` class complète
- Factory functions (3 variants)
- Message builders (11 types)
- Helpers d'inspection

**Utilisation:**
```typescript
import { MockWebSocket, createHITLDecisionRequiredEvent } from './websocket-mock';

const ws = new MockWebSocket('ws://test');
const event = createHITLDecisionRequiredEvent({ ... });
ws.simulateMessage(event);
```

### [setup.ts](./setup.ts)
Configuration globale des tests

**Contenu:**
- Mock Audio API
- Mock window.matchMedia
- Mock IntersectionObserver
- Mock ResizeObserver
- Environment variables
- Test utilities

### [vitest.config.ts](./vitest.config.ts)
Configuration Vitest spécifique

**Settings:**
- Timeouts: 10s (test), 5s (hooks)
- Coverage targets: >95%
- Reporters: verbose
- Mock reset: automatique
- Retry: 1x pour stabilité

---

## 📊 Statistiques

| Métrique | Valeur |
|----------|--------|
| **Total Tests** | 77+ |
| **Fichiers de Test** | 3 |
| **Fichiers Support** | 5 |
| **Lignes de Code** | ~2,500 |
| **Couverture Cible** | >95% |

---

## 🎯 Commandes Npm

```bash
# Exécution
npm run test:realtime              # Run once
npm run test:realtime:watch        # Watch mode
npm run test:realtime:coverage     # With coverage
npm run test:realtime:ui           # UI interactive

# Debugging
npm run test:debug                 # Chrome DevTools
npm run test -- --grep "pattern"   # Filter tests

# Coverage
npm run test:realtime:coverage     # Generate
open coverage/index.html           # View report
```

---

## 📖 Guide par Tâche

### Je veux...

#### ...exécuter les tests
→ [QUICK_START.md § Exécution Rapide](./QUICK_START.md#exécution-rapide)

#### ...écrire un nouveau test
→ [TESTING_GUIDE.md § Écriture de Nouveaux Tests](./TESTING_GUIDE.md#écriture-de-nouveaux-tests)

#### ...débugger un test qui échoue
→ [TESTING_GUIDE.md § Debugging](./TESTING_GUIDE.md#debugging)

#### ...comprendre un test existant
→ [README.md § Scénarios Testés](./README.md#scénarios-testés)

#### ...améliorer la couverture
→ [TESTING_GUIDE.md § Best Practices](./TESTING_GUIDE.md#best-practices)

#### ...résoudre un test flaky
→ [TESTING_GUIDE.md § FAQ](./TESTING_GUIDE.md#faq)

---

## 🧩 Patterns de Test

### Test de Connexion
```typescript
it('should connect', async () => {
  const { result } = renderHook(() => useMyHook());
  await act(async () => { vi.advanceTimersByTime(120); });
  await waitFor(() => {
    expect(result.current.isConnected).toBe(true);
  });
});
```

### Test de Message
```typescript
it('should handle message', async () => {
  act(() => {
    mockWs?.simulateMessage({ type: 'test', data: {} });
  });
  await waitFor(() => {
    expect(handler).toHaveBeenCalled();
  });
});
```

### Test de Reconnexion
```typescript
it('should reconnect', async () => {
  act(() => { mockWs?.close(1006); });
  await waitFor(() => {
    expect(result.current.isConnected).toBe(false);
  });
  await act(async () => { vi.advanceTimersByTime(1100); });
  await waitFor(() => {
    expect(result.current.isConnected).toBe(true);
  });
});
```

Plus d'exemples → [QUICK_START.md § Exemple de Test Simple](./QUICK_START.md#exemple-de-test-simple)

---

## 🔍 Recherche Rapide

### Par Fonctionnalité

| Fonctionnalité | Fichier de Test |
|----------------|-----------------|
| Notifications temps réel | `use-realtime-notifications.test.ts` |
| Assistant IA | `use-assistant-websocket.test.ts` |
| Intégration | `websocket-integration.test.ts` |
| Mock WebSocket | `websocket-mock.ts` |

### Par Type de Test

| Type | Localisation |
|------|-------------|
| Connection | Tous les fichiers § "Connection Management" |
| Reconnection | Tous les fichiers § "Reconnection Logic" |
| Messages | `use-realtime-notifications.test.ts` § "Message Handling" |
| Performance | `websocket-integration.test.ts` § "Performance" |
| Edge Cases | `use-assistant-websocket.test.ts` § "Edge Cases" |

---

## 🐛 Troubleshooting

### Tests Échouent

1. Vérifier la configuration → [vitest.config.ts](./vitest.config.ts)
2. Vérifier le setup → [setup.ts](./setup.ts)
3. Activer les logs → [TESTING_GUIDE.md § Debugging](./TESTING_GUIDE.md#debugging)

### Tests Lents

1. Vérifier usage de `vi.useFakeTimers()`
2. Vérifier parallélisation
3. Voir [TESTING_GUIDE.md § FAQ](./TESTING_GUIDE.md#faq)

### Couverture Insuffisante

1. Exécuter avec `--coverage`
2. Ouvrir `coverage/index.html`
3. Identifier lignes non couvertes
4. Ajouter tests manquants

---

## 📚 Resources Externes

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## ✅ Checklist Qualité

Avant de commit :

- [ ] Tous les tests passent (`npm run test:realtime`)
- [ ] Couverture >95% (`npm run test:realtime:coverage`)
- [ ] Pas de tests `.only()` ou `.skip()`
- [ ] Documentation à jour si changements API
- [ ] Pas de console.log() oubliés
- [ ] Nettoyage des mocks dans `afterEach`

---

## 🚀 Prochaines Étapes

### Recommandations

1. **Tests E2E** - Ajouter tests avec vrai serveur WebSocket
2. **Tests de Charge** - Simuler 1000+ messages/s
3. **Tests de Sécurité** - Validation des tokens, XSS
4. **CI/CD** - Intégrer dans pipeline
5. **Snapshots** - Snapshot testing des messages

Voir détails → [SUMMARY.md § Prochaines Étapes](./SUMMARY.md#prochaines-étapes)

---

## 📞 Contact & Support

**Questions ?** Voir [TESTING_GUIDE.md § FAQ](./TESTING_GUIDE.md#faq)

**Bugs ?** Vérifier [Troubleshooting](#troubleshooting)

**Améliorations ?** Contribuer via pull request

---

**Version:** 1.0.0
**Date:** 2026-01-25
**Auteur:** Claude Code
**Projet:** Appel d'Offre Automation

---

## Navigation Rapide

| Document | Description |
|----------|-------------|
| [index.md](./index.md) | **Ce fichier** - Index principal |
| [QUICK_START.md](./QUICK_START.md) | Démarrage rapide (5 min) |
| [README.md](./README.md) | Vue d'ensemble complète |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Guide pratique détaillé |
| [SUMMARY.md](./SUMMARY.md) | Résumé et métriques |
| [websocket-mock.ts](./websocket-mock.ts) | Mock réutilisable |
| [setup.ts](./setup.ts) | Configuration globale |
| [vitest.config.ts](./vitest.config.ts) | Config Vitest |

---

**Prêt à tester ?** → [QUICK_START.md](./QUICK_START.md)
