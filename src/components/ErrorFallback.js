/**
 * ErrorFallback — friendly error screen for bad URLs or missing data.
 *
 * Renders a centred message with an emoji, i18n text, and a "back home"
 * link, all animated with a gentle GSAP float.
 */
import gsap from 'gsap';
import i18next from '../i18n/index.js';

/**
 * Render the error screen into `container`, replacing its contents.
 *
 * @param {HTMLElement} container   the #app element
 * @param {'badUrl' | 'noData'} errorType
 */
export function renderError(container, errorType) {
  // Clear whatever is there
  container.innerHTML = '';

  const i18nKey = errorType === 'badUrl' ? 'error.badUrl' : 'error.noData';

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'error-fallback';
  Object.assign(wrapper.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center',
    padding: '2rem',
    background: 'linear-gradient(170deg, var(--color-bg) 0%, rgba(22,33,62,0.95) 50%, rgba(15,52,96,0.9) 100%)',
    color: '#ffffff',
    fontFamily: 'var(--font-serif)',
  });

  // Emoji
  const emoji = document.createElement('div');
  emoji.textContent = errorType === 'badUrl' ? '💌' : '🔗';
  Object.assign(emoji.style, {
    fontSize: '4rem',
    marginBottom: '1.5rem',
    lineHeight: '1',
  });

  // Title
  const title = document.createElement('h1');
  title.textContent = i18next.t(i18nKey);
  Object.assign(title.style, {
    fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
    fontWeight: '700',
    marginBottom: '1rem',
    maxWidth: '90vw',
    lineHeight: '1.5',
  });

  // Subtitle
  const subtitle = document.createElement('p');
  const subKey = errorType === 'badUrl' ? 'error.noData' : 'error.badUrl';
  subtitle.textContent = i18next.t(subKey);
  Object.assign(subtitle.style, {
    fontSize: '0.95rem',
    opacity: '0.65',
    marginBottom: '2.5rem',
    maxWidth: '80vw',
    lineHeight: '1.7',
  });

  // Back button
  const btn = document.createElement('a');
  btn.href = 'creator.html';
  btn.textContent = '← 返回首页';
  Object.assign(btn.style, {
    display: 'inline-block',
    padding: '0.75rem 2rem',
    background: 'var(--color-primary)',
    color: '#ffffff',
    borderRadius: '2rem',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '600',
    letterSpacing: '0.04em',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  });

  wrapper.appendChild(emoji);
  wrapper.appendChild(title);
  wrapper.appendChild(subtitle);
  wrapper.appendChild(btn);
  container.appendChild(wrapper);

  // Gentle floating animation
  gsap.to(emoji, {
    y: -12,
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });

  // Button hover effect
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.boxShadow = '0 6px 28px rgba(0,0,0,0.4)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  });
}

/**
 * Re-render the error page after a language change (re-call with same type).
 */
export function reRenderError(container, errorType) {
  renderError(container, errorType);
}
