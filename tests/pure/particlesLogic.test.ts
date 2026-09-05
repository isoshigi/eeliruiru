import { describe, expect, it } from "vitest";
import {
  isParticleDead,
  makeExplosionSpecs,
  particleAlpha,
  stepParticle,
  type ParticleState,
} from "../../frontend/src/pure/particlesLogic.js";

const base: ParticleState = {
  x: 10,
  y: 20,
  color: "#fff",
  size: 4,
  vx: 3,
  vy: -2,
  life: 10,
  maxLife: 10,
};

describe("stepParticle: 1フレーム進行", () => {
  it("x+=vx, y+=vy, vy+=0.15, life--", () => {
    const n = stepParticle(base);
    expect(n.x).toBe(13);
    expect(n.y).toBe(18);
    expect(n.vy).toBeCloseTo(-1.85);
    expect(n.life).toBe(9);
    expect(n.maxLife).toBe(10);
  });
  it("入力を破壊しない（非破壊）", () => {
    stepParticle(base);
    expect(base.x).toBe(10);
    expect(base.life).toBe(10);
  });
  it("lifeを使い切ると dead になる", () => {
    let p = { ...base, life: 2 };
    p = stepParticle(p);
    expect(isParticleDead(p.life)).toBe(false);
    p = stepParticle(p);
    expect(isParticleDead(p.life)).toBe(true);
  });
});

describe("particleAlpha: max(0, life/maxLife)", () => {
  it("満タンで 1、半分で 0.5", () => {
    expect(particleAlpha(10, 10)).toBe(1);
    expect(particleAlpha(5, 10)).toBe(0.5);
  });
  it("0以下は 0 にクランプ（負 life でも）", () => {
    expect(particleAlpha(0, 10)).toBe(0);
    expect(particleAlpha(-3, 10)).toBe(0);
  });
});

describe("isParticleDead: life<=0 で消滅", () => {
  it.each([
    [1, false],
    [0, true],
    [-1, true],
  ])("life=%i → %s", (life, expected) => {
    expect(isParticleDead(life)).toBe(expected);
  });
});

describe("makeExplosionSpecs: 爆発スペック生成", () => {
  // 決定論的rng: 常に0.5を返す
  const half = () => 0.5;
  it("count 件生成し、起点座標を引き継ぐ", () => {
    const specs = makeExplosionSpecs(100, 200, ["#a", "#b"], 3, half);
    expect(specs).toHaveLength(3);
    for (const s of specs) {
      expect(s.x).toBe(100);
      expect(s.y).toBe(200);
    }
  });
  it("rng=0.5 のとき速度・サイズ・寿命が期待値どおり", () => {
    const [s] = makeExplosionSpecs(0, 0, ["#a", "#b"], 1, half);
    // angle=π, speed=6, size=6, life=35, color=colors[1]
    expect(s.vx).toBeCloseTo(Math.cos(Math.PI) * 6);
    expect(s.vy).toBeCloseTo(Math.sin(Math.PI) * 6 - 2);
    expect(s.size).toBe(6);
    expect(s.life).toBe(35);
    expect(s.color).toBe("#b");
  });
  it("count=0 は空配列", () => {
    expect(makeExplosionSpecs(0, 0, ["#a"], 0, half)).toEqual([]);
  });
  it("色は colors の中からのみ選ばれる（擬似乱数列で確認）", () => {
    const seq = [0.0, 0.999, 0.0, 0.999, 0.0];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const specs = makeExplosionSpecs(0, 0, ["#a", "#b", "#c"], 10, rng);
    for (const s of specs) expect(["#a", "#b", "#c"]).toContain(s.color);
  });
  it("size は 3〜9、life は 20〜50、speed は 2〜10 の範囲", () => {
    let seed = 1;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const specs = makeExplosionSpecs(0, 0, ["#a"], 200, rng);
    for (const s of specs) {
      expect(s.size).toBeGreaterThanOrEqual(3);
      expect(s.size).toBeLessThanOrEqual(9);
      expect(s.life).toBeGreaterThanOrEqual(20);
      expect(s.life).toBeLessThanOrEqual(50);
      expect(Math.hypot(s.vx, s.vy + 2)).toBeLessThanOrEqual(10);
    }
  });
});
