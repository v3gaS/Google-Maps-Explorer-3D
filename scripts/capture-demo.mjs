import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const OUT_DIR = path.resolve('docs');
const BASE_URL = process.env.DEMO_URL || 'http://localhost:3000';

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();

try {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const search = page.locator('#location-search');
  if (await search.isVisible()) {
    await search.fill('Statue of Liberty');
    await page.locator('#search-btn').click();
    await page.waitForTimeout(4000);
  }

  const matchWeather = page.locator('#match-real-weather');
  if (await matchWeather.isVisible()) {
    await matchWeather.check();
    await page.waitForTimeout(2000);
  }

  await page.waitForTimeout(1500);
} catch (error) {
  console.warn('Capture partial — map may still be loading:', error.message);
  await page.waitForTimeout(3000);
}

const video = page.video();
await page.close();

if (video) {
  const webmPath = path.join(OUT_DIR, 'demo.webm');
  await video.saveAs(webmPath);
  console.log('Saved', webmPath);
}

await context.close();
await browser.close();
