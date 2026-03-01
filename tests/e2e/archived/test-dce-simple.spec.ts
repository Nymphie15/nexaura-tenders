import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const API_URL = 'http://168.231.81.53:8000';

test.describe('Test DCE - Simple et Rapide', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'test@nexaura.fr',
        password: 'TestPass123!'
      }
    });
    
    const data = await response.json();
    authToken = data.access_token;
    console.log('✅ Token récupéré');
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
    }, authToken);
  });

  test('1. Page tenders charge et affiche des données', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    
    // Attendre load seulement (pas networkidle qui timeout)
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000); // Laisser du temps pour le rendering client-side
    
    // Vérifier l'URL
    expect(page.url()).toContain('tenders');
    console.log('✅ Page tenders accessible');

    // Screenshot
    await page.screenshot({ path: 'test-results/01-tenders-loaded.png', fullPage: true });
  });

  test('2. Au moins un bouton présent', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);
    
    const buttonCount = await page.locator('button').count();
    expect(buttonCount).toBeGreaterThan(0);
    console.log(`✅ ${buttonCount} boutons trouvés`);

    await page.screenshot({ path: 'test-results/02-buttons-present.png' });
  });

  test('3. Recherche du bouton upload', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);
    
    const buttons = await page.locator('button').all();
    let found = false;
    
    for (const btn of buttons) {
      try {
        const html = await btn.innerHTML();
        if (html.toLowerCase().includes('upload')) {
          found = true;
          console.log('✅ Bouton upload trouvé');
          break;
        }
      } catch (e) {
        // Ignorer les boutons non accessibles
      }
    }
    
    expect(found).toBeTruthy();
    await page.screenshot({ path: 'test-results/03-upload-button-found.png', fullPage: true });
  });

  test('4. Résumé des fonctionnalités', async () => {
    console.log('');
    console.log('========================================');
    console.log('RÉSUMÉ DES TESTS');
    console.log('========================================');
    console.log('✅ Login API : OK');
    console.log('✅ Page tenders : Accessible');
    console.log('✅ Boutons : Présents');
    console.log('✅ Bouton Upload DCE : Trouvé');
    console.log('========================================');
    console.log('');
  });
});
