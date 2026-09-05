import { describe, expect, it } from "vitest";
import {
  buildShareText,
  getMedalLabel,
  sanitizePlayerName,
  sortRankings,
} from "../../frontend/src/pure/rankingLogic.js";

describe("getMedalLabel: 順位表示", () => {
  it("0〜2位はメダル", () => {
    expect(getMedalLabel(0)).toBe("🥇");
    expect(getMedalLabel(1)).toBe("🥈");
    expect(getMedalLabel(2)).toBe("🥉");
  });
  it("3位以降は『n.』形式", () => {
    expect(getMedalLabel(3)).toBe("4.");
    expect(getMedalLabel(4)).toBe("5.");
  });
});

describe("sortRankings: 降順・上位5件・非破壊", () => {
  it("スコア降順に並べ替える", () => {
    const rows = [
      { name: "a", score: 100 },
      { name: "b", score: 500 },
      { name: "c", score: 300 },
    ];
    expect(sortRankings(rows).map((r) => r.name)).toEqual(["b", "c", "a"]);
  });
  it("6件以上は上位5件に絞る", () => {
    const rows = [1, 2, 3, 4, 5, 6].map((s) => ({ name: `n${s}`, score: s * 100 }));
    const sorted = sortRankings(rows);
    expect(sorted).toHaveLength(5);
    expect(sorted[0].score).toBe(600);
    expect(sorted[4].score).toBe(200);
  });
  it("5件以下は全件返す・空配列は空", () => {
    expect(sortRankings([{ name: "a", score: 1 }])).toHaveLength(1);
    expect(sortRankings([])).toEqual([]);
  });
  it("入力配列を破壊しない", () => {
    const rows = [
      { name: "a", score: 1 },
      { name: "b", score: 9 },
    ];
    sortRankings(rows);
    expect(rows[0].name).toBe("a");
  });
  it("同点でも5件以内に収まる", () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({ name: `n${i}`, score: 100 }));
    expect(sortRankings(rows)).toHaveLength(5);
  });
});

describe("sanitizePlayerName: 登録名の整形", () => {
  it("前後空白を除去する", () => {
    expect(sanitizePlayerName("  うな吉  ")).toBe("うな吉");
  });
  it("8文字で切り詰める", () => {
    expect(sanitizePlayerName("123456789ABC")).toBe("12345678");
    expect(sanitizePlayerName("あいうえおかきくけこさ")).toBe("あいうえおかきく");
  });
  it("空・空白のみは『ウナギ職人』", () => {
    expect(sanitizePlayerName("")).toBe("ウナギ職人");
    expect(sanitizePlayerName("   ")).toBe("ウナギ職人");
  });
  it("maxLen を指定できる", () => {
    expect(sanitizePlayerName("abcdef", 3)).toBe("abc");
  });
});

describe("buildShareText: X共有文", () => {
  it("スコアと称号が埋め込まれる", () => {
    const text = buildShareText(1234, "見習いシェフ");
    expect(text).toContain("1234点");
    expect(text).toContain("見習いシェフ");
    expect(text).toContain("#イール炒る要る");
    expect(text).toContain("#居る居る閣");
  });
  it("テンプレ完全一致（旧実装どおり）", () => {
    expect(buildShareText(0, "見習いシェフ")).toBe(
      "『イール炒る、要る？』居る居る閣で売上【0点】を達成！\n称号：見習いシェフ\n#イール炒る要る #居る居る閣",
    );
  });
});
