import { test, expect } from '@playwright/test';

test.describe('Document Editor Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('input[name="email"]', 'admin@nexaura.fr');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3001/');
  });

  test('should display document editor', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Verify editor is present
    await expect(page.locator('[data-testid="document-editor"]')).toBeVisible();
  });

  test('should display toolbar with persona and writing modes', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Verify toolbar elements
    await expect(page.locator('[data-testid="persona-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="writing-mode-toggle"]')).toBeVisible();
  });

  test('should generate AI suggestions', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Click generate suggestions button
    await page.click('button:has-text("Suggestions IA")');
    
    // Wait for suggestions to appear
    await expect(page.locator('[data-testid="ai-suggestions"]')).toBeVisible({ timeout: 10000 });
    
    // Verify at least one suggestion is present
    const suggestions = await page.locator('[data-testid="suggestion-item"]').count();
    expect(suggestions).toBeGreaterThan(0);
  });

  test('should apply inline edit command', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Select some text
    await page.click('[data-testid="document-content"]');
    await page.keyboard.press('Control+a');
    
    // Click quick action
    await page.click('button:has-text("Rendre concis")');
    
    // Wait for transformation
    await page.waitForTimeout(2000);
    
    // Verify text has been transformed
    const content = await page.locator('[data-testid="document-content"]').inputValue();
    expect(content).not.toBe('');
  });

  test('should open chat with AI', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Click chat button
    await page.click('button:has-text("Chat IA")');
    
    // Verify chat panel is visible
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    
    // Type a message
    await page.fill('[data-testid="chat-input"]', 'Peux-tu améliorer cette introduction?');
    await page.click('[data-testid="send-message"]');
    
    // Wait for AI response
    await expect(page.locator('[data-testid="chat-message"]:has-text("assistant")')).toBeVisible({ timeout: 10000 });
  });

  test('should show version history', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Click history button
    await page.click('button:has-text("Historique")');
    
    // Verify history panel is visible
    await expect(page.locator('[data-testid="version-history"]')).toBeVisible();
  });

  test('should save document', async ({ page }) => {
    await page.goto('http://localhost:3001/test-v3');
    
    // Edit content
    await page.fill('[data-testid="document-content"]', 'Test content updated');
    
    // Click save
    await page.click('button:has-text("Sauvegarder")');
    
    // Verify success message
    await expect(page.locator('text=Document saved successfully')).toBeVisible();
  });
});
