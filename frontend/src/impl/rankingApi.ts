// オンラインランキング通信（非純粋: fetch）
// 元: public/app.js fetchRankings / checkAndHandleHighScore 内の POST

export type RankingScope = "daily" | "alltime";

export interface ServerRanking {
  name: string;
  score: number;
  rank_title?: string;
}

export interface SaveScorePayload {
  name: string;
  score: number;
  rankTitle: string;
  fried: number;
  discarded: number;
  saved: number;
  burned: number;
}

export async function fetchRankings(scope: RankingScope): Promise<ServerRanking[] | null> {
  try {
    const res = await fetch("/api/rankings?scope=" + scope + "&limit=5");
    if (!res.ok) throw new Error("bad status " + res.status);
    const data = (await res.json()) as { rankings?: unknown };
    if (!Array.isArray(data.rankings)) throw new Error("bad payload");
    return data.rankings as ServerRanking[];
  } catch (e) {
    return null;
  }
}

export async function postScore(payload: SaveScorePayload): Promise<{ rankInDaily?: number }> {
  const res = await fetch("/api/scores", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      score: payload.score,
      rankTitle: payload.rankTitle,
      fried: payload.fried,
      discarded: payload.discarded,
      saved: payload.saved,
      burned: payload.burned,
    }),
  });
  if (!res.ok) throw new Error("save failed: " + res.status);
  return (await res.json()) as { rankInDaily?: number };
}
