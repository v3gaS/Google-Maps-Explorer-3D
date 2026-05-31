/**
 * @file weather.js
 * @description Live weather sync via the server Open-Meteo proxy.
 */

import { ATMOSPHERE, LIVE_WEATHER_DEBOUNCE_MS } from './constants.js';
import { state } from './state.js';
import { applyCloudCoverage, setWeather, updateTimeOfDay } from './atmosphere.js';

/** @type {ReturnType<typeof setTimeout> | null} */
let debounceTimer = null;

/** @type {boolean} */
let listenersAttached = false;

/**
 * @typedef {object} WeatherPayload
 * @property {'clear' | 'rain' | 'snow'} effect
 * @property {number} cloudCoverage
 * @property {number | null} temperature
 * @property {boolean} isDay
 * @property {number} weatherCode
 * @property {string} summary
 */

/**
 * Fetches normalized weather data for a coordinate pair.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<WeatherPayload>}
 */
export async function fetchWeatherForLocation(lat, lng) {
  const response = await fetch(
    `/api/weather?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch live weather.');
  }

  return data;
}

/**
 * Applies a live weather payload to atmosphere state and UI.
 * @param {WeatherPayload} data
 */
export function applyLiveWeather(data) {
  applyCloudCoverage(data.cloudCoverage);
  setWeather(data.effect, { fromLive: true });

  if (typeof data.isDay === 'boolean') {
    state.timeOfDay = data.isDay ? ATMOSPHERE.DAYTIME_HOUR : ATMOSPHERE.NIGHTTIME_HOUR;
    const timeSlider = document.getElementById('time-slider');
    if (timeSlider) {
      timeSlider.value = String(state.timeOfDay);
    }
    updateTimeOfDay();
  }

  const temp =
    data.temperature === null || data.temperature === undefined
      ? ''
      : `${Math.round(data.temperature)}°C`;
  const summaryParts = [data.summary, temp, `${data.cloudCoverage}% clouds`].filter(Boolean);
  state.liveWeatherSummary = summaryParts.join(' · ');
  updateLiveWeatherStatus(state.liveWeatherSummary);
}

/**
 * Updates the live weather status line beneath the toggle.
 * @param {string | null} message
 * @param {boolean} [isError]
 */
export function updateLiveWeatherStatus(message, isError = false) {
  const status = document.getElementById('live-weather-status');
  if (!status) return;

  if (!message) {
    status.hidden = true;
    status.textContent = '';
    status.classList.remove('error');
    return;
  }

  status.hidden = false;
  status.textContent = message;
  status.classList.toggle('error', isError);
}

/**
 * Enables or disables manual weather and cloud controls.
 * @param {boolean} enabled
 */
export function setManualControlsEnabled(enabled) {
  ['rain-btn', 'snow-btn', 'clear-btn'].forEach((id) => {
    document.getElementById(id)?.toggleAttribute('disabled', !enabled);
  });

  const cloudSlider = document.getElementById('cloud-slider');
  if (cloudSlider) {
    cloudSlider.disabled = !enabled;
  }
}

/** Fetches and applies weather for the current map center when live mode is active. */
export async function refreshLiveWeather() {
  const map = state.map;
  if (!map?.center || !state.matchRealWeather) return;

  const { lat, lng } = map.center;

  try {
    updateLiveWeatherStatus('Fetching live weather...');
    const data = await fetchWeatherForLocation(lat, lng);
    applyLiveWeather(data);
  } catch (error) {
    updateLiveWeatherStatus(error.message, true);
  }
}

function scheduleLiveWeatherRefresh() {
  if (!state.matchRealWeather) return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(refreshLiveWeather, LIVE_WEATHER_DEBOUNCE_MS);
}

/**
 * Turns live weather sync on or off and syncs the checkbox state.
 * @param {boolean} enabled
 */
export function setMatchRealWeather(enabled) {
  state.matchRealWeather = enabled;

  const toggle = document.getElementById('match-real-weather');
  if (toggle) toggle.checked = enabled;

  setManualControlsEnabled(!enabled);

  if (enabled) {
    refreshLiveWeather();
  } else {
    updateLiveWeatherStatus(null);
  }
}

/**
 * Disables live weather and applies a manual effect.
 * @param {'clear' | 'rain' | 'snow'} effect
 */
export function applyManualWeather(effect) {
  setMatchRealWeather(false);
  setWeather(effect);
}

/**
 * Disables live weather and sets manual cloud coverage.
 * @param {number} value
 */
export function applyManualCloudCoverage(value) {
  setMatchRealWeather(false);
  applyCloudCoverage(value);
}

/**
 * Listens for map movement and refreshes weather when live mode is enabled.
 * @param {google.maps.maps3d.Map3DElement} map
 */
export function startLiveWeatherSync(map) {
  if (!map || listenersAttached) return;

  listenersAttached = true;
  map.addEventListener('gmp-centerchange', scheduleLiveWeatherRefresh);
  map.addEventListener('gmp-steadystate', scheduleLiveWeatherRefresh);
}

/** Wires the "Match real weather" checkbox. */
export function wireMatchRealWeatherToggle() {
  const toggle = document.getElementById('match-real-weather');
  if (!toggle) return;

  toggle.addEventListener('change', (event) => {
    setMatchRealWeather(event.target.checked);
  });
}
