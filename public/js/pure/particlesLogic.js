// パーティクル物理の純粋関数（元: public/app.js Particle / createExplosion / renderParticles）
export const GRAVITY = 0.15;
/** 1フレーム進行。旧実装: x+=vx, y+=vy, vy+=0.15, life--（非破壊で返す）。 */
export function stepParticle(p) {
    return {
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + GRAVITY,
        life: p.life - 1,
    };
}
/** 描画α。旧実装: max(0, life/maxLife) */
export function particleAlpha(life, maxLife) {
    return Math.max(0, life / maxLife);
}
/** 消滅判定。旧実装: life <= 0 で splice */
export function isParticleDead(life) {
    return life <= 0;
}
/**
 * 爆発の発生スペック。
 * 旧実装は Math.random を直呼びしていたため rng を注入して決定化する。
 * 消費順序: angle → speed → color → size → life の順に1個ずつ。
 */
export function makeExplosionSpecs(x, y, colors, count, rng = Math.random) {
    const specs = [];
    for (let i = 0; i < count; i++) {
        const angle = rng() * Math.PI * 2;
        const speed = rng() * 8 + 2;
        const color = colors[Math.floor(rng() * colors.length)];
        const size = rng() * 6 + 3;
        const life = rng() * 30 + 20;
        specs.push({
            x,
            y,
            color,
            size,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life,
        });
    }
    return specs;
}
