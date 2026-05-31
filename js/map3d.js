/**
 * @file map3d.js
 * @description Map3DElement lifecycle and camera animation helpers.
 */

import {
  CAMERA,
  DEFAULT_VIEW,
  MAP_READY_TIMEOUT_MS,
} from './constants.js';
import { state } from './state.js';

/**
 * Creates and mounts a Map3DElement inside the given container.
 * @param {HTMLElement} container
 * @returns {Promise<google.maps.maps3d.Map3DElement>}
 */
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

  container.replaceChildren(map);
  state.map = map;

  await waitForMapReady(map);
  return map;
}

/**
 * Resolves when the map reports ready, or after a timeout fallback.
 * @param {google.maps.maps3d.Map3DElement} map
 * @returns {Promise<void>}
 */
function waitForMapReady(map) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      state.mapReady = true;
      resolve();
    }, MAP_READY_TIMEOUT_MS);

    const onReady = () => {
      clearTimeout(timeout);
      state.mapReady = true;
      resolve();
    };

    map.addEventListener('gmp-steadystate', onReady, { once: true });
    map.addEventListener('gmp-map-ready', onReady, { once: true });
  });
}

/**
 * Animates the camera to a geographic location.
 * @param {number} lat
 * @param {number} lng
 * @param {object} [options]
 */
export function flyToLocation(lat, lng, options = {}) {
  const map = state.map;
  if (!map) return;

  const {
    altitude = CAMERA.SEARCH_ALTITUDE,
    range = CAMERA.SEARCH_RANGE,
    tilt = CAMERA.SEARCH_TILT,
    heading = map.heading ?? DEFAULT_VIEW.heading,
    durationMillis = CAMERA.FLY_TO_DURATION_MS,
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

/**
 * Orbits the camera around a location once.
 * @param {number} lat
 * @param {number} lng
 */
export function flyCameraAroundLocation(lat, lng) {
  const map = state.map;
  if (!map) return;

  map.flyCameraAround({
    camera: {
      center: { lat, lng, altitude: CAMERA.SEARCH_ALTITUDE },
      range: CAMERA.ORBIT_RANGE,
      tilt: CAMERA.SEARCH_TILT,
      heading: map.heading ?? DEFAULT_VIEW.heading,
    },
    durationMillis: CAMERA.ORBIT_DURATION_MS,
    repeatCount: 1,
  });
}

/** Returns the camera to the default New York view. */
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
    durationMillis: CAMERA.FLY_TO_DURATION_MS,
  });
  map.mode = DEFAULT_VIEW.mode;
}

/**
 * Reads current camera properties for UI sync.
 * @returns {{ tilt: number, heading: number, range: number, mode: string } | null}
 */
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
