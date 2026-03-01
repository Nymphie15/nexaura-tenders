import { test } from '@playwright/test';

test('click away from command palette', async ({ page }) => {
  await page.goto('/workflows');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Cliquer en bas à droite pour fermer le command palette
  await page.mouse.click(800, 500);
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'test-results/after-click.png', fullPage: true });
});
