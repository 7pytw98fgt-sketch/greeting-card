/**
 * Global constants for the greeting card animation studio.
 *
 * Centralises scene timing, device-specific particle configs,
 * responsive breakpoints, and occasion colour themes so every
 * module draws from the same source of truth.
 */

// ---- Scene durations (milliseconds) ----
export const SCENE_DURATIONS = {
  opening: 6000,
  flipCard: 8000,
  narrative: 15000,
  climax: 8000,
  closing: 5000,
};

// ---- Cross-scene transition duration (milliseconds) ----
export const TRANSITION_DURATION = 800;

// ---- Particle system defaults per device tier ----
export const PARTICLE_CONFIG = {
  desktop: { count: 800, speed: 1.0, size: 1.0 },
  tablet:  { count: 500, speed: 0.8, size: 0.8 },
  mobile:  { count: 200, speed: 0.6, size: 0.6 },
};

// ---- Responsive breakpoints (pixels) ----
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1200,
};

// ---- Colour themes keyed by occasion ----
export const OCCASION_THEMES = {
  birthday:   { primary: '#FF6B6B', secondary: '#FFE66D', bg: '#1a1a2e' },
  festival:   { primary: '#E63946', secondary: '#F1FAEE', bg: '#1d3557' },
  graduation: { primary: '#2A9D8F', secondary: '#E9C46A', bg: '#264653' },
  wedding:    { primary: '#FFB5A7', secondary: '#FCD5CE', bg: '#1a1a2e' },
  promotion:  { primary: '#FFD700', secondary: '#C0C0C0', bg: '#1a1a2e' },
  default:    { primary: '#FF6B6B', secondary: '#FFE66D', bg: '#1a1a2e' },
};

// ---- Helpers ----

/**
 * Resolve the particle config for the current viewport width.
 * @param {number} [width] - viewport width (defaults to window.innerWidth)
 * @returns {{ count: number, speed: number, size: number }}
 */
export function getParticleConfig(width = window.innerWidth) {
  if (width < BREAKPOINTS.mobile) return PARTICLE_CONFIG.mobile;
  if (width < BREAKPOINTS.tablet) return PARTICLE_CONFIG.tablet;
  return PARTICLE_CONFIG.desktop;
}

/**
 * Resolve the colour theme for a given occasion, falling back to `default`.
 * @param {string} [occasion] - e.g. 'birthday', 'graduation'
 * @returns {{ primary: string, secondary: string, bg: string }}
 */
export function getTheme(occasion) {
  return OCCASION_THEMES[occasion] || OCCASION_THEMES.default;
}
