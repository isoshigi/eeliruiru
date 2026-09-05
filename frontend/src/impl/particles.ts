// パーティクル描画 (Canvas)（非純粋: canvas / rAF / resize）
// 元: public/app.js Particle / createExplosion / renderParticles
// 物理計算は pure/particlesLogic.ts に委譲する。

import {
  isParticleDead,
  makeExplosionSpecs,
  particleAlpha,
  stepParticle,
  type ParticleState,
} from "../pure/particlesLogic.js";

export class Particle {
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;

  constructor(x: number, y: number, color: string, size: number, vx: number, vy: number, life: number) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
  }

  update(): void {
    const next: ParticleState = stepParticle({
      x: this.x,
      y: this.y,
      color: this.color,
      size: this.size,
      vx: this.vx,
      vy: this.vy,
      life: this.life,
      maxLife: this.maxLife,
    });
    this.x = next.x;
    this.y = next.y;
    this.vy = next.vy;
    this.life = next.life;
  }

  draw(c: CanvasRenderingContext2D): void {
    c.save();
    c.globalAlpha = particleAlpha(this.life, this.maxLife);
    c.fillStyle = this.color;
    c.beginPath();
    c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

export const particles: Particle[] = [];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

function resizeCanvas(): void {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export function createExplosion(x: number, y: number, colors: readonly string[], count = 30): void {
  for (const spec of makeExplosionSpecs(x, y, colors, count)) {
    particles.push(new Particle(spec.x, spec.y, spec.color, spec.size, spec.vx, spec.vy, spec.life));
  }
}

function renderParticles(): void {
  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw(ctx);
      if (isParticleDead(particles[i].life)) {
        particles.splice(i, 1);
      }
    }
  }
  requestAnimationFrame(renderParticles);
}

/** 旧実装のトップレベル初期化と同等。main.ts から1回呼ぶ。 */
export function initParticles(): void {
  canvas = document.getElementById("fx-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  renderParticles();
}
