// 鍋表示の文言系 view-model（元: public/app.js updateWokUI / resetWokUI）
// DOM操作は含まず、文言と表示トーンだけを返す。

import type { CookStatus } from "./cook.js";

export type WokTone = "idle" | "raw" | "perfect" | "burning";

export interface WokStatusView {
  text: string;
  tone: WokTone;
  steamVisible: boolean;
  highlight: boolean;
}

export const EMPTY_PULL_BONUS_TEXT = "重ね炒り（最大5匹）で超絶倍率ボーナス！";

const PULL_BONUS_TEXTS: Readonly<Record<number, string>> = {
  1: "1匹引き上げ（標準）",
  2: "2匹引き上げ（1.8倍ボーナス）",
  3: "3匹引き上げ（2.8倍ボーナス）",
  4: "4匹引き上げ（4.0倍ボーナス）",
  5: "5匹引き上げ（超絶5.5倍倍率ボーナス！！）",
};

export function getWokBadgeText(eelCount: number): string {
  return `${eelCount}/5 匹`;
}

export function getPullBonusText(eelCount: number): string {
  return PULL_BONUS_TEXTS[eelCount] ?? EMPTY_PULL_BONUS_TEXT;
}

/** 旧実装の status 分岐（raw/perfect/burning + 空鍋）をそのままデータ化。 */
export function getWokStatusView(status: CookStatus, eelCount: number): WokStatusView {
  if (eelCount === 0 || status === "empty") {
    return { text: "鍋は空っぽ", tone: "idle", steamVisible: false, highlight: false };
  }
  if (status === "raw") {
    return {
      text: `じわじわ炒め中… (${eelCount}/5匹)`,
      tone: "raw",
      steamVisible: false,
      highlight: false,
    };
  }
  if (status === "perfect") {
    return {
      text: `【要る！】極上の焼き加減！(${eelCount}匹)`,
      tone: "perfect",
      steamVisible: true,
      highlight: true,
    };
  }
  if (status === "burning" || status === "burned") {
    return {
      text: "焦げる！今すぐ盛れ！",
      tone: "burning",
      steamVisible: true,
      highlight: false,
    };
  }
  return { text: "鍋は空っぽ", tone: "idle", steamVisible: false, highlight: false };
}
