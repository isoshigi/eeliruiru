// チュートリアルツアー処理（非純粋: DOM + 状態）
// 元: public/app.js tutStep / tutSteps / startTutorialMode / clearAllHighlights /
//     applyTutStep / endTutorialMode
// 進行条件の判定は pure/tutorialLogic.ts に委譲する。
import { ITEMS } from "../pure/items.js";
import { TUTORIAL_TOTAL_STEPS, isTutorialFinished } from "../pure/tutorialLogic.js";
import { sfx } from "./audio.js";
import { resetWok, updateWokCooking } from "./gameActions.js";
import { gameState, resetGameState } from "./gameStore.js";
import { $, els } from "./ui/dom.js";
import { showJudgementText } from "./ui/judgement.js";
import { updateWokUI } from "./ui/wokView.js";
export let tutStep = 0;
export function setTutStep(n) {
    tutStep = n;
}
export const tutSteps = [
    {
        stepText: "STEP 1 / 4",
        icon: "🐍",
        title: "「新鮮ウナギ」を鍋に入れる！",
        desc: "左カードに「新鮮ウナギ」が出ています。【🔥 炒る！】ボタンを押して鍋へ入れよう！(最大5匹)",
        highlightElId: "btn-iru-pan",
        itemToSet: ITEMS[0], // ウナギ
    },
    {
        stepText: "STEP 2 / 4",
        icon: "⚡",
        title: "「危険物/偽物」はゴミ箱へ処分！",
        desc: "「デンキウナギ」「毒ウナギ」「アナゴ」が出たら【🗑️ 要らん】を押して破棄しよう！",
        highlightElId: "btn-iran",
        itemToSet: ITEMS[1], // デンキウナギ
    },
    {
        stepText: "STEP 3 / 4",
        icon: "🐬",
        title: "「イルカ」は海へ開放！",
        desc: "珍しいイルカが出現したら【🐬 居る！】を押そう！RUSHタイムが発動するぞ！",
        highlightElId: "btn-iru-dolphin",
        itemToSet: ITEMS[4], // イルカ
    },
    {
        stepText: "STEP 4 / 4",
        icon: "🍽️",
        title: "黄金タイミングで皿へ引き上げる！",
        desc: "右側の鍋にウナギが入っています！メーターが「黄金ゾーン」に達したタイミングで【皿へ盛る！】を押そう！",
        highlightElId: "btn-pull-out",
        itemToSet: ITEMS[0],
    },
];
void TUTORIAL_TOTAL_STEPS;
export function startTutorialMode() {
    sfx.init();
    resetGameState(true);
    $("modal-start").classList.add("hidden");
    $("modal-result").classList.add("hidden");
    $("tutorial-banner").classList.remove("hidden");
    els.tutBadge?.classList.remove("hidden");
    if (els.timer)
        els.timer.innerText = "∞";
    tutStep = 0;
    applyTutStep(0);
    if (gameState.cookInterval)
        clearInterval(gameState.cookInterval);
    gameState.cookInterval = setInterval(updateWokCooking, 50);
}
export function clearAllHighlights() {
    document.querySelectorAll(".tutorial-highlight").forEach((el) => {
        el.classList.remove("tutorial-highlight");
    });
}
export function applyTutStep(stepIdx) {
    clearAllHighlights();
    if (isTutorialFinished(stepIdx)) {
        endTutorialMode();
        return;
    }
    const step = tutSteps[stepIdx];
    tutStep = stepIdx;
    $("tut-banner-step").innerText = step.stepText;
    $("tut-banner-icon").innerText = step.icon;
    $("tut-banner-title").innerText = step.title;
    $("tut-banner-desc").innerText = step.desc;
    // 食材の強制指定
    gameState.currentItem = step.itemToSet;
    if (els.itemEmoji)
        els.itemEmoji.innerText = gameState.currentItem.emoji;
    if (els.itemName)
        els.itemName.innerText = gameState.currentItem.name;
    if (els.itemSub)
        els.itemSub.innerText = gameState.currentItem.sub;
    // STEP 4 の場合、鍋にウナギを入れ調理進行
    if (stepIdx === 3) {
        if (gameState.wok.eelCount === 0) {
            gameState.wok.eelCount = 2;
            gameState.wok.cookProgress = 60; // 黄金ゾーン直下
            updateWokUI();
        }
    }
    // ハイライト付与
    const targetEl = $(step.highlightElId);
    if (targetEl) {
        targetEl.classList.add("tutorial-highlight");
    }
}
export function endTutorialMode() {
    clearAllHighlights();
    $("tutorial-banner").classList.add("hidden");
    els.tutBadge?.classList.add("hidden");
    gameState.isTutorial = false;
    gameState.isPlaying = false;
    if (gameState.cookInterval)
        clearInterval(gameState.cookInterval);
    resetWok();
    showJudgementText("チュートリアル完了！", "#fbbf24");
    setTimeout(() => {
        $("modal-start").classList.remove("hidden");
    }, 800);
}
