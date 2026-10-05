import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const STORAGE_KEY = "amara-bakery-order-v1";

test("reveals the offscreen visit details on scroll and honors reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 720 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const visitCopy = page.locator("#visit .visit__copy[data-reveal-wrapper]");
  await expect(visitCopy).toHaveAttribute("data-reveal", "ready");
  await expect(visitCopy).toHaveCSS("opacity", "0");
  await visitCopy.scrollIntoViewIfNeeded();
  await expect(visitCopy).toHaveAttribute("data-reveal", "visible");
  await expect(visitCopy).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(visitCopy).toHaveAttribute("data-reveal", "visible");
  await expect(visitCopy).toHaveCSS("opacity", "1");
});

test("adds a chosen quantity, totals it, and restores it after refresh", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/menu");

  const orderLink = page.getByRole("link", { name: /^Your order,/ });
  const countBadge = orderLink.locator(".site-header__order-count");
  await expect(page.getByText("Your order is saved in this browser for your next visit.", { exact: true })).toBeVisible();
  await expect(countBadge).toHaveText("0");
  await expect(countBadge).not.toHaveClass(/site-header__order-count--added/);

  const productTrigger = page.getByRole("button", { name: "View Classic Pandesal details" });
  await productTrigger.click();
  const dialog = page.getByRole("dialog", { name: "Classic Pandesal" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Increase quantity of Classic Pandesal" }).click();
  await dialog.getByRole("button", { name: "Increase quantity of Classic Pandesal" }).click();
  await expect(dialog.locator("output")).toHaveText("3");
  await dialog.getByRole("button", { name: /^Add to order/ }).click();
  await expect(countBadge).toHaveText("3");
  await expect(countBadge).toHaveClass(/site-header__order-count--added/);
  await expect(countBadge).not.toHaveClass(/site-header__order-count--added/);
  await expect(page.getByText("Classic Pandesal added to your order.", { exact: true })).toBeVisible();

  await goToOrder(page);
  await expect(page.getByRole("heading", { name: "Classic Pandesal" })).toBeVisible();
  const row = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Classic Pandesal" }) });
  await expect(row.locator("output")).toHaveText("3");
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText("₱180");
  await row.getByRole("button", { name: "Decrease quantity of Classic Pandesal" }).click();
  await expect(row.locator("output")).toHaveText("2");
  await expect(countBadge).toHaveText("2");
  await expect(countBadge).not.toHaveClass(/site-header__order-count--added/);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Classic Pandesal" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText("₱120");
  await expect(orderLink).toHaveAccessibleName("Your order, 2 items");
  await expect(countBadge).not.toHaveClass(/site-header__order-count--added/);
});

test("removes a product and restores it with Undo", async ({ page }) => {
  await addProduct(page, "Classic Pandesal");
  await goToOrder(page);

  await page.getByRole("button", { name: "Remove Classic Pandesal from your order" }).click();
  await expect(page.getByRole("heading", { name: "Your order is empty" })).toBeVisible();
  // The undo affordance stays available alongside the empty state.
  await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("heading", { name: "Classic Pandesal" })).toBeVisible();
});

