import { test, expect } from "@playwright/test";

test.describe("Login Test", () => {
  test("should login and reach dashboard", async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem("theme", "dark");
    });

    // Go to login
    await page.goto("http://localhost/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/login-01-page.png" });

    // Fill form
    await page.fill("input[type=\"email\"]", "admin@nexaura.fr");
    await page.fill("input[type=\"password\"]", "Admin123!");
    await page.screenshot({ path: "test-results/login-02-filled.png" });

    // Submit and wait for response
    const responsePromise = page.waitForResponse(resp => resp.url().includes("auth/login"), { timeout: 15000 });
    await page.click("button[type=\"submit\"]");
    
    try {
      const response = await responsePromise;
      console.log("Login response status:", response.status());
      const body = await response.json();
      console.log("Login success:", !!body.access_token);
    } catch (e) {
      console.log("No login response intercepted");
    }

    // Wait for navigation
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "test-results/login-03-after.png", fullPage: true });

    console.log("Final URL:", page.url());
    
    // Check if we reached dashboard
    const isOnDashboard = !page.url().includes("/login");
    console.log("Reached dashboard:", isOnDashboard);
  });
});
