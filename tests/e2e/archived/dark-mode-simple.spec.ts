import { test, expect } from '@playwright/test';

test.describe('Simple Dark Mode Test', () => {
  test('should have dark mode', async ({ page, context }) => {
    // Set localStorage BEFORE navigating
    await context.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
    
    // Force dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Go to login page with less strict waiting
    await page.goto('http://localhost/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for page to render
    await page.waitForTimeout(2000);
    
    // Check html class before login
    let htmlClass = await page.evaluate(() => document.documentElement.className);
    console.log('HTML class on login page:', htmlClass);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/dark-login.png' });
    
    // If dark class is present, test passes
    expect(htmlClass).toContain('dark');
  });
});
