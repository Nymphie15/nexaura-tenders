import { test } from '@playwright/test';

test('dashboard dark mode check', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/dashboard-dark-fixed.png', fullPage: true });
});
