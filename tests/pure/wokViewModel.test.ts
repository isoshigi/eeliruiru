import { describe, expect, it } from "vitest";
import {
  EMPTY_PULL_BONUS_TEXT,
  getPullBonusText,
  getWokBadgeText,
  getWokStatusView,
} from "../../frontend/src/pure/wokViewModel.js";

describe("getWokBadgeText: 匹数バッジ", () => {
  it.each([
    [0, "0/5 匹"],
    [1, "1/5 匹"],
    [5, "5/5 匹"],
  ])("%i匹 → %s", (n, expected) => {
    expect(getWokBadgeText(n)).toBe(expected);
  });
});

describe("getPullBonusText: 引き上げボーナス文言", () => {
  it.each([
    [1, "1匹引き上げ（標準）"],
    [2, "2匹引き上げ（1.8倍ボーナス）"],
    [3, "3匹引き上げ（2.8倍ボーナス）"],
    [4, "4匹引き上げ（4.0倍ボーナス）"],
    [5, "5匹引き上げ（超絶5.5倍倍率ボーナス！！）"],
  ])("%i匹 → %s", (n, expected) => {
    expect(getPullBonusText(n)).toBe(expected);
  });
  it("0匹など範囲外は空鍋デフォルト文", () => {
    expect(getPullBonusText(0)).toBe(EMPTY_PULL_BONUS_TEXT);
    expect(getPullBonusText(6)).toBe(EMPTY_PULL_BONUS_TEXT);
  });
});

describe("getWokStatusView: 状態ごとの表示", () => {
  it("空鍋は『鍋は空っぽ』・湯気なし", () => {
    expect(getWokStatusView("empty", 0)).toMatchObject({
      text: "鍋は空っぽ",
      tone: "idle",
      steamVisible: false,
    });
    expect(getWokStatusView("raw", 0).text).toBe("鍋は空っぽ");
  });
  it("raw は炒め中文言・湯気なし", () => {
    const v = getWokStatusView("raw", 2);
    expect(v.text).toBe("じわじわ炒め中… (2/5匹)");
    expect(v.tone).toBe("raw");
    expect(v.steamVisible).toBe(false);
  });
  it("perfect は黄金文言・湯気あり・ハイライト", () => {
    const v = getWokStatusView("perfect", 3);
    expect(v.text).toBe("【要る！】極上の焼き加減！(3匹)");
    expect(v.tone).toBe("perfect");
    expect(v.steamVisible).toBe(true);
    expect(v.highlight).toBe(true);
  });
  it("burning/burned は警告文言・湯気あり", () => {
    for (const s of ["burning", "burned"] as const) {
      const v = getWokStatusView(s, 1);
      expect(v.text).toBe("焦げる！今すぐ盛れ！");
      expect(v.tone).toBe("burning");
      expect(v.steamVisible).toBe(true);
    }
  });
});
