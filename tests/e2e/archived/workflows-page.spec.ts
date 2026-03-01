import { test } from '@playwright/test';

test('workflows page full', async ({ page }) => {
  await page.goto('/workflows');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'test-results/workflows-full.png', fullPage: true });
  
  // Log console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERROR:', msg.text());
  });
});
