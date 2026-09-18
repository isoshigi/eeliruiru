import { describe, expect, it } from "vitest";
import { toSaveScorePayload } from "../../shared/src/api.js";

describe("toSaveScorePayload: フロント統計→APIボディ", () => {
  it("cooked/trashed を fried/discarded に対応付ける", () => {
    expect(
      toSaveScorePayload("うな吉", 1200, "見習いシェフ", {
        cooked: 3,
        trashed: 2,
        saved: 1,
        burned: 0,
      }),
    ).toEqual({
      name: "うな吉",
      score: 1200,
      rankTitle: "見習いシェフ",
      fried: 3,
      discarded: 2,
      saved: 1,
      burned: 0,
    });
  });

  it("stats 未定義はすべて0にする", () => {
    expect(toSaveScorePayload("x", 1, "r", undefined)).toEqual({
      name: "x",
      score: 1,
      rankTitle: "r",
      fried: 0,
      discarded: 0,
      saved: 0,
      burned: 0,
    });
  });
});
