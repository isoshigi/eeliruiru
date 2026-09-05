// 端末内ランキング保存（非純粋: localStorage）
// 元: public/app.js loadLocalRankings / saveLocalRankings

export const RANKING_KEY = "iru_iru_kaku_rankings_v1";

export interface LocalRanking {
  name: string;
  score: number;
  rank_title?: string;
  rank?: string;
}

export const FALLBACK_RANKINGS: LocalRanking[] = [
  { name: "居る居る閣 龍", score: 8500, rank_title: "👑 伝説の爆熱ウナギ炒り神" },
  { name: "さすらいシェフ", score: 5400, rank_title: "🔥 一流ウナギ炒り職人" },
  { name: "うな吉", score: 3200, rank_title: "🍳 一人前の調理人" },
  { name: "看板娘アオイ", score: 1800, rank_title: "見習いシェフ" },
  { name: "新人スタッフルーキー", score: 800, rank_title: "見習いシェフ" },
];

export function loadLocalRankings(): LocalRanking[] {
  try {
    const data = localStorage.getItem(RANKING_KEY);
    if (data) return JSON.parse(data) as LocalRanking[];
  } catch (e) {
    /* ignore */
  }
  return FALLBACK_RANKINGS.slice();
}

export function saveLocalRankings(rankings: LocalRanking[]): void {
  try {
    localStorage.setItem(RANKING_KEY, JSON.stringify(rankings.slice(0, 5)));
  } catch (e) {
    /* ignore */
  }
}
