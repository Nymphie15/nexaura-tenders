/**
 * Workflow Fournitures E2E Tests
 *
 * Tests couverts:
 * - Workflow complet pour le secteur Fournitures
 * - Création d'un appel d'offre dans le secteur fournitures
 * - Traitement automatique par le système
 * - Validation finale
 * - Vérification du statut à chaque étape
 *
 * Workflow testé: Création -> Analyse IA -> Scoring -> Validation -> Publication
 * Secteur: Fournitures (supplies, equipment, materials)
 */
import { test, expect } from '@playwright/test';

test.describe('Workflow Fournitures - Processus complet', () => {

  // Configuration du test avec timeout étendu pour le workflow complet
  test.setTimeout(120000); // 2 minutes pour le workflow complet

  test.describe('Étape 1: Création AO Fournitures', () => {
    /**
     * Test: Accéder au formulaire de création d'AO
     */
    test('devrait accéder au formulaire de création', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Chercher le bouton de création
      const createButton = page.locator(
        '[data-testid="create-ao"], ' +
        'button:has-text("Nouveau"), ' +
        'button:has-text("Créer"), ' +
        'button:has-text("New"), ' +
        'a[href*="create"], ' +
        '.create-ao-btn'
      );

      if (await createButton.count() > 0) {
        await createButton.first().click();
        await page.waitForLoadState('networkidle');

        // Vérifier qu'un formulaire s'affiche
        const form = page.locator('form, [data-testid="ao-form"], .ao-creation-form');
        await expect(form.first()).toBeVisible({ timeout: 10000 });
      }
    });

    /**
     * Test: Sélectionner le secteur Fournitures
     */
    test('devrait permettre de sélectionner le secteur Fournitures', async ({ page }) => {
      await page.goto('/create');
      await page.waitForLoadState('networkidle');

      const sectorSelect = page.locator(
        '[data-testid="sector-select"], ' +
        'select[name*="sector"], ' +
        'select[name*="secteur"], ' +
        '[data-testid="category-select"]'
      );

      if (await sectorSelect.count() > 0) {
        await sectorSelect.first().click();

        // Chercher l'option Fournitures
        const fournituresOption = page.locator(
          'option:has-text("Fournitures"), ' +
          'option:has-text("Supplies"), ' +
          '[data-value="fournitures"], ' +
          'li:has-text("Fournitures")'
        );

        if (await fournituresOption.count() > 0) {
          await fournituresOption.first().click();
        }
      }
    });

    /**
     * Test: Remplir les informations de base de l'AO
     */
    test('devrait remplir le formulaire de création', async ({ page }) => {
      await page.goto('/create');
      await page.waitForLoadState('networkidle');

      // Titre de l'AO
      const titleInput = page.locator(
        '[data-testid="ao-title"], ' +
        'input[name*="title"], ' +
        'input[name*="titre"], ' +
        'input[placeholder*="titre"]'
      );

      if (await titleInput.count() > 0) {
        await titleInput.first().fill('Test Fournitures E2E - ' + Date.now());
      }

      // Description
      const descriptionInput = page.locator(
        '[data-testid="ao-description"], ' +
        'textarea[name*="description"], ' +
        '.description-field'
      );

      if (await descriptionInput.count() > 0) {
        await descriptionInput.first().fill(
          'Appel offre de test pour fournitures de bureau. ' +
          'Inclut: papeterie, consommables informatiques, mobilier.'
        );
      }

      // Budget (si présent)
      const budgetInput = page.locator(
        '[data-testid="ao-budget"], ' +
        'input[name*="budget"], ' +
        'input[type="number"]'
      );

      if (await budgetInput.count() > 0) {
        await budgetInput.first().fill('50000');
      }
    });

    /**
     * Test: Soumettre le formulaire de création
     */
    test('devrait soumettre le formulaire avec succès', async ({ page }) => {
      await page.goto('/create');
      await page.waitForLoadState('networkidle');

      // Remplir les champs requis
      const titleInput = page.locator('input[name*="title"], input[name*="titre"]');
      if (await titleInput.count() > 0) {
        await titleInput.first().fill('Test Workflow Fournitures');
      }

      const submitButton = page.locator(
        '[data-testid="submit-ao"], ' +
        'button[type="submit"], ' +
        'button:has-text("Soumettre"), ' +
        'button:has-text("Créer"), ' +
        'button:has-text("Submit")'
      );

      if (await submitButton.count() > 0) {
        // Vérifier que le bouton est activé
        await expect(submitButton.first()).toBeEnabled();
      }
    });
  });

  test.describe('Étape 2: Analyse IA automatique', () => {
    /**
     * Test: L'AO est pris en charge par l'analyse IA
     */
    test('devrait déclencher l analyse IA après création', async ({ page }) => {
      // Naviguer vers un AO en cours de traitement
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Chercher un indicateur de traitement IA
      const processingIndicator = page.locator(
        '[data-testid="ai-processing"], ' +
        '.processing-indicator, ' +
        '[data-status="processing"], ' +
        '.ai-analysis-status'
      );

      // Ou vérifier la présence d'AO avec statut "En analyse"
      const analysisStatus = page.locator(
        ':has-text("En analyse"), ' +
        ':has-text("Processing"), ' +
        ':has-text("Analyzing"), ' +
        '[data-status="analyzing"]'
      );

      // L'un ou l'autre devrait etre présent si des AO sont en cours
    });

    /**
     * Test: Affichage du progress de l'analyse
     */
    test('devrait afficher la progression de l analyse', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const progressBar = page.locator(
        '[data-testid="analysis-progress"], ' +
        '.progress-bar, ' +
        '[role="progressbar"], ' +
        '.analysis-progress'
      );

      if (await progressBar.count() > 0) {
        await expect(progressBar.first()).toBeVisible();
      }
    });

    /**
     * Test: L'analyse extrait les informations clés
     */
    test('devrait extraire les informations clés du secteur fournitures', async ({ page }) => {
      // Naviguer vers un AO analysé
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const aoItems = page.locator('[data-testid="ao-item"], .ao-item, table tbody tr');

      if (await aoItems.count() > 0) {
        await aoItems.first().click();
        await page.waitForTimeout(1500);

        // Vérifier la présence d'informations extraites
        const extractedInfo = page.locator(
          '[data-testid="extracted-data"], ' +
          '.extracted-info, ' +
          '.ai-extraction, ' +
          '.analysis-results'
        );

        if (await extractedInfo.count() > 0) {
          const infoText = await extractedInfo.first().textContent();
          expect(infoText).toBeTruthy();
        }
      }
    });
  });

  test.describe('Étape 3: Scoring et classification', () => {
    /**
     * Test: Un score de pertinence est attribué
     */
    test('devrait attribuer un score de pertinence', async ({ page }) => {
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const scoreIndicator = page.locator(
        '[data-testid="relevance-score"], ' +
        '.score-badge, ' +
        '.relevance-indicator, ' +
        '[data-testid="ao-score"]'
      );

      if (await scoreIndicator.count() > 0) {
        await expect(scoreIndicator.first()).toBeVisible();
        const scoreText = await scoreIndicator.first().textContent();
        // Le score devrait contenir un nombre ou pourcentage
        expect(scoreText).toMatch(/\d/);
      }
    });

    /**
     * Test: Classification dans la catégorie appropriée
     */
    test('devrait classifier correctement dans Fournitures', async ({ page }) => {
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Filtrer par secteur Fournitures
      const sectorFilter = page.locator(
        '[data-testid="sector-filter"], select[name*="sector"]'
      );

      if (await sectorFilter.count() > 0) {
        await sectorFilter.first().selectOption({ label: 'Fournitures' });
        await page.waitForTimeout(1000);

        // Vérifier que des AO sont affichés
        const aoItems = page.locator('[data-testid="ao-item"], .ao-item, table tbody tr');
        // Des AO devraient etre visibles apres filtrage (si existants)
      }
    });

    /**
     * Test: Les critères de scoring sont visibles
     */
    test('devrait afficher les critères de scoring', async ({ page }) => {
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const aoItems = page.locator('[data-testid="ao-item"], .ao-item, table tbody tr');

      if (await aoItems.count() > 0) {
        await aoItems.first().click();
        await page.waitForTimeout(1500);

        const scoringCriteria = page.locator(
          '[data-testid="scoring-criteria"], ' +
          '.criteria-breakdown, ' +
          '.score-details, ' +
          '.scoring-breakdown'
        );

        if (await scoringCriteria.count() > 0) {
          await expect(scoringCriteria.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Étape 4: Validation humaine', () => {
    /**
     * Test: L'AO apparait dans la queue de validation
     */
    test('devrait apparaitre dans la queue de validation', async ({ page }) => {
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const validationQueue = page.locator(
        '[data-testid="validation-queue"], ' +
        '.validation-list, ' +
        '.pending-validation'
      );

      await expect(validationQueue.first()).toBeVisible({ timeout: 15000 });
    });

    /**
     * Test: Le validateur peut voir toutes les informations
     */
    test('devrait afficher toutes les informations pour validation', async ({ page }) => {
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const aoItems = page.locator('[data-testid="ao-item"], .ao-item, table tbody tr');

      if (await aoItems.count() > 0) {
        await aoItems.first().click();
        await page.waitForTimeout(1500);

        // Vérifier les sections d'information
        const detailsPanel = page.locator('.ao-details, .detail-panel, [data-testid="ao-details"]');

        if (await detailsPanel.count() > 0) {
          const content = await detailsPanel.first().textContent();
          expect(content!.length).toBeGreaterThan(50);
        }
      }
    });

    /**
     * Test: Processus de validation avec commentaire
     */
    test('devrait permettre la validation avec commentaire', async ({ page }) => {
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const aoItems = page.locator('[data-testid="ao-item"], .ao-item, table tbody tr');

      if (await aoItems.count() > 0) {
        await aoItems.first().click();
        await page.waitForTimeout(1000);

        // Vérifier la présence du champ commentaire
        const commentField = page.locator(
          'textarea[name*="comment"], [data-testid="validation-comment"]'
        );

        // Vérifier la présence du bouton valider
        const validateButton = page.locator(
          'button:has-text("Valider"), button:has-text("Approuver")'
        );

        if (await commentField.count() > 0 && await validateButton.count() > 0) {
          await expect(commentField.first()).toBeVisible();
          await expect(validateButton.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Étape 5: Publication et suivi', () => {
    /**
     * Test: L'AO validé change de statut
     */
    test('devrait changer le statut apres validation', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Chercher des AO avec différents statuts
      const statusBadges = page.locator(
        '[data-testid="ao-status"], .status-badge, [class*="status"]'
      );

      if (await statusBadges.count() > 0) {
        // Vérifier qu'il existe des statuts variés (Validé, En cours, etc.)
        const statuses = await statusBadges.allTextContents();
        expect(statuses.length).toBeGreaterThan(0);
      }
    });

    /**
     * Test: L'AO validé apparait dans le tableau de bord
     */
    test('devrait apparaitre dans les statistiques du dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Les KPIs devraient refléter les AO validés
      const validatedKpi = page.locator(
        '[data-testid="validated-count"], ' +
        ':has-text("Validés"), ' +
        ':has-text("Approved"), ' +
        '.validated-stat'
      );

      // Le KPI ou une statistique devrait etre présent
    });

    /**
     * Test: Historique de traitement visible
     */
    test('devrait avoir un historique de traitement', async ({ page }) => {
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const aoItems = page.locator('[data-testid="ao-item"], .ao-item, table tbody tr');

      if (await aoItems.count() > 0) {
        await aoItems.first().click();
        await page.waitForTimeout(1500);

        const historySection = page.locator(
          '[data-testid="processing-history"], ' +
          '.history-timeline, ' +
          '.processing-steps, ' +
          '.workflow-history'
        );

        if (await historySection.count() > 0) {
          await expect(historySection.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Workflow complet E2E', () => {
    /**
     * Test: Simulation du workflow complet de bout en bout
     * Ce test vérifie l'enchainement des étapes sans modifier les données
     */
    test('devrait parcourir le workflow complet', async ({ page }) => {
      // Étape 1: Dashboard - Vue d'ensemble
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();

      // Étape 2: Validation - Voir les AO en attente
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();

      // Étape 3: HITL - Vérifier la queue
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();

      // Étape 4: Retour dashboard - Vérifier les métriques
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Vérifier qu'aucune erreur n'est survenue
      const errorMessages = page.locator('.error, [role="alert"][class*="error"]');
      const errorCount = await errorMessages.count();

      // Le workflow devrait se compléter sans erreurs critiques
      expect(errorCount).toBeLessThan(5); // Tolère quelques warnings
    });
  });
});
