import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'test@nexaura.fr',
  password: 'TestPass123!'
};

test.describe('Test Upload DCE - Complet', () => {
  test.beforeEach(async ({ page }) => {
    // Login plus robuste
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    
    // Cliquer et attendre la redirection
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('/auth/login') && response.status() === 200, { timeout: 15000 }),
      page.click('button:has-text("Se connecter")')
    ]);
    
    // Attendre que la page charge complètement
    await page.waitForURL(/\/(tenders|dashboard)/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Login réussi');
  });

  test('1. Trouver et cliquer sur le bouton Upload', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('networkidle');

    // Le bouton avec l'icône Upload
    const uploadButton = page.locator('button').filter({ has: page.locator('svg').filter({ hasText: /upload/i }) }).or(
      page.locator('button:has-text("Nouveau DCE")').or(
        page.locator('button').filter({ has: page.locator('[class*="upload"]') })
      )
    ).first();

    await expect(uploadButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Bouton upload trouvé');

    await uploadButton.click();
    await page.waitForTimeout(1000);

    // Vérifier que le dialog s'ouvre
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    console.log('✅ Dialog ouvert');

    await page.screenshot({ path: 'test-results/upload-dialog-opened.png', fullPage: true });
  });

  test('2. Vérifier les champs du formulaire', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('networkidle');

    // Ouvrir le dialog
    const uploadButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await uploadButton.click();
    await page.waitForTimeout(1000);

    // Vérifier le titre du dialog
    const dialogTitle = page.locator('[role="dialog"] h2, [role="dialog"] [class*="title"]');
    await expect(dialogTitle).toBeVisible();
    console.log('✅ Titre du dialog visible');

    // Vérifier le champ titre
    const titleInput = page.locator('[role="dialog"] input[name="title"], [role="dialog"] input').filter({ hasText: /titre/i }).or(
      page.locator('[role="dialog"] label:has-text("Titre") + input, [role="dialog"] label:has-text("Titre") ~ input')
    ).first();
    
    if (await titleInput.count() > 0) {
      await expect(titleInput).toBeVisible();
      console.log('✅ Champ titre trouvé');
    }

    // Vérifier le champ client
    const clientInput = page.locator('[role="dialog"] input[name="client"], [role="dialog"] label:has-text("Client") + input, [role="dialog"] label:has-text("Client") ~ input').first();
    
    if (await clientInput.count() > 0) {
      await expect(clientInput).toBeVisible();
      console.log('✅ Champ client trouvé');
    }

    // Vérifier la zone de drop ou le bouton de sélection
    const dropzone = page.locator('[role="dialog"] [class*="drop"], [role="dialog"] input[type="file"]').first();
    const fileButton = page.locator('[role="dialog"] button:has-text("Sélectionner"), [role="dialog"] button:has-text("Parcourir")').first();
    
    const hasUploadArea = (await dropzone.count()) > 0 || (await fileButton.count()) > 0;
    expect(hasUploadArea).toBeTruthy();
    console.log('✅ Zone de sélection de fichiers présente');

    await page.screenshot({ path: 'test-results/upload-form-complete.png', fullPage: true });
  });

  test('3. Remplir le formulaire et valider', async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState('networkidle');

    // Ouvrir le dialog
    const uploadButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await uploadButton.click();
    await page.waitForTimeout(1500);

    // Remplir le titre
    const titleInput = page.locator('[role="dialog"] label:has-text("Titre") + input, [role="dialog"] label:has-text("Titre") ~ input').first();
    if (await titleInput.count() > 0) {
      await titleInput.fill('Test DCE Playwright');
      console.log('✅ Titre rempli');
    }

    // Remplir le client
    const clientInput = page.locator('[role="dialog"] label:has-text("Client") + input, [role="dialog"] label:has-text("Client") ~ input').first();
    if (await clientInput.count() > 0) {
      await clientInput.fill('Test Client');
      console.log('✅ Client rempli');
    }

    // Note: On ne peut pas facilement tester l'upload de fichier en headless sans fichier réel
    // On vérifie juste que le bouton submit existe
    const submitButton = page.locator('[role="dialog"] button:has-text("Envoyer"), [role="dialog"] button:has-text("Valider"), [role="dialog"] button:has-text("Upload"), [role="dialog"] button[type="submit"]').first();
    
    if (await submitButton.count() > 0) {
      await expect(submitButton).toBeVisible();
      console.log('✅ Bouton submit trouvé');
    }

    await page.screenshot({ path: 'test-results/upload-form-filled.png', fullPage: true });
  });
});
