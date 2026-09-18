import { describe, expect, it } from "vitest";
import {
  normalizePlayerName,
  PLAYER_NAME_FALLBACK,
  PLAYER_NAME_MAX_LEN,
  stripUnsafeChars,
} from "../../shared/src/playerName.js";

describe("stripUnsafeChars: 名前から危険な文字を除く", () => {
  it("NFKC 正規化する", () => {
    expect(stripUnsafeChars("ＡＢＣ")).toBe("ABC");
  });
  it("制御文字・ゼロ幅文字を除去する", () => {
    expect(stripUnsafeChars("a\u0000b\u200Bc")).toBe("abc");
  });
  it("タグ混入に使える記号を除去する", () => {
    expect(stripUnsafeChars('a<b>"c"&d')).toBe("abcd");
  });
});

describe("normalizePlayerName: 登録名の正規化", () => {
  it("trim して上限で切り詰める", () => {
    expect(normalizePlayerName("  abcdef  ", 3)).toBe("abc");
  });
  it("既定の上限は20文字（DB CHECK と一致）", () => {
    expect(PLAYER_NAME_MAX_LEN).toBe(20);
    expect(normalizePlayerName("x".repeat(25))).toHaveLength(20);
  });
  it("空・記号のみはフォールバック", () => {
    expect(normalizePlayerName("")).toBe(PLAYER_NAME_FALLBACK);
    expect(normalizePlayerName("<>")).toBe(PLAYER_NAME_FALLBACK);
  });
});
