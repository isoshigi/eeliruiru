// ゲーム状態の生成（元: public/app.js startGame / startTutorialMode の gameState 初期化）

import type { Item } from "./items.js";

export interface WokState {
  eelCount: number;
  cookProgress: number;
  status: "empty" | "raw" | "perfect" | "burning" | "burned";
}

export interface GameStats {
  cooked: number;
  trashed: number;
  saved: number;
  burned: number;
}

export interface GameState {
  isPlaying: boolean;
  isTutorial: boolean;
  score: number;
  timeLeft: number;
  combo: number;
  rushMode: boolean;
  rushTimer: ReturnType<typeof setTimeout> | null;
  timerInterval: ReturnType<typeof setInterval> | null;
  cookInterval: ReturnType<typeof setInterval> | null;
  currentItem: Item | null;
  wok: WokState;
  stats: GameStats;
}

export const TUTORIAL_TIME_LEFT = 999;
export const GAME_TIME_LEFT = 60;

/** 旧実装の2箇所の初期化リテラルを一本化。差は isTutorial / timeLeft のみ。 */
export function createInitialGameState(opts: { isTutorial: boolean }): GameState {
  return {
    isPlaying: true,
    isTutorial: opts.isTutorial,
    score: 0,
    timeLeft: opts.isTutorial ? TUTORIAL_TIME_LEFT : GAME_TIME_LEFT,
    combo: 0,
    rushMode: false,
    rushTimer: null,
    timerInterval: null,
    cookInterval: null,
    currentItem: null,
    wok: { eelCount: 0, cookProgress: 0, status: "empty" },
    stats: { cooked: 0, trashed: 0, saved: 0, burned: 0 },
  };
}
