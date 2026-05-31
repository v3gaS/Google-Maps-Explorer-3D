import { state } from './state.js';
import { createMap3D } from './map3d.js';
import { initAtmosphere } from './atmosphere.js';
import { initUI, setLoading, showError } from './ui.js';
import { startLiveWeatherSync } from './weather.js';

window.gm_authFailure = function gmAuthFailure() {
  setLoading(false);
  showError(
    'Google Maps authentication failed. Check GOOGLE_MAPS_API_KEY and HTTP referrer restrictions for http://localhost:3000/*',
  );
};

async function loadMapsScript(config) {
  return new Promise((resolve, reject) => {
    const version = encodeURIComponent(config.mapsVersion || 'beta');
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

async function initApp() {
  try {
    setLoading(true, 'Loading Maps API...');

    const response = await fetch('/api/maps-config');
    const config = await response.json();

    if (!response.ok || !config.apiKey) {
      throw new Error(config.error || 'Failed to get Maps API configuration from the server.');
    }

    state.mapsVersion = config.mapsVersion || 'beta';
    state.mapId = config.mapId || null;

    await loadMapsScript(config);

    setLoading(true, 'Loading 3D map...');

    const container = document.getElementById('map-container');
    await createMap3D(container);

    initAtmosphere();
    initUI();
    startLiveWeatherSync(state.map);

    setLoading(false);
  } catch (error) {
    console.error('Error initializing app:', error);
    setLoading(false);
    showError(error.message || 'Failed to initialize the 3D map. Check the server console and .env file.');
  }
}

window.addEventListener('load', initApp);
