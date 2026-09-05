// 食材・仕分け判定系の純粋関数＋データ（元: public/app.js ITEMS / nextItem / actionSort）

export type ItemType = "eel" | "danger" | "dolphin";
export type ChosenType = "pan" | "trash" | "dolphin";

export interface Item {
  id: string;
  name: string;
  sub: string;
  emoji: string;
  type: ItemType;
}

export const ITEMS: readonly Item[] = [
  { id: "eel", name: "新鮮ウナギ", sub: "（Eel）", emoji: "🐍", type: "eel" },
  { id: "electric_eel", name: "デンキウナギ", sub: "（危険！）", emoji: "⚡", type: "danger" },
  { id: "poison_eel", name: "毒ウナギ", sub: "（要らん！）", emoji: "🟣", type: "danger" },
  { id: "anago", name: "偽ウナギ（アナゴ）", sub: "（紛らわしい）", emoji: "🐟", type: "danger" },
  { id: "dolphin", name: "イルカ", sub: "（イルカが居る！）", emoji: "🐬", type: "dolphin" },
] as const;

/** 出現確率の境界（旧実装: ウナギ62% / 危険物30% / イルカ8%）。 */
export const EEL_RATE = 0.62;
export const DANGER_RATE_END = 0.92;

/** danger 3種の添字選択。旧実装: floor(random*3)+1 */
export function pickDangerIndex(dangerRand: number): 1 | 2 | 3 {
  return (Math.floor(dangerRand * 3) + 1) as 1 | 2 | 3;
}

/**
 * 次に出す食材を決める純粋版。
 * 旧実装は Math.random() を2回呼ぶため、rand / dangerRand を引数で注入する。
 * rushMode 時は常に ITEMS[0]（新鮮ウナギ）。
 */
export function pickNextItem(rushMode: boolean, rand: number, dangerRand: number): Item {
  if (rushMode) return ITEMS[0];
  if (rand < EEL_RATE) return ITEMS[0];
  if (rand < DANGER_RATE_END) return ITEMS[pickDangerIndex(dangerRand)];
  return ITEMS[4];
}

/** 仕分けの正誤表。pan-eel / trash-danger / dolphin-dolphin が正解。 */
export function isCorrectSort(itemType: ItemType, chosenType: ChosenType): boolean {
  if (chosenType === "pan") return itemType === "eel";
  if (chosenType === "trash") return itemType === "danger";
  return itemType === "dolphin";
}
