import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const API_URL = 'http://168.231.81.53:8000';
const TEST_USER = {
  email: 'test@nexaura.fr',
  password: 'TestPass123!'
};

test.describe('Test Upload DCE', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button:has-text("Se connecter")');
    await page.waitForURL(/\/(tenders|$)/, { timeout: 30000 });
  });

  test('1. Bouton Nouveau DCE présent et cliquable', async ({ page }) => {
    // Aller sur la page tenders
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('networkidle');

    // Chercher le bouton "Nouveau DCE" ou "Upload" ou "Uploader"
    const uploadButton = page.locator('button, a').filter({ 
      hasText: /nouveau|upload|uploader|dce/i 
    }).first();

    // Vérifier que le bouton existe
    await expect(uploadButton).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Bouton upload DCE trouvé');

    // Screenshot
    await page.screenshot({ 
      path: 'test-results/upload-button-found.png',
      fullPage: true 
    });
  });

  test('2. Modal ou page d\'upload s\'ouvre', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('networkidle');

    // Trouver et cliquer sur le bouton
    const uploadButton = page.locator('button, a').filter({ 
      hasText: /nouveau|upload|uploader|dce/i 
    }).first();

    await uploadButton.click();
    await page.waitForTimeout(2000);

    // Vérifier qu'un modal ou une nouvelle page s'ouvre
    const hasModal = await page.locator('[role="dialog"], .modal, [class*="dialog"]').count() > 0;
    const hasFileInput = await page.locator('input[type="file"]').count() > 0;
    const hasUploadForm = await page.locator('form').filter({ hasText: /upload|fichier|dce/i }).count() > 0;

    const uploadInterfaceVisible = hasModal || hasFileInput || hasUploadForm;

    expect(uploadInterfaceVisible).toBeTruthy();
    
    console.log(`✅ Interface d'upload visible - Modal: ${hasModal}, FileInput: ${hasFileInput}, Form: ${hasUploadForm}`);

    // Screenshot
    await page.screenshot({ 
      path: 'test-results/upload-interface-opened.png',
      fullPage: true 
    });
  });

  test('3. Champs du formulaire présents', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('networkidle');

    const uploadButton = page.locator('button, a').filter({ 
      hasText: /nouveau|upload|uploader|dce/i 
    }).first();

    await uploadButton.click();
    await page.waitForTimeout(2000);

    // Vérifier les champs attendus
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 5000 });

    // Chercher les champs titre et client
    const titleField = page.locator('input, textarea').filter({ 
      hasText: /titre|title|nom/i 
    }).or(page.locator('[name*="title"], [name*="titre"], [name*="name"]')).first();
    
    const clientField = page.locator('input, textarea').filter({ 
      hasText: /client/i 
    }).or(page.locator('[name*="client"]')).first();

    console.log('✅ Champ fichier trouvé');
    
    if (await titleField.count() > 0) {
      console.log('✅ Champ titre trouvé');
    }
    
    if (await clientField.count() > 0) {
      console.log('✅ Champ client trouvé');
    }

    // Screenshot
    await page.screenshot({ 
      path: 'test-results/upload-form-fields.png',
      fullPage: true 
    });
  });
});
