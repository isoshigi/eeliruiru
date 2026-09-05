import { describe, expect, it } from "vitest";
import {
  applyMissPenalty,
  calcComboBonus,
  calcMissPenalty,
  calcPullPoints,
  calcRawPullPoints,
  getRankTitle,
  shouldTriggerFever,
} from "../../frontend/src/pure/scoring.js";

// 仕様: コンボボーナス = 1 + floor(combo/5)*0.25
describe("calcComboBonus: コンボ数からのボーナス倍率", () => {
  it.each([
    [0, 1.0],
    [4, 1.0],
    [5, 1.25],
    [9, 1.25],
    [10, 1.5],
    [15, 1.75],
    [20, 2.0],
  ])("combo=%i → %f", (combo, expected) => {
    expect(calcComboBonus(combo)).toBe(expected);
  });
});

// 仕様: round(200*count*comboBonus*multiplier)
describe("calcPullPoints: 黄金引き上げの最終得点", () => {
  it("1匹・コンボ0・等倍 → 200点", () => {
    expect(calcPullPoints(1, 0, 1.0)).toBe(200);
  });
  it("5匹・コンボ0・5.5倍 → 5500点", () => {
    expect(calcPullPoints(5, 0, 5.5)).toBe(5500);
  });
  it("コンボ5（1.25倍）が乗る: 1匹 → 250点", () => {
    expect(calcPullPoints(1, 5, 1.0)).toBe(250);
  });
  it("小数切り上げ/切り捨ては round に従う", () => {
    // 200*2*1.0*1.8 = 720
    expect(calcPullPoints(2, 0, 1.8)).toBe(720);
    // 200*3*1.25*2.8 = 2100
    expect(calcPullPoints(3, 5, 2.8)).toBe(2100);
  });
});

describe("calcRawPullPoints: 生揚げは 25*匹数", () => {
  it.each([
    [1, 25],
    [3, 75],
    [5, 125],
  ])("%i匹 → %i点", (count, expected) => {
    expect(calcRawPullPoints(count)).toBe(expected);
  });
  it("0匹は 0点", () => {
    expect(calcRawPullPoints(0)).toBe(0);
  });
});

describe("calcMissPenalty / applyMissPenalty: ミス減点", () => {
  it("鍋が空なら 100点", () => {
    expect(calcMissPenalty(0)).toBe(100);
  });
  it("鍋に残数があれば 120*残数", () => {
    expect(calcMissPenalty(1)).toBe(120);
    expect(calcMissPenalty(5)).toBe(600);
  });
  it("スコアがマイナスにならない（下限0）", () => {
    expect(applyMissPenalty(50, 100)).toBe(0);
    expect(applyMissPenalty(0, 100)).toBe(0);
    expect(applyMissPenalty(500, 120)).toBe(380);
  });
});

// 仕様: 10000→伝説 / 6000→一流 / 3000→一人前 / burned>=4→危険人物 / 他→見習い
describe("getRankTitle: 結果称号の分岐", () => {
  it.each([
    [10000, 0, "👑 伝説の爆熱ウナギ炒り神"],
    [15000, 9, "👑 伝説の爆熱ウナギ炒り神"],
    [9999, 0, "🔥 一流ウナギ炒り職人"],
    [6000, 0, "🔥 一流ウナギ炒り職人"],
    [5999, 0, "🍳 一人前の調理人"],
    [3000, 0, "🍳 一人前の調理人"],
  ])("score=%i burned=%i → %s", (score, burned, expected) => {
    expect(getRankTitle(score, burned)).toBe(expected);
  });
  it("スコア不足でも burned>=4 なら危険人物", () => {
    expect(getRankTitle(0, 4)).toBe("⚠️ ボヤ騒ぎを起こした危険人物");
    expect(getRankTitle(2999, 5)).toBe("⚠️ ボヤ騒ぎを起こした危険人物");
  });
  it("burned 3以下・低スコアは見習い", () => {
    expect(getRankTitle(0, 0)).toBe("見習いシェフ");
    expect(getRankTitle(2999, 3)).toBe("見習いシェフ");
  });
  it("スコア称号が burned 称号より優先される", () => {
    expect(getRankTitle(3000, 10)).toBe("🍳 一人前の調理人");
  });
});

describe("shouldTriggerFever: 15コンボごとにフィーバー", () => {
  it("15の倍数（0含む）で true", () => {
    expect(shouldTriggerFever(15)).toBe(true);
    expect(shouldTriggerFever(30)).toBe(true);
  });
  it("それ以外は false", () => {
    expect(shouldTriggerFever(1)).toBe(false);
    expect(shouldTriggerFever(14)).toBe(false);
    expect(shouldTriggerFever(16)).toBe(false);
  });
});
