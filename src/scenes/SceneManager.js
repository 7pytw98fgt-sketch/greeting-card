/**
 * SceneManager — orchestrates scene transitions for the greeting card
 * animation short film.
 *
 * Lifecycle:
 *   opening → flipCard → narrative → climax → closing
 *
 * Each scene is implemented in its own module under src/scenes/.
 * The manager handles the shared DOM shell, fade transitions, input
 * events, auto-advance, and navigation.
 */
import gsap from 'gsap';
import {
  SCENE_DURATIONS,
  TRANSITION_DURATION,
} from '../config/constants.js';

// Scene renderers — each returns { particles?, … }
import { renderOpening } from './OpeningScene.js';
import { renderFlipCard } from './FlipCardScene.js';
import { renderNarrative } from './NarrativeScene.js';
import { renderClimax } from './ClimaxScene.js';
import { renderClosing } from './ClosingScene.js';

// UX components
import { showHint } from '../components/NavigationHint.js';
import { updateProgress } from '../components/ProgressBar.js';

/** Maps scene name → render function. */
const SCENE_RENDERERS = {
  opening: renderOpening,
  flipCard: renderFlipCard,
  narrative: renderNarrative,
  climax: renderClimax,
  closing: renderClosing,
};

/** Ordered scene pipeline. */
const SCENE_ORDER = ['opening', 'flipCard', 'narrative', 'climax', 'closing'];

/** Minimum horizontal swipe distance to trigger skip (px). */
const SWIPE_THRESHOLD = 50;
/** Debounce window for click / touchend (ms). */
const TAP_DEBOUNCE = 300;

export class SceneManager {
  /**
   * @param {HTMLElement} container  the #app element
   * @param {object}      data       parsed greeting data from the URL
   */
  constructor(container, data) {
    /** @type {HTMLElement} */
    this.container = container;
    /** @type {object} */
    this.data = data;

    /** @type {number} */
    this.sceneIndex = -1;
    /** @type {boolean} */
    this.transitioning = false;
    /** @type {Array<() => void>} */
    this.onCompleteCallbacks = [];

    /** @type {HTMLElement|null} current scene's root <div> */
    this.sceneRoot = null;
    /** @type {object|null} resources returned by the current scene renderer */
    this.sceneResources = null;
    /** @type {ReturnType<typeof setTimeout>|null} */
    this.autoAdvanceTimer = null;

    // Tap debounce state
    this._lastTapTime = 0;

    // Touch swipe state
    this._touchStartX = null;
    this._touchStartY = null;
    this._swipeHandled = false;

    // User interaction flag — once they tap/swipe once, treat as
    // "manual control" (auto-advance still fires from scene durations
    // but manual advance via skipCurrent also works without conflict).
    this._userInteracted = false;

    // Bound handlers (for add/removeEventListener)
    this._boundClickHandler = this._onClickOrTouchEnd.bind(this);
    this._boundKeyHandler = this._onKey.bind(this);
    this._boundTouchStart = this._onTouchStart.bind(this);
    this._boundTouchEnd = this._onTouchEnd.bind(this);
  }

  // ==================================================================
  // Public API
  // ==================================================================

  /** Start the scene sequence from the beginning. */
  async start() {
    this.sceneIndex = -1;
    updateProgress(0, SCENE_ORDER.length);
    await this.next();
  }

  /** Advance to the next scene. */
  async next() {
    if (this.transitioning) return;

    const nextIndex = this.sceneIndex + 1;
    if (nextIndex >= SCENE_ORDER.length) {
      this._complete();
      return;
    }

    this.transitioning = true;

    // Exit current scene
    if (this.sceneRoot) {
      await this._exitCurrentScene();
    }

    // Enter next
    const sceneName = SCENE_ORDER[nextIndex];
    this.sceneIndex = nextIndex;
    await this._enterScene(sceneName);

    this.transitioning = false;
  }

  /** Go back to the previous scene. */
  async previous() {
    if (this.transitioning) return;

    const prevIndex = this.sceneIndex - 1;
    if (prevIndex < 0) return;

    this.transitioning = true;

    if (this.sceneRoot) {
      await this._exitCurrentScene();
    }

    const sceneName = SCENE_ORDER[prevIndex];
    this.sceneIndex = prevIndex;
    await this._enterScene(sceneName);

    this.transitioning = false;
  }

  /**
   * Jump to a specific scene by name.
   * @param {string} sceneName
   */
  async goTo(sceneName) {
    const index = SCENE_ORDER.indexOf(sceneName);
    if (index === -1 || this.transitioning) return;

    this.transitioning = true;

    if (this.sceneRoot) {
      await this._exitCurrentScene();
    }

    this.sceneIndex = index;
    await this._enterScene(sceneName);

    this.transitioning = false;
  }

  /**
   * Skip the current scene (user-initiated).
   * Wraps next() — identical behaviour but also flags user interaction.
   */
  skipCurrent() {
    if (this.transitioning) return;
    this._userInteracted = true;
    this.next();
  }

  /** Register a callback invoked when all scenes finish. */
  onComplete(callback) {
    this.onCompleteCallbacks.push(callback);
  }

  /** Tear down everything. */
  destroy() {
    this._clearAutoAdvance();
    this._removeInputListeners();
    this._cleanupSceneResources();
    if (this.sceneRoot) {
      gsap.killTweensOf(this.sceneRoot);
      this._removeElement(this.sceneRoot);
      this.sceneRoot = null;
    }
    this.onCompleteCallbacks = [];
  }

