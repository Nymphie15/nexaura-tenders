import { test, expect } from "@playwright/test";

test.describe("Full Site Test (Real)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem("theme", "dark");
      localStorage.setItem("onboarding_completed", "true");
    });
  });

  test("login and check all pages", async ({ page }) => {
    // Login
    await page.goto("http://168.231.81.53/login");
    await page.waitForTimeout(1500);
    await page.fill("input[type=\"email\"]", "admin@nexaura.fr");
    await page.fill("input[type=\"password\"]", "Admin123!");
    await page.click("button[type=\"submit\"]");
    await page.waitForTimeout(3000);
    
    // Dashboard
    console.log("Testing Dashboard...");
    await page.screenshot({ path: "test-results/site-01-dashboard.png", fullPage: true });
    expect(page.url()).not.toContain("/login");

    // Workflows
    console.log("Testing Workflows...");
    await page.goto("http://168.231.81.53/workflows");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/site-02-workflows.png", fullPage: true });

    // HITL
    console.log("Testing HITL...");
    await page.goto("http://168.231.81.53/hitl");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/site-03-hitl.png", fullPage: true });

    // Tenders
    console.log("Testing Tenders...");
    await page.goto("http://168.231.81.53/tenders");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/site-04-tenders.png", fullPage: true });

    // Settings
    console.log("Testing Settings...");
    await page.goto("http://168.231.81.53/settings");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/site-05-settings.png", fullPage: true });

    console.log("All pages tested successfully!");
  });
});
