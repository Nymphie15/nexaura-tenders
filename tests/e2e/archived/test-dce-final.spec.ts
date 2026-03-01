import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const API_URL = 'http://168.231.81.53:8000';

test.describe('Test DCE Final - Avec Auth Token', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Obtenir le token via l'API directement
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'test@nexaura.fr',
        password: 'TestPass123!'
      }
    });
    
    const data = await response.json();
    authToken = data.access_token;
    console.log('✅ Token obtenu via API');
  });

  test.beforeEach(async ({ page }) => {
    // Injecter le token directement dans le localStorage
    await page.goto(BASE_URL);
    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', token);
    }, authToken);
    
    console.log('✅ Token injecté dans localStorage');
  });

  test('1. Accès à la page tenders', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Vérifier que la page est chargée
    await expect(page).toHaveURL(/.*tenders.*/);
    console.log('✅ Page tenders chargée');

    await page.screenshot({ path: 'test-results/tenders-page-loaded.png', fullPage: true });
  });

  test('2. Bouton Upload DCE visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Chercher le bouton avec icône Upload
    const buttons = await page.locator('button').all();
    let uploadButton = null;
    
    for (const button of buttons) {
      const text = await button.textContent();
      const html = await button.innerHTML();
      if (html.includes('Upload') || html.includes('upload') || text?.includes('Nouveau')) {
        uploadButton = button;
        break;
      }
    }

    expect(uploadButton).not.toBeNull();
    console.log('✅ Bouton upload trouvé');

    await page.screenshot({ path: 'test-results/upload-button-visible.png', fullPage: true });
  });

  test('3. Ouvrir le dialog d\'upload', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Trouver et cliquer sur le bouton
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const html = await button.innerHTML();
      if (html.includes('Upload') || html.includes('upload')) {
        await button.click();
        break;
      }
    }

    await page.waitForTimeout(2000);

    // Vérifier que le dialog s'ouvre
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    console.log('✅ Dialog upload ouvert');

    await page.screenshot({ path: 'test-results/upload-dialog-open.png', fullPage: true });
  });

  test('4. Formulaire d\'upload complet', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Ouvrir le dialog
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const html = await button.innerHTML();
      if (html.includes('Upload') || html.includes('upload')) {
        await button.click();
        break;
      }
    }

    await page.waitForTimeout(2000);

    // Vérifier les éléments du formulaire
    const dialogContent = page.locator('[role="dialog"]');
    await expect(dialogContent).toBeVisible();

    // Compter les inputs
    const inputs = await dialogContent.locator('input').all();
    console.log(`✅ ${inputs.length} champs de saisie trouvés`);

    // Vérifier qu'il y a au moins 2 champs (titre + client minimum)
    expect(inputs.length).toBeGreaterThanOrEqual(2);

    await page.screenshot({ path: 'test-results/upload-form-fields.png', fullPage: true });
  });
});
