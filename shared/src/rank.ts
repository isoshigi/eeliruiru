// frontend / backend 共用: 結果称号の判定
// フロント表示とサーバー保存で同一ロジックを使い、クライアント改ざんの影響をなくす。
/** 旧実装の分岐順序を維持（スコア優先、最後に burned>=4）。 */
export function getRankTitle(score: number, burned: number): string {
  if (score >= 10000) return "👑 伝説の爆熱ウナギ炒り神";
  if (score >= 6000) return "🔥 一流ウナギ炒り職人";
  if (score >= 3000) return "🍳 一人前の調理人";
  if (burned >= 4) return "⚠️ ボヤ騒ぎを起こした危険人物";
  return "見習いシェフ";
}
