import { describe, expect, it } from "vitest";
import { COOK_STEP, getCookStatus, getPullMultiplier, stepCookProgress } from "../../frontend/src/pure/cook.js";

// 仕様: 調理ステータスは raw <50 / perfect 50-85 / burning 85-100 / burned 100以上
describe("getCookStatus: 進捗値から調理状態を求める", () => {
  it("50未満は raw（生）", () => {
    expect(getCookStatus(0)).toBe("raw");
    expect(getCookStatus(49.99)).toBe("raw");
    expect(getCookStatus(-1)).toBe("raw");
  });
  it("50ちょうど〜85ちょうどは perfect（黄金）", () => {
    expect(getCookStatus(50)).toBe("perfect");
    expect(getCookStatus(60)).toBe("perfect");
    expect(getCookStatus(85)).toBe("perfect");
  });
  it("85超過〜100未満は burning（焦げかけ）", () => {
    expect(getCookStatus(85.01)).toBe("burning");
    expect(getCookStatus(99.99)).toBe("burning");
  });
  it("100以上は burned（全滅焦がし）", () => {
    expect(getCookStatus(100)).toBe("burned");
    expect(getCookStatus(150)).toBe("burned");
  });
});

describe("stepCookProgress: tickごとの加算", () => {
  it("既定で +1.25 進む", () => {
    expect(stepCookProgress(0)).toBeCloseTo(1.25);
    expect(stepCookProgress(60)).toBeCloseTo(61.25);
  });
  it("delta を指定できる", () => {
    expect(stepCookProgress(10, 5)).toBe(15);
    expect(stepCookProgress(10, 0)).toBe(10);
  });
  it("40tickで raw(0)→perfect下限(50)に到達する", () => {
    let p = 0;
    for (let i = 0; i < 40; i++) p = stepCookProgress(p);
    expect(p).toBeCloseTo(50, 10);
    expect(getCookStatus(p)).toBe("perfect");
  });
  it("COOK_STEP 定数は旧実装の 1.25 と等しい", () => {
    expect(COOK_STEP).toBe(1.25);
  });
});

describe("getPullMultiplier: 匹数ごとの倍率", () => {
  it.each([
    [1, 1.0],
    [2, 1.8],
    [3, 2.8],
    [4, 4.0],
    [5, 5.5],
  ])("%i匹 → %f倍", (count, expected) => {
    expect(getPullMultiplier(count)).toBe(expected);
  });
  it("範囲外（0/6/負数）は 1.0 にフォールバック", () => {
    expect(getPullMultiplier(0)).toBe(1.0);
    expect(getPullMultiplier(6)).toBe(1.0);
    expect(getPullMultiplier(-2)).toBe(1.0);
  });
});
