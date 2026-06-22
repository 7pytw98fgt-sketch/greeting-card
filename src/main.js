/**
 * Application entry point.
 *
 * 1. Parse URL data
 * 2. Apply theme
 * 3. Boot UI components (language switcher, etc.)
 * 4. Boot the SceneManager
 */
import './styles/base.css';
import './styles/responsive.css';
import './styles/themes.css';
import { parseUrlData } from './utils/url-codec.js';
import { SceneManager } from './scenes/SceneManager.js';
import { showLoading, hideLoading } from './components/LoadingScreen.js';
import { renderError } from './components/ErrorFallback.js';
import { initLanguageSwitcher } from './i18n/language-switcher.js';
import { trackPageView } from './utils/analytics.js';
import './i18n/index.js'; // ensure i18next is initialised

// Cross-module reference to parsed greeting data
window.__greetingData = null;

/** @type {SceneManager|null} */
let sceneManager = null;

function applyTheme(occasion) {
  // Remove any existing theme classes
  document.body.classList.forEach((cls) => {
    if (cls.startsWith('theme-')) document.body.classList.remove(cls);
  });
  // Add the current theme class
  document.body.classList.add(`theme-${occasion || 'birthday'}`);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function init() {
  // Upgrade the loading screen with enriched UI
  showLoading();

  // Language switcher (independent of greeting data)
  initLanguageSwitcher();

  const data = parseUrlData();

  // ---- Error: no data at all -------------------------------------------
  if (!data) {
    hideLoading();
    const app = document.getElementById('app');
    if (app) renderError(app, 'badUrl');
    return;
  }

  // ---- Error: incomplete data ------------------------------------------
  if (!data.recipient?.name || !data.message?.body) {
    hideLoading();
    const app = document.getElementById('app');
    if (app) renderError(app, 'noData');
    return;
  }

  // Store globally
  window.__greetingData = data;

  // Apply colour theme
  applyTheme(data.occasion);

  // Track page view (anonymous, privacy-friendly)
  trackPageView(data);

  // Fade out loading screen
  await hideLoading();

  // Boot scene manager
  const app = document.getElementById('app');
  if (!app) return;

  sceneManager = new SceneManager(app, data);
  sceneManager.onComplete(() => {
    console.log('🎉 Greeting card animation complete!');
  });

  await sceneManager.start();
}

init().catch((err) => {
  console.error('Init error:', err);
  hideLoading();
  const app = document.getElementById('app');
  if (app) renderError(app, 'badUrl');
});
