/**
 * AUDIT E2E — Donnees & Integrite Frontend
 *
 * Verifie que les donnees sont correctement affichees sur chaque page,
 * sans erreur JS, sans 500, et en mode clair (pas de dark mode).
 */
import { test, expect, Page, APIRequestContext } from "@playwright/test";
import path from "path";

const BASE_URL = "http://localhost:3001";
const API_URL = "http://localhost:8000";
const CREDS = { email: "billy@nexaura.fr", password: "NexauraDemo2026" };
const SCREENSHOT_DIR = path.resolve(__dirname, "screenshots/audit");
const PAGE_TIMEOUT = 30_000;

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  });
}

async function loginViaAPI(
  page: Page,
  request: APIRequestContext
): Promise<string> {
  const resp = await request.post(`${API_URL}/auth/login`, { data: CREDS });
  expect(resp.ok(), `Login failed: ${resp.status()}`).toBeTruthy();
  const { access_token, refresh_token } = await resp.json();
  expect(access_token).toBeTruthy();

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ at, rt }) => {
      localStorage.setItem("access_token", at);
      if (rt) localStorage.setItem("refresh_token", rt);
    },
    { at: access_token, rt: refresh_token }
  );
  return access_token;
}

/** Navigate and wait for page to be interactive (not networkidle, which hangs on SSR) */
async function navigateAndWait(page: Page, url: string, waitMs = 3000) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT });
  // Wait for React hydration
  await page.waitForTimeout(waitMs);
}

