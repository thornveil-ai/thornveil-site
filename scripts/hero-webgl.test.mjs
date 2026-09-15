// Run with a locally available Playwright installation:
// PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/hero-webgl.test.mjs
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.HERO_TEST_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

for (const mode of ['supported', 'disabled', 'renderer-failure', 'context-loss']) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
    args: mode === 'disabled' ? ['--disable-webgl'] :
      ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (mode === 'renderer-failure') {
      await page.addInitScript(() => {
        WebGL2RenderingContext.prototype.getShaderPrecisionFormat = () => {
          throw new Error('Injected renderer initialization failure');
        };
      });
    }
    await page.goto(baseURL);
    const canvas = page.locator('canvas[data-hero-renderer]');
    const initialState = ['supported', 'context-loss'].includes(mode) ? 'ready' : 'fallback';
    await page.waitForFunction(state =>
      document.querySelector('canvas[data-hero-renderer]')?.dataset.heroRenderer === state,
    initialState);
    if (mode === 'context-loss') {
      await canvas.evaluate(element => {
        element.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();
      });
      await page.waitForFunction(() =>
        document.querySelector('canvas[data-hero-renderer]')?.dataset.heroRenderer === 'fallback');
    }
    if (mode !== 'supported') {
      assert.equal(await canvas.evaluate(el => getComputedStyle(el).visibility), 'hidden');
      assert.equal(await page.locator('svg #tv-glow').count(), 1);
    } else {
      assert.equal(await canvas.evaluate(el => getComputedStyle(el).visibility), 'visible');
      assert.ok(await canvas.evaluate(el => el.width > 0 && el.height > 0));
      await page.setViewportSize({ width: 820, height: 740 });
      await page.waitForTimeout(250);
      assert.ok(await canvas.evaluate(el => Math.abs(el.width / devicePixelRatio - 820) < 2));
    }
    assert.ok(await page.locator('h1').isVisible());
    assert.ok(await page.locator('a[href="/mycelium"]').first().isVisible());
    await page.waitForTimeout(750);
    assert.deepEqual(errors, [], `${mode}: no uncaught errors or rejections`);
    console.log(`PASS ${mode}: hero text, links, and graphics state`);
  } finally {
    await browser.close();
  }
}