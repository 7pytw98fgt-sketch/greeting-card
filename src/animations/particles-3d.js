/**
 * Three.js based 3D particle / firework system.
 *
 * Provides firework bursts and floating particles (hearts, stars,
 * petals) for the climax scene. Falls back to enhanced 2D Canvas if
 * WebGL is unavailable.
 */
import * as THREE from 'three';
import { getTheme } from '../config/constants.js';

// ---- Texture generators (off-screen canvas) -----------------------------

function createHeartTexture(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const s = size / 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(s, size * 0.2);
  ctx.bezierCurveTo(s, 0, 0, 0, 0, s * 0.6);
  ctx.bezierCurveTo(0, s * 1.2, s, size, s, size);
  ctx.bezierCurveTo(s, size, size, s * 1.2, size, s * 0.6);
  ctx.bezierCurveTo(size, 0, s, 0, s, size * 0.2);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

function createStarTexture(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2;
  const innerR = size / 5;
  const spikes = 5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

function createPetalTexture(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.4, size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

function createConfettiTexture(size = 32) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(2, 2, size - 4, size * 0.7 - 2);
  return new THREE.CanvasTexture(c);
}

// ---- ParticleSystem3D class ---------------------------------------------

export class ParticleSystem3D {
  /**
   * @param {HTMLElement} container  DOM element that hosts the canvas
   * @param {object}      [config]
   * @param {string}      [config.occasion]   occasion key for colours
   * @param {number}      [config.particleCount]  particles per firework burst
   */
  constructor(container, config = {}) {
    this.container = container;
    this.config = config;

    const theme = getTheme(config.occasion);

    this.colors = [
      new THREE.Color(theme.primary),
      new THREE.Color(theme.secondary),
      new THREE.Color('#ffffff'),
      new THREE.Color('#FFD700'), // gold
      new THREE.Color('#FF69B4'), // hot pink
    ];

    this.particleCount = config.particleCount || 300;

    // Three.js core
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();
    this.running = false;
    this.rafId = null;

    // Active particle groups
    this.fireworks = [];    // { points, velocities, life, maxLife }
    this.floaters = [];     // { sprites, data[] }

    // Textures cache
    this._textures = {};
    this._textures.heart = createHeartTexture();
    this._textures.star = createStarTexture();
    this._textures.petal = createPetalTexture();
    this._textures.confetti = createConfettiTexture();

    this._onResize = this._onResize.bind(this);
  }

  // ---- Public API -------------------------------------------------------

  /** Initialise Three.js scene and start render loop. */
  start() {
    if (this.running) return;

    const { width, height } = this.container.getBoundingClientRect();

    // Renderer (transparent background)
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    this.container.style.position = 'relative';
    this.container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this.camera.position.z = 15;

    // Resize
    window.addEventListener('resize', this._onResize);

    this.running = true;
    this._tick();
  }

  /** Stop the render loop and release resources. */
  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('resize', this._onResize);

    // Dispose Three.js resources
    this._disposeFireworks();
    this._disposeFloaters();

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
  }

  /** Launch a firework burst at a random position. */
  createFirework() {
    if (!this.scene) return;

    const count = this.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 4); // vx,vy,vz,rotSpeed

    // Burst origin (random, mostly toward upper half)
    const ox = (Math.random() - 0.5) * 8;
    const oy = (Math.random() - 0.5) * 4 + 2;
    const oz = (Math.random() - 0.5) * 2;

    for (let i = 0; i < count; i++) {
      positions[i * 3] = ox;
      positions[i * 3 + 1] = oy;
      positions[i * 3 + 2] = oz;

      // Velocity (burst sphere)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.6 - Math.PI * 0.3; // bias upward
      const speed = 3 + Math.random() * 8;
      velocities[i * 4] = Math.cos(theta) * Math.cos(phi) * speed;
      velocities[i * 4 + 1] = Math.sin(phi) * speed + 1;
      velocities[i * 4 + 2] = (Math.random() - 0.5) * speed * 0.6;
      velocities[i * 4 + 3] = (Math.random() - 0.5) * 4;

      // Color
      const col = this.colors[Math.floor(Math.random() * this.colors.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 1,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.fireworks.push({
      points,
      velocities,
      life: 2.5 + Math.random() * 1.0,
      maxLife: 3.5,
      age: 0,
    });
  }

  /**
   * Create continuously floating particles.
   * @param {'hearts'|'stars'|'petals'|'confetti'} type
   */
  createFloatingParticles(type = 'confetti') {
    if (!this.scene) return;

    const count = 60;
    const texKey = type === 'hearts' ? 'heart'
      : type === 'stars' ? 'star'
      : type === 'petals' ? 'petal'
      : 'confetti';
    const texture = this._textures[texKey];

    const material = new THREE.SpriteMaterial({
      map: texture,
      blending: THREE.NormalBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.7,
    });

    const sprites = [];
    const data = [];

    for (let i = 0; i < count; i++) {
      const sprite = new THREE.Sprite(material.clone());
      const size = 0.3 + Math.random() * 0.8;
      sprite.scale.set(size, size, 1);
      sprite.position.set(
        (Math.random() - 0.5) * 14,
        8 + Math.random() * 6,
        (Math.random() - 0.5) * 6,
      );

      // Random tint
      const col = this.colors[Math.floor(Math.random() * (this.colors.length - 2))]; // skip white/gold
      sprite.material.color = col;
      sprite.material.opacity = 0.3 + Math.random() * 0.5;

      this.scene.add(sprite);
      sprites.push(sprite);

      data.push({
        fallSpeed: 0.3 + Math.random() * 0.8,
        driftAmp: 0.5 + Math.random() * 1.5,
        driftFreq: 0.5 + Math.random() * 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.5,
        startY: sprite.position.y,
        startX: sprite.position.x,
        timeOffset: Math.random() * Math.PI * 2,
      });
    }

    this.floaters.push({ sprites, data, type });
  }

  /**
   * Fade out and remove all floating particles over `duration` seconds.
   * Returns a promise that resolves when done.
   */
  async fadeOutFloaters(duration = 1.5) {
    const groups = this.floaters.slice();
    const start = performance.now();

    return new Promise((resolve) => {
      const step = () => {
        const elapsed = (performance.now() - start) / 1000;
        const progress = Math.min(elapsed / duration, 1);

        for (const g of groups) {
          for (const s of g.sprites) {
            s.material.opacity = Math.max(0, s.material.opacity - 0.02);
            s.scale.multiplyScalar(0.995);
          }
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          this._disposeFloaters();
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  // ---- Internals --------------------------------------------------------

  _tick() {
    if (!this.running) return;

    const dt = Math.min(this.clock.getDelta(), 0.1);

    // ---- Update fireworks -----------------------------------------------
    for (let f = this.fireworks.length - 1; f >= 0; f--) {
      const fw = this.fireworks[f];
      fw.age += dt;

      const posArr = fw.points.geometry.attributes.position.array;
      const count = posArr.length / 3;

      for (let i = 0; i < count; i++) {
        posArr[i * 3] += fw.velocities[i * 4] * dt;
        posArr[i * 3 + 1] += fw.velocities[i * 4 + 1] * dt;
        posArr[i * 3 + 2] += fw.velocities[i * 4 + 2] * dt;

        // Gravity
        fw.velocities[i * 4 + 1] -= 2.5 * dt;
      }

      fw.points.geometry.attributes.position.needsUpdate = true;

      // Fade out
      const lifeRatio = fw.age / fw.maxLife;
      fw.points.material.opacity = Math.max(0, 1 - lifeRatio);
      fw.points.material.size = 0.08 * (1 - lifeRatio * 0.5);

      // Remove dead
      if (fw.age >= fw.maxLife) {
        this.scene.remove(fw.points);
        fw.points.geometry.dispose();
        fw.points.material.dispose();
        this.fireworks.splice(f, 1);
      }
    }

    // ---- Update floaters ------------------------------------------------
    for (const fl of this.floaters) {
      for (let i = 0; i < fl.sprites.length; i++) {
        const s = fl.sprites[i];
        const d = fl.data[i];

        s.position.y -= d.fallSpeed * dt;
        s.position.x = d.startX + Math.sin(performance.now() * 0.001 * d.driftFreq + d.timeOffset) * d.driftAmp;
        s.material.rotation = d.rotation + performance.now() * 0.001 * d.rotSpeed;

        // Wrap to top
        if (s.position.y < -8) {
          s.position.y = 8;
          s.position.x = (Math.random() - 0.5) * 14;
          d.startX = s.position.x;
        }
      }
    }

    // ---- Render ---------------------------------------------------------
    this.renderer.render(this.scene, this.camera);

    this.rafId = requestAnimationFrame(() => this._tick());
  }

  _disposeFireworks() {
    for (const fw of this.fireworks) {
      if (fw.points.parent) this.scene?.remove(fw.points);
      fw.points.geometry?.dispose();
      fw.points.material?.dispose();
    }
    this.fireworks = [];
  }

  _disposeFloaters() {
    for (const fl of this.floaters) {
      for (const s of fl.sprites) {
        if (s.parent) this.scene?.remove(s);
        s.material?.dispose();
      }
    }
    this.floaters = [];
  }

  _onResize() {
    if (!this.renderer || !this.camera) return;
    const { width, height } = this.container.getBoundingClientRect();
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

export default ParticleSystem3D;
