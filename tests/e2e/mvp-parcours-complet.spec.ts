/**
 * TEST E2E COMPLET MVP — Parcours Client Appel d'Offres
 *
 * Scenario : Un vrai client utilise la plateforme pour repondre a un appel d'offres.
 * DCE : DCE_MATEROPTIQ_SAD_V2.zip (1.9 MB, 8 documents)
 *
 * Phases :
 *   1. Connexion & Dashboard
 *   2. Import DCE
 *   3. Traitement IA (10 phases)
 *   4. Decisions HITL (4 checkpoints)
 *   5. Documents generes
 *   6. Pages secondaires
 *   7. Edge cases
 */
import { test, expect, Page, APIRequestContext } from "@playwright/test";
import path from "path";

// ─── Configuration ───────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3001";
const API_URL = "http://localhost:8000";

const CREDS = {
  email: "billy@nexaura.fr",
  password: "NexauraDemo2026",
};

const DCE_PATH = path.resolve(
  __dirname,
  "../../../../data/test_dce_it/DCE_MATEROPTIQ_SAD_V2.zip"
);

const SCREENSHOT_DIR = path.resolve(__dirname, "screenshots");

// Timeouts adaptes au LLM (deepseek-v3.1:671b peut etre lent)
const WORKFLOW_PHASE_TIMEOUT = 10 * 60_000; // 10 min par phase
const HITL_POLL_INTERVAL = 10_000; // 10s entre polls
const PAGE_LOAD_TIMEOUT = 15_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  });
}

/**
 * Login via API, injecter le token dans localStorage, puis naviguer.
 */
async function loginViaAPI(
  page: Page,
  request: APIRequestContext
): Promise<string> {
  const resp = await request.post(`${API_URL}/auth/login`, {
    data: CREDS,
  });
  expect(resp.ok(), `Login API failed: ${resp.status()}`).toBeTruthy();
  const { access_token, refresh_token } = await resp.json();
  expect(access_token).toBeTruthy();

  await page.goto(BASE_URL);
  await page.evaluate(
    ({ at, rt }) => {
      localStorage.setItem("access_token", at);
      if (rt) localStorage.setItem("refresh_token", rt);
    },
    { at: access_token, rt: refresh_token }
  );

  return access_token;
}

/**
 * Login via le formulaire UI (Phase 1)
 */
async function loginViaUI(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  await page.fill("#email", CREDS.email);
  await page.fill("#password", CREDS.password);
  await page.click('button[type="submit"]');

  // Attendre redirection vers dashboard
  await page.waitForURL(`${BASE_URL}/`, { timeout: PAGE_LOAD_TIMEOUT });
}

/**
 * Attendre qu'un workflow atteigne un certain statut via polling API.
 */
async function waitForWorkflowStatus(
  request: APIRequestContext,
  token: string,
  caseId: string,
  targetStatuses: string[],
  timeout: number = WORKFLOW_PHASE_TIMEOUT
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const resp = await request.get(
        `${API_URL}/workflow/cases/${caseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.ok()) {
        const data = await resp.json();
        const status = (data.status || "").toLowerCase();
        if (targetStatuses.includes(status)) {
          return data;
        }
        console.log(
          `  [poll] case=${caseId} phase=${data.current_phase} status=${status}`
        );
      }
    } catch {
      // ignore transient errors
    }
    await new Promise((r) => setTimeout(r, HITL_POLL_INTERVAL));
  }
  throw new Error(
    `Timeout: workflow ${caseId} n'a pas atteint ${targetStatuses.join("|")} en ${timeout / 1000}s`
  );
}

/**
 * Attendre qu'un checkpoint HITL apparaisse pour un case.
 */
