/**
 * @file ui.js
 * @description Control panel wiring, loading states, and user feedback.
 */

import { WEATHER_EFFECT } from './constants.js';
import { state } from './state.js';
import { geocodeAddress } from './geocoder.js';
import { setSearchMarker } from './markers.js';
import {
  flyToLocation,
  flyCameraAroundLocation,
  resetView,
  syncCameraFromMap,
} from './map3d.js';
import { updateTimeOfDay } from './atmosphere.js';
import {
  applyManualCloudCoverage,
  applyManualWeather,
  refreshLiveWeather,
  wireMatchRealWeatherToggle,
} from './weather.js';
import { formatWithUnit } from './utils/format.js';

/**
 * Initializes all UI event listeners. Call once after the map is ready.
 */
export function initUI() {
  wireSearch();
  wireTimeSlider();
  wireCloudSlider();
  wireWeatherButtons();
  wireMatchRealWeatherToggle();
  wireCameraControls();
  wirePanelToggle();
  applyManualWeather(WEATHER_EFFECT.CLEAR);
}

function wireSearch() {
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('location-search');

  searchBtn?.addEventListener('click', searchLocation);
  searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      searchLocation();
    }
  });
}

async function searchLocation() {
  const input = document.getElementById('location-search');
  const query = input?.value.trim();

  if (!query) {
    showError('Enter a location to search.');
    return;
  }

  setLoading(true, 'Searching location...');
  hideError();
  setSearchDisabled(true);

  try {
    const result = await geocodeAddress(query);
    flyToLocation(result.lat, result.lng);
    await setSearchMarker(result.lat, result.lng, result.formattedAddress);
    syncSlidersFromMap();

    if (state.matchRealWeather) {
      await refreshLiveWeather();
    }
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
    setSearchDisabled(false);
  }
}

function wireTimeSlider() {
  const slider = document.getElementById('time-slider');
  slider?.addEventListener('input', (event) => {
    state.timeOfDay = Number.parseFloat(event.target.value);
    updateTimeOfDay();
  });
}

function wireCloudSlider() {
  const slider = document.getElementById('cloud-slider');
  slider?.addEventListener('input', (event) => {
    applyManualCloudCoverage(Number.parseInt(event.target.value, 10));
  });
}

function wireWeatherButtons() {
  document.getElementById('rain-btn')?.addEventListener('click', () => {
    applyManualWeather(WEATHER_EFFECT.RAIN);
  });
  document.getElementById('snow-btn')?.addEventListener('click', () => {
    applyManualWeather(WEATHER_EFFECT.SNOW);
  });
  document.getElementById('clear-btn')?.addEventListener('click', () => {
    applyManualWeather(WEATHER_EFFECT.CLEAR);
  });
}

function wireCameraControls() {
  const mapMode = document.getElementById('map-mode');
  const tiltSlider = document.getElementById('tilt-slider');
  const headingSlider = document.getElementById('heading-slider');
  const rangeSlider = document.getElementById('range-slider');

  mapMode?.addEventListener('change', (event) => {
    if (state.map) state.map.mode = event.target.value;
  });

  tiltSlider?.addEventListener('input', (event) => {
    const tilt = Number.parseInt(event.target.value, 10);
    document.getElementById('tilt-value').textContent = formatWithUnit(tilt, '°');
    if (state.map) state.map.tilt = tilt;
  });

  headingSlider?.addEventListener('input', (event) => {
    const heading = Number.parseInt(event.target.value, 10);
    document.getElementById('heading-value').textContent = formatWithUnit(heading, '°');
    if (state.map) state.map.heading = heading;
  });

  rangeSlider?.addEventListener('input', (event) => {
    const range = Number.parseInt(event.target.value, 10);
    document.getElementById('range-value').textContent = formatWithUnit(range, 'm');
    if (state.map) state.map.range = range;
  });

  document.getElementById('orbit-btn')?.addEventListener('click', () => {
    const map = state.map;
    if (!map?.center) {
      showError('No location to orbit. Search for a place first.');
      return;
    }

    const { lat, lng } = map.center;
    flyCameraAroundLocation(lat, lng);
  });

  document.getElementById('reset-btn')?.addEventListener('click', () => {
    resetView();
    syncSlidersFromMap();
    hideError();
  });

  if (state.map) {
    state.map.addEventListener('gmp-steadystate', syncSlidersFromMap);
    state.map.addEventListener('gmp-centerchange', syncSlidersFromMap);
  }

  syncSlidersFromMap();
}

function syncSlidersFromMap() {
  const camera = syncCameraFromMap();
  if (!camera) return;

  const tiltSlider = document.getElementById('tilt-slider');
  const headingSlider = document.getElementById('heading-slider');
  const rangeSlider = document.getElementById('range-slider');
  const mapMode = document.getElementById('map-mode');

  if (tiltSlider) tiltSlider.value = String(camera.tilt);
  if (headingSlider) headingSlider.value = String(camera.heading);
  if (rangeSlider) rangeSlider.value = String(camera.range);
  if (mapMode) mapMode.value = camera.mode;

  document.getElementById('tilt-value').textContent = formatWithUnit(camera.tilt, '°');
  document.getElementById('heading-value').textContent = formatWithUnit(camera.heading, '°');
  document.getElementById('range-value').textContent = formatWithUnit(camera.range, 'm');
}

function wirePanelToggle() {
  const toggle = document.getElementById('panel-toggle');
  const panel = document.getElementById('controls');

  toggle?.addEventListener('click', () => {
    panel?.classList.toggle('collapsed');
    toggle.textContent = panel?.classList.contains('collapsed')
      ? 'Show Controls'
      : 'Hide Controls';
  });
}

/**
 * Shows or hides the global loading overlay.
 * @param {boolean} visible
 * @param {string} [message]
 */
export function setLoading(visible, message) {
  const loading = document.getElementById('loading');
  if (!loading) return;

  loading.style.display = visible ? 'block' : 'none';
  if (message) {
    loading.querySelector('p').textContent = message;
  }
}

/**
 * Displays an inline error banner in the controls panel.
 * @param {string} message
 */
export function showError(message) {
  const banner = document.getElementById('error-banner');
  if (!banner) return;

  banner.textContent = message;
  banner.hidden = false;
}

/** Hides the inline error banner. */
export function hideError() {
  const banner = document.getElementById('error-banner');
  if (!banner) return;

  banner.hidden = true;
  banner.textContent = '';
}

/**
 * @param {boolean} disabled
 */
function setSearchDisabled(disabled) {
  document.getElementById('search-btn')?.toggleAttribute('disabled', disabled);
  document.getElementById('location-search')?.toggleAttribute('disabled', disabled);
}
