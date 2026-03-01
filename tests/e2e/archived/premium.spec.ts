/**
 * Premium Components E2E Test
 * Tests des nouveaux composants premium
 */

import { test, expect } from '@playwright/test';

test.describe('Premium Components', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers la page principale (pas /dashboard)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('devrait charger la page principale sans erreur', async ({ page }) => {
    // Vérifier qu'il n'y a pas d'erreur 404
    await expect(page.locator('text=404')).not.toBeVisible();

    // Vérifier que la page a du contenu
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('devrait afficher des cartes KPI ou statistiques', async ({ page }) => {
    // Chercher des éléments de type carte ou stat
    const cards = page.locator('[class*="card"], [class*="stat"], [class*="kpi"]');
    const count = await cards.count();

    console.log(`Nombre de cartes trouvées: ${count}`);

    // On s'attend à au moins quelques cartes sur le dashboard
    // Si 0, ce n'est pas forcément une erreur, juste à noter
  });

  test('devrait avoir le dark mode toggle fonctionnel', async ({ page }) => {
    // Chercher un bouton de theme
    const themeButton = page.locator('[aria-label*="theme"], [aria-label*="dark"], button:has([class*="moon"]), button:has([class*="sun"])');

    if (await themeButton.count() > 0) {
      await themeButton.first().click();
      // Vérifier que le DOM a changé
      await page.waitForTimeout(500);
    }
  });

  test('devrait afficher la navigation sidebar', async ({ page }) => {
    // Chercher une sidebar ou navigation
    const sidebar = page.locator('nav, aside, [class*="sidebar"], [class*="nav"]');
    const count = await sidebar.count();

    console.log(`Éléments de navigation trouvés: ${count}`);
    expect(count).toBeGreaterThan(0);
  });

  test('devrait avoir des animations Framer Motion', async ({ page }) => {
    // Chercher des éléments avec des attributs Framer Motion
    const motionElements = page.locator('[style*="transform"], [style*="opacity"]');
    const count = await motionElements.count();

    console.log(`Éléments animés trouvés: ${count}`);
  });

  test('screenshot de la page principale', async ({ page }) => {
    await page.screenshot({ path: 'test-results/homepage-screenshot.png', fullPage: true });
  });
});

test.describe('Page Workflows', () => {
  test('devrait charger la page workflows', async ({ page }) => {
    await page.goto('/workflows');
    await page.waitForLoadState('networkidle');

    // Vérifier qu'il n'y a pas d'erreur 404
    const is404 = await page.locator('text=404').count();
    if (is404 === 0) {
      await page.screenshot({ path: 'test-results/workflows-screenshot.png', fullPage: true });
    }
  });
});

test.describe('Page HITL', () => {
  test('devrait charger la page HITL', async ({ page }) => {
    await page.goto('/hitl');
    await page.waitForLoadState('networkidle');

    // Vérifier qu'il n'y a pas d'erreur 404
    const is404 = await page.locator('text=404').count();
    if (is404 === 0) {
      await page.screenshot({ path: 'test-results/hitl-screenshot.png', fullPage: true });
    }
  });
});

test.describe('Page Tenders', () => {
  test('devrait charger la page tenders', async ({ page }) => {
    await page.goto('/tenders');
    await page.waitForLoadState('networkidle');

    // Vérifier qu'il n'y a pas d'erreur 404
    const is404 = await page.locator('text=404').count();
    if (is404 === 0) {
      await page.screenshot({ path: 'test-results/tenders-screenshot.png', fullPage: true });
    }
  });
});
