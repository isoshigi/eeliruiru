import { describe, expect, it } from "vitest";
import { GAME_TIME_LEFT, TUTORIAL_TIME_LEFT, createInitialGameState } from "../../frontend/src/pure/gameState.js";
import {
  TUTORIAL_TOTAL_STEPS,
  isTutorialFinished,
  shouldAdvanceTutorial,
  shouldFinishTutorialOnPull,
} from "../../frontend/src/pure/tutorialLogic.js";

describe("createInitialGameState: 初期状態（旧 startGame/startTutorialMode と同一）", () => {
  it("本番は isTutorial=false・残り60秒", () => {
    const s = createInitialGameState({ isTutorial: false });
    expect(s.isPlaying).toBe(true);
    expect(s.isTutorial).toBe(false);
    expect(s.timeLeft).toBe(60);
    expect(s.timeLeft).toBe(GAME_TIME_LEFT);
  });
  it("チュートリアルは残り999・∞表示の元値", () => {
    const s = createInitialGameState({ isTutorial: true });
    expect(s.isTutorial).toBe(true);
    expect(s.timeLeft).toBe(999);
    expect(s.timeLeft).toBe(TUTORIAL_TIME_LEFT);
  });
  it("スコア・コンボ・鍋・統計が初期化される", () => {
    const s = createInitialGameState({ isTutorial: false });
    expect(s.score).toBe(0);
    expect(s.combo).toBe(0);
    expect(s.rushMode).toBe(false);
    expect(s.wok).toEqual({ eelCount: 0, cookProgress: 0, status: "empty" });
    expect(s.stats).toEqual({ cooked: 0, trashed: 0, saved: 0, burned: 0 });
    expect(s.currentItem).toBeNull();
  });
  it("タイマーハンドルは null 始まり", () => {
    const s = createInitialGameState({ isTutorial: false });
    expect(s.rushTimer).toBeNull();
    expect(s.timerInterval).toBeNull();
    expect(s.cookInterval).toBeNull();
  });
  it("呼び出しごとに独立したオブジェクトを返す", () => {
    const a = createInitialGameState({ isTutorial: false });
    const b = createInitialGameState({ isTutorial: false });
    a.wok.eelCount = 5;
    expect(b.wok.eelCount).toBe(0);
  });
});

describe("shouldAdvanceTutorial: STEP進行条件（0-pan/1-trash/2-dolphin）", () => {
  it("期待操作で true", () => {
    expect(shouldAdvanceTutorial(0, "pan")).toBe(true);
    expect(shouldAdvanceTutorial(1, "trash")).toBe(true);
    expect(shouldAdvanceTutorial(2, "dolphin")).toBe(true);
  });
  it("期待外の操作では進まない（全9通り）", () => {
    expect(shouldAdvanceTutorial(0, "trash")).toBe(false);
    expect(shouldAdvanceTutorial(0, "dolphin")).toBe(false);
    expect(shouldAdvanceTutorial(1, "pan")).toBe(false);
    expect(shouldAdvanceTutorial(1, "dolphin")).toBe(false);
    expect(shouldAdvanceTutorial(2, "pan")).toBe(false);
    expect(shouldAdvanceTutorial(2, "trash")).toBe(false);
    expect(shouldAdvanceTutorial(3, "pan")).toBe(false);
  });
});

describe("shouldFinishTutorialOnPull / isTutorialFinished", () => {
  it("STEP4（index 3）の引き上げでのみ完了", () => {
    expect(shouldFinishTutorialOnPull(3)).toBe(true);
    expect(shouldFinishTutorialOnPull(2)).toBe(false);
  });
  it("stepIdx>=4 で終了（TUTORIAL_TOTAL_STEPS=4）", () => {
    expect(TUTORIAL_TOTAL_STEPS).toBe(4);
    expect(isTutorialFinished(3)).toBe(false);
    expect(isTutorialFinished(4)).toBe(true);
    expect(isTutorialFinished(5)).toBe(true);
  });
});
