// フロント側の既存 import を維持するための再エクスポート。
// 実体は frontend / backend 共用の shared/src にある。

export { getRankTitle } from "../../../shared/src/rank.js";
export * from "../../../shared/src/scoring.js";
