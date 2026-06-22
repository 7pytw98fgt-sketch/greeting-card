import i18next from 'i18next';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

const resources = {
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  en: { translation: en },
  ja: { translation: ja },
  ko: { translation: ko },
  fr: { translation: fr },
  es: { translation: es },
};

/**
 * Resolve initial language based on priority:
 * 1. URL ?lang= parameter
 * 2. localStorage i18nextLng
 * 3. Browser navigator.language
 * Falls back to 'zh-CN'.
 */
function resolveLanguage() {
  // Priority 1: URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && resources[urlLang]) {
    return urlLang;
  }

  // Priority 2: localStorage
  try {
    const stored = localStorage.getItem('i18nextLng');
    if (stored && resources[stored]) {
      return stored;
    }
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }

  // Priority 3: browser language
  const browserLang = navigator.language;
  if (browserLang && resources[browserLang]) {
    return browserLang;
  }

  // Check for partial match (e.g. zh-HK -> zh-TW)
  if (browserLang) {
    const prefix = browserLang.split('-')[0];
    const match = Object.keys(resources).find((k) => k.startsWith(prefix));
    if (match) return match;
  }

  return 'zh-CN';
}

const lng = resolveLanguage();

i18next.init({
  lng,
  fallbackLng: 'zh-CN',
  debug: import.meta.env.DEV === true,
  resources,
  returnObjects: false,
  interpolation: {
    escapeValue: false,
  },
  // Disable backend reporting
  saveMissing: false,
  missingKeyHandler: false,
});

// Persist language preference on change
i18next.on('languageChanged', (changedLng) => {
  try {
    localStorage.setItem('i18nextLng', changedLng);
  } catch {
    // ignore
  }
});

export default i18next;
