import { chromium } from "@playwright/test";

const baseURL = process.env.AMARA_TEST_URL ?? "http://127.0.0.1:3102";
const browser = await chromium.launch({ channel: "msedge" });

try {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const resourceRequests = new Map();
  const measuredResourceTypes = new Set(["Image", "Script", "Font", "Stylesheet"]);

  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 200 * 1024,
    uploadThroughput: 93.75 * 1024,
    connectionType: "cellular4g",
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  cdp.on("Network.requestWillBeSent", ({ requestId, request, type }) => {
    if (measuredResourceTypes.has(type)) resourceRequests.set(requestId, { type, url: request.url });
  });
  cdp.on("Network.responseReceived", ({ requestId, response }) => {
    const resource = resourceRequests.get(requestId);
    if (resource) Object.assign(resource, { status: response.status, mimeType: response.mimeType });
  });
  cdp.on("Network.loadingFinished", ({ requestId, encodedDataLength }) => {
    const resource = resourceRequests.get(requestId);
    if (resource) resource.encodedBytes = encodedDataLength;
  });
  cdp.on("Network.loadingFailed", ({ requestId, errorText }) => {
    const resource = resourceRequests.get(requestId);
    if (resource) resource.error = errorText;
  });

  await page.addInitScript(() => {
    const audit = { fcpMs: null, lcpMs: null, lcpElement: null, cls: 0, shifts: [] };
    Object.defineProperty(window, "__amaraPerformanceAudit", { value: audit, configurable: false });

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") audit.fcpMs = Math.round(entry.startTime);
        }
      }).observe({ type: "paint", buffered: true });
    } catch {}

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          audit.lcpMs = Math.round(entry.startTime);
          const element = entry.element;
          audit.lcpElement = element instanceof Element
            ? { tag: element.tagName.toLowerCase(), id: element.id, className: String(element.className) }
            : null;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          audit.cls += entry.value;
          audit.shifts.push({
            startMs: Math.round(entry.startTime),
            value: Number(entry.value.toFixed(5)),
            sources: (entry.sources ?? []).slice(0, 3).map((source) => {
              const node = source.node;
              return node instanceof Element
                ? `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}${typeof node.className === "string" && node.className ? `.${node.className.trim().replaceAll(" ", ".")}` : ""}`
                : "unknown";
            }),
          });
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {}
  });

  const navigation = await page.goto(baseURL, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);

  const firstViewport = await page.evaluate(() => ({
    metrics: window.__amaraPerformanceAudit,
    visibleImages: [...document.images]
      .filter((image) => {
        const rect = image.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0;
      })
      .map((image) => ({
        src: image.currentSrc,
        loaded: image.complete && image.naturalWidth > 0,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      })),
  }));

  const resources = [...resourceRequests.values()];
  const resourceTotals = Object.fromEntries([...measuredResourceTypes].map((type) => {
    const selected = resources.filter((resource) => resource.type === type);
    return [type, {
      requestCount: selected.length,
      totalEncodedBytes: selected.reduce((total, resource) => total + (resource.encodedBytes ?? 0), 0),
    }];
  }));
  const result = {
    target: baseURL,
    route: "/",
    device: { viewport: "375x812 CSS px", deviceScaleFactor: 2, mobileEmulation: true, physicalDevice: false },
    conditions: { latencyMs: 150, downloadBytesPerSecond: 204800, uploadBytesPerSecond: 96000, cpuThrottleRate: 4, cacheDisabled: true },
    navigation: { status: navigation?.status() ?? null },
    firstViewport,
    networkResources: { totals: resourceTotals, responses: resources },
  };
  console.log(JSON.stringify(result, null, 2));
  await context.close();
} finally {
  await browser.close();
}
