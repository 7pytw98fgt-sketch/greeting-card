/**
 * FlipCardScene — 翻页贺卡场景
 *
 * A 3D greeting card that auto-flips after 1.5 s, rests,
 * then slides off screen. Returns immediately after setup;
 * the auto-advance timer handles scene progression.
 */
import gsap from 'gsap';
import { getTheme } from '../config/constants.js';
import { createFlipCard } from '../animations/flip-card.js';

// ---- Occasion → icon map -------------------------------------------------
const OCCASION_ICONS = {
  birthday:   '🎂',
  graduation: '🎓',
  wedding:    '💒',
  festival:   '🧧',
  promotion:  '🚀',
};
const DEFAULT_ICON = '🎁';

/**
 * @param {HTMLElement} sceneRoot
 * @param {object}      data
 * @returns {{ destroy: () => void }}
 */
export async function renderFlipCard(sceneRoot, data) {
  const theme = getTheme(data.occasion);
  const icon = OCCASION_ICONS[data.occasion] || DEFAULT_ICON;

  // ---- Background gradient -----------------------------------------------
  sceneRoot.style.background = `
    linear-gradient(135deg, ${theme.bg} 0%, ${withAlpha(theme.primary, 0.25)} 50%, ${theme.bg} 100%)
  `;

  // ---- Build front content -----------------------------------------------
  const ageLine = data.recipient.age ? `<p style="
    font-size: clamp(1rem, 2vw, 1.3rem);
    color: var(--color-text-dim);
    margin-top: 0.5rem;
    letter-spacing: 0.05em;
  ">${esc(String(data.recipient.age))}岁</p>` : '';

  const frontContent = `
    <div style="text-align:center;">
      <div style="font-size: clamp(3rem, 8vw, 5rem); margin-bottom: 1rem;">${icon}</div>
      <h2 style="
        font-size: clamp(2rem, 5vw, 3rem);
        font-weight: 700;
        color: var(--color-text);
        font-family: var(--font-serif);
        line-height: 1.3;
        margin-bottom: 0.5rem;
      ">${esc(data.recipient.name)}</h2>
      ${ageLine}
    </div>
  `;

  // ---- Build back content ------------------------------------------------
  const senderNameLine = data.sender?.name ? `<h3 style="
    font-size: clamp(1.4rem, 3vw, 1.8rem);
    color: var(--color-primary);
    font-family: var(--font-script);
    margin-bottom: 0.3rem;
  ">— ${esc(data.sender.name)}</h3>` : '';

  const relationLine = data.sender?.relation ? `<p style="
    font-size: 0.95rem;
    color: var(--color-text-dim);
    margin-bottom: 1.5rem;
  ">${esc(data.sender.relation)}</p>` : '';

  const greetingText = data.message.greeting || '';
  const backContent = `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      text-align:center;
      height:100%;
    ">
      <p style="
        font-size: clamp(1.1rem, 2.5vw, 1.4rem);
        line-height: 1.8;
        color: var(--color-text);
        margin-bottom: 1rem;
        font-style: italic;
      ">${esc(greetingText)}</p>
      <div style="
        border-top: 1px solid rgba(255,255,255,0.15);
        width: 60%;
        margin: 1rem 0;
      "></div>
      ${senderNameLine}
      ${relationLine}
      <div style="
        font-size: 0.7rem;
        color: var(--color-text-dim);
        margin-top: auto;
        letter-spacing: 0.15em;
        opacity: 0.6;
        font-family: var(--font-script);
      ">✦ With Love ✦</div>
    </div>
  `;

  // ---- Create flip card -------------------------------------------------
  const cardController = createFlipCard(sceneRoot, frontContent, backContent, {
    duration: 1.0,
    easing: 'power3.inOut',
  });

  const cardEl = cardController.el;
  const frontFace = cardEl.querySelector('.flip-card-front');
  const backFace = cardEl.querySelector('.flip-card-back');

  if (frontFace) {
    frontFace.style.background = `
      linear-gradient(150deg, #fdf6f0 0%, #fef5e7 25%, #fdebd0 50%, #fef5e7 75%, #fdf6f0 100%)
    `;
    frontFace.style.color = '#3d2b1f';
  }

  if (backFace) {
    backFace.style.background = `
      linear-gradient(150deg, #f7efe5 0%, #f5e6d3 25%, #eed9c4 50%, #f5e6d3 75%, #f7efe5 100%)
    `;
    backFace.style.color = '#3d2b1f';
  }

  // ---- Entrance animation ------------------------------------------------
  gsap.fromTo(
    cardEl,
    { opacity: 0, y: 60, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.4)' },
  );

  // ---- Auto-flip after 1.5s ----------------------------------------------
  const flipTween = gsap.delayedCall(1.5, () => {
    const flipTimeline = cardController.flip();
    // After flip completes, shrink & move the card off screen
    flipTimeline.eventCallback('onComplete', () => {
      gsap.to(cardEl, {
        scale: 0.3,
        y: -120,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.in',
        delay: 1.2, // brief pause so the viewer can read the back
      });
    });
  });

  // ---- Return ------------------------------------------------------------
  return {
    destroy() {
      flipTween.kill();
      gsap.killTweensOf(cardEl);
      cardController.destroy();
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
