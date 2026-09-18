# AGENTS.md

60秒でウナギを仕分け・炒めるブラウザゲーム。Cloudflare Workers + Hono + D1 のバックエンドと、vanilla TypeScript フロント（esbuild バンドル）。UI・コメント・ドキュメントは日本語。

## コマンド

```sh
npm install
npm run db:migrate:local   # ローカルD1。dev の前に必須
npm run dev                # esbuild watch + wrangler dev (127.0.0.1:8787)
npm run build:frontend     # public/js/main.js を生成（ブラウザ確認の前に必要）
npm run typecheck          # backend のみ
npm run typecheck:frontend # frontend のみ（CI は両方実行）
npm test                   # vitest run（tests/ 以下）
npm test -- tests/pure/cook.test.ts   # 単一テスト
npm run check:fix          # Biome (format + lint)
```

- `public/js/main.js` はビルド成果物で git 管理外。`public/js/` を直接編集しても反映されない。編集するのは `frontend/src`。
- typecheck は分割されている。全体検査には両コマンドが要る。

## アーキテクチャ

- `frontend/src/pure/` 純関数のみ。`tests/pure` のテスト対象。副作用を持ち込まない。
- `frontend/src/impl/` DOM・fetch・audio 等の副作用。テスト対象外。
- `frontend/src/main.ts` エントリ。esbuild が `public/js/main.js` にバンドル。
- `shared/src/` frontend / backend 共用の型・ロジック（スコア、称号、名前正規化、API 型、時間）。単一の真実源。
- `backend/src/worker.ts` Hono API（health/rankings/scores）、`backend/src/db.ts` D1 クエリ層。
- import は TS ソースでも `.js` 拡張子で書く（`verbatimModuleSyntax` + ESM）。例: `../../shared/src/api.js`。

## 規約・落とし穴

- プレイ統計の呼称変換 `cooked/trashed` → API `fried/discarded` は `shared/src/api.ts` の `toSaveScorePayload` 一箇所に集約。ここを迂回しない。
- 称号はサーバー側 `getRankTitle` で再計算される。クライアント送信の `rankTitle` は保存に使われない。
- スコア上限は `shared/src/scoreLimits.ts` が単一の真実源（zod 検証・DB CHECK・クライアント表示で共有）。
- `/api/rankings` は 10分バケットの CDN キャッシュ。レスポンス変更時はキャッシュキー（`backend/src/worker.ts` の `/__cache/rankings`）に注意。
- `wrangler.jsonc` の `assets` が `./public` を SPA 配信。`main` は `backend/src/worker.ts`。
- ローカル起動順: `npm run db:migrate:local` → `npm run dev`。
- README は概要と仕様の資料。構成や手順の実体はこのファイルと config を優先する。

## デプロイ / CI

- PR: `lint` → `typecheck` → `typecheck:frontend` → `test` → `build:frontend` → `wrangler deploy --dry-run`。
- main push: `wrangler d1 migrations apply eeliruiru-db --remote` → `wrangler deploy`。`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` の secrets が必要。
- Node.js / Wrangler のバージョンは `mise.toml` で固定（node 24 / wrangler 4）。
