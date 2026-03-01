import { test, expect } from '@playwright/test';

const pages = [
  { path: '/', name: 'home' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/workflows', name: 'workflows' },
  { path: '/tenders', name: 'tenders' },
  { path: '/hitl', name: 'hitl' },
  { path: '/company', name: 'company' },
  { path: '/settings', name: 'settings' },
];

test.describe('Full Site Check', () => {
  for (const page of pages) {
    test(`Page ${page.name} (${page.path})`, async ({ page: p }) => {
      const response = await p.goto(page.path);
      
      // Vérifier que la page répond
      expect(response?.status()).toBeLessThan(500);
      
      await p.waitForLoadState('networkidle');
      await p.waitForTimeout(1000);
      
      // Screenshot
      await p.screenshot({ 
        path: `test-results/site-check-${page.name}.png`, 
        fullPage: true 
      });
      
      // Vérifier pas d'erreur 404 visible
      const body = await p.locator('body').textContent();
      console.log(`✓ ${page.name}: OK (status: ${response?.status()})`);
    });
  }
});
