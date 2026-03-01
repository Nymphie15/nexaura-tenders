import { test, expect } from "@playwright/test";

test("debug login", async ({ page, context }) => {
  const allRequests: string[] = [];
  const allResponses: string[] = [];
  const consoleMessages: string[] = [];

  page.on("request", req => {
    if (req.url().includes("api") || req.url().includes("auth")) {
      allRequests.push(req.method() + " " + req.url());
    }
  });

  page.on("response", resp => {
    if (resp.url().includes("api") || resp.url().includes("auth")) {
      allResponses.push(resp.status() + " " + resp.url());
    }
  });

  page.on("console", msg => {
    consoleMessages.push(msg.type() + ": " + msg.text());
  });

  await page.goto("http://localhost/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await page.fill("input[type=\"email\"]", "admin@nexaura.fr");
  await page.fill("input[type=\"password\"]", "Admin123\!");
  
  console.log("Clicking submit button...");
  await page.click("button[type=\"submit\"]");
  
  await page.waitForTimeout(5000);

  console.log("=== ALL REQUESTS ===");
  allRequests.forEach(r => console.log(r));
  
  console.log("=== ALL RESPONSES ===");
  allResponses.forEach(r => console.log(r));
  
  console.log("=== CONSOLE MESSAGES ===");
  consoleMessages.slice(0, 20).forEach(m => console.log(m));

  console.log("Final URL:", page.url());
});
