/**
 * @file capture-demo.mjs
 * @description Records a short browser demo of the app for README promotional GIFs.
 *
 * Prerequisites: server running at DEMO_URL with a valid GOOGLE_MAPS_API_KEY.
 * Usage: npm run capture-demo
 * Output: docs/demo.webm (convert to GIF with ffmpeg for GitHub README)
 */

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const OUT_DIR = path.resolve('docs');
const BASE_URL = process.env.DEMO_URL || 'http://localhost:3000';
const MAP_LOAD_WAIT_MS = 5000;
const SEARCH_WAIT_MS = 4000;
const WEATHER_WAIT_MS = 2000;
const FINAL_WAIT_MS = 1500;

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();

try {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(MAP_LOAD_WAIT_MS);

  const search = page.locator('#location-search');
  if (await search.isVisible()) {
    await search.fill('Statue of Liberty');
    await page.locator('#search-btn').click();
    await page.waitForTimeout(SEARCH_WAIT_MS);
  }

  const matchWeather = page.locator('#match-real-weather');
  if (await matchWeather.isVisible()) {
    await matchWeather.check();
    await page.waitForTimeout(WEATHER_WAIT_MS);
  }

  await page.waitForTimeout(FINAL_WAIT_MS);
} catch (error) {
  console.warn('[capture-demo] Partial capture — map may still be loading:', error.message);
  await page.waitForTimeout(3000);
}

const video = page.video();
await page.close();

if (video) {
  const webmPath = path.join(OUT_DIR, 'demo.webm');
  await video.saveAs(webmPath);
  console.log(`Saved ${webmPath}`);
}

await context.close();
await browser.close();
