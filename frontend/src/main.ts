// エントリ: イベントリスナー設定（非純粋）
// 元: public/app.js window.addEventListener('DOMContentLoaded', ...) ブロック

import { sfx } from "./impl/audio.js";
import { actionPullOut, actionSort, startGame } from "./impl/gameActions.js";
import { gameState } from "./impl/gameStore.js";
import { initParticles } from "./impl/particles.js";
import { buildShareText } from "./pure/rankingLogic.js";
import { renderStartRanking } from "./impl/rankingView.js";
import { clearAllHighlights, startTutorialMode } from "./impl/tutorial.js";
import { $, els, initDom } from "./impl/ui/dom.js";

function init(): void {
  initDom();
  initParticles();
  renderStartRanking();

  $("btn-start").addEventListener("click", startGame);
  $("btn-retry").addEventListener("click", startGame);

  // タイトル画面へ戻るボタン
  $("btn-home").addEventListener("click", () => {
    $("modal-result").classList.add("hidden");
    renderStartRanking();
    $("modal-start").classList.remove("hidden");
  });

  // チュートリアル関連
  $("btn-tutorial-start").addEventListener("click", startTutorialMode);
  $("btn-tut-quit").addEventListener("click", () => {
    clearAllHighlights();
    $("tutorial-banner").classList.add("hidden");
    els.tutBadge?.classList.add("hidden");
    gameState.isTutorial = false;
    renderStartRanking();
    $("modal-start").classList.remove("hidden");
  });

  // BGM
  $("btn-audio-toggle").addEventListener("click", () => {
    const isPlaying = sfx.toggleBGM();
    $("audio-icon").innerText = isPlaying ? "🔊" : "🔇";
    $("audio-text").innerText = isPlaying ? "BGM ON" : "BGM OFF";
  });

  // 左操作
  $("btn-iru-pan").addEventListener("click", () => actionSort("pan"));
  $("btn-iran").addEventListener("click", () => actionSort("trash"));
  $("btn-iru-dolphin").addEventListener("click", () => actionSort("dolphin"));

  // 右操作
  $("btn-pull-out").addEventListener("click", actionPullOut);
  els.wokContainer?.addEventListener("click", actionPullOut);

  // キーボード
  window.addEventListener("keydown", (e) => {
    if (!gameState.isPlaying) return;

    const key = e.key.toLowerCase();
    if (key === "w" || e.key === "ArrowUp") {
      actionSort("pan");
    } else if (key === "s" || e.key === "ArrowDown") {
      actionSort("trash");
    } else if (e.key === " " || key === "spacebar") {
      e.preventDefault();
      actionSort("dolphin");
    } else if (e.key === "Enter") {
      e.preventDefault();
      actionPullOut();
    }
  });

  // X シェア
  $("btn-share").addEventListener("click", () => {
    const text = buildShareText(gameState.score, $("result-rank").innerText);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  });
}

window.addEventListener("DOMContentLoaded", init);
