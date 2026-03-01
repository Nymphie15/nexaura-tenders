import { test } from '@playwright/test';

const pages = [
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/workflows', name: 'workflows' },
  { path: '/tenders', name: 'tenders' },
  { path: '/hitl', name: 'hitl' },
  { path: '/settings', name: 'settings' },
];

for (const p of pages) {
  test(`Page ${p.name}`, async ({ page }) => {
    await page.goto(p.path, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test-results/v2-${p.name}.png`, fullPage: true });
  });
}
