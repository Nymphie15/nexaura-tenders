import { test, expect } from '@playwright/test';

test.describe('Writing Modes Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('input[name="email"]', 'admin@nexaura.fr');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3001/');
  });

  test('should display writing mode toggle', async ({ page }) => {
    // Navigate to document editor
    await page.goto('http://localhost:3001/workflows/test-case-id');
    
    // Verify writing mode toggle is present
    await expect(page.locator('[data-testid="writing-mode-toggle"]')).toBeVisible();
  });

  test('should display all 7 writing modes', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Verify all modes are present
    const modes = ['Concis', 'Détaillé', 'Technique', 'Exécutif', 'Pédagogique', 'Conforme', 'Persuasif'];
    
    for (const mode of modes) {
      await expect(page.locator(`button:has-text("${mode}")`)).toBeVisible();
    }
  });

  test('should apply concise mode and reduce text length', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Get initial text length
    const initialText = await page.locator('[data-testid="document-content"]').inputValue();
    const initialLength = initialText.length;
    
    // Click concise mode
    await page.click('button:has-text("Concis")');
    
    // Wait for transformation
    await page.waitForTimeout(2000);
    
    // Verify text has been transformed (length should be reduced)
    const transformedText = await page.locator('[data-testid="document-content"]').inputValue();
    expect(transformedText.length).toBeLessThan(initialLength * 0.9);
  });

  test('should show keyboard shortcuts', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Verify shortcuts are displayed
    await expect(page.locator('text=Ctrl+1')).toBeVisible();
    await expect(page.locator('text=Ctrl+2')).toBeVisible();
  });

  test('should use Ctrl+1 shortcut for concise mode', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Focus editor
    await page.click('[data-testid="document-content"]');
    
    // Press Ctrl+1
    await page.keyboard.press('Control+1');
    
    // Wait for transformation
    await page.waitForTimeout(2000);
    
    // Verify concise mode was applied
    await expect(page.locator('[data-testid="mode-applied"]:has-text("concise")')).toBeVisible();
  });
});
