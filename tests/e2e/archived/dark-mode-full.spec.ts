import { test, expect } from '@playwright/test';

test.describe('Dark Mode Full Test', () => {
  test('should display dashboard in dark mode', async ({ page, context }) => {
    // Set localStorage BEFORE navigating
    await context.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
    
    // Force dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Go to login page
    await page.goto('http://localhost/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Wait for form fields
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Login
    await page.fill('input[type="email"]', 'admin@nexaura.fr');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('**/!(login|register)**', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Check html class on dashboard
    let htmlClass = await page.evaluate(() => document.documentElement.className);
    console.log('HTML class on dashboard:', htmlClass);
    
    // Get current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/dashboard-final.png', fullPage: true });
    
    // Test if dark mode is active
    expect(htmlClass).toContain('dark');
  });
});
