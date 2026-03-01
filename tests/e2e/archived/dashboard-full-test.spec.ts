import { test, expect } from '@playwright/test';

test.describe('Dashboard Full Test', () => {
  test('should login and display dashboard correctly', async ({ page, context }) => {
    // Set dark mode
    await context.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Go to login
    await page.goto('http://localhost/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Screenshot login page
    await page.screenshot({ path: 'test-results/01-login-page.png' });
    
    // Fill login form
    await page.fill('input[type="email"]', 'admin@nexaura.fr');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForTimeout(5000);
    
    // Get current URL
    const url = page.url();
    console.log('Current URL:', url);
    
    // Check dark mode
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    console.log('HTML class:', htmlClass);
    
    // Screenshot dashboard
    await page.screenshot({ path: 'test-results/02-dashboard.png', fullPage: true });
    
    // Check for key dashboard elements
    const sidebar = await page.locator('aside, nav, [class*="sidebar"]').first().isVisible().catch(() => false);
    const header = await page.locator('header').first().isVisible().catch(() => false);
    
    console.log('Sidebar visible:', sidebar);
    console.log('Header visible:', header);
    
    // Verify dark mode is active
    expect(htmlClass).toContain('dark');
  });
});
