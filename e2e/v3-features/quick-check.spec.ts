import { test, expect } from '@playwright/test';

test.describe('Quick Check Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3001/login');
    await page.fill('input[name="email"]', 'admin@nexaura.fr');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3001/');
  });

  test('should display quick check card on tender page', async ({ page }) => {
    // Navigate to a tender
    await page.goto('http://localhost:3001/tenders');
    await page.waitForSelector('[data-testid="tender-list"]');
    
    // Click on first tender
    await page.click('[data-testid="tender-item"]:first-child');
    await page.waitForURL(/\/tenders\/.+/);
    
    // Verify Quick Check card is present
    await expect(page.locator('[data-testid="quick-check-card"]')).toBeVisible();
  });

  test('should start quick check analysis', async ({ page }) => {
    await page.goto('http://localhost:3001/tenders/boamp_26-10914');
    
    // Click start analysis button
    const startButton = page.locator('button:has-text("Lancer l\'analyse")');
    await expect(startButton).toBeVisible();
    await startButton.click();
    
    // Verify loading state
    await expect(page.locator('text=Analyse en cours')).toBeVisible();
    
    // Wait for result (max 15s)
    await expect(page.locator('[data-testid="quick-check-result"]')).toBeVisible({ timeout: 15000 });
  });

  test('should display matching score and recommendation', async ({ page }) => {
    await page.goto('http://localhost:3001/tenders/boamp_26-10914');
    
    // Wait for quick check to complete
    await page.waitForSelector('[data-testid="quick-check-result"]', { timeout: 15000 });
    
    // Verify score is displayed
    await expect(page.locator('[data-testid="matching-score"]')).toBeVisible();
    
    // Verify recommendation is displayed
    await expect(page.locator('[data-testid="recommendation"]')).toBeVisible();
    
    // Verify recommendation is one of: GO, NO_GO, REVIEW
    const recommendation = await page.locator('[data-testid="recommendation"]').textContent();
    expect(['GO', 'NO-GO', 'REVIEW']).toContain(recommendation);
  });

  test('should display effort and cost estimates', async ({ page }) => {
    await page.goto('http://localhost:3001/tenders/boamp_26-10914');
    
    await page.waitForSelector('[data-testid="quick-check-result"]', { timeout: 15000 });
    
    // Verify estimates are displayed
    await expect(page.locator('text=Temps estimé')).toBeVisible();
    await expect(page.locator('text=Coût estimé')).toBeVisible();
  });

  test('should proceed to workflow when clicking GO', async ({ page }) => {
    await page.goto('http://localhost:3001/tenders/boamp_26-10914');
    
    await page.waitForSelector('[data-testid="quick-check-result"]', { timeout: 15000 });
    
    // Click proceed button
    const proceedButton = page.locator('button:has-text("Lancer le workflow")');
    if (await proceedButton.isVisible()) {
      await proceedButton.click();
      await expect(page).toHaveURL(/\/workflows\/.+/);
    }
  });
});
