import { test, expect } from '@playwright/test';

test.describe('Dark Mode Modal Test', () => {
  test('modal should have dark background in dark mode', async ({ page }) => {
    // Force dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Go to login page
    await page.goto('http://168.231.81.53/login', { waitUntil: 'networkidle' });
    
    // Login
    await page.fill('input[type="email"]', 'admin@nexaura.fr');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation and modal
    await page.waitForTimeout(3000);
    
    // Take screenshot before checking
    await page.screenshot({ path: 'test-results/before-modal-check.png', fullPage: true });
    
    // Check if modal is visible
    const modal = page.locator('[data-slot="dialog-content"]');
    const isModalVisible = await modal.isVisible().catch(() => false);
    
    console.log('Modal visible:', isModalVisible);
    
    if (isModalVisible) {
      // Wait a bit more for styles to apply
      await page.waitForTimeout(1000);
      
      // Get computed background color
      const bgColor = await modal.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      console.log('Modal background color:', bgColor);
      
      // Get inline style
      const inlineStyle = await modal.evaluate((el) => {
        return el.getAttribute('style');
      });
      console.log('Modal inline style:', inlineStyle);
      
      // Get the html class
      const htmlClass = await page.evaluate(() => document.documentElement.className);
      console.log('HTML class:', htmlClass);
      
      // Take screenshot of modal
      await page.screenshot({ path: 'test-results/modal-dark-mode.png', fullPage: true });
      
      // Check that background is dark (rgb values should be low)
      // #0f172a = rgb(15, 23, 42)
      expect(bgColor).toContain('rgb(15, 23, 42)');
    } else {
      console.log('No modal visible, checking dashboard');
      await page.screenshot({ path: 'test-results/dashboard-no-modal.png', fullPage: true });
    }
  });
});
