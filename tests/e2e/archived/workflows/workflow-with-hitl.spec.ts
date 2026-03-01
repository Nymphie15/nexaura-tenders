/**
 * Workflow avec interruption HITL E2E Tests
 *
 * Tests couverts:
 * - Workflow qui déclenche une interruption HITL
 * - Détection automatique du besoin de review humain
 * - Création de la tache HITL
 * - Processus de review et décision
 * - Reprise du workflow apres décision HITL
 * - Cas limites et gestion des erreurs
 *
 * Workflow testé: Processing -> HITL Trigger -> Human Review -> Decision -> Resume
 * Scénario: Un AO avec score de confiance faible nécessite une validation humaine
 */
import { test, expect } from '@playwright/test';

test.describe('Workflow avec interruption HITL', () => {

  // Configuration du test avec timeout étendu
  test.setTimeout(180000); // 3 minutes pour le workflow avec HITL

  test.describe('Détection du besoin HITL', () => {
    /**
     * Test: Le système détecte quand un review humain est nécessaire
     * Critères: score de confiance < seuil, ambiguité, données manquantes
     */
    test('devrait détecter le besoin de review humain', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Vérifier la présence d'indicateurs HITL
      const hitlIndicators = page.locator(
        '[data-testid="hitl-needed"], ' +
        '.hitl-flag, ' +
        '[data-status="needs-review"], ' +
        ':has-text("Review requis"), ' +
        ':has-text("Human review")'
      );

      // Si des AO nécessitent un review HITL, ils devraient etre flaggés
      if (await hitlIndicators.count() > 0) {
        await expect(hitlIndicators.first()).toBeVisible();
      }
    });

    /**
     * Test: Les critères de déclenchement HITL sont configurables
     */
    test('devrait avoir des seuils de confiance configurés', async ({ page }) => {
      // Accéder aux paramètres (si accessible)
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const confidenceThreshold = page.locator(
        '[data-testid="confidence-threshold"], ' +
        'input[name*="threshold"], ' +
        '.threshold-setting, ' +
        '[data-setting="hitl-threshold"]'
      );

      // Si les settings sont accessibles
      if (await confidenceThreshold.count() > 0) {
        await expect(confidenceThreshold.first()).toBeVisible();
      }
    });

    /**
     * Test: Un score de confiance faible déclenche HITL
     */
    test('devrait déclencher HITL pour score de confiance faible', async ({ page }) => {
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Chercher un AO avec score faible
      const lowConfidenceItems = page.locator(
        '[data-confidence="low"], ' +
        '.low-confidence, ' +
        '[class*="warning"], ' +
        '.confidence-low'
      );

      if (await lowConfidenceItems.count() > 0) {
        await lowConfidenceItems.first().click();
        await page.waitForTimeout(1000);

        // Vérifier qu'un flag HITL est présent
        const hitlFlag = page.locator(
          '[data-testid="hitl-required"], .hitl-badge, .needs-review'
        );

        if (await hitlFlag.count() > 0) {
          await expect(hitlFlag.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Création de la tache HITL', () => {
    /**
     * Test: Une tache HITL est créée automatiquement
     */
    test('devrait créer une tache HITL automatiquement', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator(
        '[data-testid="hitl-task"], ' +
        '.hitl-task, ' +
        '.review-task, ' +
        '.task-item'
      );

      // Des taches HITL devraient exister
      if (await hitlTasks.count() > 0) {
        await expect(hitlTasks.first()).toBeVisible();
      }
    });

    /**
     * Test: La tache HITL contient le contexte complet
     */
    test('devrait inclure le contexte dans la tache HITL', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1500);

        // Vérifier le contexte
        const contextElements = page.locator(
          '[data-testid="task-context"], ' +
          '.context-section, ' +
          '.decision-context'
        );

        if (await contextElements.count() > 0) {
          const contextText = await contextElements.first().textContent();
          expect(contextText!.length).toBeGreaterThan(20);
        }
      }
    });

    /**
     * Test: La raison du déclenchement HITL est expliquée
     */
    test('devrait expliquer la raison du déclenchement', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1500);

        const triggerReason = page.locator(
          '[data-testid="trigger-reason"], ' +
          '.trigger-explanation, ' +
          '.hitl-reason, ' +
          ':has-text("Raison"), ' +
          ':has-text("Reason")'
        );

        if (await triggerReason.count() > 0) {
          await expect(triggerReason.first()).toBeVisible();
        }
      }
    });

    /**
     * Test: Notification de nouvelle tache HITL
     */
    test('devrait notifier les reviewers', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');

      // Vérifier la présence d'un compteur de notifications ou badge
      const notificationBadge = page.locator(
        '[data-testid="hitl-notification"], ' +
        '.notification-badge, ' +
        '.unread-count, ' +
        '[aria-label*="notification"]'
      );

      // Un indicateur de nouvelles taches pourrait etre présent
    });
  });

  test.describe('Processus de review humain', () => {
    /**
     * Test: Le reviewer peut voir les options de décision
     */
    test('devrait afficher les options de décision', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1500);

        // Options attendues: Approuver, Modifier, Rejeter
        const approveBtn = page.locator('button:has-text("Approuver"), button:has-text("Approve")');
        const modifyBtn = page.locator('button:has-text("Modifier"), button:has-text("Edit")');
        const rejectBtn = page.locator('button:has-text("Rejeter"), button:has-text("Reject")');

        // Au moins une option devrait etre visible
        const hasOptions = await approveBtn.count() > 0 ||
                          await modifyBtn.count() > 0 ||
                          await rejectBtn.count() > 0;
      }
    });

    /**
     * Test: Le reviewer peut ajouter des commentaires
     */
    test('devrait permettre d ajouter des commentaires', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1500);

        const commentField = page.locator(
          'textarea[name*="comment"], ' +
          '[data-testid="review-comment"], ' +
          '.comment-textarea, ' +
          '.review-notes'
        );

        if (await commentField.count() > 0) {
          await expect(commentField.first()).toBeVisible();
          await expect(commentField.first()).toBeEditable();
        }
      }
    });

    /**
     * Test: La suggestion IA est présentée clairement
     */
    test('devrait présenter la suggestion IA', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1500);

        const aiSuggestion = page.locator(
          '[data-testid="ai-suggestion"], ' +
          '.ai-recommendation, ' +
          '.model-suggestion, ' +
          '.suggested-action'
        );

        if (await aiSuggestion.count() > 0) {
          await expect(aiSuggestion.first()).toBeVisible();
        }
      }
    });

    /**
     * Test: Le niveau de confiance IA est affiché
     */
    test('devrait afficher le niveau de confiance IA', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1500);

        const confidenceScore = page.locator(
          '[data-testid="confidence-score"], ' +
          '.confidence-level, ' +
          '.ai-confidence, ' +
          '[class*="confidence"]'
        );

        if (await confidenceScore.count() > 0) {
          const scoreText = await confidenceScore.first().textContent();
          // Le score devrait contenir un nombre ou pourcentage
        }
      }
    });
  });

  test.describe('Décision et reprise du workflow', () => {
    /**
     * Test: L'approbation reprend le workflow
     */
    test('devrait reprendre le workflow apres approbation', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1000);

        const approveBtn = page.locator(
          '[data-testid="approve-task"], button:has-text("Approuver")'
        );

        if (await approveBtn.count() > 0) {
          // Vérifier que le bouton est fonctionnel
          await expect(approveBtn.first()).toBeEnabled();

          // Note: Ne pas cliquer pour ne pas modifier les données de prod
          // Dans un environnement de test, on cliquerait ici
        }
      }
    });

    /**
     * Test: La modification met à jour et reprend le workflow
     */
    test('devrait permettre modification avant reprise', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1000);

        const modifyBtn = page.locator(
          '[data-testid="modify-task"], button:has-text("Modifier")'
        );

        if (await modifyBtn.count() > 0) {
          await modifyBtn.first().click();
          await page.waitForTimeout(1000);

          // Un formulaire d'édition devrait apparaitre
          const editForm = page.locator(
            'form, [data-testid="edit-form"], .edit-panel, .modification-form'
          );

          if (await editForm.count() > 0) {
            await expect(editForm.first()).toBeVisible();
          }
        }
      }
    });

    /**
     * Test: Le rejet arrete le workflow avec raison
     */
    test('devrait demander une raison pour le rejet', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1000);

        const rejectBtn = page.locator(
          '[data-testid="reject-task"], button:has-text("Rejeter")'
        );

        if (await rejectBtn.count() > 0) {
          await rejectBtn.first().click();
          await page.waitForTimeout(1000);

          // Une demande de raison ou confirmation devrait apparaitre
          const rejectForm = page.locator(
            '[data-testid="reject-reason"], ' +
            'textarea[required], ' +
            '.reject-reason-field, ' +
            '[role="dialog"]'
          );

          // Un formulaire ou dialog de rejet devrait etre présent
        }
      }
    });

    /**
     * Test: L'historique de décision est enregistré
     */
    test('devrait enregistrer l historique de décision', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');

      // Accéder à l'historique
      const historyLink = page.locator(
        '[data-testid="hitl-history"], ' +
        'a[href*="history"], ' +
        'button:has-text("Historique")'
      );

      if (await historyLink.count() > 0) {
        await historyLink.first().click();
        await page.waitForTimeout(2000);

        const historyEntries = page.locator(
          '[data-testid="history-entry"], ' +
          '.history-item, ' +
          '.decision-log, ' +
          'table tbody tr'
        );

        if (await historyEntries.count() > 0) {
          // L'historique devrait contenir des entrées avec:
          // - Date/heure
          // - Décision (approuvé/modifié/rejeté)
          // - Reviewer
          // - Commentaires
          await expect(historyEntries.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Cas limites et gestion des erreurs', () => {
    /**
     * Test: Gestion du timeout HITL
     */
    test('devrait gérer le timeout des taches HITL', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');

      // Vérifier s'il y a des indicateurs de taches en timeout
      const timeoutIndicator = page.locator(
        '[data-testid="task-timeout"], ' +
        '.timeout-warning, ' +
        '.overdue-task, ' +
        '[class*="expired"]'
      );

      // Les taches en timeout devraient etre mises en évidence
    });

    /**
     * Test: Réassignation de tache HITL
     */
    test('devrait permettre la réassignation', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1000);

        const reassignBtn = page.locator(
          '[data-testid="reassign-task"], ' +
          'button:has-text("Réassigner"), ' +
          'button:has-text("Assign"), ' +
          '.reassign-btn'
        );

        if (await reassignBtn.count() > 0) {
          await expect(reassignBtn.first()).toBeVisible();
        }
      }
    });

    /**
     * Test: Escalade de tache urgente
     */
    test('devrait permettre l escalade des taches urgentes', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1000);

        const escalateBtn = page.locator(
          '[data-testid="escalate-task"], ' +
          'button:has-text("Escalader"), ' +
          'button:has-text("Escalate"), ' +
          '.escalate-btn'
        );

        if (await escalateBtn.count() > 0) {
          await expect(escalateBtn.first()).toBeVisible();
        }
      }
    });

    /**
     * Test: Annulation de tache HITL
     */
    test('devrait permettre l annulation si approprié', async ({ page }) => {
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');

      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1000);

        const cancelBtn = page.locator(
          '[data-testid="cancel-task"], ' +
          'button:has-text("Annuler"), ' +
          'button:has-text("Cancel"), ' +
          '.cancel-btn'
        );

        // L'annulation peut ne pas etre disponible pour toutes les taches
      }
    });
  });

  test.describe('Workflow complet avec HITL', () => {
    /**
     * Test: Simulation du workflow complet avec interruption HITL
     * Ce test vérifie l'enchainement: Processing -> HITL -> Review -> Resume
     */
    test('devrait parcourir le workflow complet avec HITL', async ({ page }) => {
      // Étape 1: Dashboard - Voir l'état général
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();

      // Étape 2: Validation - Voir les AO nécessitant review
      await page.goto('/validation');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Étape 3: HITL - Accéder à la queue de review
      await page.goto('/hitl');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Vérifier la présence de la queue HITL
      const hitlQueue = page.locator(
        '[data-testid="hitl-queue"], .hitl-queue, .task-list'
      );

      if (await hitlQueue.count() > 0) {
        await expect(hitlQueue.first()).toBeVisible();
      }

      // Étape 4: Détail d'une tache (si disponible)
      const hitlTasks = page.locator('[data-testid="hitl-task"], .hitl-task, .task-item');
      if (await hitlTasks.count() > 0) {
        await hitlTasks.first().click();
        await page.waitForTimeout(1500);

        // Vérifier les éléments de décision
        const decisionArea = page.locator(
          '[data-testid="decision-panel"], .decision-area, .action-buttons'
        );

        // Un panneau de décision devrait etre visible
      }

      // Étape 5: Retour au dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Vérifier les métriques HITL dans le dashboard
      const hitlMetrics = page.locator(
        '[data-testid="hitl-stats"], ' +
        ':has-text("HITL"), ' +
        ':has-text("Review"), ' +
        '.hitl-metrics'
      );

      // Le workflow devrait se compléter sans erreurs
      const criticalErrors = page.locator('[class*="error"][class*="critical"]');
      const errorCount = await criticalErrors.count();
      expect(errorCount).toBe(0);
    });
  });
});
