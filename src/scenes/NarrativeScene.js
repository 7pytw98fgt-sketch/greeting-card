/**
 * NarrativeScene — 叙事滚动场景
 *
 * Displays the message body one paragraph at a time. Each paragraph
 * slides in from below, pauses for reading, then slides out upward.
 * Returns immediately; the auto-advance timer handles progression.
 */
import gsap from 'gsap';
import { getTheme } from '../config/constants.js';

/**
 * @param {HTMLElement} sceneRoot
 * @param {object}      data
 * @returns {{ destroy: () => void }}
 */
export async function renderNarrative(sceneRoot, data) {
  const theme = getTheme(data.occasion);

  // ---- Background --------------------------------------------------------
  sceneRoot.style.background = `
    linear-gradient(170deg, ${theme.bg} 0%, ${withAlpha(theme.primary, 0.2)} 60%, ${theme.bg} 100%)
  `;

  // Slow background shift
  const bgTween = gsap.to(sceneRoot, {
    duration: 20,
    backgroundPosition: '200% 50%',
    ease: 'none',
  });
  sceneRoot.style.backgroundSize = '200% 200%';

  // ---- Build sections ----------------------------------------------------
  const body = data.message.body || '';
  let paragraphs = body.split('\n').filter((p) => p.trim());

  if (paragraphs.length <= 1) {
    const parts = [];
    if (data.message.greeting) parts.push(data.message.greeting);
    parts.push(...paragraphs);
    if (data.message.closing) parts.push(data.message.closing);
    paragraphs = parts;
  }

  if (paragraphs.length < 3 && paragraphs.length > 0) {
    paragraphs.push('·· · ✦ · ··');
  }

  const sections = paragraphs.map((text, i) => {
    const star = ['✨', '🌟', '💫', '🌸', '🌷', '🪷'][i % 6];
    return `${star} ${text}`;
  });

  // ---- DOM blocks --------------------------------------------------------
  const blocks = [];
  const tl = gsap.timeline({ paused: true, delay: 0.5 });

  for (const sec of sections) {
    const block = document.createElement('div');
    block.innerHTML = `<p style="
      font-size: clamp(1.2rem, 4vw, 1.8rem);
      line-height: 1.8;
      color: var(--color-text);
      text-shadow: 0 1px 8px rgba(0,0,0,0.4);
      max-width: 85vw;
      text-align: center;
      margin: 0 auto;
      white-space: pre-line;
    ">${esc(sec)}</p>`;
    Object.assign(block.style, {
      position: 'absolute',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      transform: 'translateY(100%)',
      opacity: 0,
    });
    sceneRoot.appendChild(block);
    blocks.push(block);
  }

  // ---- Timeline segments -------------------------------------------------
  const SLIDE_DUR = 1.0;
  const MIN_READ = 2.5;
  const READ_SPEED = 18;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const textLen = sections[i].length;
    const readTime = Math.max(MIN_READ, textLen / READ_SPEED);

    // Slide in
    tl.to(block, {
      y: 0,
      opacity: 1,
      duration: SLIDE_DUR,
      ease: 'power2.inOut',
    }, i === 0 ? '>' : `>-0.3`);

    // Breathe
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
        duration: SLIDE_DUR,
        ease: 'power2.inOut',
      }, `>${readTime}`);
    }
  }

  tl.play();

  return {
    destroy() {
      tl.kill();
      bgTween.kill();
      gsap.killTweensOf(sceneRoot);
      for (const b of blocks) {
        if (b.parentNode) b.parentNode.removeChild(b);
      }
    },
  };
}

// ---- Helpers -------------------------------------------------------------

function esc(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function withAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
