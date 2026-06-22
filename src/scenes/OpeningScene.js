/**
 * OpeningScene — particle burst + name reveal.
 *
 * Exports a render function that populates a scene-root element
 * with a Canvas 2D particle system and animated text.
 */
import gsap from 'gsap';
import i18next from '../i18n/index.js';
import { ParticleSystem2D } from '../animations/particles-2d.js';
import { revealText, fadeInText } from '../animations/text-reveal.js';
import { PARTICLE_CONFIG } from '../config/constants.js';
import { getParticleCount } from '../utils/perf-manager.js';

/**
 * Render the opening scene into `sceneRoot`.
 *
 * @param {HTMLElement} sceneRoot  full-viewport container div
 * @param {object}      data       parsed greeting data
 * @returns {{ particles: ParticleSystem2D }}
 */
export async function renderOpening(sceneRoot, data) {
  // ---- Particles -------------------------------------------------------
  const particleCount = getParticleCount(PARTICLE_CONFIG);
  const particles = new ParticleSystem2D(sceneRoot, {
    occasion: data.occasion,
    count: particleCount,
  });
  particles.start();

  // ---- Text elements ---------------------------------------------------
  const greeting = data.message.greeting || '';

  const greetingEl = document.createElement('h2');
  Object.assign(greetingEl.style, {
    fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
    fontFamily: 'var(--font-script)',
    color: 'var(--color-secondary)',
    marginBottom: '1.5rem',
    opacity: '0',
    textAlign: 'center',
  });
  greetingEl.textContent = greeting;

  const nameEl = document.createElement('h1');
  Object.assign(nameEl.style, {
    fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
    fontWeight: '700',
    color: 'var(--color-text)',
    textAlign: 'center',
    lineHeight: '1.3',
    padding: '0 1rem',
    opacity: '0',
  });
  nameEl.textContent = data.recipient.name;

  const hintEl = document.createElement('p');
  Object.assign(hintEl.style, {
    fontSize: '0.85rem',
    color: 'var(--color-text-dim)',
    marginTop: '2.5rem',
    opacity: '0',
    textAlign: 'center',
  });
  hintEl.textContent = i18next.t('nav.tapToContinue');

  sceneRoot.appendChild(greetingEl);
  sceneRoot.appendChild(nameEl);
  sceneRoot.appendChild(hintEl);

  // ---- Animation sequence ----------------------------------------------
  const tl = gsap.timeline();
  tl.add(fadeInText(greetingEl, { duration: 1.0 }), 0.3);
  tl.add(
    revealText(nameEl, {
      duration: 0.5,
      stagger: 0.06,
      from: { opacity: 0, y: 28 },
      ease: 'back.out(1.4)',
    }),
    1.0,
  );
  tl.to(hintEl, { opacity: 1, duration: 0.8 }, '+=0.4');

  // Return the particle system so the SceneManager can stop it on exit.
  return { particles };
}
