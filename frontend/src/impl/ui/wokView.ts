// 鍋UI描画（非純粋: DOM）。元: public/app.js updateWokUI / resetWokUI
// 文言は pure/wokViewModel.ts から取得し、クラス付与は旧実装どおり。

import { gameState } from "../gameStore.js";
import { EMPTY_PULL_BONUS_TEXT, getPullBonusText, getWokBadgeText } from "../../pure/wokViewModel.js";
import { els } from "./dom.js";

// 5匹入っても崩れない頑丈なWok UI描画関数（旧実装のマップをそのまま移設）
const COUNT_DISPLAY_HTML: Readonly<Record<number, string>> = {
  1: '<span class="text-4xl md:text-6xl animate-bounce">🐍</span>',
  2: '<div class="flex gap-2 text-3xl md:text-5xl"><span>🐍</span><span>🐍</span></div>',
  3: '<div class="flex gap-1.5 text-2xl md:text-4xl"><span>🐍</span><span>🐍</span><span>🐍</span></div>',
  4: '<div class="grid grid-cols-2 gap-2 text-2xl md:text-4xl"><span>🐍</span><span>🐍</span><span>🐍</span><span>🐍</span></div>',
  5: '<div class="flex flex-col items-center gap-1"><div class="flex gap-1 text-2xl md:text-3xl"><span>🐍</span><span>🐍</span><span>🐍</span></div><div class="flex gap-1 text-2xl md:text-3xl"><span>🐍</span><span>🐍</span></div></div>',
};

export function updateWokUI(): void {
  const w = gameState.wok;
  if (!els.cookProgress || !els.wokContainer || !els.steamEffect || !els.wokBadge || !els.wokEmoji || !els.wokStatusText || !els.pullBonusText) return;
  els.cookProgress.style.width = `${w.cookProgress}%`;

  els.wokContainer.classList.remove("sizzle-perfect-super", "border-red-600");
  els.steamEffect.classList.add("hidden");

  if (w.eelCount === 0) {
    resetWokUI();
    return;
  }

  els.wokBadge.innerText = getWokBadgeText(w.eelCount);

  // 鍋の中はウナギ絵文字だけに特化！(グリッド/フレックスで視認性抜群)
  els.wokEmoji.style.opacity = "1";
  els.wokEmoji.innerHTML = COUNT_DISPLAY_HTML[w.eelCount] || "🐍";

  els.pullBonusText.innerText = getPullBonusText(w.eelCount);

  if (w.status === "raw") {
    els.wokStatusText.innerText = `じわじわ炒め中… (${w.eelCount}/5匹)`;
    els.wokStatusText.className = "text-xs md:text-sm font-bold text-amber-300 truncate";
  } else if (w.status === "perfect") {
    els.wokStatusText.innerText = `【要る！】極上の焼き加減！(${w.eelCount}匹)`;
    els.wokStatusText.className = "text-xs md:text-sm font-black text-yellow-300 animate-pulse truncate";
    els.wokContainer.classList.add("sizzle-perfect-super");
    els.steamEffect.classList.remove("hidden");
  } else if (w.status === "burning") {
    els.wokStatusText.innerText = "焦げる！今すぐ盛れ！";
    els.wokStatusText.className = "text-xs md:text-sm font-black text-red-400 animate-bounce truncate";
    els.wokContainer.classList.add("border-red-600");
    els.steamEffect.classList.remove("hidden");
  }
}

export function resetWokUI(): void {
  if (!els.cookProgress || !els.wokContainer || !els.steamEffect || !els.wokBadge || !els.wokEmoji || !els.wokStatusText || !els.pullBonusText) return;
  els.cookProgress.style.width = "0%";
  els.wokContainer.classList.remove("sizzle-perfect-super", "border-red-600");
  els.steamEffect.classList.add("hidden");
  els.wokBadge.innerText = "0/5 匹";
  els.wokEmoji.innerHTML = '<span class="text-4xl md:text-6xl">🍳</span>';
  els.wokEmoji.style.opacity = "0.3";
  els.wokStatusText.innerText = "鍋は空っぽ";
  els.wokStatusText.className = "text-xs md:text-sm font-bold text-stone-400 truncate";
  els.pullBonusText.innerText = EMPTY_PULL_BONUS_TEXT;
}
