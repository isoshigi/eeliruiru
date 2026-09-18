import { applyD1Migrations, env } from "cloudflare:test";

// テスト用 D1 に migrations を適用する（各テストの分離ストレージごとに実行される）。
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
