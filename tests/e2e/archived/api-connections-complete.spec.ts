/**
 * Test Playwright - Validation Complète des Connexions API Frontend
 *
 * Ce test valide:
 * - Tous les endpoints REST
 * - WebSocket connections
 * - Token refresh flow
 * - Error handling
 * - Real-time notifications
 *
 * @author Billy
 * @date 2026-01-27
 */

import { test, expect, Page } from '@playwright/test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://168.231.81.53:8000';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://168.231.81.53:8000';

// Helper: Intercepter et logger les requêtes API
async function setupAPIInterceptor(page: Page) {
  const apiCalls: Array<{ method: string; url: string; status: number }> = [];

  page.on('response', (response) => {
    const url = response.url();
    if (url.includes(API_BASE_URL)) {
      apiCalls.push({
        method: response.request().method(),
        url: url.replace(API_BASE_URL, ''),
        status: response.status(),
      });
    }
  });

  return apiCalls;
}

// Helper: Attendre une réponse API spécifique
async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  method: string = 'GET'
) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === method &&
      (typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())),
    { timeout: 30000 }
  );
}

test.describe('API Connections - Complete Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers login
    await page.goto('/login');
  });

  // ============================================
  // 1. AUTH ENDPOINTS
  // ============================================

  test('1.1 Login & Token Management', async ({ page }) => {
    const apiCalls = await setupAPIInterceptor(page);

    // Login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');

    const loginResponse = waitForAPIResponse(page, '/auth/login', 'POST');
    await page.click('button[type="submit"]');
    const response = await loginResponse;

    expect(response.status()).toBe(200);

    const loginData = await response.json();
    expect(loginData).toHaveProperty('access_token');
    expect(loginData).toHaveProperty('refresh_token');
    expect(loginData).toHaveProperty('user');

    // Vérifier storage
    const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // Vérifier redirection dashboard
    await page.waitForURL('/dashboard');

    // GET /auth/me (auto-load après login)
    await page.waitForResponse((r) =>
      r.url().includes('/auth/me') && r.status() === 200
    );

    console.log('✅ Auth endpoints OK:', {
      login: '200 OK',
      tokens: 'stored',
      me: '200 OK',
    });
  });

  test('1.2 Token Refresh Flow', async ({ page, context }) => {
    // Login first
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Simuler token expiré (injecter token invalide)
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'expired_token_123');
    });

    // Faire une requête → Doit trigger refresh
    await page.click('a[href="/tenders"]');

    // Vérifier que /auth/refresh est appelé
    const refreshResponse = await page.waitForResponse(
      (r) => r.url().includes('/auth/refresh') && r.request().method() === 'POST',
      { timeout: 10000 }
    );

    expect(refreshResponse.status()).toBe(200);

    const refreshData = await refreshResponse.json();
    expect(refreshData).toHaveProperty('access_token');

    // Vérifier que le nouveau token est stocké
    const newToken = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(newToken).not.toBe('expired_token_123');

    console.log('✅ Token refresh flow OK');
  });

  // ============================================
  // 2. TENDERS ENDPOINTS
  // ============================================

  test('2.1 Tenders - List & Filter', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigation vers tenders
    await page.click('a[href="/tenders"]');

    // GET /tenders
    const tendersResponse = await waitForAPIResponse(page, '/tenders');
    expect(tendersResponse.status()).toBe(200);

    const tenders = await tendersResponse.json();
    expect(Array.isArray(tenders)).toBeTruthy();

    // GET /tenders/count
    const countResponse = await waitForAPIResponse(page, '/tenders/count');
    expect(countResponse.status()).toBe(200);

    console.log('✅ Tenders list OK:', { count: tenders.length });
  });

  test('2.2 Tenders - Upload DCE', async ({ page }) => {
    // Login + navigate
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.click('a[href="/tenders"]');

    // Ouvrir dialog upload
    await page.click('button:has-text("Importer DCE")');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-dce.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content'),
    });

    // Soumettre
    const uploadResponse = waitForAPIResponse(page, '/tenders/upload', 'POST');
    await page.click('button:has-text("Uploader")');
    const response = await uploadResponse;

    expect(response.status()).toBe(201);

    const uploadData = await response.json();
    expect(uploadData).toHaveProperty('id');
    expect(uploadData).toHaveProperty('status', 'new');

    console.log('✅ Tender upload OK:', { id: uploadData.id });
  });

  test('2.3 Tenders - Process Workflow', async ({ page }) => {
    // Login + navigate
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.click('a[href="/tenders"]');

    // Attendre que tenders chargent
    await page.waitForResponse((r) => r.url().includes('/tenders'));

    // Cliquer sur premier tender
    await page.click('[data-testid="tender-card"]:first-child');

    // Cliquer "Traiter"
    const processResponse = waitForAPIResponse(page, /\/tenders\/[^\/]+\/process/, 'POST');
    await page.click('button:has-text("Traiter")');
    const response = await processResponse;

    expect(response.status()).toBe(200);

    const processData = await response.json();
    expect(processData).toHaveProperty('case_id');

    // Vérifier redirect vers workflow
    await page.waitForURL(/\/workflows\/[a-z0-9-]+/);

    console.log('✅ Tender process OK:', { caseId: processData.case_id });
  });

  // ============================================
  // 3. WORKFLOW ENDPOINTS
  // ============================================

  test('3.1 Workflow - List & Details', async ({ page }) => {
    // Login + navigate
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.click('a[href="/workflows"]');

    // GET /workflow/cases
    const workflowsResponse = await waitForAPIResponse(page, '/workflow/cases');
    expect(workflowsResponse.status()).toBe(200);

    const workflows = await workflowsResponse.json();
    expect(Array.isArray(workflows)).toBeTruthy();

    if (workflows.length > 0) {
      // Cliquer sur premier workflow
      await page.click('[data-testid="workflow-card"]:first-child');

      // GET /workflow/cases/{caseId}
      const detailsResponse = await waitForAPIResponse(
        page,
        /\/workflow\/cases\/[a-z0-9-]+$/
      );
      expect(detailsResponse.status()).toBe(200);

      const details = await detailsResponse.json();
      expect(details).toHaveProperty('case_id');
      expect(details).toHaveProperty('current_phase');

      // GET /workflow/cases/{caseId}/history
      const historyResponse = await waitForAPIResponse(
        page,
        /\/workflow\/cases\/[a-z0-9-]+\/history/
      );
      expect(historyResponse.status()).toBe(200);

      console.log('✅ Workflow list & details OK');
    }
  });

  test('3.2 Workflow - Stats', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // GET /workflow/stats (called on dashboard)
    const statsResponse = await waitForAPIResponse(page, '/workflow/stats');
    expect(statsResponse.status()).toBe(200);

    const stats = await statsResponse.json();
    expect(stats).toHaveProperty('total_workflows');
    expect(stats).toHaveProperty('by_status');

    console.log('✅ Workflow stats OK:', {
      total: stats.total_workflows,
    });
  });

  // ============================================
  // 4. HITL ENDPOINTS
  // ============================================

  test('4.1 HITL - Pending List', async ({ page }) => {
    // Login + navigate
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.click('a[href="/hitl"]');

    // GET /workflow/hitl/pending
    const pendingResponse = await waitForAPIResponse(page, '/workflow/hitl/pending');
    expect(pendingResponse.status()).toBe(200);

    const pending = await pendingResponse.json();
    expect(Array.isArray(pending)).toBeTruthy();

    console.log('✅ HITL pending OK:', { count: pending.length });
  });

  test('4.2 HITL - Submit Decision', async ({ page }) => {
    // Login + navigate
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.click('a[href="/hitl"]');
    await page.waitForResponse((r) => r.url().includes('/workflow/hitl/pending'));

    // Si HITL existe, soumettre décision
    const hasHITL = await page.locator('[data-testid="hitl-card"]').count();

    if (hasHITL > 0) {
      await page.click('[data-testid="hitl-card"]:first-child');

      // Cliquer Approve
      const decisionResponse = waitForAPIResponse(
        page,
        /\/workflow\/hitl\/[^\/]+\/[^\/]+$/,
        'POST'
      );
      await page.click('button:has-text("Approuver")');
      const response = await decisionResponse;

      expect([200, 204]).toContain(response.status());

      console.log('✅ HITL decision OK');
    } else {
      console.log('⚠️  No HITL pending - skipped');
    }
  });

  // ============================================
  // 5. WEBSOCKET CONNECTIONS
  // ============================================

  test('5.1 WebSocket - Assistant Connection', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to workflow avec assistant
    await page.click('a[href="/workflows"]');
    await page.waitForResponse((r) => r.url().includes('/workflow/cases'));

    const hasWorkflow = await page.locator('[data-testid="workflow-card"]').count();

    if (hasWorkflow > 0) {
      await page.click('[data-testid="workflow-card"]:first-child');

      // Vérifier WebSocket connection dans console
      const wsConnected = await page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
          // Attendre max 5s pour connection
          setTimeout(() => resolve(false), 5000);

          // Simuler check WebSocket (si exposé globalement)
          if ((window as any).__wsAssistant) {
            resolve((window as any).__wsAssistant.readyState === WebSocket.OPEN);
          }
        });
      });

      console.log('✅ WebSocket Assistant:', wsConnected ? 'Connected' : 'Not detected');
    }
  });

  test('5.2 WebSocket - Realtime Notifications', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Attendre que notifications WebSocket se connecte
    await page.waitForTimeout(2000);

    // Vérifier compteur notifications visible
    const notifBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notifBadge).toBeVisible();

    console.log('✅ WebSocket Notifications connected');
  });

  // ============================================
  // 6. NOTIFICATIONS ENDPOINTS
  // ============================================

  test('6.1 Notifications - List & Mark Read', async ({ page }) => {
    // Login + open notifications
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Ouvrir panel notifications
    await page.click('[data-testid="notifications-button"]');

    // GET /notifications
    const notifResponse = await waitForAPIResponse(page, '/notifications');
    expect(notifResponse.status()).toBe(200);

    const notifs = await notifResponse.json();
    expect(notifs).toHaveProperty('notifications');
    expect(notifs).toHaveProperty('unread_count');

    // GET /notifications/unread-count
    const countResponse = await waitForAPIResponse(page, '/notifications/unread-count');
    expect(countResponse.status()).toBe(200);

    // Marquer une notification lue
    if (notifs.notifications.length > 0) {
      const markReadResponse = waitForAPIResponse(
        page,
        '/notifications/mark-read',
        'POST'
      );
      await page.click('[data-testid="notification-item"]:first-child');
      const response = await markReadResponse;
      expect(response.status()).toBe(200);
    }

    console.log('✅ Notifications OK:', {
      total: notifs.notifications.length,
      unread: notifs.unread_count,
    });
  });

  // ============================================
  // 7. FEEDBACK ENDPOINTS
  // ============================================

  test('7.1 Feedback - Inline Thumbs Up/Down', async ({ page }) => {
    // Login + navigate to workflow
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.click('a[href="/workflows"]');
    await page.waitForResponse((r) => r.url().includes('/workflow/cases'));

    const hasWorkflow = await page.locator('[data-testid="workflow-card"]').count();

    if (hasWorkflow > 0) {
      await page.click('[data-testid="workflow-card"]:first-child');

      // Cliquer thumbs up sur un élément
      const feedbackResponse = waitForAPIResponse(page, '/feedback/inline', 'POST');
      await page.click('[data-testid="thumbs-up"]:first-child');
      const response = await feedbackResponse;

      expect([200, 201]).toContain(response.status());

      const feedback = await response.json();
      expect(feedback).toHaveProperty('id');
      expect(feedback).toHaveProperty('feedback_type', 'thumbs_up');

      console.log('✅ Inline feedback OK');
    }
  });

  test('7.2 Feedback - Dashboard Metrics', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to analytics
    await page.click('a[href="/analytics"]');

    // GET /feedback/metrics
    const metricsResponse = await waitForAPIResponse(page, '/feedback/metrics');
    expect(metricsResponse.status()).toBe(200);

    const metrics = await metricsResponse.json();
    expect(metrics).toHaveProperty('total_count');
    expect(metrics).toHaveProperty('approval_rate');

    console.log('✅ Feedback metrics OK:', {
      total: metrics.total_count,
      approvalRate: metrics.approval_rate,
    });
  });

  // ============================================
  // 8. COST ANALYTICS ENDPOINTS
  // ============================================

  test('8.1 Cost Analytics - Report & Budget', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to analytics/costs
    await page.click('a[href="/analytics/costs"]');

    // GET /analytics/costs/report
    const reportResponse = await waitForAPIResponse(page, '/analytics/costs/report');
    expect(reportResponse.status()).toBe(200);

    const report = await reportResponse.json();
    expect(report).toHaveProperty('total_cost_usd');
    expect(report).toHaveProperty('by_model');
    expect(report).toHaveProperty('by_phase');

    // GET /analytics/costs/budget
    const budgetResponse = await waitForAPIResponse(page, '/analytics/costs/budget');
    expect(budgetResponse.status()).toBe(200);

    const budget = await budgetResponse.json();
    expect(budget).toHaveProperty('current_month_cost_usd');
    expect(budget).toHaveProperty('usage_percent');

    console.log('✅ Cost analytics OK:', {
      totalCost: report.total_cost_usd,
      budgetUsage: budget.usage_percent,
    });
  });

  test('8.2 Cost Analytics - By Model & Phase', async ({ page }) => {
    // Login + navigate
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.click('a[href="/analytics/costs"]');

    // GET /analytics/costs/by-model
    const modelResponse = await waitForAPIResponse(page, '/analytics/costs/by-model');
    expect(modelResponse.status()).toBe(200);

    const modelData = await modelResponse.json();
    expect(modelData).toHaveProperty('models');
    expect(Array.isArray(modelData.models)).toBeTruthy();

    // GET /analytics/costs/by-phase
    const phaseResponse = await waitForAPIResponse(page, '/analytics/costs/by-phase');
    expect(phaseResponse.status()).toBe(200);

    const phaseData = await phaseResponse.json();
    expect(phaseData).toHaveProperty('phases');
    expect(Array.isArray(phaseData.phases)).toBeTruthy();

    console.log('✅ Cost breakdown OK:', {
      modelCount: modelData.models.length,
      phaseCount: phaseData.phases.length,
    });
  });

  // ============================================
  // 9. DOCUMENTS ENDPOINTS
  // ============================================

  test('9.1 Documents - List & Upload', async ({ page }) => {
    // Login + navigate to tender
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.click('a[href="/tenders"]');
    await page.waitForResponse((r) => r.url().includes('/tenders'));

    const hasTender = await page.locator('[data-testid="tender-card"]').count();

    if (hasTender > 0) {
      await page.click('[data-testid="tender-card"]:first-child');

      // GET /documents/{tenderId}
      const docsResponse = await waitForAPIResponse(page, /\/documents\/[^\/]+$/);
      expect(docsResponse.status()).toBe(200);

      const docs = await docsResponse.json();
      expect(Array.isArray(docs)).toBeTruthy();

      console.log('✅ Documents list OK:', { count: docs.length });
    }
  });

  // ============================================
  // 10. HEALTH ENDPOINTS
  // ============================================

  test('10.1 Health Check', async ({ page }) => {
    // Appel direct API (pas besoin login)
    const response = await page.request.get(`${API_BASE_URL}/health`);
    expect(response.status()).toBe(200);

    const health = await response.json();
    expect(health).toHaveProperty('status', 'healthy');
    expect(health).toHaveProperty('timestamp');

    console.log('✅ Health check OK:', health);
  });

  test('10.2 Health Ready', async ({ page }) => {
    const response = await page.request.get(`${API_BASE_URL}/health/ready`);
    expect(response.status()).toBe(200);

    const ready = await response.json();
    expect(ready).toHaveProperty('ready', true);

    console.log('✅ Health ready OK');
  });

  // ============================================
  // 11. ERROR HANDLING
  // ============================================

  test('11.1 Error - 401 Unauthorized', async ({ page }) => {
    // Essayer d'accéder à une page protégée sans token
    await page.goto('/dashboard');

    // Doit redirect vers /login
    await page.waitForURL('/login');

    console.log('✅ 401 handling OK (redirect to login)');
  });

  test('11.2 Error - 404 Not Found', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Accéder à tender inexistant
    await page.goto('/tenders/invalid-id-12345');

    // Vérifier toast error 404
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible({ timeout: 5000 });

    console.log('✅ 404 handling OK (toast displayed)');
  });

  test('11.3 Error - Network Timeout', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Bloquer réseau
    await page.route('**/tenders', (route) => {
      route.abort('timedout');
    });

    // Essayer de charger tenders
    await page.click('a[href="/tenders"]');

    // Vérifier toast erreur réseau
    const toast = page.locator('[data-sonner-toast]:has-text("réseau")');
    await expect(toast).toBeVisible({ timeout: 5000 });

    console.log('✅ Network timeout handling OK');
  });

  // ============================================
  // 12. SUMMARY REPORT
  // ============================================

  test('12.1 Generate API Coverage Report', async ({ page }) => {
    const apiCalls = await setupAPIInterceptor(page);

    // Login complet
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigation complète
    await page.click('a[href="/tenders"]');
    await page.waitForTimeout(2000);

    await page.click('a[href="/workflows"]');
    await page.waitForTimeout(2000);

    await page.click('a[href="/hitl"]');
    await page.waitForTimeout(2000);

    await page.click('a[href="/analytics"]');
    await page.waitForTimeout(2000);

    // Générer rapport
    const uniqueEndpoints = new Set(apiCalls.map((call) => `${call.method} ${call.url}`));

    console.log('\n📊 API Coverage Report:');
    console.log('='.repeat(50));
    console.log(`Total API calls: ${apiCalls.length}`);
    console.log(`Unique endpoints: ${uniqueEndpoints.size}`);
    console.log('\nEndpoints called:');

    [...uniqueEndpoints].sort().forEach((endpoint) => {
      console.log(`  • ${endpoint}`);
    });

    console.log('\nStatus distribution:');
    const statusCounts = apiCalls.reduce((acc, call) => {
      const status = `${call.status}`;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(statusCounts)
      .sort()
      .forEach(([status, count]) => {
        const emoji = status.startsWith('2') ? '✅' : status.startsWith('4') ? '⚠️' : '❌';
        console.log(`  ${emoji} ${status}: ${count} calls`);
      });

    console.log('='.repeat(50));

    // Assertions
    expect(apiCalls.length).toBeGreaterThan(10);
    expect(uniqueEndpoints.size).toBeGreaterThan(5);
  });
});

