import { test } from '@playwright/test';

test('dark mode login page', async ({ page }) => {
  await page.goto('/login', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/dark-mode-login.png', fullPage: true });
});
