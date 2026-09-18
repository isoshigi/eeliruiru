// ランキング表示ロジック（元: public/app.js renderRankingRows / checkAndHandleHighScore / btn-share）
// 名前正規化は shared に集約し、既存の呼び名 (sanitizePlayerName) も互換のため再エクスポートする。
export {
  normalizePlayerName,
  normalizePlayerName as sanitizePlayerName,
  PLAYER_NAME_FALLBACK,
  PLAYER_NAME_MAX_LEN,
  stripUnsafeChars,
} from "../../../shared/src/playerName.js";

export interface RankingRow {
  name: string;
  score: number;
}

export const RANKING_MAX_ROWS = 5;

const MEDALS = ["🥇", "🥈", "🥉"] as const;

/** 順位メダル。旧実装: 0→🥇 1→🥈 2→🥉 3以降→"n." */
export function getMedalLabel(index: number): string {
  if (index < MEDALS.length) return MEDALS[index];
  return `${index + 1}.`;
}

/** スコア降順ソート（非破壊）して上位5件に絞る。旧実装: sort((a,b)=>b.score-a.score).slice(0,5) */
export function sortRankings<T extends RankingRow>(rows: readonly T[]): T[] {
  return rows
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, RANKING_MAX_ROWS);
}

/** X共有文。旧実装のテンプレをそのまま切り出し。 */
export function buildShareText(score: number, rank: string): string {
  return `『イール炒る、要る？』居る居る閣で売上【${score}点】を達成！\n称号：${rank}\n#イール炒る要る #居る居る閣`;
}
