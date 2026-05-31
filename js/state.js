export const DEFAULT_VIEW = {
  center: { lat: 40.7128, lng: -74.0060, altitude: 0 },
  range: 800,
  tilt: 65,
  heading: 0,
  mode: 'HYBRID',
};

export const state = {
  map: null,
  mapsVersion: 'beta',
  mapId: null,
  timeOfDay: 12,
  cloudCoverage: 30,
  weatherEffect: 'clear',
  searchMarker: null,
  mapReady: false,
  matchRealWeather: false,
  liveWeatherSummary: null,
};
