import { test, expect } from "@playwright/test";

test.describe("Full Site Diagnostic", () => {
  test("check login functionality", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const networkErrors: string[] = [];
    page.on("requestfailed", request => {
      networkErrors.push(request.url() + " - " + (request.failure()?.errorText || "unknown"));
    });

    await page.goto("http://localhost/login", { waitUntil: "networkidle", timeout: 30000 });
    await page.screenshot({ path: "test-results/diag-01-login.png" });

    await page.fill("input[type=\"email\"]", "admin@nexaura.fr");
    await page.fill("input[type=\"password\"]", "Admin123\!");
    
    const responsePromise = page.waitForResponse(resp => resp.url().includes("auth") || resp.url().includes("api"), { timeout: 10000 }).catch(() => null);
    await page.click("button[type=\"submit\"]");
    const response = await responsePromise;

    if (response) {
      console.log("API Response URL:", response.url());
      console.log("API Response Status:", response.status());
      const body = await response.text().catch(() => "No body");
      console.log("API Response Body:", body.substring(0, 500));
    } else {
      console.log("No API response captured");
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/diag-02-after-login.png" });
    console.log("Current URL after login:", page.url());
    console.log("Console Errors:", JSON.stringify(consoleErrors));
    console.log("Network Errors:", JSON.stringify(networkErrors));
  });

  test("check API connectivity", async ({ page }) => {
    const apiResponse = await page.request.get("http://localhost/api/health");
    console.log("API Health Status:", apiResponse.status());
    console.log("API Health Body:", await apiResponse.text());

    const loginResponse = await page.request.post("http://localhost/api/auth/login", {
      data: { email: "admin@nexaura.fr", password: "Admin123\!" }
    });
    console.log("Login API Status:", loginResponse.status());
    console.log("Login API Body:", await loginResponse.text());
  });
});
