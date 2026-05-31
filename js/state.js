/**
 * @file state.js
 * @description Shared mutable application state.
 */

import { ATMOSPHERE, WEATHER_EFFECT } from './constants.js';

export { DEFAULT_VIEW } from './constants.js';

/**
 * Application runtime state. Mutated by map, atmosphere, weather, and UI modules.
 */
export const state = {
  map: null,
  mapsVersion: 'beta',
  mapId: null,
  timeOfDay: ATMOSPHERE.DEFAULT_TIME_OF_DAY,
  cloudCoverage: ATMOSPHERE.DEFAULT_CLOUD_COVERAGE,
  weatherEffect: WEATHER_EFFECT.CLEAR,
  searchMarker: null,
  mapReady: false,
  matchRealWeather: false,
  liveWeatherSummary: null,
};
