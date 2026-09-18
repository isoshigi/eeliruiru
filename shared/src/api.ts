// frontend / backend 共用: API の型とペイロード変換
// cooked→fried / trashed→discarded の変換点を toSaveScorePayload ただ一つに集約する。
export type RankingScope = "daily" | "alltime";

export interface ServerRanking {
  name: string;
  score: number;
  /** DB の rank_title（サーバー再計算値）。 */
  rank_title?: string;
}

/** POST /api/scores のリクエストボディ。 */
export interface SaveScorePayload {
  name: string;
  score: number;
  rankTitle: string;
  fried: number;
  discarded: number;
  saved: number;
  burned: number;
}

/** フロントのプレイ統計（呼称は cooked/trashed）。 */
export interface PlayStats {
  cooked?: number;
  trashed?: number;
  saved?: number;
  burned?: number;
}

/** プレイ統計を API のフィールド名へ変換する唯一の場所。 */
export function toSaveScorePayload(
  name: string,
  score: number,
  rankTitle: string,
  stats: PlayStats | undefined,
): SaveScorePayload {
  return {
    name,
    score,
    rankTitle,
    fried: stats?.cooked ?? 0,
    discarded: stats?.trashed ?? 0,
    saved: stats?.saved ?? 0,
    burned: stats?.burned ?? 0,
  };
}
