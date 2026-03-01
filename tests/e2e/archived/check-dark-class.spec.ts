import { test, expect } from '@playwright/test';

test('check dark class on html', async ({ page }) => {
  await page.goto('/login');
  await page.waitForTimeout(2000);
  
  // Check if html has dark class
  const htmlClass = await page.evaluate(() => document.documentElement.className);
  console.log('HTML class:', htmlClass);
  
  // Login
  await page.fill('input[type="email"]', 'admin@nexaura.fr');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Check again after login
  const htmlClassAfter = await page.evaluate(() => document.documentElement.className);
  console.log('HTML class after login:', htmlClassAfter);
  
  // Check computed style of dialog
  const dialogBg = await page.evaluate(() => {
    const dialog = document.querySelector('[data-slot="dialog-content"]');
    if (dialog) {
      return window.getComputedStyle(dialog).backgroundColor;
    }
    return 'no dialog found';
  });
  console.log('Dialog background:', dialogBg);
});