  // ==================================================================
  // Internals — scene lifecycle
  // ==================================================================

  async _enterScene(name) {
    console.log(`[SceneManager] Entering: ${name}`);

    // Fresh root element
    this.sceneRoot = document.createElement('div');
    this.sceneRoot.className = `scene scene-${name}`;
    Object.assign(this.sceneRoot.style, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    });
    this.container.appendChild(this.sceneRoot);

    // Fade-in
    gsap.fromTo(
      this.sceneRoot,
      { opacity: 0 },
      { opacity: 1, duration: TRANSITION_DURATION / 1000, ease: 'power2.inOut' },
    );

    // Input listeners
    this._addInputListeners();

    // Delegate rendering to the scene module
    const renderFn = SCENE_RENDERERS[name];
    if (renderFn) {
      this.sceneResources = await renderFn(this.sceneRoot, this.data);
    } else {
      console.warn(`[SceneManager] No renderer registered for scene: ${name}`);
      this.sceneResources = {};
    }

    // Show navigation hint & update progress bar
    showHint();
    updateProgress(this.sceneIndex, SCENE_ORDER.length);

    // Auto-advance
    this._scheduleAutoAdvance(name);
  }

  async _exitCurrentScene() {
    this._clearAutoAdvance();
    this._removeInputListeners();

    // Stop particles / release scene resources
    this._cleanupSceneResources();

    // Fade-out
    if (this.sceneRoot) {
      const root = this.sceneRoot;
      this.sceneRoot = null;
      gsap.killTweensOf(root);
      await gsap
        .to(root, {
          opacity: 0,
          duration: TRANSITION_DURATION / 1000,
          ease: 'power2.inOut',
        })
        .then();
      this._removeElement(root);
    }
  }

  _cleanupSceneResources() {
    if (!this.sceneResources) return;
    if (typeof this.sceneResources.destroy === 'function') {
      this.sceneResources.destroy();
    }
    if (this.sceneResources.particles && typeof this.sceneResources.particles.stop === 'function') {
      this.sceneResources.particles.stop();
    }
    this.sceneResources = null;
  }

  // ==================================================================
  // Auto-advance & input
  // ==================================================================

  _scheduleAutoAdvance(name) {
    const duration = SCENE_DURATIONS[name] || 6000;
    this._clearAutoAdvance();
    this.autoAdvanceTimer = setTimeout(() => {
      this.autoAdvanceTimer = null;
      if (!this.transitioning) this.next();
    }, duration);
  }

  _clearAutoAdvance() {
    if (this.autoAdvanceTimer != null) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  // ---- Input listeners ----------------------------------------------------

  _addInputListeners() {
    document.addEventListener('click', this._boundClickHandler);
    document.addEventListener('touchend', this._boundClickHandler);
    document.addEventListener('touchstart', this._boundTouchStart, { passive: true });
    document.addEventListener('keydown', this._boundKeyHandler);
  }

  _removeInputListeners() {
    document.removeEventListener('click', this._boundClickHandler);
    document.removeEventListener('touchend', this._boundClickHandler);
    document.removeEventListener('touchstart', this._boundTouchStart);
    document.removeEventListener('keydown', this._boundKeyHandler);
  }

  // ---- Click / tap --------------------------------------------------------

  _onClickOrTouchEnd(e) {
    // Ignore if tapping on UI controls (language switcher, etc.)
    if (e.target.closest('[data-no-skip]')) return;
    // Ignore if a swipe was already processed for this touch sequence
    if (e.type === 'touchend' && this._swipeHandled) {
      this._swipeHandled = false;
      return;
    }
    if (this.transitioning) return;

    // Debounce (300 ms)
    const now = Date.now();
    if (now - this._lastTapTime < TAP_DEBOUNCE) return;
    this._lastTapTime = now;

    this.skipCurrent();
  }

  // ---- Keyboard -----------------------------------------------------------

  _onKey(e) {
    if (this.transitioning) return;
    // Space, Enter, ArrowRight → skip forward
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      this.skipCurrent();
    }
    // ArrowLeft: intentionally ignored (no backwards support in this workflow)
  }

  // ---- Touch swipe --------------------------------------------------------

  _onTouchStart(e) {
    if (e.touches.length === 1) {
      this._touchStartX = e.touches[0].clientX;
      this._touchStartY = e.touches[0].clientY;
      this._swipeHandled = false;
    }
  }

  _onTouchEnd(e) {
    if (
      this._touchStartX == null ||
      this._touchStartY == null ||
      this.transitioning
    ) {
      this._touchStartX = null;
      this._touchStartY = null;
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const dx = endX - this._touchStartX;
    const dy = endY - this._touchStartY;

    // Only horizontal swipes with sufficient distance
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      this._swipeHandled = true;
      this.skipCurrent();
    }

    this._touchStartX = null;
    this._touchStartY = null;
  }

  // ==================================================================
  // Completion
  // ==================================================================

  _complete() {
    console.log('[SceneManager] All scenes complete.');
    updateProgress(SCENE_ORDER.length - 1, SCENE_ORDER.length);
    for (const cb of this.onCompleteCallbacks) {
      try { cb(); } catch (err) { console.error('onComplete error:', err); }
    }
  }

  // ==================================================================
  // Utility
  // ==================================================================

  _removeElement(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }
}

export default SceneManager;
