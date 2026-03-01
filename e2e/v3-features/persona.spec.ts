import { test, expect } from '@playwright/test';

test.describe('Company Persona Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('input[name="email"]', 'admin@nexaura.fr');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3001/');
  });

  test('should display persona selector', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Verify persona selector is present
    await expect(page.locator('[data-testid="persona-selector"]')).toBeVisible();
  });

  test('should display persona templates', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Click on persona selector
    await page.click('[data-testid="persona-selector"]');
    
    // Verify templates are displayed
    await expect(page.locator('text=BTP - Entreprise générale')).toBeVisible();
    await expect(page.locator('text=IT - Éditeur logiciel')).toBeVisible();
    await expect(page.locator('text=Consulting - Cabinet conseil')).toBeVisible();
    await expect(page.locator('text=Services - Facilities')).toBeVisible();
  });

  test('should create persona from template', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Click persona selector
    await page.click('[data-testid="persona-selector"]');
    
    // Click on BTP template
    await page.click('text=BTP - Entreprise générale');
    
    // Verify persona is selected
    await expect(page.locator('[data-testid="selected-persona"]:has-text("BTP")')).toBeVisible();
  });

  test('should display persona configuration', async ({ page }) => {
    await page.goto('http://localhost:3001/settings/persona');
    
    // Verify voice profile settings
    await expect(page.locator('text=Formality')).toBeVisible();
    await expect(page.locator('text=Technical Level')).toBeVisible();
    await expect(page.locator('text=Tone')).toBeVisible();
    await expect(page.locator('text=Verbosity')).toBeVisible();
  });

  test('should save vocabulary preferences', async ({ page }) => {
    await page.goto('http://localhost:3001/settings/persona');
    
    // Add preferred term
    await page.fill('[data-testid="preferred-term-input"]', 'expertise');
    await page.click('[data-testid="add-preferred-term"]');
    
    // Add avoided term
    await page.fill('[data-testid="avoided-term-input"]', 'produit');
    await page.click('[data-testid="add-avoided-term"]');
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify success message
    await expect(page.locator('text=Persona saved successfully')).toBeVisible();
  });
});
