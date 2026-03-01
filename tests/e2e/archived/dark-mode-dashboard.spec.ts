import { test, expect } from '@playwright/test';

test.describe('Dark Mode Dashboard Test', () => {
  test('should maintain dark mode after login', async ({ page, context }) => {
    // Set localStorage BEFORE navigating
    await context.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
    
    // Force dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Go to login page
    await page.goto('http://localhost/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    // Login
    await page.fill('input[type="email"]', 'admin@nexaura.fr');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(4000);
    
    // Check html class on dashboard
    let htmlClass = await page.evaluate(() => document.documentElement.className);
    console.log('HTML class on dashboard:', htmlClass);
    
    // Check localStorage
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    console.log('LocalStorage theme:', theme);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/dark-dashboard.png', fullPage: true });
    
    // Test if dark mode is active
    expect(htmlClass).toContain('dark');
  });
});
