import { test } from '@playwright/test';

test('capture real homepage after escape', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  
  // Fermer command palette
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'test-results/real-homepage.png', fullPage: true });
});
