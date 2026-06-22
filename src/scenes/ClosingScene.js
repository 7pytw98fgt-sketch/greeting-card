/**
 * ClosingScene — sender signature with gentle particle ambiance.
 *
 * Exports a render function that populates a scene-root element
 * with the sender's name, relationship, and closing message.
 */
import gsap from 'gsap';
import { ParticleSystem2D } from '../animations/particles-2d.js';
import { revealText, fadeInText } from '../animations/text-reveal.js';
import { PARTICLE_CONFIG } from '../config/constants.js';
import { getParticleCount } from '../utils/perf-manager.js';

/**
 * Render the closing scene into `sceneRoot`.
 *
 * @param {HTMLElement} sceneRoot  full-viewport container div
 * @param {object}      data       parsed greeting data
 * @returns {{ particles: ParticleSystem2D }}
 */
export async function renderClosing(sceneRoot, data) {
  // ---- Background particles --------------------------------------------
  const particleCount = getParticleCount(PARTICLE_CONFIG);
  const particles = new ParticleSystem2D(sceneRoot, {
    occasion: data.occasion,
    count: particleCount,
  });
  particles.start();

  // ---- Wrapper ---------------------------------------------------------
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    textAlign: 'center',
    zIndex: '1',
    padding: '2rem',
  });

  // ---- Closing message -------------------------------------------------
  const closingText = data.message.closing || '❤️';
  const closingEl = document.createElement('p');
  Object.assign(closingEl.style, {
    fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
    lineHeight: '2',
    color: 'var(--color-text)',
    marginBottom: '2.5rem',
    opacity: '0',
    fontStyle: 'italic',
  });
  closingEl.textContent = closingText;

  // ---- Sender name -----------------------------------------------------
  const senderText = data.sender?.name ? `— ${data.sender.name}` : '';
  const senderEl = document.createElement('h3');
  Object.assign(senderEl.style, {
    fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
    fontWeight: '700',
    color: 'var(--color-primary)',
    opacity: '0',
    fontFamily: 'var(--font-script)',
  });
  senderEl.textContent = senderText;

  // ---- Relationship label ----------------------------------------------
  let relationEl = null;
  if (data.sender?.relation) {
    relationEl = document.createElement('p');
    Object.assign(relationEl.style, {
      fontSize: '0.95rem',
      color: 'var(--color-text-dim)',
      marginTop: '0.5rem',
      opacity: '0',
    });
    relationEl.textContent = data.sender.relation;
  }

  wrapper.appendChild(closingEl);
  wrapper.appendChild(senderEl);
  if (relationEl) wrapper.appendChild(relationEl);
  sceneRoot.appendChild(wrapper);

  // ---- Animation sequence ----------------------------------------------
  const tl = gsap.timeline();
  tl.add(fadeInText(closingEl, { duration: 1.2 }), 0.2);
  tl.add(
    revealText(senderEl, {
      duration: 0.5,
      stagger: 0.07,
      from: { opacity: 0, y: 20 },
      ease: 'power2.out',
    }),
    1.0,
  );
  if (relationEl) {
    tl.to(relationEl, { opacity: 1, duration: 0.6 }, '+=0.3');
  }

  return { particles };
}
