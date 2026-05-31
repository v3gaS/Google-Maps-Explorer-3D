import { state } from './state.js';
import { applyCloudCoverage, setWeather, updateTimeOfDay } from './atmosphere.js';

const DEBOUNCE_MS = 1500;

let debounceTimer = null;
let listenersAttached = false;

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

export function applyLiveWeather(data) {
  applyCloudCoverage(data.cloudCoverage);
  setWeather(data.effect, { fromLive: true });

  if (typeof data.isDay === 'boolean') {
    state.timeOfDay = data.isDay ? 12 : 22;
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

export function setManualControlsEnabled(enabled) {
  ['rain-btn', 'snow-btn', 'clear-btn'].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.disabled = !enabled;
  });

  const cloudSlider = document.getElementById('cloud-slider');
  if (cloudSlider) cloudSlider.disabled = !enabled;
}

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
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    refreshLiveWeather();
  }, DEBOUNCE_MS);
}

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

export function startLiveWeatherSync(map) {
  if (!map || listenersAttached) return;
  listenersAttached = true;

  map.addEventListener('gmp-centerchange', scheduleLiveWeatherRefresh);
  map.addEventListener('gmp-steadystate', scheduleLiveWeatherRefresh);
}

export function wireMatchRealWeatherToggle() {
  const toggle = document.getElementById('match-real-weather');
  if (!toggle) return;

  toggle.addEventListener('change', (e) => {
    setMatchRealWeather(e.target.checked);
  });
}
