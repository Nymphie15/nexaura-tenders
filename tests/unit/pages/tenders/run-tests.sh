#!/bin/bash

# Script pour exécuter les tests de pages Tenders
# Usage: ./run-tests.sh [options]

set -e

echo "🧪 Tests des pages Tenders"
echo "=========================="
echo ""

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher un message de succès
success() {
  echo -e "${GREEN}✓${NC} $1"
}

# Fonction pour afficher un message d'erreur
error() {
  echo -e "${RED}✗${NC} $1"
}

# Fonction pour afficher un message d'info
info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

# Déterminer le type de test à exécuter
TEST_TYPE="${1:-all}"

case "$TEST_TYPE" in
  list)
    info "Exécution des tests de la page liste..."
    npm test -- tenders-list.test.tsx
    ;;
  detail)
    info "Exécution des tests de la page détail..."
    npm test -- tender-detail.test.tsx
    ;;
  loading)
    info "Exécution des tests de loading..."
    npm test -- tenders-loading.test.tsx
    ;;
  error)
    info "Exécution des tests d'erreur..."
    npm test -- tenders-error.test.tsx
    ;;
  coverage)
    info "Exécution des tests avec couverture..."
    npm run test:coverage -- tenders
    ;;
  watch)
    info "Exécution des tests en mode watch..."
    npm test -- tenders --watch
    ;;
  all)
    info "Exécution de tous les tests tenders..."
    npm test -- tests/unit/pages/tenders
    ;;
  ci)
    info "Exécution des tests en mode CI..."
    CI=true npm test -- tests/unit/pages/tenders --coverage --reporter=junit --reporter=json
    ;;
  *)
    error "Type de test inconnu: $TEST_TYPE"
    echo ""
    echo "Usage: $0 [type]"
    echo ""
    echo "Types disponibles:"
    echo "  list      - Tests de la page liste"
    echo "  detail    - Tests de la page détail"
    echo "  loading   - Tests de loading"
    echo "  error     - Tests d'erreur"
    echo "  coverage  - Tests avec couverture"
    echo "  watch     - Tests en mode watch"
    echo "  all       - Tous les tests (défaut)"
    echo "  ci        - Tests en mode CI"
    exit 1
    ;;
esac

# Vérifier le code de sortie
if [ $? -eq 0 ]; then
  echo ""
  success "Tests terminés avec succès!"
else
  echo ""
  error "Des tests ont échoué."
  exit 1
fi
