import { test } from '@playwright/test';

test('force dark mode', async ({ page }) => {
  // Activer le dark mode via media query
  await page.emulateMedia({ colorScheme: 'dark' });
  
  await page.goto('/login', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/forced-dark-mode.png', fullPage: true });
});
