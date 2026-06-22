/**
 * Device detection utilities.
 *
 * Provides viewport-based device classification, touch capability
 * detection, and performance tier estimation. Results are cached
 * on window.__deviceInfo so repeated calls return instantly.
 */
import { BREAKPOINTS } from '../config/constants.js';

const CACHE_KEY = '__deviceInfo';

function cached() {
  if (window[CACHE_KEY]) return window[CACHE_KEY];

  const info = {
    deviceType: computeDeviceType(),
    isTouch: computeTouch(),
    performanceTier: computePerformanceTier(),
  };

  window[CACHE_KEY] = info;
  return info;
}

// ---- Internal computation helpers ------------------------------------------

/**
 * Classify the device based on the current viewport width.
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
function computeDeviceType() {
  const w = window.innerWidth;
  if (w < BREAKPOINTS.mobile) return 'mobile';
  if (w < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

/**
 * Detect whether the device supports touch.
 * @returns {boolean}
 */
function computeTouch() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Estimate a performance tier from hardware hints.
 * @returns {'low' | 'medium' | 'high'}
 */
function computePerformanceTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4; // GB, may be undefined

  if (cores < 4 || memory < 4) return 'low';
  if (cores <= 8) return 'medium';
  return 'high';
}

// ---- Public API ------------------------------------------------------------

/**
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
export function getDeviceType() {
  return cached().deviceType;
}

/**
 * @returns {boolean}
 */
export function isTouchDevice() {
  return cached().isTouch;
}

/**
 * @returns {'low' | 'medium' | 'high'}
 */
export function getPerformanceTier() {
  return cached().performanceTier;
}
