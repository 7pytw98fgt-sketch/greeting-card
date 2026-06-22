/**
 * Text reveal animations built on GSAP.
 *
 * Each function returns a gsap.core.Timeline so callers can
 * chain, pause, or reverse the animation as needed.
 */
import gsap from 'gsap';

/**
 * Reveal text word-by-word (or character-by-character).
 *
 * Splits the element's textContent into <span> wrappers so GSAP
 * can stagger each piece independently.
 *
 * @param {HTMLElement} element    DOM node whose text will be revealed
 * @param {object}      [options]
 * @param {number}      [options.duration=0.6]  per-character tween duration (s)
 * @param {number}      [options.stagger=0.04]  stagger delay between chars (s)
 * @param {object}      [options.from]          gsap "from" vars (opacity, y, …)
 * @param {string}      [options.ease='power2.out']
 * @param {'char'|'word'} [options.mode='char'] split granularity
 * @returns {gsap.core.Timeline}
 */
export function revealText(element, options = {}) {
  const {
    duration = 0.6,
    stagger = 0.04,
    from = { opacity: 0, y: 12 },
    ease = 'power2.out',
    mode = 'char',
  } = options;

  const text = element.textContent || '';
  const pieces =
    mode === 'word'
      ? text.split(/(\s+)/)
      : text.split('');

  element.innerHTML = pieces
    .map((p) => (p === ' ' ? ' ' : `<span style="display:inline-block">${p}</span>`))
    .join('');

  const targets = element.querySelectorAll('span');
  if (targets.length === 0) return gsap.timeline();

  const tl = gsap.timeline();
  tl.from(targets, { ...from, duration, stagger, ease });
  return tl;
}

/**
 * Simple fade-in for an element.
 *
 * @param {HTMLElement} element
 * @param {object}      [options]
 * @param {number}      [options.duration=0.8]
 * @param {number}      [options.delay=0]
 * @param {string}      [options.ease='power2.out']
 * @returns {gsap.core.Timeline}
 */
export function fadeInText(element, options = {}) {
  const { duration = 0.8, delay = 0, ease = 'power2.out' } = options;

  const tl = gsap.timeline();
  tl.fromTo(
    element,
    { opacity: 0 },
    { opacity: 1, duration, delay, ease },
  );
  return tl;
}

/**
 * Typewriter effect — characters appear one by one.
 *
 * Uses a hidden pseudo-cursor `|` that blinks after typing finishes.
 *
 * @param {HTMLElement} element
 * @param {object}      [options]
 * @param {number}      [options.duration=0.05]  per-char time (s)
 * @param {number}      [options.delay=0]
 * @param {boolean}     [options.showCursor=true]
 * @returns {gsap.core.Timeline}
 */
export function typewriterText(element, options = {}) {
  const {
    duration = 0.05,
    delay = 0,
    showCursor = true,
  } = options;

  const text = element.textContent || '';
  element.textContent = '';

  const tl = gsap.timeline({ delay });

  if (showCursor) {
    element.style.position = 'relative';
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    tl.call(() => {
      element.textContent += char;
    }, null, i * duration);
  }

  if (showCursor) {
    // Append a blinking cursor
    tl.call(() => {
      const cursor = document.createElement('span');
      cursor.textContent = '|';
      cursor.style.animation = 'blink 0.8s step-end infinite';
      element.appendChild(cursor);

      // Inject blink keyframes once
      if (!document.getElementById('_typewriterBlink')) {
        const style = document.createElement('style');
        style.id = '_typewriterBlink';
        style.textContent =
          '@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}';
        document.head.appendChild(style);
      }
    });
  }

  return tl;
}
