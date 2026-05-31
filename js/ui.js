import { state } from './state.js';
import { geocodeAddress } from './geocoder.js';
import { setSearchMarker } from './markers.js';
import {
  flyToLocation,
  flyCameraAroundLocation,
  resetView,
  syncCameraFromMap,
} from './map3d.js';
import {
  updateTimeOfDay,
  updateCloudCoverage,
  setWeather,
} from './atmosphere.js';
import {
  setMatchRealWeather,
  wireMatchRealWeatherToggle,
  refreshLiveWeather,
} from './weather.js';

export function initUI() {
  wireSearch();
  wireTimeSlider();
  wireCloudSlider();
  wireWeatherButtons();
  wireMatchRealWeatherToggle();
  wireCameraControls();
  wirePanelToggle();
  setWeather('clear');
}

function wireSearch() {
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('location-search');

  searchBtn.addEventListener('click', searchLocation);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchLocation();
  });
}

async function searchLocation() {
  const input = document.getElementById('location-search');
  const query = input.value.trim();
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
  slider.addEventListener('input', (e) => {
    state.timeOfDay = parseFloat(e.target.value);
    updateTimeOfDay();
  });
}

function wireCloudSlider() {
  const slider = document.getElementById('cloud-slider');
  slider.addEventListener('input', (e) => {
    if (state.matchRealWeather) {
      setMatchRealWeather(false);
    }
    state.cloudCoverage = parseInt(e.target.value, 10);
    document.getElementById('cloud-value').textContent = `${state.cloudCoverage}%`;
    updateCloudCoverage();
  });
}

function wireWeatherButtons() {
  document.getElementById('rain-btn').addEventListener('click', () => {
    setMatchRealWeather(false);
    setWeather('rain');
  });
  document.getElementById('snow-btn').addEventListener('click', () => {
    setMatchRealWeather(false);
    setWeather('snow');
  });
  document.getElementById('clear-btn').addEventListener('click', () => {
    setMatchRealWeather(false);
    setWeather('clear');
  });
}

function wireCameraControls() {
  const mapMode = document.getElementById('map-mode');
  const tiltSlider = document.getElementById('tilt-slider');
  const headingSlider = document.getElementById('heading-slider');
  const rangeSlider = document.getElementById('range-slider');

  mapMode.addEventListener('change', (e) => {
    if (state.map) state.map.mode = e.target.value;
  });

  tiltSlider.addEventListener('input', (e) => {
    const tilt = parseInt(e.target.value, 10);
    document.getElementById('tilt-value').textContent = `${tilt}°`;
    if (state.map) state.map.tilt = tilt;
  });

  headingSlider.addEventListener('input', (e) => {
    const heading = parseInt(e.target.value, 10);
    document.getElementById('heading-value').textContent = `${heading}°`;
    if (state.map) state.map.heading = heading;
  });

  rangeSlider.addEventListener('input', (e) => {
    const range = parseInt(e.target.value, 10);
    document.getElementById('range-value').textContent = `${range}m`;
    if (state.map) state.map.range = range;
  });

  document.getElementById('orbit-btn').addEventListener('click', () => {
    const map = state.map;
    if (!map?.center) {
      showError('No location to orbit. Search for a place first.');
      return;
    }
    const { lat, lng } = map.center;
    flyCameraAroundLocation(lat, lng);
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
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

  tiltSlider.value = camera.tilt;
  headingSlider.value = camera.heading;
  rangeSlider.value = camera.range;
  mapMode.value = camera.mode;

  document.getElementById('tilt-value').textContent = `${camera.tilt}°`;
  document.getElementById('heading-value').textContent = `${camera.heading}°`;
  document.getElementById('range-value').textContent = `${camera.range}m`;
}

function wirePanelToggle() {
  const toggle = document.getElementById('panel-toggle');
  const panel = document.getElementById('controls');
  toggle.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    toggle.textContent = panel.classList.contains('collapsed') ? 'Show Controls' : 'Hide Controls';
  });
}

export function setLoading(visible, message) {
  const loading = document.getElementById('loading');
  loading.style.display = visible ? 'block' : 'none';
  if (message) {
    loading.querySelector('p').textContent = message;
  }
}

export function showError(message) {
  const banner = document.getElementById('error-banner');
  banner.textContent = message;
  banner.hidden = false;
}

export function hideError() {
  const banner = document.getElementById('error-banner');
  banner.hidden = true;
  banner.textContent = '';
}

function setSearchDisabled(disabled) {
  document.getElementById('search-btn').disabled = disabled;
  document.getElementById('location-search').disabled = disabled;
}
