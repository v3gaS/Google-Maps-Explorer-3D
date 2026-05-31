/**
 * @file geocoder.js
 * @description Address search via the Google Maps Geocoding API.
 */

/** @typedef {{ lat: number, lng: number, formattedAddress: string }} GeocodeResult */

const GEOCODER_STATUS_MESSAGES = Object.freeze({
  ZERO_RESULTS: 'Location not found. Try a different search.',
  OVER_QUERY_LIMIT: 'Geocoding quota exceeded. Try again later.',
  REQUEST_DENIED: 'Geocoding request denied. Check that Geocoding API is enabled.',
  INVALID_REQUEST: 'Invalid search query.',
});

/**
 * Geocodes a free-text address or place name.
 * @param {string} address
 * @returns {Promise<GeocodeResult>}
 */
export function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
          formattedAddress: results[0].formatted_address,
        });
        return;
      }

      reject(new Error(GEOCODER_STATUS_MESSAGES[status] || `Geocoding failed: ${status}`));
    });
  });
}
