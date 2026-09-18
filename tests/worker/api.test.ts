import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { todaySeasonJST } from "../../backend/src/db.js";
import { getRankTitle } from "../../shared/src/rank.js";

const BASE = "https://example.com";

// Cache API はテスト間でリセットされないため、各テストの前にランキングキャッシュを消す。
beforeEach(async () => {
  const season = todaySeasonJST();
  const cacheKeys = [
    `${BASE}/__cache/rankings?scope=alltime&limit=5`,
    `${BASE}/__cache/rankings?scope=daily&limit=5&season=${season}`,
  ];
  await Promise.all(
    cacheKeys.map((url) => caches.default.delete(new Request(url, { method: "GET" }))),
  );
});

function postScore(body: unknown, ip: string) {
  return SELF.fetch(`${BASE}/api/scores`, {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": ip },
    body: JSON.stringify(body),
  });
}

function validScore(over: Record<string, unknown> = {}) {
  return {
    name: "うな吉",
    score: 1500,
    rankTitle: "dummy",
    fried: 3,
    discarded: 1,
    saved: 0,
    burned: 0,
    ...over,
  };
}

function getRankings(scope: string) {
  return SELF.fetch(`${BASE}/api/rankings?scope=${scope}&limit=5`);
}

describe("GET /api/health", () => {
  it("ok を返す", async () => {
    const res = await SELF.fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("POST /api/scores", () => {
  it("不正な JSON / body は 400", async () => {
    const broken = await SELF.fetch(`${BASE}/api/scores`, {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.1" },
      body: "{",
    });
    expect(broken.status).toBe(400);

    const invalid = await postScore({ name: "", score: -1 }, "203.0.113.1");
    expect(invalid.status).toBe(400);
  });

  it("物理上限 60000 を超えるスコアは 400", async () => {
    const res = await postScore(validScore({ score: 70000 }), "203.0.113.2");
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "score exceeds physical cap" });
  });

  it("登録すると rankInDaily を返し、高得点が上位になる", async () => {
    const first = await postScore(validScore({ score: 1000 }), "203.0.113.3");
    expect(first.status).toBe(201);
    expect(await first.json()).toMatchObject({ rankInDaily: 1 });

    const second = await postScore(validScore({ score: 2000 }), "203.0.113.4");
    expect(await second.json()).toMatchObject({ rankInDaily: 1 });
  });

  it("称号はクライアント値を無視してサーバーで再計算する", async () => {
    await postScore(validScore({ score: 12000, rankTitle: "にせ称号" }), "203.0.113.5");
    const data = (await (await getRankings("daily")).json()) as {
      rankings: Array<{ score: number; rank_title: string }>;
    };
    const row = data.rankings.find((r) => r.score === 12000);
    expect(row?.rank_title).toBe(getRankTitle(12000, 0));
  });

  it("名前に含まれる危険な記号を除去する", async () => {
    await postScore(validScore({ name: "a<b>&c", score: 500 }), "203.0.113.6");
    const data = (await (await getRankings("daily")).json()) as {
      rankings: Array<{ name: string; score: number }>;
    };
    expect(data.rankings.find((r) => r.score === 500)?.name).toBe("abc");
  });

  it("同一 IP で 10 回を超えると 429", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await postScore(validScore({ score: 100 + i }), "203.0.113.20");
      expect(res.status).toBe(201);
    }
    const blocked = await postScore(validScore({ score: 999 }), "203.0.113.20");
    expect(blocked.status).toBe(429);
  });
});

describe("GET /api/rankings のキャッシュ", () => {
  it("キャッシュヘッダーと cachedAt を返す", async () => {
    const res = await getRankings("alltime");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toMatch(/public, max-age=\d+/);
    const data = (await res.json()) as { cachedAt?: unknown };
    expect(typeof data.cachedAt).toBe("string");
  });

  it("同一バケット内の 2 回目はキャッシュヒットする", async () => {
    const url = `${BASE}/api/rankings?scope=alltime&limit=5`;
    const first = await SELF.fetch(url);
    expect(first.headers.get("x-cache")).toBe("MISS");
    const second = await SELF.fetch(url);
    expect(second.headers.get("x-cache")).toBe("HIT");
  });
});
