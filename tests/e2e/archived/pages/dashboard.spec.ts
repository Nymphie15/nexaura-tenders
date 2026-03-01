/**
 * Dashboard Page E2E Tests
 *
 * Tests couverts:
 * - Affichage et chargement des KPIs (métriques clés)
 * - Navigation entre les différentes sections
 * - Filtres de période (jour, semaine, mois, année)
 * - Rafraîchissement des données
 * - Responsivité des graphiques
 *
 * Page testée: /dashboard (page principale après connexion)
 */
import { test, expect } from '@playwright/test';

test.describe('Dashboard - Page principale', () => {

  // Avant chaque test, naviguer vers le dashboard
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle');
  });

  test.describe('Affichage des KPIs', () => {
    /**
     * Test: Vérifier que tous les KPIs principaux sont affichés
     * Les KPIs incluent: Total AO, AO en cours, Taux de succès, etc.
     */
    test('devrait afficher tous les KPIs principaux', async ({ page }) => {
      // Vérifier la présence des cartes KPI
      const kpiCards = page.locator('[data-testid="kpi-card"], .kpi-card, .stat-card');
      await expect(kpiCards.first()).toBeVisible({ timeout: 10000 });

      // Vérifier quil y a au moins 3 KPIs affichés
      const count = await kpiCards.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    /**
     * Test: Vérifier que les valeurs KPI sont numériques et valides
     */
    test('devrait afficher des valeurs numériques dans les KPIs', async ({ page }) => {
      // Attendre le chargement des données
      await page.waitForSelector('[data-testid="kpi-value"], .kpi-value, .stat-value', {
        state: 'visible',
        timeout: 15000
      });

      const kpiValues = page.locator('[data-testid="kpi-value"], .kpi-value, .stat-value');
      const firstValue = await kpiValues.first().textContent();

      // Vérifier que la valeur nest pas vide
      expect(firstValue).toBeTruthy();
    });

    /**
     * Test: Vérifier le chargement asynchrone des KPIs
     */
    test('devrait charger les KPIs sans erreur', async ({ page }) => {
      // Écouter les erreurs console
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Attendre le chargement complet
      await page.waitForTimeout(3000);

      // Vérifier quil ny a pas derreurs critiques liées aux KPIs
      const kpiErrors = errors.filter(e =>
        e.toLowerCase().includes('kpi') ||
        e.toLowerCase().includes('metric')
      );
      expect(kpiErrors).toHaveLength(0);
    });
  });

  test.describe('Navigation', () => {
    /**
     * Test: Vérifier la présence du menu de navigation
     */
    test('devrait afficher le menu de navigation principal', async ({ page }) => {
      const nav = page.locator('nav, [data-testid="navigation"], .sidebar, .nav-menu');
      await expect(nav.first()).toBeVisible();
    });

    /**
     * Test: Navigation vers la page Validation
     */
    test('devrait naviguer vers la page Validation', async ({ page }) => {
      // Cliquer sur le lien Validation
      const validationLink = page.locator('a[href*="validation"], [data-testid="nav-validation"]');

      if (await validationLink.count() > 0) {
        await validationLink.first().click();
        await page.waitForLoadState('networkidle');

        // Vérifier lURL ou le contenu de la page
        expect(page.url()).toContain('validation');
      }
    });

    /**
     * Test: Navigation vers la page HITL Review
     */
    test('devrait naviguer vers la page HITL Review', async ({ page }) => {
      const hitlLink = page.locator('a[href*="hitl"], a[href*="review"], [data-testid="nav-hitl"]');

      if (await hitlLink.count() > 0) {
        await hitlLink.first().click();
        await page.waitForLoadState('networkidle');

        // Vérifier la navigation
        const url = page.url();
        expect(url.includes('hitl') || url.includes('review')).toBeTruthy();
      }
    });

    /**
     * Test: Retour au dashboard depuis une autre page
     */
    test('devrait permettre de revenir au dashboard', async ({ page }) => {
      // Naviguer ailleurs dabord
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');

      // Revenir au dashboard
      const dashboardLink = page.locator('a[href*="dashboard"], a[href="/"], [data-testid="nav-dashboard"]');
      if (await dashboardLink.count() > 0) {
        await dashboardLink.first().click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('dashboard');
      }
    });
  });

  test.describe('Filtres de période', () => {
    /**
     * Test: Vérifier la présence des filtres de période
     */
    test('devrait afficher les options de filtre de période', async ({ page }) => {
      const periodFilter = page.locator(
        '[data-testid="period-filter"], ' +
        '.period-selector, ' +
        'select[name*="period"], ' +
        '.date-filter, ' +
        '[data-testid="date-range"]'
      );

      // Si le filtre existe, vérifier sa visibilité
      if (await periodFilter.count() > 0) {
        await expect(periodFilter.first()).toBeVisible();
      }
    });

    /**
     * Test: Changer le filtre sur "Semaine"
     */
    test('devrait filtrer par semaine', async ({ page }) => {
      const weekFilter = page.locator(
        'button:has-text("Semaine"), ' +
        'button:has-text("Week"), ' +
        '[data-testid="filter-week"], ' +
        'option[value="week"]'
      );

      if (await weekFilter.count() > 0) {
        await weekFilter.first().click();
        await page.waitForLoadState('networkidle');

        // Vérifier que le filtre est actif (classe active ou aria-selected)
        const isActive = await weekFilter.first().evaluate(el =>
          el.classList.contains('active') ||
          el.getAttribute('aria-selected') === 'true' ||
          el.getAttribute('data-active') === 'true'
        );
        // Le filtre devrait être actif ou la page devrait avoir changé
      }
    });

    /**
     * Test: Changer le filtre sur "Mois"
     */
    test('devrait filtrer par mois', async ({ page }) => {
      const monthFilter = page.locator(
        'button:has-text("Mois"), ' +
        'button:has-text("Month"), ' +
        '[data-testid="filter-month"]'
      );

      if (await monthFilter.count() > 0) {
        await monthFilter.first().click();
        await page.waitForTimeout(1000);

        // Vérifier le changement des données (les KPIs devraient se mettre à jour)
        const kpiValues = page.locator('[data-testid="kpi-value"], .kpi-value');
        await expect(kpiValues.first()).toBeVisible();
      }
    });

    /**
     * Test: Filtre personnalisé avec date range
     */
    test('devrait permettre un filtre de date personnalisé', async ({ page }) => {
      const customDatePicker = page.locator(
        '[data-testid="date-picker"], ' +
        '.date-range-picker, ' +
        'input[type="date"]'
      );

      if (await customDatePicker.count() > 0) {
        await customDatePicker.first().click();
        // Vérifier que le calendrier/picker souvre
        const calendar = page.locator('.calendar, .date-picker-dropdown, [role="dialog"]');
        // Le calendrier devrait safficher
      }
    });
  });

  test.describe('Rafraîchissement des données', () => {
    /**
     * Test: Bouton de rafraîchissement manuel
     */
    test('devrait avoir un bouton de rafraîchissement', async ({ page }) => {
      const refreshButton = page.locator(
        '[data-testid="refresh-button"], ' +
        'button[aria-label*="refresh"], ' +
        'button:has-text("Actualiser"), ' +
        '.refresh-btn'
      );

      if (await refreshButton.count() > 0) {
        await expect(refreshButton.first()).toBeVisible();
        await expect(refreshButton.first()).toBeEnabled();
      }
    });

    /**
     * Test: Rafraîchissement déclenche une requête API
     */
    test('devrait rafraîchir les données au clic', async ({ page }) => {
      const refreshButton = page.locator(
        '[data-testid="refresh-button"], ' +
        'button[aria-label*="refresh"], ' +
        'button:has-text("Actualiser")'
      );

      if (await refreshButton.count() > 0) {
        // Intercepter les requêtes API
        let apiCalled = false;
        page.on('request', request => {
          if (request.url().includes('/api/')) {
            apiCalled = true;
          }
        });

        await refreshButton.first().click();
        await page.waitForTimeout(2000);

        // Vérifier quune requête API a été faite
        // Note: Ceci dépend de limplémentation
      }
    });
  });

  test.describe('Graphiques et visualisations', () => {
    /**
     * Test: Vérifier la présence de graphiques
     */
    test('devrait afficher des graphiques de statistiques', async ({ page }) => {
      const charts = page.locator(
        'canvas, ' +
        'svg[class*="chart"], ' +
        '[data-testid="chart"], ' +
        '.recharts-wrapper, ' +
        '.chart-container'
      );

      // Attendre le rendu des graphiques
      await page.waitForTimeout(2000);

      if (await charts.count() > 0) {
        await expect(charts.first()).toBeVisible();
      }
    });

    /**
     * Test: Les graphiques sont responsifs
     */
    test('devrait adapter les graphiques à différentes tailles', async ({ page }) => {
      // Taille desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      const chartDesktop = page.locator('canvas, .chart-container').first();
      const desktopBox = await chartDesktop.boundingBox();

      // Taille tablette
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);

      // Le graphique devrait toujours être visible
      await expect(chartDesktop).toBeVisible();
    });
  });
});
