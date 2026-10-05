import { chromium, expect } from "@playwright/test";

const baseURL = process.env.AMARA_TEST_URL ?? "http://127.0.0.1:3102";
const results = [];

for (const channel of ["chrome", "msedge"]) {
  let browser;
  try {
    browser = await chromium.launch({ channel });
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(baseURL);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Menu" }).click();
    const trigger = page.getByRole("button", { name: "View Classic Pandesal details" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Classic Pandesal" });
    await dialog.getByRole("button", { name: /^Add to order/ }).click();
    await page.getByRole("link", { name: "Your order, 1 item" }).click();
    await page.getByRole("heading", { name: "Your order", exact: true }).waitFor();
    await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText("₱60");
    if (errors.length) throw new Error(errors.join("\n"));

    results.push({ channel, version: browser.version(), status: "passed", journey: "menu → product dialog → add → order total" });
    await context.close();
  } catch (error) {
    results.push({ channel, status: "failed", error: error instanceof Error ? error.message : String(error) });
  } finally {
    await browser?.close();
  }
}

console.log(JSON.stringify({ target: baseURL, results }, null, 2));
if (results.some((result) => result.status !== "passed")) process.exitCode = 1;
