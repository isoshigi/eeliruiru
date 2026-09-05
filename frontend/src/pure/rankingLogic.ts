// ランキング表示ロジック（元: public/app.js renderRankingRows / checkAndHandleHighScore / btn-share）

export interface RankingRow {
  name: string;
  score: number;
}

export const RANKING_MAX_ROWS = 5;
export const PLAYER_NAME_FALLBACK = "ウナギ職人";
export const PLAYER_NAME_MAX_LEN = 8;

const MEDALS = ["🥇", "🥈", "🥉"] as const;

/** 順位メダル。旧実装: 0→🥇 1→🥈 2→🥉 3以降→"n." */
export function getMedalLabel(index: number): string {
  if (index < MEDALS.length) return MEDALS[index];
  return `${index + 1}.`;
}

/** スコア降順ソート（非破壊）して上位5件に絞る。旧実装: sort((a,b)=>b.score-a.score).slice(0,5) */
export function sortRankings<T extends RankingRow>(rows: readonly T[]): T[] {
  return rows.slice().sort((a, b) => b.score - a.score).slice(0, RANKING_MAX_ROWS);
}

/**
 * 登録名の整形。旧実装の登録成功パス: value.trim().slice(0,8) || 'ウナギ職人'
 * ※端末保存フォールバック側は slice なしのまま impl 側に残す（挙動据え置き）。
 */
export function sanitizePlayerName(raw: string, maxLen: number = PLAYER_NAME_MAX_LEN): string {
  const trimmed = raw.trim().slice(0, maxLen);
  return trimmed || PLAYER_NAME_FALLBACK;
}

/** X共有文。旧実装のテンプレをそのまま切り出し。 */
export function buildShareText(score: number, rank: string): string {
  return `『イール炒る、要る？』居る居る閣で売上【${score}点】を達成！\n称号：${rank}\n#イール炒る要る #居る居る閣`;
}
