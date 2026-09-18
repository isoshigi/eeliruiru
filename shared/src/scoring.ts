// frontend / backend 共用: スコア計算の純粋関数
// 元: frontend/src/pure/scoring.ts（旧 public/app.js actionPullOut / handleMiss / addCombo）

export const FEVER_INTERVAL = 15;
export const RAW_PULL_POINTS_PER_EEL = 25;
export const PULL_BASE_POINTS_PER_EEL = 200;

export function calcComboBonus(combo: number): number {
  return 1 + Math.floor(combo / 5) * 0.25;
}

/** 黄金/焦げかけ引き上げの最終得点。旧実装: round(200*count*comboBonus*multiplier) */
export function calcPullPoints(count: number, combo: number, multiplier: number): number {
  const basePoints = PULL_BASE_POINTS_PER_EEL * count;
  return Math.round(basePoints * calcComboBonus(combo) * multiplier);
}

/** 生揚げ引き上げの得点。旧実装: 25 * count */
export function calcRawPullPoints(count: number): number {
  return RAW_PULL_POINTS_PER_EEL * count;
}

/** ミス時の減点。旧実装: wok残数>0 ? 120*残数 : 100 */
export function calcMissPenalty(wokEelCount: number): number {
  return wokEelCount > 0 ? 120 * wokEelCount : 100;
}

/** 減点適用（0未満にしない）。旧実装: Math.max(0, score - penalty) */
export function applyMissPenalty(score: number, penalty: number): number {
  return Math.max(0, score - penalty);
}

/** 15コンボごとにフィーバー。旧実装: combo % 15 === 0 */
export function shouldTriggerFever(combo: number): boolean {
  return combo % FEVER_INTERVAL === 0;
}