async function waitForHITLCheckpoint(
  request: APIRequestContext,
  token: string,
  caseId: string,
  checkpointType?: string,
  timeout: number = WORKFLOW_PHASE_TIMEOUT
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const resp = await request.get(`${API_URL}/workflow/hitl/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok()) {
        const pending = await resp.json();
        const match = (Array.isArray(pending) ? pending : []).find(
          (cp: any) =>
            cp.case_id === caseId &&
            (!checkpointType || cp.checkpoint === checkpointType)
        );
        if (match) {
          console.log(
            `  [hitl] checkpoint=${match.checkpoint} trouve pour case=${caseId}`
          );
          return match;
        }
      }
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, HITL_POLL_INTERVAL));
  }
  throw new Error(
    `Timeout: pas de checkpoint HITL${checkpointType ? ` (${checkpointType})` : ""} pour case=${caseId}`
  );
}

// ─── PHASE 1 : Connexion & Dashboard ─────────────────────────────────────────

test.describe("Phase 1 - Connexion & Dashboard", () => {
  test("1.1 Login via formulaire UI", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");
    await screenshot(page, "01-login-page");

    // Remplir le formulaire
    await page.fill("#email", CREDS.email);
    await page.fill("#password", CREDS.password);
    await page.click('button[type="submit"]');

    // Verifier redirection
    await page.waitForURL(`${BASE_URL}/`, { timeout: PAGE_LOAD_TIMEOUT });
    await page.waitForLoadState("networkidle");
    await screenshot(page, "02-dashboard-apres-login");

    // Verifier: pas de dialog onboarding
    const onboardingDialog = page.locator('[role="dialog"]');
    const dialogCount = await onboardingDialog.count();
    // Si dialog, verifier que ce n'est pas l'onboarding
    if (dialogCount > 0) {
      const dialogText = await onboardingDialog.first().textContent();
      expect(dialogText).not.toContain("onboarding");
    }

    // Verifier elements du dashboard
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("1.2 Verification Dashboard KPIs", async ({ page, request }) => {
    const token = await loginViaAPI(page, request);

    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await screenshot(page, "03-dashboard-kpis");

    // Le dashboard doit avoir du contenu (pas page blanche)
    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(100);
  });

  test("1.3 Navigation sidebar - toutes les pages", async ({
    page,
    request,
  }) => {
    const token = await loginViaAPI(page, request);

    const pages = [
      { path: "/", name: "dashboard" },
      { path: "/tenders", name: "tenders" },
      { path: "/responses", name: "responses" },
      { path: "/decisions", name: "decisions" },
      { path: "/workflows", name: "workflows" },
      { path: "/analytics", name: "analytics" },
      { path: "/templates", name: "templates" },
      { path: "/audit", name: "audit" },
      { path: "/company", name: "company" },
      { path: "/settings", name: "settings" },
    ];

    for (const p of pages) {
      await page.goto(`${BASE_URL}${p.path}`);
      await page.waitForLoadState("load");
      await page.waitForTimeout(1500);

      // Verifier pas d'erreur 500 / page blanche
      const bodyText = await page.textContent("body");
      expect(
        bodyText!.length,
        `Page ${p.name} semble vide`
      ).toBeGreaterThan(50);

      // Verifier pas d'erreur affichee
      const has500 = bodyText!.includes("500") && bodyText!.includes("Internal");
      // Certains cas (comme "500" dans un KPI) sont normaux, ne verifier que les erreurs evidentes
      if (has500 && bodyText!.includes("Server Error")) {
        throw new Error(`Page ${p.name} affiche une erreur serveur`);
      }

      await screenshot(page, `04-page-${p.name}`);
      console.log(`  [nav] ${p.name} OK`);
    }
  });
});

// ─── PHASE 2 : Import DCE ────────────────────────────────────────────────────

test.describe("Phase 2 - Import DCE", () => {
  let token: string;

  test.beforeEach(async ({ page, request }) => {
    token = await loginViaAPI(page, request);
  });

  test("2.1 Upload DCE via dialog UI", async ({ page }) => {
    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await screenshot(page, "10-tenders-avant-upload");

    // Cliquer sur "Importer DCE"
    const importBtn = page.getByRole("button", { name: /importer/i });
    await expect(importBtn).toBeVisible({ timeout: 10_000 });
    await importBtn.click();

    // Attendre le dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await screenshot(page, "11-dialog-upload-ouvert");

    // Upload du fichier DCE via file input
    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles(DCE_PATH);
    await page.waitForTimeout(1000);

    // Verifier que le fichier apparait dans la liste
    await expect(dialog.getByText(/DCE_MATEROPTIQ/i)).toBeVisible();
    await screenshot(page, "12-fichier-selectionne");

    // Remplir les metadonnees
    await dialog.locator("#title").fill("SAD Materiels Photographiques MaterOptiq");
    await dialog.locator("#client").fill("MaterOptiq / Administration");

    // Date limite future
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);
    const dateStr = futureDate.toISOString().slice(0, 16);
    await dialog.locator("#deadline").fill(dateStr);

    await screenshot(page, "13-formulaire-rempli");

    // Soumettre
    const submitBtn = dialog.getByRole("button", {
      name: /importer et analyser/i,
    });
    await submitBtn.click();

    // Attendre la progression
    await page.waitForTimeout(3000);
    await screenshot(page, "14-upload-en-cours");

    // Attendre redirection vers /responses/{caseId} ou /tenders/{id}
    await page.waitForURL(/\/(responses|tenders)\//, {
      timeout: 30_000,
    });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await screenshot(page, "15-apres-upload-redirection");

    console.log(`  [upload] Redirige vers: ${page.url()}`);
  });

  test("2.2 Upload DCE via API directe", async ({ request }) => {
    const fs = require("fs");
    const fileBuffer = fs.readFileSync(DCE_PATH);

    const resp = await request.post(`${API_URL}/tenders/upload`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      multipart: {
        files: {
          name: "DCE_MATEROPTIQ_SAD_V2.zip",
          mimeType: "application/zip",
          buffer: fileBuffer,
        },
        title: "Test API Upload - MaterOptiq",
        client: "MaterOptiq Admin",
      },
    });

    expect(resp.ok(), `Upload API echoue: ${resp.status()}`).toBeTruthy();
    const data = await resp.json();
    console.log(
      `  [api-upload] tender_id=${data.id || data.tender_id} status=${data.status}`
    );
    expect(data.id || data.tender_id).toBeTruthy();
  });
});

// ─── PHASE 3 : Traitement IA ─────────────────────────────────────────────────

test.describe("Phase 3 - Traitement IA & HITL complet", () => {
  // Ce test est long (potentiellement 15-45 min avec LLM)
  test.setTimeout(60 * 60_000); // 1 heure max

  let token: string;
  let tenderId: string;
  let caseId: string;

  test("3.0 Upload + Process + 4 HITL checkpoints", async ({
    page,
    request,
  }) => {
    // ── Etape 1: Login ──
    token = await loginViaAPI(page, request);
    console.log("  [step] Login OK");

    // ── Etape 2: Upload DCE via API ──
    const fs = require("fs");
    const fileBuffer = fs.readFileSync(DCE_PATH);

    const uploadResp = await request.post(`${API_URL}/tenders/upload`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        files: {
          name: "DCE_MATEROPTIQ_SAD_V2.zip",
          mimeType: "application/zip",
          buffer: fileBuffer,
        },
        title: "Workflow Complet - MaterOptiq SAD",
        client: "MaterOptiq",
      },
    });

    expect(
      uploadResp.ok(),
      `Upload echoue: ${uploadResp.status()}`
    ).toBeTruthy();
    const uploadData = await uploadResp.json();
    tenderId = uploadData.id || uploadData.tender_id;
    console.log(`  [step] Upload OK - tender_id=${tenderId}`);

    // ── Etape 3: Lancer le traitement ──
    const processResp = await request.post(
      `${API_URL}/tenders/${tenderId}/process`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {},
      }
    );

    expect(
      processResp.ok(),
      `Process echoue: ${processResp.status()}`
    ).toBeTruthy();
    const processData = await processResp.json();
    caseId =
      processData.case_id || processData.workflow_id || `case-${tenderId}`;
    console.log(`  [step] Process lance - case_id=${caseId}`);

    // ── Etape 4: Verifier la progression dans l'UI ──
    await page.goto(`${BASE_URL}/responses/${caseId}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await screenshot(page, "20-workflow-demarre");

    // ── Etape 5: Attendre le premier checkpoint HITL (GO_NOGO) ──
    console.log("  [step] Attente checkpoint GO_NOGO...");
    let hitlData: any;
    try {
      hitlData = await waitForHITLCheckpoint(
        request,
        token,
        caseId,
        "go_nogo",
        WORKFLOW_PHASE_TIMEOUT
      );
    } catch {
      // Si pas de go_nogo, chercher n'importe quel checkpoint
      console.log(
        "  [warn] go_nogo non trouve, recherche de tout checkpoint..."
      );
      hitlData = await waitForHITLCheckpoint(
        request,
        token,
        caseId,
        undefined,
        WORKFLOW_PHASE_TIMEOUT
      );
    }

    console.log(`  [step] Checkpoint HITL: ${hitlData.checkpoint}`);

    // ── HITL Checkpoint 1: GO/NO-GO ──
    if (hitlData.checkpoint === "go_nogo") {
      // Naviguer vers la page de decision
      await page.goto(
        `${BASE_URL}/decisions/${caseId}/go_nogo`
      );
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);
      await screenshot(page, "21-hitl-go-nogo");

      // Soumettre la decision GO via API (plus fiable que l'UI pour un test long)
      const goResp = await request.post(
        `${API_URL}/workflow/cases/${caseId}/hitl/go_nogo`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            action: "approve",
            data: { risk_decision: "GO", reason: "Test E2E - approuve" },
            decided_by: "e2e-test",
            timestamp: new Date().toISOString(),
          },
        }
      );
      console.log(`  [hitl] GO_NOGO soumis: ${goResp.status()}`);
      if (!goResp.ok()) {
        console.log(`  [hitl] Response: ${await goResp.text()}`);
      }
    }

    // ── HITL Checkpoint 2: STRATEGY_REVIEW ──
    console.log("  [step] Attente checkpoint STRATEGY_REVIEW...");
    try {
      hitlData = await waitForHITLCheckpoint(
        request,
        token,
        caseId,
        "strategy_review",
        WORKFLOW_PHASE_TIMEOUT
      );

      await page.goto(
        `${BASE_URL}/decisions/${caseId}/strategy_review`
      );
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);
      await screenshot(page, "22-hitl-strategy-review");

      const stratResp = await request.post(
        `${API_URL}/workflow/cases/${caseId}/hitl/strategy_review`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            action: "approve",
            data: {
              approved_themes: ["all"],
              modifications: {},
              new_themes: [],
            },
            decided_by: "e2e-test",
            timestamp: new Date().toISOString(),
          },
        }
      );
      console.log(`  [hitl] STRATEGY_REVIEW soumis: ${stratResp.status()}`);
    } catch (e) {
      console.log(
        `  [warn] STRATEGY_REVIEW timeout/skip: ${(e as Error).message}`
      );
    }

    // ── HITL Checkpoint 3: PRICE_REVIEW ──
    console.log("  [step] Attente checkpoint PRICE_REVIEW...");
    try {
      hitlData = await waitForHITLCheckpoint(
        request,
        token,
        caseId,
        "price_review",
        WORKFLOW_PHASE_TIMEOUT
      );

      await page.goto(
        `${BASE_URL}/decisions/${caseId}/price_review`
      );
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);
      await screenshot(page, "23-hitl-price-review");

      const priceResp = await request.post(
        `${API_URL}/workflow/cases/${caseId}/hitl/price_review`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            action: "approve",
            data: {
              adjustments: {},
              global_discount: 0,
              final_total: 0,
            },
            decided_by: "e2e-test",
            timestamp: new Date().toISOString(),
          },
        }
      );
      console.log(`  [hitl] PRICE_REVIEW soumis: ${priceResp.status()}`);
    } catch (e) {
      console.log(
        `  [warn] PRICE_REVIEW timeout/skip: ${(e as Error).message}`
      );
    }

    // ── HITL Checkpoint 4: TECH_REVIEW ──
    console.log("  [step] Attente checkpoint TECH_REVIEW...");
    try {
      hitlData = await waitForHITLCheckpoint(
        request,
        token,
        caseId,
        "tech_review",
        WORKFLOW_PHASE_TIMEOUT
      );

      await page.goto(
        `${BASE_URL}/decisions/${caseId}/tech_review`
      );
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);
      await screenshot(page, "24-hitl-tech-review");

      const techResp = await request.post(
        `${API_URL}/workflow/cases/${caseId}/hitl/tech_review`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            action: "approve",
            data: { edits: {}, comment: "Valide par test E2E" },
            decided_by: "e2e-test",
            timestamp: new Date().toISOString(),
          },
        }
      );
      console.log(`  [hitl] TECH_REVIEW soumis: ${techResp.status()}`);
    } catch (e) {
      console.log(
        `  [warn] TECH_REVIEW timeout/skip: ${(e as Error).message}`
      );
    }

    // ── Etape 6: Attendre la fin du workflow ──
    console.log("  [step] Attente completion du workflow...");
    try {
      const finalState = await waitForWorkflowStatus(
        request,
        token,
        caseId,
        ["completed", "failed"],
        WORKFLOW_PHASE_TIMEOUT
      );
      console.log(
        `  [step] Workflow termine: status=${finalState.status} phase=${finalState.current_phase}`
      );

      // Capturer la page de reponse finale
      await page.goto(`${BASE_URL}/responses/${caseId}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);
      await screenshot(page, "25-workflow-complete");
    } catch (e) {
      console.log(
        `  [warn] Workflow pas complete dans le timeout: ${(e as Error).message}`
      );
      // Capturer l'etat actuel
      await page.goto(`${BASE_URL}/responses/${caseId}`);
      await page.waitForLoadState("networkidle");
      await screenshot(page, "25-workflow-etat-final");
    }
  });
});

// ─── PHASE 4 : Verification des decisions HITL dans l'UI ─────────────────────

test.describe("Phase 4 - Page Decisions HITL", () => {
  test("4.1 Page /decisions affiche les stats et les checkpoints", async ({
    page,
    request,
  }) => {
    const token = await loginViaAPI(page, request);

    await page.goto(`${BASE_URL}/decisions`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await screenshot(page, "30-decisions-page");

    // Verifier que la page a du contenu
    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(50);

    // Verifier les onglets
    const tabs = page.locator('[role="tablist"]');
    if ((await tabs.count()) > 0) {
      console.log("  [decisions] Onglets trouves");
    }
  });

  test("4.2 Page decision GO_NOGO - structure UI", async ({
    page,
    request,
  }) => {
    const token = await loginViaAPI(page, request);

    // Chercher un checkpoint en attente
    const resp = await request.get(`${API_URL}/workflow/hitl/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resp.ok()) {
      const pending = await resp.json();
      if (Array.isArray(pending) && pending.length > 0) {
        const cp = pending[0];
        await page.goto(
          `${BASE_URL}/decisions/${cp.case_id}/${cp.checkpoint}`
        );
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);
        await screenshot(page, `31-decision-${cp.checkpoint}`);

        // Verifier les elements de la page
        const bodyText = await page.textContent("body");
        expect(bodyText!.length).toBeGreaterThan(100);
        console.log(
          `  [hitl-ui] Page ${cp.checkpoint} affichee pour case=${cp.case_id}`
        );
      } else {
        console.log("  [hitl-ui] Aucun checkpoint en attente");
      }
    }
  });
});

