// ゲーム状態コンテナ（非純粋: モジュール共有の可変シングルトン）
// 初期値の形は pure/gameState.ts の createInitialGameState に一本化。
import { createInitialGameState } from "../pure/gameState.js";
export let gameState = createInitialGameState({ isTutorial: false });
export function setGameState(next) {
    gameState = next;
}
/** startGame / startTutorialMode の旧初期化リテラルと同等。 */
export function resetGameState(isTutorial) {
    gameState = createInitialGameState({ isTutorial });
    return gameState;
}
