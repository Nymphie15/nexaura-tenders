import { test, expect } from "@playwright/test";

test("login with public IP", async ({ page, context }) => {
  await context.addInitScript(() => {
    localStorage.setItem("theme", "dark");
  });

  // Use public IP to avoid CORS
  await page.goto("http://168.231.81.53/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  
  console.log("On login page");
  await page.screenshot({ path: "test-results/real-01-login.png" });

  await page.fill("input[type=\"email\"]", "admin@nexaura.fr");
  await page.fill("input[type=\"password\"]", "Admin123!");
  
  // Listen for login response
  const responsePromise = page.waitForResponse(resp => resp.url().includes("auth/login"), { timeout: 10000 });
  await page.click("button[type=\"submit\"]");
  
  const response = await responsePromise;
  console.log("Login response:", response.status());
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/real-02-after.png", fullPage: true });
  
  console.log("Final URL:", page.url());
  const isOnDashboard = !page.url().includes("/login");
  console.log("On dashboard:", isOnDashboard);
  expect(isOnDashboard).toBe(true);
});