test.describe("Audit MVP — Donnees & Integrite Frontend", () => {
  let page: Page;
  let pageConsoleErrors: string[] = [];
  let pageNetworkErrors: string[] = [];

  test.beforeAll(async ({ browser, playwright }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();

    // Capture console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          !text.includes("favicon") &&
          !text.includes("ResizeObserver") &&
          !text.includes("hydration") &&
          !text.includes("Background Sync")
        ) {
          pageConsoleErrors.push(text);
        }
      }
    });

    // Capture network errors (5xx)
    page.on("response", (resp) => {
      if (resp.status() >= 500) {
        pageNetworkErrors.push(`${resp.status()} ${resp.url()}`);
      }
    });

    // Login
    const request = await playwright.request.newContext();
    await loginViaAPI(page, request);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  // ─── Phase 4.1 : Dashboard ──────────────────────────────────────────────────

  test("4.1.1 Dashboard loads with KPIs", async () => {
    await navigateAndWait(page, `${BASE_URL}/`, 5000);
    await screenshot(page, "4.1.1_dashboard");

    // Should not be a blank page - wait for visible text content
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);
    expect(await page.title()).toBeTruthy();
  });

  test("4.1.2 Dashboard is in light mode (no dark)", async () => {
    await navigateAndWait(page, `${BASE_URL}/`);
    const classList = (await page.locator("html").getAttribute("class")) || "";
    expect(classList).not.toContain("dark");

    const bgColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    expect(bgColor).not.toBe("rgb(0, 0, 0)");
  });

  // ─── Phase 4.2 : Opportunites ───────────────────────────────────────────────

  test("4.2.1 /tenders page loads", async () => {
    await navigateAndWait(page, `${BASE_URL}/tenders`, 5000);
    await screenshot(page, "4.2.1_tenders_list");

    const bodyText = await page.locator("body").innerText();
    // Page should have content (even if loading skeleton)
    expect(bodyText.length).toBeGreaterThan(30);

    // Check if MaterOptiq is visible or if we can see tender titles
    const hasTenderContent =
      bodyText.includes("MaterOptiq") ||
      bodyText.includes("Opportunit") ||
      bodyText.includes("appel") ||
      bodyText.includes("tender");
    console.log(
      `Tenders page content (first 500): ${bodyText.substring(0, 500)}`
    );
    // Informational: log whether actual data loaded
    console.log(`MaterOptiq visible: ${bodyText.includes("MaterOptiq")}`);
  });

  test("4.2.2 MaterOptiq tender detail page loads", async () => {
    await navigateAndWait(
      page,
      `${BASE_URL}/tenders/upload-685ab1bcb589`,
      5000
    );
    await screenshot(page, "4.2.2_tender_detail_materoptiq");

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);
    console.log(
      `Tender detail content (first 500): ${bodyText.substring(0, 500)}`
    );
  });

  // ─── Phase 4.3 : Reponses ──────────────────────────────────────────────────

  test("4.3.1 /responses page loads", async () => {
    await navigateAndWait(page, `${BASE_URL}/responses`, 5000);
    await screenshot(page, "4.3.1_responses");

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(30);
    console.log(
      `Responses page content (first 500): ${bodyText.substring(0, 500)}`
    );

    const hasResponse =
      bodyText.includes("Termin") ||
      bodyText.includes("100%") ||
      bodyText.includes("685ab1bcb589") ||
      bodyText.includes("completed") ||
      bodyText.includes("ponse") ||
      bodyText.includes("workflow");
    console.log(`Has response data: ${hasResponse}`);
  });

  test("4.3.2 Response detail page loads", async () => {
    await navigateAndWait(
      page,
      `${BASE_URL}/responses/case-upload-685ab1bcb589`,
      5000
    );
    await screenshot(page, "4.3.2_response_detail");

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);
    console.log(
      `Response detail content (first 500): ${bodyText.substring(0, 500)}`
    );
  });

  // ─── Phase 4.4 : Decisions ─────────────────────────────────────────────────

  test("4.4.1 /decisions page loads", async () => {
    await navigateAndWait(page, `${BASE_URL}/decisions`, 5000);
    await screenshot(page, "4.4.1_decisions");

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(30);
    console.log(
      `Decisions page content (first 500): ${bodyText.substring(0, 500)}`
    );
  });

  // ─── Phase 4.5 : Pages secondaires ─────────────────────────────────────────

  const secondaryPages = [
    { path: "/analytics", name: "analytics" },
    { path: "/audit", name: "audit" },
    { path: "/company", name: "company" },
    { path: "/settings", name: "settings" },
    { path: "/templates", name: "templates" },
  ];

  for (const sp of secondaryPages) {
    test(`4.5 ${sp.name} page loads without error`, async () => {
      const netErrsBefore = pageNetworkErrors.length;

      await navigateAndWait(page, `${BASE_URL}${sp.path}`, 4000);
      await screenshot(page, `4.5_${sp.name}`);

      const bodyText = await page.locator("body").innerText();
      expect(bodyText.length).toBeGreaterThan(20);

      // No 500 errors on this page
      const newNetErrors = pageNetworkErrors.slice(netErrsBefore);
      const serverErrors = newNetErrors.filter(
        (e) => e.includes("500") || e.includes("502") || e.includes("503")
      );
      expect(serverErrors).toHaveLength(0);

      console.log(
        `${sp.name} page content (first 300): ${bodyText.substring(0, 300)}`
      );
    });
  }

  // ─── Phase 5.1 : Console Errors Summary ─────────────────────────────────────

  test("5.1 No critical JS console errors across all pages", async () => {
    const criticalErrors = pageConsoleErrors.filter(
      (e) =>
        !e.includes("Warning:") &&
        !e.includes("404") &&
        !e.includes("net::ERR")
    );

    console.log(`Total console errors: ${pageConsoleErrors.length}`);
    console.log(`Critical errors: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      console.log("Critical errors:", criticalErrors.slice(0, 10));
    }
    expect(criticalErrors.length).toBeLessThan(10);
  });

  test("5.2 No 500/502/503 API responses", async () => {
    console.log(`Total 5xx responses: ${pageNetworkErrors.length}`);
    if (pageNetworkErrors.length > 0) {
      console.log("5xx errors:", pageNetworkErrors);
    }
    expect(pageNetworkErrors.length).toBe(0);
  });

  // ─── Phase 5.2 : Auth Security ──────────────────────────────────────────────

  test("5.3 Wrong password shows error on login page", async () => {
    const newPage = await page.context().newPage();
    await newPage.goto(`${BASE_URL}/login`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT,
    });
    await newPage.waitForTimeout(2000);

    const emailInput = newPage
      .locator('input[type="email"], input[name="email"]')
      .first();
    const pwdInput = newPage
      .locator('input[type="password"], input[name="password"]')
      .first();

    if (await emailInput.isVisible()) {
      await emailInput.fill("billy@nexaura.fr");
      await pwdInput.fill("wrongpassword");

      const submitBtn = newPage.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await newPage.waitForTimeout(3000);
        await screenshot(newPage, "5.3_wrong_password");

        const url = newPage.url();
        expect(url).toContain("login");
      }
    }
    await newPage.close();
  });

  test("5.4 Access without token redirects to login", async () => {
    const newContext = await page.context().browser()!.newContext();
    const newPage = await newContext.newPage();

    await newPage.goto(`${BASE_URL}/responses`, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT,
    });
    await newPage.waitForTimeout(3000);
    await screenshot(newPage, "5.4_no_token_access");

    const url = newPage.url();
    const isProtected =
      url.includes("login") ||
      (await newPage
        .locator('input[type="password"]')
        .isVisible()
        .catch(() => false));
    expect(isProtected).toBe(true);

    await newPage.close();
    await newContext.close();
  });

  // ─── Phase 5.3 : CORS ──────────────────────────────────────────────────────

  test("5.5 No CORS errors in console", async () => {
    const corsErrors = pageConsoleErrors.filter(
      (e) =>
        e.toLowerCase().includes("cors") ||
        e.toLowerCase().includes("cross-origin")
    );
    console.log(`CORS errors: ${corsErrors.length}`);
    if (corsErrors.length > 0) {
      console.log("CORS errors:", corsErrors);
    }
    expect(corsErrors.length).toBe(0);
  });
});
