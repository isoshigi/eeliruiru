import { describe, expect, it } from "vitest";
import {
  ITEMS,
  isCorrectSort,
  pickDangerIndex,
  pickNextItem,
} from "../../frontend/src/pure/items.js";

describe("ITEMS: マスタ定義", () => {
  it("5件（ウナギ1/危険3/イルカ1）の構成", () => {
    expect(ITEMS).toHaveLength(5);
    expect(ITEMS[0].type).toBe("eel");
    expect(ITEMS.slice(1, 4).every((i) => i.type === "danger")).toBe(true);
    expect(ITEMS[4].type).toBe("dolphin");
  });
});

describe("pickDangerIndex: 危険3種の選択", () => {
  it("0.0〜0.33… → 1", () => {
    expect(pickDangerIndex(0)).toBe(1);
    expect(pickDangerIndex(0.33)).toBe(1);
  });
  it("0.34〜0.66… → 2", () => {
    expect(pickDangerIndex(0.5)).toBe(2);
  });
  it("0.67〜0.99… → 3", () => {
    expect(pickDangerIndex(0.99)).toBe(3);
  });
});

// 仕様: rush時は常にウナギ / 通常時は rand<0.62 ウナギ / <0.92 危険 / 他 イルカ
describe("pickNextItem: 出現抽選", () => {
  it("rushMode では乱数に関わらず新鮮ウナギ", () => {
    expect(pickNextItem(true, 0.99, 0.99).id).toBe("eel");
    expect(pickNextItem(true, 0.0, 0.0).id).toBe("eel");
  });
  it("rand<0.62 → 新鮮ウナギ", () => {
    expect(pickNextItem(false, 0, 0).id).toBe("eel");
    expect(pickNextItem(false, 0.619, 0).id).toBe("eel");
  });
  it("0.62<=rand<0.92 → 危険3種（dangerRandで決定）", () => {
    expect(pickNextItem(false, 0.62, 0.0).id).toBe("electric_eel");
    expect(pickNextItem(false, 0.8, 0.5).id).toBe("poison_eel");
    expect(pickNextItem(false, 0.919, 0.99).id).toBe("anago");
  });
  it("rand>=0.92 → イルカ", () => {
    expect(pickNextItem(false, 0.92, 0).id).toBe("dolphin");
    expect(pickNextItem(false, 0.999, 0.99).id).toBe("dolphin");
  });
});

describe("isCorrectSort: 仕分けの正誤", () => {
  it("正解パターン", () => {
    expect(isCorrectSort("eel", "pan")).toBe(true);
    expect(isCorrectSort("danger", "trash")).toBe(true);
    expect(isCorrectSort("dolphin", "dolphin")).toBe(true);
  });
  it("不正解パターン（全9通りの残り6通り）", () => {
    expect(isCorrectSort("danger", "pan")).toBe(false);
    expect(isCorrectSort("dolphin", "pan")).toBe(false);
    expect(isCorrectSort("eel", "trash")).toBe(false);
    expect(isCorrectSort("dolphin", "trash")).toBe(false);
    expect(isCorrectSort("eel", "dolphin")).toBe(false);
    expect(isCorrectSort("danger", "dolphin")).toBe(false);
  });
});
