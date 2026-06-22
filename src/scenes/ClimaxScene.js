/**
 * ClimaxScene — 高潮特效场景
 *
 * The visual "peak" of the card: 3D firework bursts, floating
 * particles matching the occasion, and a core blessing phrase
 * that slams in with elastic easing + golden glow.
 */
import gsap from 'gsap';
import { getTheme, PARTICLE_CONFIG } from '../config/constants.js';
import { ParticleSystem3D } from '../animations/particles-3d.js';
import { getParticleCount } from '../utils/perf-manager.js';

const OCCASION_FLOATERS = {
  birthday:   'confetti',
  wedding:    'petals',
  graduation: 'stars',
  festival:   'confetti',
  promotion:  'stars',
};
const DEFAULT_FLOATER = 'confetti';

/**
 * @param {HTMLElement} sceneRoot
 * @param {object}      data
 * @returns {{ destroy: () => void }}
 */
export async function renderClimax(sceneRoot, data) {
  const theme = getTheme(data.occasion);

  // ---- Background --------------------------------------------------------
  sceneRoot.style.background = `
    radial-gradient(ellipse at center, ${withAlpha(theme.primary, 0.18)} 0%, ${theme.bg} 70%)
  `;

  // ---- 3D Particle system -----------------------------------------------
  const particleCount = getParticleCount(PARTICLE_CONFIG);
  const particles = new ParticleSystem3D(sceneRoot, {
    occasion: data.occasion,
    particleCount,
  });
  particles.start();

  // ---- Firework burst sequence ------------------------------------------
  const burstCount = 3 + Math.floor(Math.random() * 3);
  const burstTimers = [];
  for (let i = 0; i < burstCount; i++) {
    burstTimers.push(setTimeout(() => particles.createFirework(), i * 250));
  }

  // After 0.8s, start floating particles
  const floaterTimer = setTimeout(() => {
    const floaterType = OCCASION_FLOATERS[data.occasion] || DEFAULT_FLOATER;
    particles.createFloatingParticles(floaterType);
  }, 800);

  // ---- Core blessing text -----------------------------------------------
  const blessingText = data.message.closing || data.message.greeting || '🎉';

  const textEl = document.createElement('h2');
  textEl.textContent = blessingText;
  Object.assign(textEl.style, {
    fontSize: 'clamp(2rem, 6vw, 4rem)',
    fontWeight: '700',
    color: 'var(--color-text)',
    textAlign: 'center',
    textShadow: `
      0 0 20px ${theme.primary},
      0 0 40px ${theme.primary},
      0 0 80px ${theme.secondary},
      0 0 120px ${theme.primary},
      0 2px 4px rgba(0,0,0,0.5)
    `,
    zIndex: '4',
    padding: '2rem',
    fontFamily: 'var(--font-serif)',
  });
  sceneRoot.appendChild(textEl);

  // Elastic slam-in
  gsap.fromTo(
    textEl,
    { scale: 0.3, opacity: 0, rotation: -5 },
    {
      scale: 1,
      opacity: 1,
      rotation: 0,
      duration: 1.2,
      ease: 'elastic.out(1, 0.5)',
      delay: 0.3,
    },
  );

  // Subtle pulse
  const pulseTween = gsap.to(textEl, {
    scale: 1.05,
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    delay: 1.8,
  });

  // Screen shake
  const shakeTween = gsap.fromTo(
    sceneRoot,
    { x: 0, y: 0 },
    {
      x: 4,
      y: -3,
      duration: 0.08,
      repeat: 7,
      yoyo: true,
      ease: 'none',
      delay: 0.8,
    },
  );

  // ---- Auto-fade-out after 5.5s ------------------------------------------
  const fadeOutTimer = setTimeout(() => {
    gsap.to(textEl, {
      scale: 0.8,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.in',
    }).then(() => {
      particles.fadeOutFloaters(1.2);
    });
  }, 5500);

  // ---- Return ------------------------------------------------------------
  return {
    destroy() {
      burstTimers.forEach(clearTimeout);
      clearTimeout(floaterTimer);
      clearTimeout(fadeOutTimer);
      pulseTween.kill();
      shakeTween.kill();
      gsap.killTweensOf(textEl);
      gsap.killTweensOf(sceneRoot);
      if (textEl.parentNode) textEl.parentNode.removeChild(textEl);
      particles.stop();
    },
  };
}

// ---- Helpers -------------------------------------------------------------

function withAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
