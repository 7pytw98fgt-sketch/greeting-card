/**
 * CSS 3D flip-card animation.
 *
 * Creates a greeting-card element with front and back faces that
 * flips in 3D space using CSS perspective and rotateY transforms.
 */
import gsap from 'gsap';

/**
 * Create a flip-card inside `container` and return its controller.
 *
 * @param {HTMLElement} container    parent element
 * @param {string}      frontContent HTML string for the front face
 * @param {string}      backContent  HTML string for the back face
 * @param {object}      [options]
 * @param {number}      [options.duration=1.2]   flip transition duration (s)
 * @param {string}      [options.easing='power3.inOut']  GSAP ease
 * @param {number}      [options.perspective=1200] CSS perspective in px
 * @returns {{ flip: () => gsap.core.Timeline, destroy: () => void, el: HTMLElement }}
 */
export function createFlipCard(container, frontContent, backContent, options = {}) {
  const {
    duration = 1.2,
    easing = 'power3.inOut',
    perspective = 1200,
  } = options;

  // ---- Build DOM ---------------------------------------------------------
  const outer = document.createElement('div');
  outer.className = 'flip-card-container';
  outer.style.cssText = `
    perspective: ${perspective}px;
    width: min(85vw, 500px);
    height: min(70vh, 650px);
    position: relative;
    z-index: 2;
  `;

  const card = document.createElement('div');
  card.className = 'flip-card';
  card.style.cssText = `
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform ${duration}s cubic-bezier(0.4, 0.0, 0.2, 1);
  `;

  // Front face
  const front = document.createElement('div');
  front.className = 'flip-card-front';
  front.innerHTML = frontContent;
  front.style.cssText = `
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 16px;
    box-shadow:
      0 4px 16px rgba(0,0,0,0.25),
      0 8px 32px rgba(0,0,0,0.15),
      inset 0 1px 2px rgba(255,255,255,0.1);
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  `;

  // Back face
  const back = document.createElement('div');
  back.className = 'flip-card-back';
  back.innerHTML = backContent;
  back.style.cssText = `
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transform: rotateY(180deg);
    border-radius: 16px;
    box-shadow:
      0 4px 16px rgba(0,0,0,0.25),
      0 8px 32px rgba(0,0,0,0.15),
      inset 0 1px 2px rgba(255,255,255,0.1);
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  `;

  card.appendChild(front);
  card.appendChild(back);
  outer.appendChild(card);

  let isFlipped = false;

  /**
   * Trigger the flip (toggle between front and back).
   * @returns {gsap.core.Timeline}
   */
  function flip() {
    isFlipped = !isFlipped;
    const tl = gsap.timeline();
    tl.to(card, {
      duration,
      rotateY: isFlipped ? 180 : 0,
      ease: easing,
    });
    return tl;
  }

  /**
   * Remove the card and its animations from the DOM.
   */
  function destroy() {
    gsap.killTweensOf(card);
    if (outer.parentNode) outer.parentNode.removeChild(outer);
  }

  // Insert
  container.appendChild(outer);

  return { flip, destroy, el: outer };
}

export default createFlipCard;
