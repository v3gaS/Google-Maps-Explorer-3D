/**
 * @file format.js
 * @description Small formatting helpers for UI display.
 */

/**
 * Formats a fractional hour (0–24) as H:MM for the time-of-day control.
 * @param {number} hour
 * @returns {string}
 */
export function formatTimeOfDay(hour) {
  const hours = Math.floor(hour);
  const minutes = Math.floor((hour - hours) * 60);
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Clamps a number to an inclusive range.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Rounds a number for display with a suffix.
 * @param {number} value
 * @param {string} suffix
 * @returns {string}
 */
export function formatWithUnit(value, suffix) {
  return `${Math.round(value)}${suffix}`;
}
