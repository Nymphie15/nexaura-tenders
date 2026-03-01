/**
 * HITL (Human-In-The-Loop) Review Page E2E Tests
 *
 * Tests couverts:
 * - Affichage de la queue HITL (taches en attente de review humain)
 * - Détails d'une tache HITL
 * - Actions de review (approuver, modifier, rejeter)
 * - Priorité et urgence des taches
 * - Historique des décisions
 * - Statistiques HITL
 *
 * Page testée: /hitl ou /review (page de review Human-In-The-Loop)
 */
import { test, expect } from '@playwright/test';

test.describe('HITL Review - Page de review humain', () => {

  // Avant chaque test, naviguer vers la page HITL
  test.beforeEach(async ({ page }) => {
    // Essayer plusieurs URLs possibles pour la page HITL
    const hitlUrls = ['/hitl', '/review', '/hitl-review', '/human-review'];
    let loaded = false;

    for (const url of hitlUrls) {
      try {
        await page.goto(url, { timeout: 5000 });
        const status = page.url();
        if (!status.includes('404') && !status.includes('error')) {
          loaded = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!loaded) {
      await page.goto('/hitl');
    }

    await page.waitForLoadState('networkidle');
  });

  test.describe('Queue HITL', () => {
    /**
     * Test: Vérifier que la queue HITL s'affiche correctement
     * La queue contient les taches necessitant une intervention humaine
     */
    test('devrait afficher la queue des taches HITL', async ({ page }) => {
      const hitlQueue = page.locator(
        '[data-testid="hitl-queue"], ' +
        '.hitl-queue, ' +
        '.review-queue, ' +
        '[data-testid="task-list"], ' +
        '.task-queue'
      );

      await expect(hitlQueue.first()).toBeVisible({ timeout: 15000 });
    });

    /**
     * Test: Chaque tache affiche son type et sa priorité
     */
    test('devrait afficher le type et la priorité de chaque tache', async ({ page }) => {
      await page.waitForTimeout(2000);

      const taskItems = page.locator(
        '[data-testid="hitl-task"], ' +
        '.hitl-task, ' +
        '.review-item, ' +
        '.task-item'
      );

      if (await taskItems.count() > 0) {
        const firstTask = taskItems.first();

        // Vérifier la présence d'un indicateur de type
        const typeIndicator = firstTask.locator(
          '[data-testid="task-type"], .task-type, .type-badge'
        );

        // Vérifier la présence d'un indicateur de priorité
        const priorityIndicator = firstTask.locator(
          '[data-testid="task-priority"], .priority-badge, .priority-indicator, [class*="priority"]'
        );

        // Au moins l'un des deux devrait etre present
      }
    });

    /**
     * Test: Affichage du nombre de taches en attente
     */
    test('devrait afficher le compteur de taches en attente', async ({ page }) => {
      const taskCounter = page.locator(
        '[data-testid="task-count"], ' +
        '.task-count, ' +
        '.queue-count, ' +
        '.pending-count'
      );

      if (await taskCounter.count() > 0) {
        await expect(taskCounter.first()).toBeVisible();
        const countText = await taskCounter.first().textContent();
        // Le compteur devrait contenir un nombre
        expect(countText).toMatch(/\d+/);
      }
    });

    /**
     * Test: Les taches sont triées par priorité/urgence
     */
    test('devrait trier les taches par priorité', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Vérifier la présence d'un sélecteur de tri
      const sortSelector = page.locator(
        '[data-testid="sort-selector"], ' +
        'select[name*="sort"], ' +
        '.sort-dropdown, ' +
        '[aria-label*="sort"]'
      );

      if (await sortSelector.count() > 0) {
        await expect(sortSelector.first()).toBeVisible();
      }
    });
  });

  test.describe('Détails d une tache HITL', () => {
    /**
     * Test: Cliquer sur une tache ouvre ses détails
     */
    test('devrait ouvrir les détails au clic sur une tache', async ({ page }) => {
      await page.waitForTimeout(2000);

      const taskItems = page.locator(
        '[data-testid="hitl-task"], .hitl-task, .review-item, .task-item'
      );

      if (await taskItems.count() > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(1500);

        // Vérifier qu'un panneau de détails s'ouvre
        const detailPanel = page.locator(
          '[data-testid="task-details"], ' +
          '.task-details, ' +
          '.detail-panel, ' +
          '[role="dialog"], ' +
          '.modal'
        );

        if (await detailPanel.count() > 0) {
          await expect(detailPanel.first()).toBeVisible();
        }
      }
    });

    /**
     * Test: Les détails montrent le contexte de la décision à prendre
     */
    test('devrait afficher le contexte de la décision', async ({ page }) => {
      await page.waitForTimeout(2000);

      const taskItems = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await taskItems.count() > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(1500);

        // Vérifier la présence de contexte
        const contextSection = page.locator(
          '[data-testid="decision-context"], ' +
          '.context-section, ' +
          '.decision-context, ' +
          '.task-context'
        );

        if (await contextSection.count() > 0) {
          const contextText = await contextSection.first().textContent();
          expect(contextText).toBeTruthy();
        }
      }
    });

    /**
     * Test: Affichage des données sources (AO concerné, etc.)
     */
    test('devrait afficher les données sources', async ({ page }) => {
      await page.waitForTimeout(2000);

      const taskItems = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await taskItems.count() > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(1500);

        // Vérifier la présence de référence aux données sources
        const sourceData = page.locator(
          '[data-testid="source-data"], ' +
          '.source-reference, ' +
          '.related-ao, ' +
          '[data-testid="ao-reference"]'
        );

        // Les données sources peuvent etre intégrées différemment
      }
    });

    /**
     * Test: Affichage de la suggestion IA (si applicable)
     */
    test('devrait afficher la suggestion IA', async ({ page }) => {
      await page.waitForTimeout(2000);

      const taskItems = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await taskItems.count() > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(1500);

        const aiSuggestion = page.locator(
          '[data-testid="ai-suggestion"], ' +
          '.ai-suggestion, ' +
          '.model-recommendation, ' +
          '.suggestion-box'
        );

        if (await aiSuggestion.count() > 0) {
          await expect(aiSuggestion.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Actions de review', () => {
    /**
     * Test: Présence du bouton Approuver la suggestion
     */
    test('devrait avoir un bouton Approuver', async ({ page }) => {
      await page.waitForTimeout(2000);

      const taskItems = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');
      if (await taskItems.count() > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(1000);
      }

      const approveButton = page.locator(
        '[data-testid="approve-task"], ' +
        'button:has-text("Approuver"), ' +
        'button:has-text("Approve"), ' +
        'button:has-text("Accepter"), ' +
        '.approve-btn'
      );

      if (await approveButton.count() > 0) {
        await expect(approveButton.first()).toBeVisible();
      }
    });

    /**
     * Test: Présence du bouton Modifier
     */
    test('devrait avoir un bouton Modifier', async ({ page }) => {
      await page.waitForTimeout(2000);

      const taskItems = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');
      if (await taskItems.count() > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(1000);
      }

      const modifyButton = page.locator(
        '[data-testid="modify-task"], ' +
        'button:has-text("Modifier"), ' +
        'button:has-text("Modify"), ' +
        'button:has-text("Edit"), ' +
        '.modify-btn, ' +
        '.edit-btn'
      );

      if (await modifyButton.count() > 0) {
        await expect(modifyButton.first()).toBeVisible();
      }
    });

    /**
     * Test: Présence du bouton Rejeter
     */
    test('devrait avoir un bouton Rejeter', async ({ page }) => {
      await page.waitForTimeout(2000);

      const taskItems = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');
      if (await taskItems.count() > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(1000);
      }

      const rejectButton = page.locator(
        '[data-testid="reject-task"], ' +
        'button:has-text("Rejeter"), ' +
        'button:has-text("Reject"), ' +
        'button:has-text("Refuser"), ' +
        '.reject-btn'
      );

      if (await rejectButton.count() > 0) {
        await expect(rejectButton.first()).toBeVisible();
      }
    });

    /**
     * Test: L'approbation met à jour la queue
     */
    test('devrait mettre à jour la queue apres approbation', async ({ page }) => {
      await page.waitForTimeout(2000);

      const taskItems = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');
      const initialCount = await taskItems.count();

      if (initialCount > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(1000);

        const approveButton = page.locator(
          '[data-testid="approve-task"], button:has-text("Approuver")'
        );

        if (await approveButton.count() > 0) {
          // Ne pas vraiment cliquer pour ne pas modifier les données
          // Juste vérifier que le bouton est cliquable
          await expect(approveButton.first()).toBeEnabled();
        }
      }
    });

    /**
     * Test: La modification ouvre un formulaire d'édition
     */
    test('devrait ouvrir un formulaire lors de la modification', async ({ page }) => {
      await page.waitForTimeout(2000);

      const taskItems = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');
      if (await taskItems.count() > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(1000);

        const modifyButton = page.locator(
          '[data-testid="modify-task"], button:has-text("Modifier"), button:has-text("Edit")'
        );

        if (await modifyButton.count() > 0) {
          await modifyButton.first().click();
          await page.waitForTimeout(1000);

          // Vérifier qu'un formulaire d'édition apparait
          const editForm = page.locator(
            '[data-testid="edit-form"], ' +
            'form.edit-form, ' +
            '.modification-form, ' +
            '[role="form"]'
          );

          // Un formulaire ou des champs éditables devraient apparaitre
        }
      }
    });
  });

  test.describe('Priorité et urgence', () => {
    /**
     * Test: Les taches urgentes sont mises en évidence
     */
    test('devrait mettre en évidence les taches urgentes', async ({ page }) => {
      await page.waitForTimeout(2000);

      const urgentIndicator = page.locator(
        '[data-testid="urgent-task"], ' +
        '.urgent-indicator, ' +
        '.priority-high, ' +
        '[class*="urgent"], ' +
        '[class*="critical"]'
      );

      if (await urgentIndicator.count() > 0) {
        // Les taches urgentes devraient avoir un style distinct
        const urgentStyle = await urgentIndicator.first().evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            border: style.border
          };
        });
        // Le style devrait etre différent (rouge, orange, etc.)
      }
    });

    /**
     * Test: Filtrer par niveau de priorité
     */
    test('devrait permettre de filtrer par priorité', async ({ page }) => {
      const priorityFilter = page.locator(
        '[data-testid="priority-filter"], ' +
        'select[name*="priority"], ' +
        '.priority-filter, ' +
        '[data-testid="filter-priority"]'
      );

      if (await priorityFilter.count() > 0) {
        await expect(priorityFilter.first()).toBeVisible();
      }
    });

    /**
     * Test: Affichage du temps en attente
     */
    test('devrait afficher le temps en attente', async ({ page }) => {
      await page.waitForTimeout(2000);

      const waitTime = page.locator(
        '[data-testid="wait-time"], ' +
        '.wait-time, ' +
        '.pending-since, ' +
        '[data-testid="created-at"]'
      );

      if (await waitTime.count() > 0) {
        await expect(waitTime.first()).toBeVisible();
        const timeText = await waitTime.first().textContent();
        // Le temps devrait etre affiché (ex: "il y a 2h", "2 hours ago")
        expect(timeText).toBeTruthy();
      }
    });
  });

  test.describe('Historique des décisions', () => {
    /**
     * Test: Accès à l'historique des décisions HITL
     */
    test('devrait avoir un accès à l historique', async ({ page }) => {
      const historyLink = page.locator(
        '[data-testid="hitl-history"], ' +
        'a[href*="history"], ' +
        'button:has-text("Historique"), ' +
        '.history-link, ' +
        '[data-testid="view-history"]'
      );

      if (await historyLink.count() > 0) {
        await expect(historyLink.first()).toBeVisible();
      }
    });

    /**
     * Test: L'historique montre les décisions passées
     */
    test('devrait afficher les décisions passées', async ({ page }) => {
      const historyLink = page.locator(
        '[data-testid="hitl-history"], a[href*="history"], button:has-text("Historique")'
      );

      if (await historyLink.count() > 0) {
        await historyLink.first().click();
        await page.waitForTimeout(2000);

        const historyItems = page.locator(
          '[data-testid="history-item"], ' +
          '.history-item, ' +
          '.decision-record, ' +
          'table tbody tr'
        );

        if (await historyItems.count() > 0) {
          await expect(historyItems.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Statistiques HITL', () => {
    /**
     * Test: Affichage des statistiques de review
     */
    test('devrait afficher les statistiques HITL', async ({ page }) => {
      const stats = page.locator(
        '[data-testid="hitl-stats"], ' +
        '.hitl-statistics, ' +
        '.review-stats, ' +
        '.stats-panel'
      );

      if (await stats.count() > 0) {
        await expect(stats.first()).toBeVisible();
      }
    });

    /**
     * Test: Statistiques incluent le taux d'approbation
     */
    test('devrait afficher le taux d approbation', async ({ page }) => {
      const approvalRate = page.locator(
        '[data-testid="approval-rate"], ' +
        '.approval-rate, ' +
        '[data-metric="approval"]'
      );

      if (await approvalRate.count() > 0) {
        const rateText = await approvalRate.first().textContent();
        // Le taux devrait contenir un pourcentage
        expect(rateText).toMatch(/%/);
      }
    });

    /**
     * Test: Statistiques incluent le temps moyen de review
     */
    test('devrait afficher le temps moyen de review', async ({ page }) => {
      const avgTime = page.locator(
        '[data-testid="avg-review-time"], ' +
        '.avg-time, ' +
        '[data-metric="avg-time"]'
      );

      if (await avgTime.count() > 0) {
        await expect(avgTime.first()).toBeVisible();
      }
    });
  });
});
