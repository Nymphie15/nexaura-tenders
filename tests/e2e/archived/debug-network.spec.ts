/**
 * Debug Network - Capture toutes les erreurs réseau
 */
import { test, expect } from "@playwright/test";

test("capture network errors on dashboard", async ({ page }) => {
  const failedRequests: { url: string; status: number; method: string; response?: string }[] = [];
  const consoleErrors: string[] = [];

  // Capturer toutes les requêtes
  page.on("response", async (response) => {
    const status = response.status();
    if (status >= 400) {
      let responseText = "";
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = "Could not read response";
      }
      failedRequests.push({
        url: response.url(),
        status: status,
        method: response.request().method(),
        response: responseText.substring(0, 500),
      });
    }
  });

  // Capturer les erreurs console
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // Login
  await page.goto("http://168.231.81.53/login");
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', "admin@nexaura.fr");
  await page.fill('input[type="password"]', "Admin123!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // Attendre que le dashboard charge complètement
  await page.waitForTimeout(5000);

  // Afficher les résultats
  console.log("\n========== FAILED REQUESTS ==========");
  if (failedRequests.length === 0) {
    console.log("No failed requests");
  } else {
    failedRequests.forEach((req, i) => {
      console.log(`\n--- Request ${i + 1} ---`);
      console.log(`URL: ${req.url}`);
      console.log(`Method: ${req.method}`);
      console.log(`Status: ${req.status}`);
      console.log(`Response: ${req.response}`);
    });
  }

  console.log("\n========== CONSOLE ERRORS ==========");
  if (consoleErrors.length === 0) {
    console.log("No console errors");
  } else {
    consoleErrors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`);
    });
  }

  // Screenshot
  await page.screenshot({ path: "test-results/debug-dashboard.png", fullPage: true });

  console.log("\n========== SUMMARY ==========");
  console.log(`Failed requests: ${failedRequests.length}`);
  console.log(`Console errors: ${consoleErrors.length}`);
});
