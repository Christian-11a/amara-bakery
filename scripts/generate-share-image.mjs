// Hallmark · pre-emit critique: P4 H4 E4 S5 R5 V4
// Render the share card from the same local photography and fonts as the site.
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = async (file, mime) => `data:${mime};base64,${(await readFile(resolve(root, file))).toString('base64')}`;
const [photo, lora, sans] = await Promise.all([
  data('public/images/hero-v2.png', 'image/png'),
  data('node_modules/@fontsource-variable/lora/files/lora-latin-wght-normal.woff2', 'font/woff2'),
  data('node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2', 'font/woff2'),
]);
const browser = await chromium.launch({ channel: process.env.AMARA_BROWSER || 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="en"><style>
    @font-face{font-family:Lora;src:url('${lora}')}@font-face{font-family:DM;src:url('${sans}')}
    :root{--paper:#faf4ef;--paper-fade:#faf4efee;--paper-clear:#faf4ef00;--ink:#342017;--accent:#a7472a;--display:Lora;--body:DM}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body)}
    main{position:relative;width:1200px;height:630px;overflow:hidden}
    img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:65% 55%}
    .shade{position:absolute;inset:0;background:linear-gradient(90deg,var(--paper) 0%,var(--paper) 31%,var(--paper-fade) 44%,var(--paper-clear) 78%)}
    .copy{position:relative;padding:54px 64px;width:740px}
    .brand{font:500 34px var(--display);letter-spacing:-1px}.brand span{display:block;font:12px var(--body);letter-spacing:4px;margin-top:3px}
    .label{color:var(--accent);font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:72px 0 20px}
    h1{font:500 58px/1.12 var(--display);letter-spacing:-2px;margin:0}
    .detail{font-size:19px;line-height:1.5;max-width:430px;margin-top:24px}
    .foot{position:absolute;bottom:44px;left:64px;font-size:12px;letter-spacing:1px;color:var(--accent)}
    </style><main><img src="${photo}" alt="Fresh bread and croissants"><div class="shade"></div>
    <div class="copy"><div class="brand">Amara<span>BAKERY</span></div><p class="label">Good bread brightens days</p>
    <h1>A little warmth,<br>fresh from the oven.</h1><p class="detail">A cozy bakery storefront, thoughtfully designed for the web.</p></div>
    <div class="foot">FRONTEND PORTFOLIO · FICTIONAL BAKERY</div></main>`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img').evaluate(image => image.decode());
  await page.screenshot({ path: resolve(root, 'src/app/opengraph-image.png') });
} finally {
  await browser.close();
}
