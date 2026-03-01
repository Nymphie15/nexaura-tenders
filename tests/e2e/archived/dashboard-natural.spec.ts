import { test } from '@playwright/test';

test('dashboard natural dark mode', async ({ page }) => {
  // Sans forcer le colorScheme - utilise le thème par défaut (dark)
  await page.goto('/login', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  
  await page.fill('input[type="email"]', 'admin@nexaura.fr');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/dashboard-natural.png', fullPage: true });
});
