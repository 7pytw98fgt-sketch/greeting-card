/**
 * NavigationHint — bottom-bar hint that fades after a few seconds.
 *
 * Exports showHint() and hideHint() so the SceneManager can call them
 * on every scene transition without knowing about internals.
 */
import gsap from 'gsap';
import i18next from '../i18n/index.js';
import { getDeviceType, isTouchDevice } from '../utils/device-detect.js';

let bar = null;
let breathTween = null;
let fadeTimer = null;

function ensureBar() {
  if (bar) return bar;

  bar = document.createElement('div');
  bar.className = 'nav-hint-bar';
  Object.assign(bar.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    zIndex: '100',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.8rem 1rem',
    background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-serif)',
    letterSpacing: '0.06em',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'opacity 0.4s ease',
  });

  document.body.appendChild(bar);
  return bar;
}

function getHintText() {
  const isMobile = getDeviceType() === 'mobile' || isTouchDevice();
  return isMobile
    ? i18next.t('nav.swipeHint')
    : i18next.t('nav.tapToContinue');
}

/**
 * Show the navigation hint. Auto-fades after 3 s.
 * Safe to call repeatedly — resets the timer each time.
 */
export function showHint() {
  const el = ensureBar();
  el.textContent = getHintText();

  // Clear previous auto-fade timer
  if (fadeTimer) clearTimeout(fadeTimer);

  // Kill existing breath tween
  if (breathTween) breathTween.kill();

  // Breathe animation (opacity cycles 0.4 ↔ 0.8)
  breathTween = gsap.fromTo(
    el,
    { opacity: 0.4 },
    {
      opacity: 0.8,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    },
  );

  // Auto-fade after 3 s
  fadeTimer = setTimeout(() => hideHint(), 3000);
}

/**
 * Fade out the navigation hint bar.
 */
export function hideHint() {
  if (breathTween) {
    breathTween.kill();
    breathTween = null;
  }
  if (fadeTimer) {
    clearTimeout(fadeTimer);
    fadeTimer = null;
  }
  if (bar) {
    gsap.to(bar, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    });
  }
}

/**
 * Update text after a language change.
 */
export function refreshHintText() {
  if (bar && bar.style.opacity !== '0') {
    bar.textContent = getHintText();
  }
}