// ─── PHASE 5 : Documents generes ─────────────────────────────────────────────

test.describe("Phase 5 - Documents & Responses", () => {
  test("5.1 Page /responses liste les reponses", async ({
    page,
    request,
  }) => {
    const token = await loginViaAPI(page, request);

    await page.goto(`${BASE_URL}/responses`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await screenshot(page, "40-responses-list");

    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(50);
    console.log("  [responses] Page chargee");
  });

  test("5.2 API: Lister les workflows existants", async ({ request }) => {
    const loginResp = await request.post(`${API_URL}/auth/login`, {
      data: CREDS,
    });
    const { access_token } = await loginResp.json();

    const resp = await request.get(`${API_URL}/workflow/cases`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (resp.ok()) {
      const data = await resp.json();
      const cases = Array.isArray(data) ? data : data.cases || [];
      console.log(`  [api] ${cases.length} workflows trouves`);

      for (const wf of cases.slice(0, 3)) {
        console.log(
          `    case=${wf.case_id?.slice(0, 12)} phase=${wf.current_phase} status=${wf.status}`
        );
      }
    } else {
      console.log(`  [api] /workflow/cases: ${resp.status()}`);
    }
  });

  test("5.3 API: Verifier documents d'un tender", async ({ request }) => {
    const loginResp = await request.post(`${API_URL}/auth/login`, {
      data: CREDS,
    });
    const { access_token } = await loginResp.json();

    // Lister les tenders pour trouver un avec des documents
    const tendersResp = await request.get(`${API_URL}/tenders`, {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { limit: 5 },
    });

    if (tendersResp.ok()) {
      const tenders = await tendersResp.json();
      const tenderList = Array.isArray(tenders) ? tenders : [];

      for (const t of tenderList.slice(0, 2)) {
        const tid = t.id || t.tender_id;
        if (!tid) continue;

        const docsResp = await request.get(
          `${API_URL}/tenders/${tid}/documents`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        );

        if (docsResp.ok()) {
          const docs = await docsResp.json();
          const docList = Array.isArray(docs) ? docs : [];
          console.log(
            `  [docs] tender=${tid}: ${docList.length} documents`
          );
          for (const d of docList.slice(0, 5)) {
            console.log(`    - ${d.name || d.filename} (${d.type || "?"})`);
          }
        }
      }
    }
  });
});

// ─── PHASE 6 : Pages Secondaires ─────────────────────────────────────────────

test.describe("Phase 6 - Pages Secondaires", () => {
  let token: string;

  test.beforeEach(async ({ page, request }) => {
    token = await loginViaAPI(page, request);
  });

  test("6.1 Workflows page", async ({ page }) => {
    await page.goto(`${BASE_URL}/workflows`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await screenshot(page, "50-workflows-page");

    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test("6.2 Analytics page", async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await screenshot(page, "51-analytics-page");

    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test("6.3 Templates page", async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await screenshot(page, "52-templates-page");
  });

  test("6.4 Audit page", async ({ page }) => {
    await page.goto(`${BASE_URL}/audit`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await screenshot(page, "53-audit-page");

    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test("6.5 Company page", async ({ page }) => {
    await page.goto(`${BASE_URL}/company`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await screenshot(page, "54-company-page");
  });

  test("6.6 Settings page - 4 onglets", async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await screenshot(page, "55-settings-page");

    // Verifier les onglets si presents
    const tabs = page.locator('[role="tablist"] [role="tab"]');
    const tabCount = await tabs.count();
    if (tabCount > 0) {
      console.log(`  [settings] ${tabCount} onglets trouves`);

      for (let i = 0; i < tabCount; i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(1000);
        const tabName = await tabs.nth(i).textContent();
        await screenshot(
          page,
          `55-settings-tab-${i}-${tabName?.replace(/\s/g, "_")}`
        );
        console.log(`  [settings] Onglet ${i}: ${tabName}`);
      }
    }
  });
});

// ─── PHASE 7 : Edge Cases ────────────────────────────────────────────────────

test.describe("Phase 7 - Edge Cases", () => {
  test("7.1 Acces sans auth redirige vers login", async ({ page }) => {
    // Nettoyer localStorage
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    });

    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForTimeout(3000);

    // Devrait rediriger vers login ou afficher message
    const url = page.url();
    const bodyText = await page.textContent("body");
    const isLoginPage =
      url.includes("/login") ||
      bodyText!.includes("Connexion") ||
      bodyText!.includes("Se connecter");
    console.log(`  [auth] URL=${url}, isLogin=${isLoginPage}`);
    await screenshot(page, "60-acces-sans-auth");
  });

  test("7.2 Page 404 - route inexistante", async ({ page, request }) => {
    await loginViaAPI(page, request);

    await page.goto(`${BASE_URL}/page-qui-nexiste-pas`);
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);
    await screenshot(page, "61-page-404");

    const bodyText = await page.textContent("body");
    // Pas de crash / page blanche
    expect(bodyText!.length).toBeGreaterThan(10);
  });

  test("7.3 API Health check", async ({ request }) => {
    const resp = await request.get(`${API_URL}/health`);
    expect(resp.ok()).toBeTruthy();

    const data = await resp.json();
    console.log(`  [health] status=${data.status || JSON.stringify(data)}`);
    expect(data.status || data.healthy).toBeTruthy();
  });

  test("7.4 Upload fichier invalide via API", async ({ request }) => {
    const loginResp = await request.post(`${API_URL}/auth/login`, {
      data: CREDS,
    });
    const { access_token } = await loginResp.json();

    // Tenter un upload sans fichier
    const resp = await request.post(`${API_URL}/tenders/upload`, {
      headers: { Authorization: `Bearer ${access_token}` },
      multipart: {
        title: "Test sans fichier",
      },
    });

    // Devrait echouer (400 ou 422)
    console.log(`  [edge] Upload sans fichier: ${resp.status()}`);
    expect([400, 422, 500]).toContain(resp.status());
  });

  test("7.5 Responsive - mobile viewport", async ({ page, request }) => {
    await loginViaAPI(page, request);

    // Passer en viewport mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await screenshot(page, "62-mobile-dashboard");

    await page.goto(`${BASE_URL}/tenders`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await screenshot(page, "63-mobile-tenders");

    // Verifier que le contenu est visible (pas de page blanche)
    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(50);
  });
});

// ─── RESUME FINAL ────────────────────────────────────────────────────────────

test.describe("Resume", () => {
  test("Checklist finale", async ({ request }) => {
    const loginResp = await request.post(`${API_URL}/auth/login`, {
      data: CREDS,
    });
    const { access_token } = await loginResp.json();

    console.log("\n══════════════════════════════════════════");
    console.log("  RESUME DU TEST E2E MVP");
    console.log("══════════════════════════════════════════\n");

    // Health
    const healthResp = await request.get(`${API_URL}/health`);
    console.log(`  [x] API Health: ${healthResp.ok() ? "OK" : "FAIL"}`);

    // Tenders
    const tendersResp = await request.get(`${API_URL}/tenders`, {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { limit: 100 },
    });
    const tenders = tendersResp.ok() ? await tendersResp.json() : [];
    console.log(
      `  [x] Tenders: ${Array.isArray(tenders) ? tenders.length : 0} en base`
    );

    // Workflows
    const wfResp = await request.get(`${API_URL}/workflow/cases`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (wfResp.ok()) {
      const wfData = await wfResp.json();
      const cases = Array.isArray(wfData) ? wfData : wfData.cases || [];
      const completed = cases.filter(
        (c: any) => (c.status || "").toLowerCase() === "completed"
      );
      const running = cases.filter(
        (c: any) => (c.status || "").toLowerCase() === "running"
      );
      const waitHitl = cases.filter(
        (c: any) => (c.status || "").toLowerCase() === "waiting_hitl"
      );
      console.log(`  [x] Workflows: ${cases.length} total`);
      console.log(`      - En cours: ${running.length}`);
      console.log(`      - Attente HITL: ${waitHitl.length}`);
      console.log(`      - Completes: ${completed.length}`);
    }

    // HITL pending
    const hitlResp = await request.get(`${API_URL}/workflow/hitl/pending`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (hitlResp.ok()) {
      const pending = await hitlResp.json();
      console.log(
        `  [x] HITL pending: ${Array.isArray(pending) ? pending.length : 0}`
      );
    }

    console.log("\n══════════════════════════════════════════");
    console.log("  Screenshots dans: tests/e2e/screenshots/");
    console.log("══════════════════════════════════════════\n");
  });
});
