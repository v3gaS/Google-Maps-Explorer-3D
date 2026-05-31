/**
 * Smoke tests for the 3D Maps Explorer server.
 * Run: npm test
 */

const PORT = process.env.PORT || 3000;
const BASE = `http://localhost:${PORT}`;

async function assertOk(name, fn) {
  try {
    await fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    console.error(` FAIL ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log(`Smoke tests against ${BASE}\n`);

  await assertOk('GET /api/health returns ok', async () => {
    const res = await fetch(`${BASE}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(JSON.stringify(data));
  });

  await assertOk('GET /api/maps-config returns apiKey and mapsVersion', async () => {
    const res = await fetch(`${BASE}/api/maps-config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.apiKey) throw new Error('missing apiKey');
    if (data.mapsVersion !== 'beta') throw new Error(`mapsVersion=${data.mapsVersion}`);
  });

  await assertOk('GET / serves main.html', async () => {
    const res = await fetch(`${BASE}/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (!html.includes('3D Google Maps Explorer')) throw new Error('unexpected HTML');
    if (!html.includes('js/bootstrap.js')) throw new Error('missing bootstrap.js');
    if (!html.includes('gmp-map-3d') && !html.includes('map-container')) {
      throw new Error('missing map container');
    }
  });

  await assertOk('GET /js/bootstrap.js is served', async () => {
    const res = await fetch(`${BASE}/js/bootstrap.js`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await assertOk('GET /api/weather returns effect for NYC coords', async () => {
    const res = await fetch(`${BASE}/api/weather?lat=40.71&lng=-74.00`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!['clear', 'rain', 'snow'].includes(data.effect)) {
      throw new Error(`unexpected effect: ${data.effect}`);
    }
    if (typeof data.cloudCoverage !== 'number') {
      throw new Error('missing cloudCoverage');
    }
  });

  console.log('');
  if (process.exitCode) {
    console.log('Some checks failed.');
  } else {
    console.log('All checks passed.');
  }
}

main();
