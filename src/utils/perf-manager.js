/**
 * Performance-adaptive resource manager.
 *
 * Selects particle counts and other resource budgets based on
 * device type and performance tier so that the experience scales
 * gracefully from low-end mobiles to high-end desktops.
 */
import { getDeviceType, getPerformanceTier } from './device-detect.js';

/**
 * Resolve the appropriate particle count from a multi-tier config.
 *
 * Each tier entry in the config is expected to be an object like
 * `{ count: number, speed: number, size: number }` (see PARTICLE_CONFIG
 * in constants.js).
 *
 * Strategy:
 *  - Low-tier devices get the next-smaller config × 0.7
 *  - Mid/high-tier devices use the config matching their screen
 *
 * @param {{ desktop: {count:number}, tablet: {count:number}, mobile: {count:number} }} config
 * @returns {number} particle count to use on this device
 */
export function getParticleCount(config) {
  const tier = getPerformanceTier();
  const device = getDeviceType();

  // Mobile
  if (device === 'mobile') {
    if (tier === 'low') return Math.round(config.mobile.count * 0.7);
    return config.mobile.count;
  }

  // Tablet
  if (device === 'tablet') {
    if (tier === 'low') return config.mobile.count;
    return config.tablet.count;
  }

  // Desktop
  if (tier === 'low') return config.tablet.count;
  return config.desktop.count;
}

/**
 * Resolve the appropriate speed multiplier from a multi-tier config.
 *
 * @param {{ desktop: {speed:number}, tablet: {speed:number}, mobile: {speed:number} }} config
 * @returns {number}
 */
export function getSpeedMult(config) {
  const tier = getPerformanceTier();
  const device = getDeviceType();

  if (device === 'mobile') {
    if (tier === 'low') return Math.max(0.3, config.mobile.speed * 0.7);
    return config.mobile.speed;
  }
  if (device === 'tablet') {
    if (tier === 'low') return config.mobile.speed;
    return config.tablet.speed;
  }
  if (tier === 'low') return config.tablet.speed;
  return config.desktop.speed;
}

/**
 * Resolve the appropriate particle size multiplier.
 *
 * @param {{ desktop: {size:number}, tablet: {size:number}, mobile: {size:number} }} config
 * @returns {number}
 */
export function getSizeMult(config) {
  const tier = getPerformanceTier();
  const device = getDeviceType();

  if (device === 'mobile') {
    if (tier === 'low') return Math.max(0.3, config.mobile.size * 0.7);
    return config.mobile.size;
  }
  if (device === 'tablet') {
    if (tier === 'low') return config.mobile.size;
    return config.tablet.size;
  }
  if (tier === 'low') return config.tablet.size;
  return config.desktop.size;
}
