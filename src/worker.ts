import { Hono } from "hono";
import { z } from "zod";
import {
  getRankings,
  insertScore,
  rankInScope,
  recentPostsByHash,
  todaySeasonJST,
} from "./db";

interface Env {
  DB: D1Database;
  SCORE_SALT?: string;
}

const app = new Hono<{ Bindings: Env }>();

const ScoreBody = z.object({
  name: z.string().trim().min(1).max(20),
  score: z.number().int().min(0).max(99999),
  rankTitle: z.string().max(60).default(""),
  fried: z.number().int().min(0).max(999).default(0),
  discarded: z.number().int().min(0).max(999).default(0),
  saved: z.number().int().min(0).max(999).default(0),
  burned: z.number().int().min(0).max(999).default(0),
});

/** 60秒プレイの物理上限を超えるスコアは拒否（5匹黄金連打の理論値を余裕見て設定）。 */
const ABS_SCORE_CAP = 60000;

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/rankings", async (c) => {
  const scope = c.req.query("scope") === "alltime" ? "alltime" : "daily";
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? 20) || 20, 1), 50);
  const season = todaySeasonJST();
  const rows = await getRankings(c.env.DB, scope, season, limit);
  return c.json({ scope, season: scope === "daily" ? season : null, rankings: rows });
});

app.post("/api/scores", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }
  const parsed = ScoreBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "invalid body", issues: parsed.error.issues }, 400);
  }
  const { name, score, rankTitle, fried, discarded, saved, burned } = parsed.data;
  if (score > ABS_SCORE_CAP) {
    return c.json({ error: "score exceeds physical cap" }, 400);
  }

  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  const salt = c.env.SCORE_SALT ?? "eeliruiru-local-salt";
  const ipHash = await sha256Hex(`${salt}:${ip}`);
  const recent = await recentPostsByHash(c.env.DB, ipHash);
  if (recent >= 10) {
    return c.json({ error: "rate limited" }, 429);
  }

  const season = todaySeasonJST();
  // タグ混入防止：<>を除去（フロントでもtextContentで描画）
  const cleanName = name.replace(/[<>"&]/g, "").trim().slice(0, 20) || "ウナギ職人";
  const cleanRank = rankTitle.replace(/[<>"&]/g, "").slice(0, 60);
  const id = await insertScore(c.env.DB, {
    name: cleanName,
    score,
    rankTitle: cleanRank,
    fried,
    discarded,
    saved,
    burned,
    season,
    ipHash,
  });
  const rank = await rankInScope(c.env.DB, "daily", season, score, id);
  return c.json({ id, season, rankInDaily: rank }, 201);
});

export default app;
