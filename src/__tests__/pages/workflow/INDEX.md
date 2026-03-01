# Tests des Pages Workflow - Index

Bienvenue dans la suite de tests complète des pages Workflow!

## 📚 Navigation Rapide

### 🚀 Démarrage
- **[QUICKSTART.md](./QUICKSTART.md)** - Commencer en 30 secondes
- **[CHECKLIST.md](./CHECKLIST.md)** - Vérifier que tout fonctionne

### 📖 Documentation
- **[README.md](./README.md)** - Documentation complète
- **[SUMMARY.md](./SUMMARY.md)** - Résumé et statistiques
- **[INTEGRATION.md](./INTEGRATION.md)** - Guide d'intégration CI/CD

### 🧪 Fichiers de Tests
- **[workflows-list.test.tsx](./workflows-list.test.tsx)** - Tests de la page liste (35+ tests)
- **[workflow-detail.test.tsx](./workflow-detail.test.tsx)** - Tests de la page détail (45+ tests)
- **[hitl-components.test.tsx](./hitl-components.test.tsx)** - Tests des composants HITL (40+ tests)
- **[phase-display.test.tsx](./phase-display.test.tsx)** - Tests d'affichage des phases (35+ tests)
- **[progress-indicators.test.tsx](./progress-indicators.test.tsx)** - Tests des indicateurs (40+ tests)

## 🎯 Objectif

Fournir une couverture de tests complète et robuste pour toutes les pages et composants liés aux workflows de l'application d'automatisation d'appels d'offres.

## 📊 Statistiques

| Métrique | Valeur |
|----------|--------|
| **Lignes de code** | 5000+ |
| **Tests créés** | 195+ |
| **Fichiers de tests** | 5 |
| **Fichiers de docs** | 5 |
| **Couverture** | ~93% |
| **Temps d'exécution** | ~15-30s |

## 🏃 Commandes Rapides

```bash
# Tout exécuter
npm run test:workflow

# Mode watch
npm run test:workflow:watch

# Avec couverture
npm run test:workflow:coverage
```

## 📂 Structure

```
src/__tests__/pages/workflow/
├── 🧪 Tests
│   ├── workflows-list.test.tsx       (35+ tests)
│   ├── workflow-detail.test.tsx      (45+ tests)
│   ├── hitl-components.test.tsx      (40+ tests)
│   ├── phase-display.test.tsx        (35+ tests)
│   ├── progress-indicators.test.tsx  (40+ tests)
│   └── index.test.ts                 (index)
│
├── 📖 Documentation
│   ├── QUICKSTART.md                 (Démarrage rapide)
│   ├── README.md                     (Documentation complète)
│   ├── SUMMARY.md                    (Résumé)
│   ├── INTEGRATION.md                (Intégration CI/CD)
│   ├── CHECKLIST.md                  (Vérifications)
│   └── INDEX.md                      (Ce fichier)
│
└── ⚙️ Configuration
    └── .gitignore                    (Fichiers ignorés)

scripts/
├── test-workflow.sh                  (Script Bash)
└── test-workflow.ps1                 (Script PowerShell)
```

## ✨ Fonctionnalités Testées

### Pages
- ✅ Liste des workflows (dashboard + tableau)
- ✅ Détail du workflow (timeline + actions)

### Composants
- ✅ Décisions HITL
- ✅ Affichage des phases
- ✅ Indicateurs de progression

### États
- ✅ running, paused, waiting_hitl
- ✅ completed, failed, cancelled

### Interactions
- ✅ Recherche et filtrage
- ✅ Actions (annuler, reprendre, relancer)
- ✅ Décisions HITL
- ✅ Navigation

## 🎓 Pour Commencer

### Nouveau sur ce projet?
1. Lire [QUICKSTART.md](./QUICKSTART.md)
2. Exécuter `npm run test:workflow`
3. Explorer [README.md](./README.md) pour plus de détails

### Développeur expérimenté?
1. Consulter [SUMMARY.md](./SUMMARY.md) pour les stats
2. Voir [INTEGRATION.md](./INTEGRATION.md) pour CI/CD
3. Utiliser les scripts dans `scripts/`

### Besoin d'aide?
1. Vérifier [CHECKLIST.md](./CHECKLIST.md)
2. Consulter la section Troubleshooting du [README.md](./README.md)
3. Contacter l'équipe

## 🚀 Prochaines Étapes

1. **Exécuter les tests**
   ```bash
   npm run test:workflow
   ```

2. **Vérifier la couverture**
   ```bash
   npm run test:workflow:coverage
   open coverage/index.html
   ```

3. **Intégrer dans CI/CD**
   - Voir [INTEGRATION.md](./INTEGRATION.md)

4. **Former l'équipe**
   - Partager [QUICKSTART.md](./QUICKSTART.md)

## 📞 Support

- 📖 Documentation complète: [README.md](./README.md)
- 🚀 Guide rapide: [QUICKSTART.md](./QUICKSTART.md)
- ✅ Vérifications: [CHECKLIST.md](./CHECKLIST.md)
- 🔧 Intégration: [INTEGRATION.md](./INTEGRATION.md)

---

**Créé le**: 2026-01-25
**Version**: 1.0.0
**Status**: ✅ Production Ready
