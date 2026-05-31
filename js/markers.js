/**
 * @file markers.js
 * @description Native 3D markers for search results.
 */

import { CAMERA } from './constants.js';
import { state } from './state.js';

/**
 * Places a Marker3DElement at the given coordinates, replacing any prior search marker.
 * @param {number} lat
 * @param {number} lng
 * @param {string} [label]
 * @returns {Promise<void>}
 */
export async function setSearchMarker(lat, lng, label) {
  if (!state.map) {
    throw new Error('Cannot add marker: map is not initialized.');
  }

  clearSearchMarker();

  const { Marker3DElement } = await google.maps.importLibrary('maps3d');

  const marker = new Marker3DElement({
    position: { lat, lng, altitude: CAMERA.MARKER_ALTITUDE },
    altitudeMode: 'RELATIVE_TO_GROUND',
    extruded: true,
    label: label || 'Search result',
  });

  state.map.appendChild(marker);
  state.searchMarker = marker;
}

/** Removes the current search marker from the map, if one exists. */
export function clearSearchMarker() {
  if (state.searchMarker) {
    state.searchMarker.remove();
    state.searchMarker = null;
  }
}
