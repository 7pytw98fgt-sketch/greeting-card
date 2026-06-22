/**
 * Lightweight Canvas 2D particle system.
 *
 * No Three.js dependency — works everywhere with minimal overhead.
 * Particles burst outward from the canvas centre with fade, gravity,
 * and random perturbation for organic motion.
 */
import { getParticleConfig, getTheme } from '../config/constants.js';

export class ParticleSystem2D {
  /**
   * @param {HTMLElement} container  DOM element that will host the canvas
   * @param {object}      [config]
   * @param {number}      [config.count]       Number of particles
   * @param {number}      [config.speed]       Base speed multiplier
   * @param {number}      [config.size]        Base size multiplier
   * @param {string}      [config.color]       Primary particle colour
   * @param {string}      [config.secondaryColor]  Secondary colour for variety
   * @param {string}      [config.occasion]    Occasion key (overrides colors)
   */
  constructor(container, config = {}) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.rafId = null;
    this.running = false;

    // Resolve config
    const deviceCfg = getParticleConfig();
    const theme = config.occasion
      ? getTheme(config.occasion)
      : {};

    // Read CSS variables for dynamic theming (fall back to constants)
    const styles = getComputedStyle(document.body);
    const cssPrimary = styles.getPropertyValue('--color-primary').trim();
    const cssSecondary = styles.getPropertyValue('--color-secondary').trim();

    this.color = config.color || cssPrimary || theme.primary || '#FF6B6B';
    this.secondaryColor = config.secondaryColor || cssSecondary || theme.secondary || '#FFE66D';
    this.particleCount = config.count ?? deviceCfg.count;
    this.speedMult = config.speed ?? deviceCfg.speed;
    this.sizeMult = config.size ?? deviceCfg.size;

    this._onResize = this._onResize.bind(this);
  }

  // ---- Public API ----

  /** Create the canvas, generate particles, and start the loop. */
  start() {
    if (this.running) return;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    this.container.style.position = 'relative';
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this._resize();

    window.addEventListener('resize', this._onResize);

    this._spawnParticles();
    this.running = true;
    this._tick();
  }

  /** Stop animation and release resources. */
  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('resize', this._onResize);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
  }

  // ---- Internals ----

  _resize() {
    if (!this.canvas) return;
    const { width, height } = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap for perf
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
    }
    this._width = width;
    this._height = height;
  }

  _onResize() {
    this._resize();
  }

  _spawnParticles() {
    const cx = this._width / 2;
    const cy = this._height / 2;
    const colors = [this.color, this.secondaryColor];

    this.particles = Array.from({ length: this.particleCount }, () => {
      // Random direction outward (biased toward all quadrants)
      const angle = Math.random() * Math.PI * 2;
      const baseSpeed = (0.3 + Math.random() * 1.2) * this.speedMult;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
        life: 0.4 + Math.random() * 0.6,       // 0..1, decays each frame
        maxLife: 1,
        size: (0.5 + Math.random() * 1.5) * this.sizeMult,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });
  }

  _tick() {
    if (!this.running) return;

    const ctx = this.ctx;
    const w = this._width;
    const h = this._height;

    ctx.clearRect(0, 0, w, h);

    let alive = false;

    for (const p of this.particles) {
      if (p.life <= 0) continue;

      p.x += p.vx;
      p.y += p.vy;

      // Gravity
      p.vy += 0.02 * this.speedMult;

      // Random perturbation
      p.vx += (Math.random() - 0.5) * 0.2 * this.speedMult;
      p.vy += (Math.random() - 0.5) * 0.1 * this.speedMult;

      // Decay
      p.life -= 0.003 + Math.random() * 0.002;

      // Draw
      const alpha = Math.max(0, p.life);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (p.life > 0) alive = true;
    }

    ctx.globalAlpha = 1;

    if (alive) {
      this.rafId = requestAnimationFrame(() => this._tick());
    } else {
      // All particles dead — stop gracefully
      this.running = false;
    }
  }
}

export default ParticleSystem2D;
