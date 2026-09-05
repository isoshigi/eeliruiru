// 判定ポップアップ・画面シェイク（非純粋: DOM）
// 元: public/app.js showJudgementText / triggerScreenShake / triggerWokShake

import { $, els } from "./dom.js";

export function showJudgementText(text: string, color: string): void {
  const container = $("judgement-container");
  const el = document.createElement("div");
  el.className =
    "popup-text absolute top-1/2 left-1/2 text-xl md:text-4xl font-black pointer-events-none tracking-widest text-center whitespace-nowrap filter drop-shadow-2xl";
  el.style.color = color;
  el.style.textShadow = "0 0 20px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.9)";
  el.innerText = text;
  container.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

export function triggerScreenShake(): void {
  document.body.classList.add("shake-heavy");
  setTimeout(() => document.body.classList.remove("shake-heavy"), 250);
}

export function triggerWokShake(): void {
  const wok = els.wokContainer;
  if (!wok) return;
  wok.classList.remove("shake-heavy");
  void wok.offsetWidth;
  wok.classList.add("shake-heavy");
}
