// メインゲーム処理（非純粋: 状態変異 + DOM + 音 + 演出）
// 元: public/app.js startGame / endGame / nextItem / actionSort /
//     updateWokCooking / actionPullOut / resetWok / addScore / addCombo /
//     handleMiss / triggerRushMode / updateUI
// 点数・抽選・称号の判定は pure/* に委譲し、数値は旧実装と同一にする。

import { getCookStatus, getPullMultiplier, stepCookProgress } from "../pure/cook.js";
import { isCorrectSort, pickNextItem, type ChosenType } from "../pure/items.js";
import {
  applyMissPenalty,
  calcMissPenalty,
  calcPullPoints,
  calcRawPullPoints,
  getRankTitle,
  shouldTriggerFever,
} from "../pure/scoring.js";
import { shouldAdvanceTutorial } from "../pure/tutorialLogic.js";
import { sfx } from "./audio.js";
import { gameState, resetGameState } from "./gameStore.js";
import { createExplosion } from "./particles.js";
import { checkAndHandleHighScore } from "./rankingView.js";
import { applyTutStep, clearAllHighlights, tutStep } from "./tutorial.js";
import { $, els } from "./ui/dom.js";
import { showJudgementText, triggerScreenShake, triggerWokShake } from "./ui/judgement.js";
import { resetWokUI, updateWokUI } from "./ui/wokView.js";

