/**
 * ProgressBar — thin bottom-of-screen progress indicator.
 *
 * Fixed at the very bottom, shows how far through the scene sequence
 * the viewer is. Dots mark each scene boundary.
 */
import { SCENE_DURATIONS } from '../config/constants.js';

const SCENE_COUNT = Object.keys(SCENE_DURATIONS).length;

let track = null;
let fill = null;
let dots = null;

function ensureDOM() {
  if (track) return;

  // Track
  track = document.createElement('div');
  track.className = 'progress-bar-track';
  Object.assign(track.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    height: '3px',
    zIndex: '101',
    background: 'rgba(255,255,255,0.1)',
    pointerEvents: 'none',
  });

  // Fill
  fill = document.createElement('div');
  fill.className = 'progress-bar-fill';
  Object.assign(fill.style, {
    height: '100%',
    width: '0%',
    background: 'var(--color-primary)',
    transition: 'width 0.5s ease',
  });
  track.appendChild(fill);

  // Scene marker dots
  dots = document.createElement('div');
  Object.assign(dots.style, {
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
  });
  track.appendChild(dots);

  for (let i = 0; i < SCENE_COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'progress-bar-dot';
    const leftPct = (i / (SCENE_COUNT - 1)) * 100;
    Object.assign(dot.style, {
      position: 'absolute',
      left: `${leftPct}%`,
      transform: 'translateX(-50%)',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.25)',
      transition: 'background 0.3s ease',
    });
    dots.appendChild(dot);
  }

  document.body.appendChild(track);
}

/**
 * Update the progress bar.
 * @param {number} current - current scene index (0-based)
 * @param {number} total   - total number of scenes
 */
export function updateProgress(current, total) {
  ensureDOM();

  const pct = total > 0 ? Math.min((current / (total - 1)) * 100, 100) : 0;
  fill.style.width = `${pct}%`;

  // Highlight dots up to current
  if (dots) {
    const dotEls = dots.querySelectorAll('.progress-bar-dot');
    dotEls.forEach((dot, i) => {
      dot.style.background =
        i <= current
          ? 'var(--color-primary)'
          : 'rgba(255,255,255,0.25)';
    });
  }
}
