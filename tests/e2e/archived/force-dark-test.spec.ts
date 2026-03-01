import { test, expect } from '@playwright/test';

test.describe('Force Dark Mode Test', () => {
  test('should display dark mode correctly', async ({ page, context }) => {
    // Set localStorage BEFORE navigating
    await context.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
    
    // Force dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Go to login page
    await page.goto('http://localhost/login', { waitUntil: 'networkidle' });
    
    // Wait for theme to be applied
    await page.waitForTimeout(1000);
    
    // Check html class before login
    let htmlClass = await page.evaluate(() => document.documentElement.className);
    console.log('HTML class on login page:', htmlClass);
    
    // Login
    await page.fill('input[type="email"]', 'admin@nexaura.fr');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForTimeout(4000);
    
    // Check html class after login
    htmlClass = await page.evaluate(() => document.documentElement.className);
    console.log('HTML class on dashboard:', htmlClass);
    
    // Check localStorage theme
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    console.log('LocalStorage theme:', theme);
    
    // Get body and main background colors
    const colors = await page.evaluate(() => {
      const body = document.body;
      const main = document.querySelector('main');
      return {
        bodyBg: window.getComputedStyle(body).backgroundColor,
        mainBg: main ? window.getComputedStyle(main).backgroundColor : 'no main',
        htmlClass: document.documentElement.className
      };
    });
    console.log('Colors:', JSON.stringify(colors, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/forced-dark-mode.png', fullPage: true });
    
    // Expect dark class to be present
    expect(colors.htmlClass).toContain('dark');
  });
});
