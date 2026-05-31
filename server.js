require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const PLACEHOLDER_KEYS = new Set([
  'your_browser_key_here',
  'your_api_key_here',
  'changeme',
]);

const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;
const weatherCache = new Map();

const WMO_SUMMARIES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

function mapWeatherCodeToEffect(code) {
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99)
  ) {
    return 'rain';
  }
  return 'clear';
}

function getWeatherSummary(code) {
  return WMO_SUMMARIES[code] || 'Unknown conditions';
}

function parseCoordinate(value, name, min, max) {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    return null;
  }
  return num;
}

function cacheKey(lat, lng) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/maps-config', (req, res) => {
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
    mapsVersion: 'beta',
    ...(mapId ? { mapId } : {}),
  });
});

app.get('/api/weather', async (req, res) => {
  const lat = parseCoordinate(req.query.lat, 'lat', -90, 90);
  const lng = parseCoordinate(req.query.lng, 'lng', -180, 180);

  if (lat === null || lng === null) {
    res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
    return;
  }

  const key = cacheKey(lat, lng);
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    res.json(cached.data);
    return;
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set(
    'current',
    'temperature_2m,weather_code,cloud_cover,is_day',
  );
  url.searchParams.set('timezone', 'auto');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo responded with HTTP ${response.status}`);
    }

    const payload = await response.json();
    const current = payload.current;
    if (!current) {
      throw new Error('Open-Meteo returned no current weather data.');
    }

    const weatherCode = current.weather_code ?? 0;
    const data = {
      effect: mapWeatherCodeToEffect(weatherCode),
      cloudCoverage: Math.round(current.cloud_cover ?? 0),
      temperature: current.temperature_2m ?? null,
      isDay: Boolean(current.is_day),
      weatherCode,
      summary: getWeatherSummary(weatherCode),
    };

    weatherCache.set(key, { timestamp: Date.now(), data });
    res.json(data);
  } catch (error) {
    console.error('Weather fetch failed:', error.message);
    res.status(502).json({
      error: 'Unable to fetch live weather. Try again in a moment.',
    });
  }
});

app.use(
  express.static(path.join(__dirname), {
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
