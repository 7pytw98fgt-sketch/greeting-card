/**
 * LanguageSwitcher — floating language-selector button.
 *
 * Renders a semi-transparent button in the top-right corner.
 * Clicking it opens a dropdown with all supported languages.
 * Changing the language updates i18next, localStorage, and all
 * [data-i18n]-marked DOM elements.
 */
import gsap from 'gsap';
import i18next from './index.js';

const LANGUAGES = [
  { code: 'zh-CN', label: '简中' },
  { code: 'zh-TW', label: '繁中' },
  { code: 'en',    label: 'EN' },
  { code: 'ja',    label: '日本語' },
  { code: 'ko',    label: '한국어' },
  { code: 'fr',    label: 'FR' },
  { code: 'es',    label: 'ES' },
];

let btn = null;
let dropdown = null;
let isOpen = false;

function getCurrentLabel() {
  const lng = i18next.language;
  const entry = LANGUAGES.find((l) => l.code === lng);
  return entry ? entry.label : lng;
}

function buildButton() {
  if (btn) return;

  btn = document.createElement('button');
  btn.className = 'lang-switcher-btn';
  btn.setAttribute('data-no-skip', 'true');
  btn.textContent = getCurrentLabel();
  Object.assign(btn.style, {
    position: 'fixed',
    top: '1rem',
    right: '1.5rem',
    zIndex: '200',
    padding: '0.4rem 0.9rem',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '1.5rem',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    fontFamily: 'var(--font-serif)',
    transition: 'background 0.2s ease',
  });

  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'rgba(255,255,255,0.2)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'rgba(255,255,255,0.1)';
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.body.appendChild(btn);
}

function buildDropdown() {
  if (dropdown) return;

  dropdown = document.createElement('div');
  dropdown.className = 'lang-switcher-dropdown';
  Object.assign(dropdown.style, {
    position: 'fixed',
    top: '3.2rem',
    right: '1.5rem',
    zIndex: '201',
    display: 'none',
    flexDirection: 'column',
    background: 'rgba(20,20,30,0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    minWidth: '120px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  });

  const currentLang = i18next.language;

  for (const lang of LANGUAGES) {
    const item = document.createElement('button');
    item.textContent = lang.label;
    item.setAttribute('data-no-skip', 'true');
    item.setAttribute('data-lang', lang.code);
    Object.assign(item.style, {
      display: 'block',
      width: '100%',
      padding: '0.6rem 1.2rem',
      background: lang.code === currentLang ? 'rgba(255,255,255,0.08)' : 'transparent',
      border: 'none',
      color: '#fff',
      fontSize: '0.85rem',
      textAlign: 'left',
      cursor: 'pointer',
      fontFamily: 'var(--font-serif)',
      letterSpacing: '0.04em',
      transition: 'background 0.15s ease',
    });

    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(255,255,255,0.15)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background =
        lang.code === i18next.language
          ? 'rgba(255,255,255,0.08)'
          : 'transparent';
    });

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectLanguage(lang.code);
    });

    dropdown.appendChild(item);
  }

  document.body.appendChild(dropdown);
}

function toggleDropdown() {
  if (isOpen) {
    closeDropdown();
  } else {
    openDropdown();
  }
}

function openDropdown() {
  if (!dropdown) buildDropdown();
  isOpen = true;
  dropdown.style.display = 'flex';
  gsap.fromTo(
    dropdown,
    { opacity: 0, y: -8 },
    { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' },
  );

  // Highlight current language
  const items = dropdown.querySelectorAll('button');
  const current = i18next.language;
  items.forEach((item) => {
    item.style.background =
      item.getAttribute('data-lang') === current
        ? 'rgba(255,255,255,0.08)'
        : 'transparent';
  });

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', closeOnOutside, { once: true });
  }, 0);
}

function closeDropdown() {
  isOpen = false;
  if (dropdown) {
    gsap.to(dropdown, {
      opacity: 0,
      y: -8,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: () => {
        if (dropdown) dropdown.style.display = 'none';
      },
    });
  }
  document.removeEventListener('click', closeOnOutside);
}

function closeOnOutside(e) {
  if (isOpen) closeDropdown();
}

function selectLanguage(code) {
  i18next.changeLanguage(code);
  if (btn) btn.textContent = getCurrentLabel();
  closeDropdown();
  updateAllI18nElements();
}

/**
 * Walk DOM and update every [data-i18n] element's textContent.
 */
function updateAllI18nElements() {
  const elements = document.querySelectorAll('[data-i18n]');
  for (const el of elements) {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = i18next.t(key);
    }
  }
}

// Listen for i18next language changes
i18next.on('languageChanged', () => {
  if (btn) btn.textContent = getCurrentLabel();
  updateAllI18nElements();
});

/**
 * Call once at app boot to wire up the UI.
 */
export function initLanguageSwitcher() {
  buildButton();
  buildDropdown();
}

/**
 * Manually trigger an i18n element refresh (for components that don't
 * use data-i18n attributes).
 */
export function refreshI18n() {
  updateAllI18nElements();
}
