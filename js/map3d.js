import { DEFAULT_VIEW, state } from './state.js';

export async function createMap3D(container) {
  const { Map3DElement } = await google.maps.importLibrary('maps3d');

  const options = {
    mode: DEFAULT_VIEW.mode,
    center: { ...DEFAULT_VIEW.center },
    range: DEFAULT_VIEW.range,
    tilt: DEFAULT_VIEW.tilt,
    heading: DEFAULT_VIEW.heading,
    defaultUIHidden: true,
  };

  if (state.mapId) {
    options.mapId = state.mapId;
  }

  const map = new Map3DElement(options);
  map.style.width = '100%';
  map.style.height = '100%';
  map.style.display = 'block';

  container.innerHTML = '';
  container.appendChild(map);
  state.map = map;

  await waitForMapReady(map);

  return map;
}

function waitForMapReady(map) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      state.mapReady = true;
      resolve();
    }, 8000);

    const onReady = () => {
      clearTimeout(timeout);
      state.mapReady = true;
      resolve();
    };

    map.addEventListener('gmp-steadystate', onReady, { once: true });
    map.addEventListener('gmp-map-ready', onReady, { once: true });
  });
}

export function flyToLocation(lat, lng, options = {}) {
  const map = state.map;
  if (!map) return;

  const {
    altitude = 50,
    range = 600,
    tilt = 65,
    heading = map.heading ?? DEFAULT_VIEW.heading,
    durationMillis = 2000,
  } = options;

  map.flyCameraTo({
    endCamera: {
      center: { lat, lng, altitude },
      range,
      tilt,
      heading,
    },
    durationMillis,
  });
}

export function flyCameraAroundLocation(lat, lng) {
  const map = state.map;
  if (!map) return;

  map.flyCameraAround({
    camera: {
      center: { lat, lng, altitude: 50 },
      range: 700,
      tilt: 65,
      heading: map.heading ?? 0,
    },
    durationMillis: 6000,
    repeatCount: 1,
  });
}

export function resetView() {
  const map = state.map;
  if (!map) return;

  map.flyCameraTo({
    endCamera: {
      center: { ...DEFAULT_VIEW.center },
      range: DEFAULT_VIEW.range,
      tilt: DEFAULT_VIEW.tilt,
      heading: DEFAULT_VIEW.heading,
    },
    durationMillis: 2000,
  });
  map.mode = DEFAULT_VIEW.mode;
}

export function syncCameraFromMap() {
  const map = state.map;
  if (!map) return null;

  return {
    tilt: Math.round(map.tilt ?? DEFAULT_VIEW.tilt),
    heading: Math.round(map.heading ?? DEFAULT_VIEW.heading),
    range: Math.round(map.range ?? DEFAULT_VIEW.range),
    mode: map.mode ?? DEFAULT_VIEW.mode,
  };
}
