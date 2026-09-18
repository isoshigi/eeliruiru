// オンラインランキング通信（非純粋: fetch）
// 型は shared を単一の真実源とし、既存 import 互換のため再エクスポートする。
import type { RankingScope, SaveScorePayload, ServerRanking } from "../../../shared/src/api.js";

export type { RankingScope, SaveScorePayload, ServerRanking } from "../../../shared/src/api.js";

export async function fetchRankings(scope: RankingScope): Promise<ServerRanking[] | null> {
  try {
    const res = await fetch(`/api/rankings?scope=${scope}&limit=5`);
    if (!res.ok) throw new Error(`bad status ${res.status}`);
    const data = (await res.json()) as { rankings?: unknown };
    if (!Array.isArray(data.rankings)) throw new Error("bad payload");
    return data.rankings as ServerRanking[];
  } catch {
    return null;
  }
}

export async function postScore(payload: SaveScorePayload): Promise<{ rankInDaily?: number }> {
  const res = await fetch("/api/scores", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`save failed: ${res.status}`);
  return (await res.json()) as { rankInDaily?: number };
}
