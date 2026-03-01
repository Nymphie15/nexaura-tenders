import { test, expect } from '@playwright/test';

test.describe('Full Site Premium Test', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
    await page.emulateMedia({ colorScheme: 'dark' });
  });

  test('login page loads correctly', async ({ page }) => {
    await page.goto('http://localhost/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('dark');
    
    await page.screenshot({ path: 'test-results/premium-login.png' });
  });

  test('workflows page loads', async ({ page }) => {
    await page.goto('http://localhost/workflows', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/premium-workflows.png' });
  });

  test('hitl page loads', async ({ page }) => {
    await page.goto('http://localhost/hitl', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/premium-hitl.png' });
  });

  test('tenders page loads', async ({ page }) => {
    await page.goto('http://localhost/tenders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/premium-tenders.png' });
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('http://localhost/settings', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/premium-settings.png' });
  });
});
