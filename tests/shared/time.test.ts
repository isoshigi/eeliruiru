import { describe, expect, it } from "vitest";
import {
  RANKING_BUCKET_MS,
  rankingBucketStart,
  rankingBucketStartISO,
  secondsToNextBucket,
} from "../../shared/src/time.js";

describe("ランキングキャッシュの10分バケット", () => {
  it("バケット幅は10分", () => {
    expect(RANKING_BUCKET_MS).toBe(600_000);
  });

  it("バケット開始は10分境界に切り下げる", () => {
    const t = Date.UTC(2026, 0, 1, 3, 27, 45, 123);
    expect(rankingBucketStart(t)).toBe(Date.UTC(2026, 0, 1, 3, 20, 0, 0));
  });

  it("ISO はバケット開始を表す", () => {
    const t = Date.UTC(2026, 0, 1, 3, 27, 45);
    expect(rankingBucketStartISO(t)).toBe("2026-01-01T03:20:00.000Z");
  });

  it("max-age は次バケットまでの残り秒（最低1）", () => {
    const t = Date.UTC(2026, 0, 1, 3, 27, 45);
    expect(secondsToNextBucket(t)).toBe(135);
    expect(secondsToNextBucket(Date.UTC(2026, 0, 1, 3, 29, 59, 999))).toBe(1);
  });
});
