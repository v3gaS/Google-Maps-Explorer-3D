/**
 * @file config.js
 * @description Central configuration for the Express server.
 */

require('dotenv').config();

const PLACEHOLDER_KEYS = new Set([
  'your_browser_key_here',
  'your_api_key_here',
  'changeme',
]);

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const MAPS_JS_VERSION = 'beta';

module.exports = {
  PLACEHOLDER_KEYS,
  PORT,
  MAPS_JS_VERSION,
  WEATHER_CACHE_TTL_MS: 5 * 60 * 1000,
  OPEN_METEO_FORECAST_URL: 'https://api.open-meteo.com/v1/forecast',
};
