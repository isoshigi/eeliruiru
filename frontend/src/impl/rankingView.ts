// ランキング表示・登録UI（非純粋: DOM + 通信 + 保存）
// 元: public/app.js renderRankingRows / updateRankingTabs / renderStartRanking /
//     switchRankingScope / checkAndHandleHighScore
// ※旧実装の挙動を据え置きで移設する（バグ修正は行わない）。

import { getMedalLabel, sanitizePlayerName, sortRankings } from "../pure/rankingLogic.js";
import { gameState } from "./gameStore.js";
import { fetchRankings, postScore, type RankingScope, type ServerRanking } from "./rankingApi.js";
import { loadLocalRankings, saveLocalRankings } from "./rankingStore.js";
import { $ } from "./ui/dom.js";
import { showJudgementText } from "./ui/judgement.js";

export let rankingScope: RankingScope = "daily";

export function setRankingScope(scope: RankingScope): void {
  rankingScope = scope;
}

export function renderRankingRows(rankings: Array<{ name?: unknown; score?: unknown }>): void {
  const listEl = $("ranking-list");
  listEl.innerHTML = "";
  if (!rankings.length) {
    const li = document.createElement("li");
    li.className = "text-center text-stone-400 text-xs py-4";
    li.textContent = "まだ記録がありません。最初の職人になろう！";
    listEl.appendChild(li);
    return;
  }

  rankings.slice(0, 5).forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center bg-black/40 px-2 py-1 rounded border border-amber-900/40";
    const medal = getMedalLabel(index);
    const nameSpan = document.createElement("span");
    nameSpan.className = "font-bold text-amber-200 truncate max-w-[110px]";
    nameSpan.textContent = medal + " " + String(item.name ?? "???").slice(0, 20);
    const scoreSpan = document.createElement("span");
    scoreSpan.className = "font-black text-amber-400 tracking-wider";
    scoreSpan.textContent = Number(item.score ?? 0) + " pt";
    li.appendChild(nameSpan);
    li.appendChild(scoreSpan);
    listEl.appendChild(li);
  });
}

export function updateRankingTabs(): void {
  const daily = $("ranking-tab-daily");
  const alltime = $("ranking-tab-alltime");
  if (!daily || !alltime) return;
  const active =
    "flex-1 text-[11px] font-bold px-2 py-1 rounded-lg border border-amber-500 bg-amber-500 text-black cursor-pointer transition";
  const inactive =
    "flex-1 text-[11px] font-bold px-2 py-1 rounded-lg border border-amber-800 text-amber-300 cursor-pointer transition";
  daily.className = rankingScope === "daily" ? active : inactive;
  alltime.className = rankingScope === "alltime" ? active : inactive;
}

export async function renderStartRanking(): Promise<void> {
  updateRankingTabs();
  const rows = await fetchRankings(rankingScope);
  if (rows) {
    if (!rows.length && rankingScope === "daily") {
      // デイリー初日は全期間を表示して空を見せない
      const all = await fetchRankings("alltime");
      renderRankingRows(all && all.length ? all : loadLocalRankings());
    } else {
      renderRankingRows(rows);
      saveLocalRankings(rows.map((r: ServerRanking) => ({ name: r.name, score: r.score, rank: r.rank_title })));
    }
  } else {
    renderRankingRows(loadLocalRankings());
  }
}

export function switchRankingScope(scope: RankingScope): void {
  if (rankingScope === scope) return;
  rankingScope = scope;
  renderStartRanking();

  if ($("ranking-tab-daily")) $("ranking-tab-daily").addEventListener("click", () => switchRankingScope("daily"));
  if ($("ranking-tab-alltime")) $("ranking-tab-alltime").addEventListener("click", () => switchRankingScope("alltime"));
}

export function checkAndHandleHighScore(score: number, rankTitle: string): void {
  const inputContainer = $("high-score-input-container");
  if (!(score > 0)) {
    inputContainer.classList.add("hidden");
    return;
  }
  // サーバー側で順位判定するため、スコア>0は常時登録可とする
  inputContainer.classList.remove("hidden");
  ($("btn-save-score") as HTMLButtonElement).onclick = async () => {
    const btn = $("btn-save-score") as HTMLButtonElement;
    btn.disabled = true;
    try {
      const name = sanitizePlayerName(($("player-name-input") as HTMLInputElement).value);
      const st = (gameState && gameState.stats) || { cooked: 0, trashed: 0, saved: 0, burned: 0 };
      const data = await postScore({
        name,
        score,
        rankTitle,
        fried: st.cooked ?? 0,
        discarded: st.trashed ?? 0,
        saved: st.saved ?? 0,
        burned: st.burned ?? 0,
      });
      inputContainer.classList.add("hidden");
      rankingScope = "daily";
      await renderStartRanking();
      showJudgementText("ランキングに登録しました！(本日" + (data.rankInDaily ?? "?") + "位)", "#fef08a");
    } catch (e) {
      // オフライン時は従来通り端末内保存
      const rankings = loadLocalRankings();
      const name = ($("player-name-input") as HTMLInputElement).value.trim() || "ウナギ職人";
      rankings.push({ name, score, rank: rankTitle });
      const sorted = sortRankings(rankings);
      saveLocalRankings(sorted);
      inputContainer.classList.add("hidden");
      renderRankingRows(loadLocalRankings());
      showJudgementText("オフラインのため端末内に保存しました", "#fef08a");
    } finally {
      btn.disabled = false;
    }
  };
}
