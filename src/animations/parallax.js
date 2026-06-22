/**
 * Parallax / pseudo-scroll animation helper.
 *
 * Since the greeting card is full-screen fixed with no real scrollbar,
 * this module provides a GSAP Timeline-based "pseudo-scroll" that
 * animates content blocks in sequence: slide-in → pause → slide-out.
 *
 * Each section can optionally trigger a background parallax effect.
 */
import gsap from 'gsap';

/**
 * Create a pseudo-scrolling sequence of text sections.
 *
 * @param {HTMLElement}  container  parent element for the animated blocks
 * @param {object[]}     sections   array of { text, className?, animation? }
 * @param {object}       [options]
 * @param {number}       [options.slideDuration=1]    in/out slide duration (s)
 * @param {number}       [options.minReadTime=2]      minimum pause per section (s)
 * @param {number}       [options.readSpeed=25]       chars per second for read-time calc
 * @param {string}       [options.ease='power2.inOut'] GSAP ease for slides
 * @param {HTMLElement}  [options.bgElement]          element to apply parallax bg shifts to
 * @returns {{ timeline: gsap.core.Timeline, destroy: () => void }}
 */
export function createParallaxScroll(container, sections, options = {}) {
  const {
    slideDuration = 1,
    minReadTime = 2,
    readSpeed = 25,
    ease = 'power2.inOut',
    bgElement = null,
  } = options;

  const tl = gsap.timeline({ paused: true });
  const blocks = [];

  // ---- Create DOM blocks ------------------------------------------------
  for (const sec of sections) {
    const block = document.createElement('div');
    block.className = sec.className || 'parallax-section';
    block.innerHTML = `
      <p style="
        font-size: clamp(1.2rem, 4vw, 1.8rem);
        line-height: 1.8;
        color: var(--color-text);
        text-shadow: 0 1px 8px rgba(0,0,0,0.4);
        max-width: 85vw;
        text-align: center;
        margin: 0 auto;
        white-space: pre-line;
      ">${escapeHtml(sec.text)}</p>
    `;
    Object.assign(block.style, {
      position: 'absolute',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      // Start below screen
      transform: 'translateY(100%)',
      opacity: 0,
    });
    container.appendChild(block);
    blocks.push(block);
  }

  // ---- Build timeline ---------------------------------------------------
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const textLength = sections[i].text.length;
    const readTime = Math.max(minReadTime, textLength / readSpeed);

    // Slide in
    tl.to(block, {
      y: 0,
      opacity: 1,
      duration: slideDuration,
      ease,
    }, `>-0.3`);

    // Subtle scale breathe during read
    tl.to(block, {
      scale: 1.03,
      duration: readTime * 0.3,
      ease: 'sine.inOut',
    });
    tl.to(block, {
      scale: 1,
      duration: readTime * 0.7,
      ease: 'sine.inOut',
    });

    // Slide out (except last)
    if (i < blocks.length - 1) {
      tl.to(block, {
        y: '-100%',
        opacity: 0,
        duration: slideDuration,
        ease,
      }, `>${readTime}`);
    }

    // Background parallax tick
    if (bgElement) {
      tl.to(bgElement, {
        '--bg-shift': `${(i + 1) * 5}%`,
        duration: slideDuration + readTime,
        ease: 'none',
      }, `<`);
    }
  }

  return {
    timeline: tl,
    blocks,
    /** Start the sequence. Returns a Promise that resolves when done. */
    play() {
      return new Promise((resolve) => {
        tl.eventCallback('onComplete', resolve);
        tl.play();
      });
    },
    /** Skip to the end immediately. */
    skip() {
      tl.progress(0.95);
    },
    /** Tear down all blocks and kill the timeline. */
    destroy() {
      tl.kill();
      for (const b of blocks) {
        if (b.parentNode) b.parentNode.removeChild(b);
      }
    },
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default createParallaxScroll;
