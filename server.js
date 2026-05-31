/**
 * @file server.js
 * @description Express entry point: API routes and static file serving.
 */

const express = require('express');
const path = require('path');
const { PLACEHOLDER_KEYS, PORT, MAPS_JS_VERSION } = require('./server/config');
const weatherService = require('./server/weatherService');

const app = express();
const staticRoot = path.join(__dirname);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/maps-config', (_req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey || PLACEHOLDER_KEYS.has(apiKey.toLowerCase())) {
    res.status(503).json({
      error:
        'Missing GOOGLE_MAPS_API_KEY. Copy .env.example to .env, add your Maps JavaScript API key, and restart the server.',
    });
    return;
  }

  const mapId = process.env.GOOGLE_MAP_ID?.trim();
  res.json({
    apiKey,
    mapsVersion: MAPS_JS_VERSION,
    ...(mapId ? { mapId } : {}),
  });
});

app.get('/api/weather', async (req, res) => {
  const lat = weatherService.parseCoordinate(req.query.lat, -90, 90);
  const lng = weatherService.parseCoordinate(req.query.lng, -180, 180);

  if (lat === null || lng === null) {
    res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
    return;
  }

  try {
    const data = await weatherService.fetchCurrentWeather(lat, lng);
    res.json(data);
  } catch (error) {
    console.error('[weather]', error.message);
    res.status(502).json({
      error: 'Unable to fetch live weather. Try again in a moment.',
    });
  }
});

app.use(
  express.static(staticRoot, {
    index: 'main.html',
  }),
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.warn(
      'Warning: GOOGLE_MAPS_API_KEY is not set. Create a .env file (see .env.example).',
    );
  }
});
