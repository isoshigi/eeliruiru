// 調理メーター系の純粋関数（元: public/app.js updateWokCooking / actionPullOut）
// 境界値は旧実装と同一: raw < 50 <= perfect <= 85 < burning < 100 <= burned
export const COOK_STEP = 1.25;
export const COOK_PERFECT_MIN = 50;
export const COOK_PERFECT_MAX = 85;
export const COOK_BURNED_AT = 100;
export const PULL_MULTIPLIERS = {
    1: 1.0,
    2: 1.8,
    3: 2.8,
    4: 4.0,
    5: 5.5,
};
/** cookProgress から調理ステータスを求める。empty 判定は呼び出し側（eelCount===0）が行う。 */
export function getCookStatus(progress) {
    if (progress < COOK_PERFECT_MIN)
        return "raw";
    if (progress <= COOK_PERFECT_MAX)
        return "perfect";
    if (progress < COOK_BURNED_AT)
        return "burning";
    return "burned";
}
/** 50ms tick ごとの進行。旧実装: cookProgress += 1.25 */
export function stepCookProgress(prev, delta = COOK_STEP) {
    return prev + delta;
}
/** 引き上げ倍率。範囲外は 1.0（旧実装の `|| 1.0` と同等）。 */
export function getPullMultiplier(count) {
    return PULL_MULTIPLIERS[count] ?? 1.0;
}
