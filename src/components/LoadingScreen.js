/**
 * LoadingScreen — pulsating loading state while data is being decoded.
 *
 * Replaces the static #loading-screen in index.html with a managed
 * component that can fade out under GSAP control.
 */
import gsap from 'gsap';
import i18next from '../i18n/index.js';

let root = null;

function ensureDOM() {
  if (root) return root;

  // Use the existing #loading-screen if it's still in the DOM
  const existing = document.getElementById('loading-screen');
  if (existing) {
    root = existing;
    // Clear the static inner text so we can rebuild with the enriched layout
    root.innerHTML = '';
  } else {
    root = document.createElement('div');
    root.id = 'loading-screen';
    Object.assign(root.style, {
      position: 'fixed',
      inset: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      color: '#fff',
      zIndex: '9999',
      fontFamily: 'var(--font-serif)',
    });
    document.body.appendChild(root);
  }

  // Envelope icon with CSS pulse
  const icon = document.createElement('div');
  icon.className = 'loading-envelope';
  icon.textContent = '💌';
  Object.assign(icon.style, {
    fontSize: '3rem',
    marginBottom: '1.5rem',
    animation: 'loadingPulse 1.8s ease-in-out infinite',
  });

  // Text with ellipsis animation
  const text = document.createElement('p');
  text.className = 'loading-text';
  text.textContent = i18next.t('loading.text');
  Object.assign(text.style, {
    fontSize: '1rem',
    letterSpacing: '0.08em',
    opacity: '0.7',
    margin: '0',
  });

  // Floating particles (CSS-only)
  const particles = document.createElement('div');
  Object.assign(particles.style, {
    position: 'absolute',
    inset: '0',
    overflow: 'hidden',
    pointerEvents: 'none',
  });

  for (let i = 0; i < 12; i++) {
    const dot = document.createElement('div');
    const size = 2 + Math.random() * 4;
    Object.assign(dot.style, {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.15)',
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `loadingFloat ${3 + Math.random() * 4}s linear infinite`,
      animationDelay: `${Math.random() * 3}s`,
    });
    particles.appendChild(dot);
  }

  root.appendChild(icon);
  root.appendChild(text);
  root.appendChild(particles);

  // Inject keyframes once
  if (!document.getElementById('loading-anim-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-anim-styles';
    style.textContent = `
      @keyframes loadingPulse {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50%      { transform: scale(1.15); opacity: 1; }
      }
      @keyframes loadingFloat {
        0%   { transform: translateY(0) translateX(0); opacity: 0; }
        20%  { opacity: 0.15; }
        80%  { opacity: 0.15; }
        100% { transform: translateY(-60px) translateX(10px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  return root;
}

/**
 * Show the loading screen (idempotent — safely call multiple times).
 */
export function showLoading() {
  ensureDOM();
  if (root) {
    root.style.display = 'flex';
    gsap.set(root, { opacity: 1 });
  }
}

/**
 * Fade out the loading screen, then remove it from the DOM.
 * @returns {Promise<void>}
 */
export function hideLoading() {
  if (!root) {
    // Try to pick up the static #loading-screen
    root = document.getElementById('loading-screen');
  }
  if (!root) return Promise.resolve();

  return gsap.to(root, {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.inOut',
    onComplete: () => {
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
      root = null;
    },
  }).then();
}
