import { test } from '@playwright/test';

test('dashboard logged in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  
  // Aller sur login
  await page.goto('/login', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  
  // Remplir le formulaire
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', 'admin@nexaura.fr');
  await page.fill('input[type="password"], input[name="password"]', 'Admin123!');
  
  // Cliquer sur Se connecter
  await page.click('button[type="submit"], button:has-text("connecter")');
  
  // Attendre la redirection
  await page.waitForTimeout(3000);
  
  // Screenshot du dashboard
  await page.screenshot({ path: 'test-results/dashboard-logged-dark.png', fullPage: true });
});
