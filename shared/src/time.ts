// frontend / backend 共用: ランキングキャッシュの10分バケット
// 日時はきりの良い10分境界（UTC基準＝JSTでも境界一致）で区切る。
/** 10分バケット幅（ミリ秒）。 */
export const RANKING_BUCKET_MS = 10 * 60 * 1000;

/** 指定時刻が属するバケットの開始時刻（ミリ秒epoch）。 */
export function rankingBucketStart(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / RANKING_BUCKET_MS) * RANKING_BUCKET_MS;
}

/** バケット開始時刻のISO文字列（cachedAtとして配布）。 */
export function rankingBucketStartISO(nowMs: number = Date.now()): string {
  return new Date(rankingBucketStart(nowMs)).toISOString();
}

/** 次バケットまでの残り秒数（Cache-Control: max-age用、最低1）。 */
export function secondsToNextBucket(nowMs: number = Date.now()): number {
  return Math.max(1, Math.ceil((rankingBucketStart(nowMs) + RANKING_BUCKET_MS - nowMs) / 1000));
}
