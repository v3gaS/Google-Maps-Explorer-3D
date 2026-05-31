/**
 * @file bootstrap.js
 * @description Application entry point: load configuration, Maps API, and subsystems.
 */

import { MAPS_JS_VERSION } from './constants.js';
import { state } from './state.js';
import { createMap3D } from './map3d.js';
import { initAtmosphere } from './atmosphere.js';
import { initUI, setLoading, showError } from './ui.js';
import { startLiveWeatherSync } from './weather.js';

/** Google Maps auth failure callback — registered before the API script loads. */
window.gm_authFailure = function gmAuthFailure() {
  setLoading(false);
  showError(
    'Google Maps authentication failed. Check GOOGLE_MAPS_API_KEY and HTTP referrer restrictions for http://localhost:3000/*',
  );
};

/**
 * Loads the Maps JavaScript API bootstrap script.
 * @param {{ apiKey: string, mapsVersion?: string }} config
 * @returns {Promise<void>}
 */
function loadMapsScript(config) {
  return new Promise((resolve, reject) => {
    const version = encodeURIComponent(config.mapsVersion || MAPS_JS_VERSION);
    const key = encodeURIComponent(config.apiKey);
    const script = document.createElement('script');

    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=${version}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps JavaScript API.'));
    document.body.appendChild(script);
  });
}

/** Bootstraps the full client application. */
async function initApp() {
  try {
    setLoading(true, 'Loading Maps API...');

    const response = await fetch('/api/maps-config');
    const config = await response.json();

    if (!response.ok || !config.apiKey) {
      throw new Error(config.error || 'Failed to get Maps API configuration from the server.');
    }

    state.mapsVersion = config.mapsVersion || MAPS_JS_VERSION;
    state.mapId = config.mapId || null;

    await loadMapsScript(config);

    setLoading(true, 'Loading 3D map...');

    const container = document.getElementById('map-container');
    if (!container) {
      throw new Error('Map container element #map-container was not found.');
    }

    await createMap3D(container);

    initAtmosphere();
    initUI();
    startLiveWeatherSync(state.map);

    setLoading(false);
  } catch (error) {
    console.error('[bootstrap]', error);
    setLoading(false);
    showError(
      error.message || 'Failed to initialize the 3D map. Check the server console and .env file.',
    );
  }
}

window.addEventListener('load', initApp);
