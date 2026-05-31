/**
 * @file constants.js
 * @description Shared application constants for map defaults, atmosphere, and timing.
 */

/** Default camera when the app loads or the view is reset. */
export const DEFAULT_VIEW = Object.freeze({
  center: { lat: 40.7128, lng: -74.0060, altitude: 0 },
  range: 800,
  tilt: 65,
  heading: 0,
  mode: 'HYBRID',
});

/** Atmosphere effect identifiers. */
export const WEATHER_EFFECT = Object.freeze({
  CLEAR: 'clear',
  RAIN: 'rain',
  SNOW: 'snow',
});

export const MAPS_JS_VERSION = 'beta';
export const MAP_READY_TIMEOUT_MS = 8000;
export const LIVE_WEATHER_DEBOUNCE_MS = 1500;

export const ATMOSPHERE = Object.freeze({
  RAIN_PARTICLE_COUNT: 800,
  SNOW_PARTICLE_COUNT: 400,
  CLOUDS_PER_COVERAGE_STEP: 5,
  DEFAULT_CLOUD_COVERAGE: 30,
  DEFAULT_TIME_OF_DAY: 12,
  DAYTIME_HOUR: 12,
  NIGHTTIME_HOUR: 22,
});

export const CAMERA = Object.freeze({
  FLY_TO_DURATION_MS: 2000,
  ORBIT_DURATION_MS: 6000,
  SEARCH_ALTITUDE: 50,
  SEARCH_RANGE: 600,
  SEARCH_TILT: 65,
  ORBIT_RANGE: 700,
  MARKER_ALTITUDE: 80,
});
