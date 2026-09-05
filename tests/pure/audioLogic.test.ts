import { describe, expect, it } from "vitest";
import {
  BGM_MELODY,
  BGM_SCALE,
  PERFECT_PULL_FREQS,
  getBgmNoteFreq,
  getPerfectPullNotes,
  sizzleBaseFreq,
} from "../../frontend/src/pure/audioLogic.js";

describe("sizzleBaseFreq: ジュー音の基準周波数 500+(n-1)*120", () => {
  it.each([
    [1, 500],
    [2, 620],
    [3, 740],
    [5, 980],
  ])("%i匹 → %iHz", (count, expected) => {
    expect(sizzleBaseFreq(count)).toBe(expected);
  });
});

describe("getPerfectPullNotes: 引き上げ音列 slice(0, 2+multiplier)", () => {
  it("multiplier=1 → 先頭3音", () => {
    expect(getPerfectPullNotes(1)).toEqual([523.25, 659.25, 783.99]);
  });
  it("multiplier=5 → 先頭7音（全6音を超える指定は全件）", () => {
    expect(getPerfectPullNotes(5)).toEqual([...PERFECT_PULL_FREQS]);
  });
  it("0 → 先頭2音", () => {
    expect(getPerfectPullNotes(0)).toHaveLength(2);
  });
  it("返却配列の操作が定数に波及しない", () => {
    const notes = getPerfectPullNotes(1);
    notes.push(9999);
    expect(PERFECT_PULL_FREQS).toHaveLength(6);
  });
});

describe("getBgmNoteFreq: 合成BGMの音高 scale[melody[i%16]]", () => {
  it("0番目は scale[0]=261.63", () => {
    expect(getBgmNoteFreq(0)).toBe(261.63);
  });
  it("1番目は melody[1]=2 → scale[2]=329.63", () => {
    expect(getBgmNoteFreq(1)).toBe(BGM_SCALE[BGM_MELODY[1]]);
  });
  it("16番目で一周する（周期16）", () => {
    expect(getBgmNoteFreq(16)).toBe(getBgmNoteFreq(0));
    expect(getBgmNoteFreq(17)).toBe(getBgmNoteFreq(1));
  });
  it("大きな index でも範囲内に収まる", () => {
    expect(getBgmNoteFreq(1000)).toBeGreaterThan(0);
  });
});