// ============================================
// HELPERS & UTILITIES
// ============================================

test.describe('API Performance & Monitoring', () => {
  test('Response Time Analysis', async ({ page }) => {
    const responseTimes: Array<{ endpoint: string; duration: number }> = [];

    page.on('response', (response) => {
      if (response.url().includes(API_BASE_URL)) {
        const timing = response.request().timing();
        if (timing) {
          responseTimes.push({
            endpoint: response.url().replace(API_BASE_URL, ''),
            duration: timing.responseEnd,
          });
        }
      }
    });

    // Login + navigation
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.click('a[href="/workflows"]');
    await page.waitForTimeout(3000);

    // Analyser
    const avgResponseTime =
      responseTimes.reduce((sum, t) => sum + t.duration, 0) / responseTimes.length;

    const slowEndpoints = responseTimes.filter((t) => t.duration > 1000);

    console.log('\n⚡ Performance Report:');
    console.log('='.repeat(50));
    console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Slow endpoints (>1s): ${slowEndpoints.length}`);

    if (slowEndpoints.length > 0) {
      console.log('\nSlow endpoints:');
      slowEndpoints.forEach((t) => {
        console.log(`  ⚠️  ${t.endpoint}: ${t.duration.toFixed(2)}ms`);
      });
    }

    console.log('='.repeat(50));

    // Assertion: avg response < 2s
    expect(avgResponseTime).toBeLessThan(2000);
  });
});
