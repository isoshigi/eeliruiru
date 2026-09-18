declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    SCORE_SALT?: string;
    TEST_MIGRATIONS: import("@cloudflare/vitest-pool-workers").D1Migration[];
  }
}