test("restores completed demo orders after refresh until a new order starts", async ({ page }) => {
  await addProduct(page, "Classic Pandesal");
  await goToOrder(page);
  await page.getByRole("button", { name: "Complete demo order" }).click();

  await expect(page.getByRole("heading", { name: "Order complete" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Classic Pandesal" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText("₱60");
  await expect(page.getByRole("button", { name: "Start a new order" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Order complete" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Classic Pandesal" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText("₱60");
  await page.getByRole("button", { name: "Start a new order" }).click();
  await expect(page.getByRole("heading", { name: "Your order is empty" })).toBeVisible();
  const browseMenu = page.getByRole("link", { name: "Browse the menu" });
  await expect(browseMenu).toBeVisible();
  await browseMenu.click();
  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.getByText("12 treats", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Your order, 0 items" })).toBeVisible();
});

test("closes the product dialog on Escape and returns focus to its trigger", async ({ page }) => {
  await page.goto("/menu");
  const trigger = page.getByRole("button", { name: "View Classic Pandesal details" });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Classic Pandesal" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("keeps product quantity between one and twenty", async ({ page }) => {
  await page.goto("/menu");
  await page.getByRole("button", { name: "View Classic Pandesal details" }).click();
  const dialog = page.getByRole("dialog", { name: "Classic Pandesal" });
  const decrease = dialog.getByRole("button", { name: "Decrease quantity of Classic Pandesal" });
  const increase = dialog.getByRole("button", { name: "Increase quantity of Classic Pandesal" });
  await expect(decrease).toBeDisabled();
  for (let quantity = 1; quantity < 20; quantity += 1) await increase.click();
  await expect(dialog.locator("output")).toHaveText("20");
  await expect(increase).toBeDisabled();
});

test("keeps the product dialog Add control reachable without scrolling on desktop and mobile", async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/menu");
    await page.getByRole("button", { name: "View Classic Pandesal details" }).click();
    const dialog = page.getByRole("dialog", { name: "Classic Pandesal" });
    const addButton = dialog.getByRole("button", { name: /^Add to order/ });
    await expect(addButton).toBeVisible();

    const geometry = await page.evaluate(() => {
      const dialogElement = document.querySelector<HTMLElement>("[role=dialog]");
      const button = dialogElement?.querySelector<HTMLElement>("button.button-primary");
      if (!dialogElement || !button) return null;
      const box = button.getBoundingClientRect();
      const modal = dialogElement.getBoundingClientRect();
      return {
        buttonTop: box.top,
        buttonBottom: box.bottom,
        buttonLeft: box.left,
        buttonRight: box.right,
        modalTop: modal.top,
        modalBottom: modal.bottom,
        modalScrollTop: dialogElement.scrollTop,
        modalScrollHeight: dialogElement.scrollHeight,
        modalClientHeight: dialogElement.clientHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
    });
    expect(geometry, `dialog geometry at ${viewport.width}×${viewport.height}`).not.toBeNull();
    expect(geometry!.buttonTop).toBeGreaterThanOrEqual(0);
    expect(geometry!.buttonBottom).toBeLessThanOrEqual(viewport.height);
    expect(geometry!.buttonTop).toBeGreaterThanOrEqual(geometry!.modalTop);
    expect(geometry!.buttonBottom).toBeLessThanOrEqual(geometry!.modalBottom);
    expect(geometry!.buttonLeft).toBeGreaterThanOrEqual(0);
    expect(geometry!.buttonRight).toBeLessThanOrEqual(viewport.width);
    expect(geometry!.modalScrollTop).toBe(0);
    expect(geometry!.modalScrollHeight).toBeLessThanOrEqual(geometry!.modalClientHeight);
    await page.keyboard.press("Escape");
  }
});

test("filters the menu and keeps the main shopping routes accessible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Menu" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Your order,/ })).toBeVisible();
  await page.goto("/menu");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await expect(page.getByText("12 treats", { exact: true })).toBeVisible();
  const filters = page.getByRole("group", { name: "Filter products by category" });
  await expect(filters.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => {
    document.documentElement.removeAttribute("data-menu-card-animation");
    document.addEventListener("animationstart", (event) => {
      if (event.target instanceof Element && event.target.matches(".menu-product-enter")) {
        document.documentElement.dataset.menuCardAnimation = event.animationName;
      }
    }, { capture: true });
  });
  const breadFilter = filters.getByRole("button", { name: "Bread" });
  await breadFilter.click();
  await expect(breadFilter).toHaveAttribute("aria-pressed", "true");
  await expect(filters.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("heading", { name: "Classic Pandesal" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Butter Croissant" })).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-menu-card-animation", "menu-card-enter");
  await filters.getByRole("button", { name: "All" }).click();
  await expect(page.getByText("12 treats", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Butter Croissant" })).toBeVisible();
});

test("global motion preference can be set explicitly and persists across routes and refresh", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const root = page.locator("html");
  const footer = page.locator(".site-footer");
  const preference = footer.getByRole("combobox", { name: "Motion preference" });

  await expect(root).toHaveAttribute("data-motion", "full");
  await expect(preference).toHaveValue("system");
  await preference.selectOption("reduced");
  await expect(root).toHaveAttribute("data-motion", "reduced");
  await expect(preference).toHaveValue("reduced");

  await page.goto("/menu");
  await expect(root).toHaveAttribute("data-motion", "reduced");
  await expect(preference).toHaveValue("reduced");
  await page.reload();
  await expect(root).toHaveAttribute("data-motion", "reduced");
  await expect(preference).toHaveValue("reduced");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await preference.selectOption("full");
  await expect(root).toHaveAttribute("data-motion", "full");
  await expect(preference).toHaveValue("full");
  await page.reload();
  await expect(root).toHaveAttribute("data-motion", "full");
  await expect(preference).toHaveValue("full");

  await preference.selectOption("system");
  await expect(root).toHaveAttribute("data-motion", "reduced");
  await expect(preference).toHaveValue("system");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(root).toHaveAttribute("data-motion", "full");
  await page.reload();
  await expect(root).toHaveAttribute("data-motion", "full");
  await expect(preference).toHaveValue("system");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(root).toHaveAttribute("data-motion", "reduced");
});

test("turning motion on keeps an in-view featured bake visible", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  const card = page.locator(".featured-section [data-reveal-wrapper]").first();
  await expect(card).toHaveAttribute("data-reveal", "visible");
  await expect(card).toBeInViewport({ ratio: 0.1 });
  await expect(card).toHaveCSS("opacity", "1");

  await page.getByRole("button", { name: "Enable motion" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await expect(card).toHaveAttribute("data-reveal", "visible");
  await expect(card).toBeInViewport({ ratio: 0.1 });
  await expect(card).toHaveCSS("opacity", "1");
});

test("opens the mobile navigation drawer and follows its Menu link", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const drawer = page.getByRole("dialog", { name: "Where to?" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: "Menu" }).click();
  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.getByRole("heading", { name: "Good things, baked daily." })).toBeVisible();
});

test("mobile Our story navigation scrolls to the anchor and keeps keyboard focus contained", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ["/", "/menu"]) {
    for (const reducedMotion of ["reduce", "no-preference"] as const) {
      await page.emulateMedia({ reducedMotion });
      await page.goto(route);
      const trigger = page.getByRole("button", { name: "Open navigation menu" });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const drawer = page.getByRole("dialog", { name: "Where to?" });
      await expect(drawer).toBeVisible();
      await expect.poll(() => drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true);

      await page.keyboard.press("Tab");
      await expect.poll(() => drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true);
      await page.keyboard.press("Shift+Tab");
      await expect.poll(() => drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true);
      await page.keyboard.press("Escape");
      await expect(drawer).toHaveCount(0);
      await expect(trigger).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(drawer).toBeVisible();
      await drawer.getByRole("link", { name: /^Our story/ }).click();
      await expect(page).toHaveURL(/\/#story$/);
      await expect(page.locator("#story").getByRole("heading", { level: 2 }), `from ${route} with ${reducedMotion} motion`).toBeInViewport({ ratio: 0.4 });
      await expect(drawer).toHaveCount(0);
    }
  }
});

test("does not overflow at common viewport widths", async ({ page }) => {
  for (const width of [320, 375, 414, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/menu", "/order"]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content, `horizontal overflow at ${width}px on ${route}`).toBeLessThanOrEqual(dimensions.viewport);
    }
    if (width === 320) {
      await page.goto("/menu");
      await page.getByRole("button", { name: "View Classic Pandesal details" }).click();
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content, "horizontal overflow at 320px with the product dialog open").toBeLessThanOrEqual(dimensions.viewport);
    }
  }
});

test("passes an axe audit on each primary route", async ({ page }) => {
  const reported: { route: string; id: string; impact: string | null; targets: string[] }[] = [];
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/", "/menu", "/order"]) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("main")).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    for (const violation of violations) {
      reported.push({
        route,
        id: violation.id,
        impact: violation.impact ?? null,
        targets: violation.nodes.map((node) => node.target.join(" ")),
      });
    }
  }
  expect(reported).toEqual([]);
});

