/**
 * @file weatherService.js
 * @description Open-Meteo integration: WMO code mapping, caching, and forecast fetch.
 */

const { WEATHER_CACHE_TTL_MS, OPEN_METEO_FORECAST_URL } = require('./config');

/** @type {Map<string, { timestamp: number, data: object }>} */
const cache = new Map();

/** WMO weather interpretation codes (WW). @see https://open-meteo.com/en/docs */
const WMO_SUMMARIES = Object.freeze({
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
});

/**
 * Maps a WMO weather code to an atmosphere effect used by the client.
 * @param {number} code
 * @returns {'clear' | 'rain' | 'snow'}
 */
function mapWeatherCodeToEffect(code) {
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return 'snow';
  }
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99)
  ) {
    return 'rain';
  }
  return 'clear';
}

/**
 * @param {number} code
 * @returns {string}
 */
function getWeatherSummary(code) {
  return WMO_SUMMARIES[code] || 'Unknown conditions';
}

/**
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 * @returns {number | null}
 */
function parseCoordinate(value, min, max) {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    return null;
  }
  return num;
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {string}
 */
function buildCacheKey(lat, lng) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<object>}
 */
async function fetchCurrentWeather(lat, lng) {
  const key = buildCacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  const url = new URL(OPEN_METEO_FORECAST_URL);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('current', 'temperature_2m,weather_code,cloud_cover,is_day');
  url.searchParams.set('timezone', 'auto');

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

  cache.set(key, { timestamp: Date.now(), data });
  return data;
}

module.exports = {
  parseCoordinate,
  fetchCurrentWeather,
};
