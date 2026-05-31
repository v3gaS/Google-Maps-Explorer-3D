/**
 * @file capture-demo.mjs
 * @description Records a promotional demo for README GIFs.
 *
 * Phase 1: Load the app fully (no recording) so tiles and API are warm.
 * Phase 2: Single recording — hold on NYC, pull back, rotate heading.
 *
 * Prerequisites: server running at DEMO_URL with a valid GOOGLE_MAPS_API_KEY.
 * Usage: npm run capture-demo
 */

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const OUT_DIR = path.resolve('docs');
const BASE_URL = process.env.DEMO_URL || 'http://localhost:3000';
const VIEWPORT = { width: 1280, height: 720 };

const TILES_SETTLE_MS = 4000;
const HOLD_BEFORE_MOVE_MS = 2500;
const CAMERA_ANIMATION_MS = 5500;
const HOLD_AFTER_MOVE_MS = 1500;

await mkdir(OUT_DIR, { recursive: true });

/**
 * Waits until the 3D map is mounted and the loading overlay is gone.
 * @param {import('playwright').Page} page
 */
async function waitForAppReady(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('gmp-map-3d', { timeout: 60_000 });
  await page.waitForFunction(() => {
    const loading = document.getElementById('loading');
    return !loading || loading.style.display === 'none';
  }, { timeout: 60_000 });
  await page.waitForTimeout(TILES_SETTLE_MS);
}

/**
 * Pulls the camera back and rotates heading via Map3DElement.flyCameraTo.
 * @param {import('playwright').Page} page
 */
async function pullBackAndRotateHeading(page) {
  await page.evaluate(() => {
    const map = document.querySelector('gmp-map-3d');
    if (!map?.flyCameraTo) {
      throw new Error('Map3DElement or flyCameraTo not available.');
    }

    const center = map.center ?? { lat: 40.7128, lng: -74.0060, altitude: 0 };
    const range = map.range ?? 800;
    const tilt = map.tilt ?? 65;
    const heading = map.heading ?? 0;

    map.flyCameraTo({
      endCamera: {
        center,
        range: Math.min(range * 1.45, 3500),
        tilt,
        heading: heading + 140,
      },
      durationMillis: 5000,
    });
  });

  await page.waitForTimeout(CAMERA_ANIMATION_MS);
}

const browser = await chromium.launch({ headless: true });

console.log('[capture-demo] Phase 1: Loading app (warm-up, no recording)...');
const warmupContext = await browser.newContext({ viewport: VIEWPORT });
const warmupPage = await warmupContext.newPage();
await waitForAppReady(warmupPage);
await warmupContext.close();

console.log('[capture-demo] Phase 2: Recording single demo clip...');
const recordContext = await browser.newContext({
  viewport: VIEWPORT,
  recordVideo: { dir: OUT_DIR, size: VIEWPORT },
});
const page = await recordContext.newPage();

try {
  await waitForAppReady(page);
  await page.waitForTimeout(HOLD_BEFORE_MOVE_MS);
  await pullBackAndRotateHeading(page);
  await page.waitForTimeout(HOLD_AFTER_MOVE_MS);
} catch (error) {
  console.warn('[capture-demo] Capture issue:', error.message);
  await page.waitForTimeout(2000);
}

const video = page.video();
await page.close();

const webmPath = path.join(OUT_DIR, 'demo.webm');
if (video) {
  await video.saveAs(webmPath);
  console.log(`Saved ${webmPath}`);
}

await recordContext.close();
await browser.close();

console.log('[capture-demo] Converting to GIF...');
const gifStartSec = process.env.GIF_START_SEC || '15';
const gifFps = process.env.GIF_FPS || '8';
const gifWidth = process.env.GIF_WIDTH || '640';

try {
  execSync(
    `ffmpeg -y -ss ${gifStartSec} -i "${webmPath}" -vf "fps=${gifFps},scale=${gifWidth}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=80[p];[s1][p]paletteuse" -loop 0 "${path.join(OUT_DIR, 'demo.gif')}"`,
    { stdio: 'inherit' },
  );
  console.log(`Saved ${path.join(OUT_DIR, 'demo.gif')} (from ${gifStartSec}s to end)`);
} catch {
  console.warn('[capture-demo] ffmpeg conversion failed — demo.webm is still available.');
}

// Remove intermediate webm after successful gif (keep if conversion failed)
try {
  execSync(`test -f "${path.join(OUT_DIR, 'demo.gif')}" && rm -f "${webmPath}"`);
} catch {
  // keep webm
}

console.log('[capture-demo] Done.');
