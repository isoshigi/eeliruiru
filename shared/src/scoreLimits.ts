// frontend / backend 共用: スコア上限の定義
// zod 検証・DB CHECK・クライアント表示で基準がずれないよう単一の真実源とする。
/** 60秒プレイの物理上限を超えるスコアは拒否（5匹黄金連打の理論値を余裕見て設定）。 */
export const ABS_SCORE_CAP = 60000;
export const SCORE_MIN = 0;
export const SCORE_MAX = 99999;
/** 内訳カウンタ（fried/discarded/saved/burned）の上限。 */
export const STAT_MAX = 999;
