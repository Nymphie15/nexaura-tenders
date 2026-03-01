import { test, expect } from '@playwright/test';

test.describe('Dark Mode Dashboard Test', () => {
  test('dashboard should have correct dark mode colors', async ({ page }) => {
    // Force dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Go to login page
    await page.goto('http://168.231.81.53/login', { waitUntil: 'networkidle' });
    
    // Login
    await page.fill('input[type="email"]', 'admin@nexaura.fr');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForTimeout(4000);
    
    // Check html class
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    console.log('HTML class:', htmlClass);
    
    // Check body background
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log('Body background:', bodyBg);
    
    // Get sidebar background
    const sidebar = page.locator('aside, nav, [class*="sidebar"]').first();
    if (await sidebar.isVisible()) {
      const sidebarBg = await sidebar.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      console.log('Sidebar background:', sidebarBg);
    }
    
    // Check for any white backgrounds
    const whiteElements = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const whites = [];
      for (const el of allElements) {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg === 'rgb(255, 255, 255)' || bg === 'rgba(255, 255, 255, 1)') {
          whites.push({
            tag: el.tagName,
            class: el.className,
            id: el.id
          });
        }
      }
      return whites.slice(0, 10);
    });
    console.log('Elements with white background:', JSON.stringify(whiteElements, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-dark-mode-full.png', fullPage: true });
  });
});