export function startGame(): void {
  sfx.init();
  clearAllHighlights();
  $("tutorial-banner").classList.add("hidden");
  els.tutBadge?.classList.add("hidden");

  resetGameState(false);

  updateUI();
  resetWokUI();
  nextItem();

  $("modal-start").classList.add("hidden");
  $("modal-result").classList.add("hidden");

  showJudgementText("開店！爆熱スタート！", "#fbbf24");

  if (gameState.timerInterval) clearInterval(gameState.timerInterval);
  gameState.timerInterval = setInterval(() => {
    if (gameState.isTutorial) return;
    gameState.timeLeft--;
    if (els.timer) els.timer.innerText = String(gameState.timeLeft);

    if (gameState.timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  if (gameState.cookInterval) clearInterval(gameState.cookInterval);
  gameState.cookInterval = setInterval(updateWokCooking, 50);
}

export function endGame(): void {
  gameState.isPlaying = false;
  if (gameState.timerInterval) clearInterval(gameState.timerInterval);
  if (gameState.cookInterval) clearInterval(gameState.cookInterval);
  if (gameState.rushTimer) clearTimeout(gameState.rushTimer);
  // RUSH中に終了するとバッジが結果画面に残るため消しておく
  gameState.rushMode = false;
  els.rushBadge?.classList.add("hidden");

  $("result-score").innerText = String(gameState.score);
  $("stat-cooked").innerText = String(gameState.stats.cooked);
  $("stat-trashed").innerText = String(gameState.stats.trashed);
  $("stat-saved").innerText = String(gameState.stats.saved);
  $("stat-burned").innerText = String(gameState.stats.burned);

  const rank = getRankTitle(gameState.score, gameState.stats.burned);

  $("result-rank").innerText = rank;
  checkAndHandleHighScore(gameState.score, rank);

  $("modal-result").classList.remove("hidden");
}

export function nextItem(): void {
  if (gameState.isTutorial) return; // チュートリアル中は手動制御

  gameState.currentItem = pickNextItem(gameState.rushMode, Math.random(), Math.random());

  if (els.itemEmoji) els.itemEmoji.innerText = gameState.currentItem.emoji;
  if (els.itemName) els.itemName.innerText = gameState.currentItem.name;
  if (els.itemSub) els.itemSub.innerText = gameState.currentItem.sub;

  els.itemCard?.classList.remove("shake-heavy");
  if (els.itemCard) void els.itemCard.offsetWidth;
  els.itemCard?.classList.add("shake-heavy");
}

export function actionSort(chosenType: ChosenType): void {
  if (!gameState.isPlaying) return;

  const item = gameState.currentItem;
  if (!item) return;
  const rect = els.itemCard?.getBoundingClientRect();
  const posX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const posY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

  if (chosenType === "pan") {
    if (isCorrectSort(item.type, "pan")) {
      if (gameState.wok.eelCount < 5) {
        gameState.wok.eelCount++;
        sfx.sizzle(gameState.wok.eelCount);

        if (gameState.wok.eelCount === 1) {
          gameState.wok.cookProgress = 0;
        } else {
          gameState.wok.cookProgress = Math.max(0, gameState.wok.cookProgress - 8);
        }

        triggerWokShake();
        createExplosion(posX, posY, ["#f59e0b", "#ef4444", "#fbbf24"], 20);
        addScore(60);
        addCombo();
        showJudgementText(`炒る！ (${gameState.wok.eelCount}/5)`, "#fbbf24");
      } else {
        sfx.sizzle(5);
        addScore(30);
        showJudgementText("鍋満タン(5匹)！", "#f59e0b");
      }
    } else {
      const lostCount = gameState.wok.eelCount;
      if (lostCount > 0) {
        gameState.stats.burned += lostCount;
        // handleMissは鍋の残数から減点(120×匹)を算出するため、resetWokより先に呼ぶ
        handleMiss(`危険物混入！ウナギ${lostCount}匹全滅！`);
        resetWok();
      } else {
        resetWok();
        handleMiss("危険物を炒めてしまった！");
      }
      createExplosion(posX, posY, ["#dc2626", "#000000", "#7f1d1d"], 35);
    }
  } else if (chosenType === "trash") {
    if (isCorrectSort(item.type, "trash")) {
      sfx.trash();
      addScore(50);
      addCombo();
      gameState.stats.trashed++;
      createExplosion(posX, posY, ["#64748b", "#94a3b8"], 15);
      showJudgementText("要らん！破棄！", "#94a3b8");
    } else {
      handleMiss("新鮮ウナギを捨ててしまった！");
      createExplosion(posX, posY, ["#dc2626"], 25);
    }
  } else if (chosenType === "dolphin") {
    if (isCorrectSort(item.type, "dolphin")) {
      sfx.dolphin();
      addScore(200);
      addCombo();
      gameState.stats.saved++;
      createExplosion(posX, posY, ["#38bdf8", "#0ea5e9", "#ffffff"], 40);
      showJudgementText("🐬 居る！大海原へ！", "#38bdf8");
      triggerRushMode();
    } else {
      handleMiss("イルカじゃない！");
    }
  }

  // チュートリアル中であればステップ進行チェック
  if (gameState.isTutorial) {
    if (shouldAdvanceTutorial(tutStep, chosenType)) {
      applyTutStep(tutStep + 1);
    }
  } else {
    nextItem();
  }
}

export function updateWokCooking(): void {
  if (!gameState.isPlaying || gameState.wok.eelCount === 0) return;

  gameState.wok.cookProgress = stepCookProgress(gameState.wok.cookProgress);

  const status = getCookStatus(gameState.wok.cookProgress);
  if (status === "burned") {
    gameState.wok.status = "burned";
    sfx.miss();

    const count = gameState.wok.eelCount;
    gameState.stats.burned += count;
    const rect = els.wokContainer?.getBoundingClientRect();
    const posX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const posY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    createExplosion(posX, posY, ["#18181b", "#ef4444", "#71717a"], 50);
    handleMiss(`ウナギ${count}匹全滅焦がし！`);
    resetWok();
    return;
  }
  gameState.wok.status = status;

  updateWokUI();
}

export function actionPullOut(): void {
  if (!gameState.isPlaying) return;

  const count = gameState.wok.eelCount;
  if (count === 0) return;

  const rect = els.wokContainer?.getBoundingClientRect();
  const posX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const posY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

  const multiplier = getPullMultiplier(count);

  if (gameState.wok.status === "perfect" || gameState.wok.status === "burning") {
    sfx.perfectPull(count);

    const finalPoints = calcPullPoints(count, gameState.combo, multiplier);

    addScore(finalPoints);
    addCombo();
    gameState.stats.cooked += count;

    createExplosion(posX, posY, ["#fef08a", "#fbbf24", "#f59e0b", "#ffffff"], 40 + count * 10);

    if (count >= 5) {
      showJudgementText("🐉 LEGEND 5-EEL STRIKE!! 🐉", "#fef08a");
      triggerScreenShake();
    } else if (count >= 3) {
      showJudgementText(`🔥 PERFECT ${count}-EEL COMBO! 🔥`, "#fef08a");
    } else {
      showJudgementText(`美味！${finalPoints}pt獲得！`, "#fbbf24");
    }
  } else if (gameState.wok.status === "raw" || gameState.wok.status === "empty") {
    // empty: 投入直後で初回tick前の救済（調理度0=生揚げ扱い）
    sfx.sizzle(1);
    addScore(calcRawPullPoints(count));
    gameState.stats.cooked += count;
    showJudgementText("生揚げ…！", "#94a3b8");
  }

  resetWok();

  if (gameState.isTutorial && tutStep === 3) {
    applyTutStep(tutStep + 1);
  }
}

export function resetWok(): void {
  gameState.wok.eelCount = 0;
  gameState.wok.cookProgress = 0;
  gameState.wok.status = "empty";
  resetWokUI();
}

export function addScore(pts: number): void {
  gameState.score += pts;
  if (els.score) els.score.innerText = String(gameState.score);
}

export function addCombo(): void {
  gameState.combo++;
  if (els.comboCount) els.comboCount.innerText = String(gameState.combo);

  if (gameState.combo >= 2) {
    els.comboContainer?.classList.remove("scale-0");
    els.comboContainer?.classList.add("scale-100");
  }

  // 15コンボごとにフィーバー発動（頻度をマイルドに調整）
  if (shouldTriggerFever(gameState.combo)) {
    triggerRushMode();
  }
}

export function handleMiss(reason: string): void {
  sfx.miss();
  gameState.combo = 0;
  els.comboContainer?.classList.add("scale-0");

  const penalty = calcMissPenalty(gameState.wok.eelCount);
  gameState.score = applyMissPenalty(gameState.score, penalty);
  if (els.score) els.score.innerText = String(gameState.score);

  showJudgementText(reason, "#ef4444");
  triggerScreenShake();
}

export function triggerRushMode(): void {
  if (gameState.rushMode || gameState.isTutorial) return;
  gameState.rushMode = true;
  els.rushBadge?.classList.remove("hidden");
  showJudgementText("🔥 爆熱・炒り放題RUSH発動！ 🔥", "#fef08a");

  if (gameState.rushTimer) clearTimeout(gameState.rushTimer);
  gameState.rushTimer = setTimeout(() => {
    gameState.rushMode = false;
    els.rushBadge?.classList.add("hidden");
  }, 6000);
}

export function updateUI(): void {
  if (els.score) els.score.innerText = String(gameState.score);
  if (els.timer) els.timer.innerText = String(gameState.timeLeft);
  els.comboContainer?.classList.add("scale-0");
  els.rushBadge?.classList.add("hidden");
}
