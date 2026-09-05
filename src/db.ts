export interface ScoreRow {
  id: number;
  name: string;
  score: number;
  rank_title: string;
  fried: number;
  discarded: number;
  saved: number;
  burned: number;
  season: string;
  created_at: string;
}

export interface NewScore {
  name: string;
  score: number;
  rankTitle: string;
  fried: number;
  discarded: number;
  saved: number;
  burned: number;
  season: string;
  ipHash: string;
}

/** JST (Asia/Tokyo) の YYYY-MM-DD を返す。デイリー締め用。 */
export function todaySeasonJST(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // YYYY-MM-DD
}

export async function getRankings(
  db: D1Database,
  scope: "daily" | "alltime",
  season: string,
  limit: number,
): Promise<ScoreRow[]> {
  const n = Math.min(Math.max(limit, 1), 50);
  if (scope === "daily") {
    const { results } = await db
      .prepare(
        `SELECT id, name, score, rank_title, fried, discarded, saved, burned, season, created_at
         FROM scores WHERE season = ? ORDER BY score DESC, id ASC LIMIT ?`,
      )
      .bind(season, n)
      .all<ScoreRow>();
    return results ?? [];
  }
  const { results } = await db
    .prepare(
      `SELECT id, name, score, rank_title, fried, discarded, saved, burned, season, created_at
       FROM scores ORDER BY score DESC, id ASC LIMIT ?`,
    )
    .bind(n)
    .all<ScoreRow>();
  return results ?? [];
}

export async function insertScore(db: D1Database, s: NewScore): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO scores (name, score, rank_title, fried, discarded, saved, burned, season, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      s.name,
      s.score,
      s.rankTitle,
      s.fried,
      s.discarded,
      s.saved,
      s.burned,
      s.season,
      s.ipHash,
    )
    .run();
  return Number(result.meta.last_row_id);
}

/** スコープ内での順位（1-indexed）を返す。 */
export async function rankInScope(
  db: D1Database,
  scope: "daily" | "alltime",
  season: string,
  score: number,
  id: number,
): Promise<number> {
  const where = scope === "daily" ? `WHERE season = ?` : ``;
  const params = scope === "daily" ? [season, score, score, id] : [score, score, id];
  const row = await db
    .prepare(
      `SELECT COUNT(*) + 1 AS rank FROM scores ${where}
       ${scope === "daily" ? "AND" : "WHERE"} (score > ? OR (score = ? AND id < ?))`,
    )
    .bind(...params)
    .first<{ rank: number }>();
  return row?.rank ?? 1;
}

/** 簡易レート制限: 直近60秒の同一ハッシュ投稿数。 */
export async function recentPostsByHash(
  db: D1Database,
  ipHash: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS c FROM scores
       WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now','-60 seconds')`,
    )
    .bind(ipHash)
    .first<{ c: number }>();
  return row?.c ?? 0;
}
