// frontend / backend 共用: 登録名の正規化
// NFKC正規化・制御文字除去・trim・上限切り詰め・空名フォールバックを一元化する。
export const PLAYER_NAME_FALLBACK = "ウナギ職人";
/** 登録名の最大文字数（DB CHECK(1..20) と一致させる）。 */
export const PLAYER_NAME_MAX_LEN = 20;

/** 制御文字・私用領域・タグ混入に使える記号を除去する。 */
export function stripUnsafeChars(raw: string): string {
  return (
    raw
      .normalize("NFKC")
      // biome-ignore lint/suspicious/noControlCharactersInRegex: 制御文字・ゼロ幅文字は名前から除去する対象
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\u2060-\u2064\uFEFF]/g, "")
      .replace(/[<>"&]/g, "")
  );
}

export function normalizePlayerName(raw: string, maxLen: number = PLAYER_NAME_MAX_LEN): string {
  const clean = stripUnsafeChars(raw).trim().slice(0, maxLen).trim();
  return clean || PLAYER_NAME_FALLBACK;
}