test("serves a complete social preview image and runs primary routes without browser errors", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });

  for (const route of ["/", "/menu", "/order"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
  }

  await page.goto("/");
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage).toBeTruthy();
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const imageResponse = await page.request.get(new URL(ogImage!, page.url()).toString());
  expect(imageResponse.status()).toBe(200);
  expect(imageResponse.headers()["content-type"]).toContain("image/png");
  const imageBytes = await imageResponse.body();
  expect(imageBytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  expect(imageBytes.readUInt32BE(16)).toBe(1200);
  expect(imageBytes.readUInt32BE(20)).toBe(630);
  expect(runtimeErrors).toEqual([]);
});

test("captures the reviewed desktop and mobile storefront screens", async ({ page }) => {
  const screenshots = resolve("docs/screenshots");
  await mkdir(screenshots, { recursive: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await settleVisibleAssets(page);
  await page.screenshot({ path: resolve(screenshots, "home-desktop.png"), fullPage: false, animations: "disabled" });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await settleVisibleAssets(page);
  await page.screenshot({ path: resolve(screenshots, "home-mobile.png"), fullPage: false, animations: "disabled" });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/menu");
  await settleVisibleAssets(page);
  await page.screenshot({ path: resolve(screenshots, "menu-desktop.png"), fullPage: false, animations: "disabled" });

  await page.getByRole("button", { name: "View Classic Pandesal details" }).click();
  await expect(page.getByRole("dialog", { name: "Classic Pandesal" })).toBeVisible();
  await settleVisibleAssets(page);
  await page.screenshot({ path: resolve(screenshots, "product-desktop.png"), fullPage: false, animations: "disabled" });
  await page.keyboard.press("Escape");

  await addProduct(page, "Classic Pandesal");
  await goToOrder(page);
  await settleVisibleAssets(page);
  await page.screenshot({ path: resolve(screenshots, "order-desktop.png"), fullPage: false, animations: "disabled" });
});

test("desktop Baking Story scrolls through four matching stages and images", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#story");
  const story = page.locator("#story");
  const stages = story.locator("[data-story-stage]");
  const images = story.locator("[data-story-image]");
  await expect(story.getByRole("heading", { level: 2 })).toBeVisible();
  await expect(stages).toHaveCount(4);
  await expect(images).toHaveCount(4);

  const currentStage = story.locator('[data-story-stage][aria-current="step"]');
  const currentImage = story.locator('[data-story-image][aria-current="step"]');
  await expect(currentStage).toHaveCount(1);
  await expect(currentImage).toHaveCount(1);
  const firstStage = await currentStage.getAttribute("data-stage");
  expect(firstStage).toBeTruthy();
  await expect(currentImage).toHaveAttribute("data-stage", firstStage!);

  const nextPosition = await story.evaluate((element) =>
    Math.round(element.getBoundingClientRect().top + window.scrollY + element.getBoundingClientRect().height * 0.62),
  );
  await page.evaluate((position) => window.scrollTo({ top: position, behavior: "instant" }), nextPosition);
  await expect.poll(async () => currentStage.getAttribute("data-stage"), { timeout: 5000 }).not.toBe(firstStage);
  await expect(currentImage).toHaveCount(1);
  await expect(currentImage).toHaveAttribute("data-stage", await currentStage.getAttribute("data-stage") ?? "");
  await expect.poll(() => currentImage.evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(1);
  await settleVisibleAssets(page);
  await page.screenshot({ path: resolve("docs/screenshots", "story-desktop.png"), fullPage: false, animations: "disabled" });
});

test("mobile and reduced-motion Baking Story expose all four static stages", async ({ page }) => {
  for (const mode of [
    { viewport: { width: 375, height: 812 }, reducedMotion: "no-preference" as const },
    { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" as const },
  ]) {
    await page.setViewportSize(mode.viewport);
    await page.emulateMedia({ reducedMotion: mode.reducedMotion });
    await page.goto("/#story");
    const story = page.locator("#story");
    const stages = story.locator("[data-story-stage]");
    const images = story.getByRole("img");
    await expect(story.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(stages).toHaveCount(4);
    await expect(images).toHaveCount(4);
    for (const stage of await stages.all()) {
      await expect(stage).toBeVisible();
      await expect(stage.getByRole("heading")).toBeVisible();
    }
    for (const image of await images.all()) {
      await expect(image).toBeVisible();
    }
    for (const image of await images.all()) await expect(image).toHaveAccessibleName(/\S+/);
    await expect(story).not.toHaveAttribute("data-enhanced", "true");
    await expect(story.locator('[data-story-stage][aria-current="step"]')).toHaveCount(0);
    await expect(story.locator('[data-story-image][aria-current="step"]')).toHaveCount(0);
    const stageStyles = await stages.evaluateAll((elements) => elements.map((element) => ({
      opacity: getComputedStyle(element).opacity,
      visibility: getComputedStyle(element).visibility,
      display: getComputedStyle(element).display,
    })));
    const imageStyles = await images.evaluateAll((elements) => elements.map((element) => ({
      opacity: getComputedStyle(element).opacity,
      visibility: getComputedStyle(element).visibility,
      display: getComputedStyle(element).display,
    })));
    const staticLayers = [...stageStyles, ...imageStyles];
    expect(staticLayers.every((layer) => layer.opacity === "1" && layer.visibility === "visible" && layer.display !== "none")).toBe(true);
    const lowerStoryPosition = await story.evaluate((element) =>
      Math.round(element.getBoundingClientRect().top + window.scrollY + element.getBoundingClientRect().height * 0.9),
    );
    await page.evaluate((position) => window.scrollTo({ top: position, behavior: "instant" }), lowerStoryPosition);
    await expect(stages).toHaveCount(4);
    await expect(story.locator('[data-story-stage][aria-current="step"]')).toHaveCount(0);
    await expect(story.locator('[data-story-image][aria-current="step"]')).toHaveCount(0);
  }
});

test("Our story navigation scrolls the Baking Story heading into view", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("link", { name: "Our story" }).click();
  await expect(page).toHaveURL(/\/#story$/);
  await expect(page.locator("#story").getByRole("heading", { level: 2 })).toBeInViewport({ ratio: 0.5 });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test("lets reduced-motion users enable the Baking Story animation and return to still images", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#story");
  const story = page.locator("#story");
  const root = page.locator("html");
  const footer = page.locator(".site-footer");
  const motionPreference = footer.getByRole("combobox", { name: "Motion preference" });
  await expect(root).toHaveAttribute("data-motion", "reduced");
  await expect(story).not.toHaveAttribute("data-enhanced", "true");
  const enableAnimation = story.getByRole("button", { name: "Enable motion" });
  await expect(enableAnimation).toHaveAttribute("aria-pressed", "false");
  await enableAnimation.click();
  await expect(root).toHaveAttribute("data-motion", "full");
  await expect(story).toHaveAttribute("data-enhanced", "true");
  const stagePosition = await story.evaluate((element) =>
    Math.round(element.getBoundingClientRect().top + window.scrollY + element.getBoundingClientRect().height * 0.62),
  );
  await page.evaluate((position) => window.scrollTo({ top: position, behavior: "instant" }), stagePosition);
  await expect(story.locator('[data-story-stage][aria-current="step"]')).toHaveCount(1);

  await motionPreference.selectOption("reduced");
  await expect(root).toHaveAttribute("data-motion", "reduced");
  await expect(motionPreference).toHaveValue("reduced");
  await expect(story).not.toHaveAttribute("data-enhanced", "true");
  await expect(story.getByRole("button", { name: "Enable motion" })).toHaveAttribute("aria-pressed", "false");
  await expect(story.locator('[data-story-stage][aria-current="step"]')).toHaveCount(0);
  const images = story.getByRole("img");
  await expect(images).toHaveCount(4);
  for (const image of await images.all()) {
    await expect(image).toBeVisible();
    await expect(image).not.toHaveAttribute("aria-hidden", "true");
    await expect(image).toHaveCSS("visibility", "visible");
    await expect(image).toHaveCSS("opacity", "1");
  }
});

test("ignores malformed saved order data without breaking the menu", async ({ page }) => {
  await page.addInitScript((key) => window.localStorage.setItem(key, "{broken json"), STORAGE_KEY);
  await page.goto("/order");
  await expect(page.getByRole("heading", { name: "Your order is empty" })).toBeVisible();
});

test("discards unknown and invalid saved rows and combines duplicate products", async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, JSON.stringify([
      { productId: "unknown-product", quantity: 3 },
      { productId: "pandesal", quantity: 0 },
      { productId: "pandesal", quantity: 2 },
      { productId: "pandesal", quantity: 5 },
    ]));
  }, STORAGE_KEY);
  await page.goto("/order");
  await expect(page.getByRole("heading", { name: "Classic Pandesal" })).toBeVisible();
  const row = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Classic Pandesal" }) });
  await expect(row.locator("output")).toHaveText("7");
  await expect(page.getByRole("article")).toHaveCount(1);
});

async function addProduct(page: import("@playwright/test").Page, name: string) {
  await page.goto("/menu");
  await page.getByRole("button", { name: `View ${name} details` }).click();
  await page.getByRole("dialog", { name }).getByRole("button", { name: /^Add to order/ }).click();
  await expect(page.getByText(`${name} added to your order.`, { exact: true })).toBeVisible();
}

async function goToOrder(page: import("@playwright/test").Page) {
  await page.getByRole("link", { name: /^Your order,/ }).click();
  await expect(page).toHaveURL(/\/order$/);
  await expect(page.getByRole("heading", { name: "Your order", exact: true })).toBeVisible();
}

async function settleVisibleAssets(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const visibleImages = [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
    });
    await Promise.all(visibleImages.map((image) => image.decode().catch(() => undefined)));
  });
}
