# Quality report

## Mobile performance captures

Production was measured at `http://127.0.0.1:3102` on 2026-10-04 using Playwright’s installed Microsoft Edge channel. Each capture used a 375 × 812 CSS-pixel mobile-emulation context at DPR 2, with the browser cache disabled, 4× CPU throttling, 150 ms network latency, 200 KiB/s download throughput, and 96 KiB/s upload throughput. The audit waits for page load, network idle, and local fonts before recording paint, layout-shift, and encoded network-byte metrics. Encoded resource bytes come from Chrome DevTools Protocol `Network.loadingFinished`; they reflect actual browser responses, not source asset sizes.

| Metric | Initial build | Refined production captures |
| --- | ---: | ---: |
| First Contentful Paint | 1,088 ms | 996 ms; 1,356 ms |
| Largest Contentful Paint | 1,452 ms | 1,480 ms; 1,604 ms |
| LCP element | Hero image | Hero image in both captures |
| Cumulative Layout Shift | 0.04077 | 0 in both captures |
| Layout-shift source | Hero figure and lede at 1,933 ms | None observed |

The first-view network totals were:

| Resource type | Initial build | Final capture |
| --- | ---: | ---: |
| Optimized WebP images | 237,546 B (4 requests) | 237,546 B (4 requests) |
| JavaScript | 227,509 B (11 requests) | 185,138 B (12 requests) |
| WOFF2 fonts | 93,848 B (3 requests) | 75,320 B (2 requests) |
| CSS | 12,294 B (2 requests) | 10,566 B (2 requests) |

The hero image (375 × 250 natural pixels in this emulation) accounted for 44,311 bytes in the final capture. The other image responses were featured pandesal (71,272 bytes), croissant (63,203 bytes), and chocolate cake (58,760 bytes). Only the hero image intersected the initial viewport when inspected; the three featured images were also fetched during the first-view capture. Paint timing varied between the two refined captures and did not show a consistent improvement over baseline. Encoded response totals fell by 42,371 JavaScript bytes, 18,528 font bytes, and 1,728 CSS bytes. Both refined captures recorded no layout shift.

These figures describe browser-delivered, encoded responses on an emulated device and constrained network. They do not describe source asset file sizes or a physical phone.

## Browser and device coverage

The full end-to-end suite passed 22/22 checks in installed Microsoft Edge. After the final native-anchor focus adjustment, the targeted desktop and mobile Our Story navigation regressions passed 2/2. A focused storefront order journey also passed in installed Chrome 154.0.8037.93 and Edge 154.0.4258.53; both use the Chromium engine. Firefox and WebKit browser binaries were not cached in the workspace, so they were not downloaded. Mobile journeys use a 375 × 812 viewport with touch and mobile emulation; no physical phone was available for testing. The suite includes axe accessibility audits on Home, Menu, and Order.

## Reproducible audits

After starting a production server, run:

```powershell
$env:AMARA_TEST_URL = 'http://127.0.0.1:3102'
node scripts/performance-audit.mjs
node scripts/browser-smoke.mjs
```

The performance audit prints its conditions, paint and CLS observations, visible images, and actual encoded response sizes for images, scripts, fonts, and stylesheets. The browser smoke script runs the storefront order journey in the installed Chrome and Edge channels.
