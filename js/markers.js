import { state } from './state.js';

export async function setSearchMarker(lat, lng, label) {
  clearSearchMarker();

  const { Marker3DElement } = await google.maps.importLibrary('maps3d');

  const marker = new Marker3DElement({
    position: { lat, lng, altitude: 80 },
    altitudeMode: 'RELATIVE_TO_GROUND',
    extruded: true,
    label: label || 'Search result',
  });

  state.map.appendChild(marker);
  state.searchMarker = marker;
}

export function clearSearchMarker() {
  if (state.searchMarker) {
    state.searchMarker.remove();
    state.searchMarker = null;
  }
}
