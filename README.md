個人開発集会off会 ポン出し開発選手権 提出作品（を修正したもの）

# イール炒る、要る？

60秒でウナギを見極めて炒める、仕分け＋重ね炒りアクションゲーム。

左で食材を仕分けて鍋に入れ、右で焼き加減を見て一括引き上げする。高倍率を狙うスコアアタックが目的。

## 遊び方

1. 開発サーバー（`npm run dev`）で配信される http://127.0.0.1:8787 をブラウザで開く
2. タイトル画面で「開店！」を押すと60秒計測スタート
3. 初めての場合は「チュートリアル」から練習できる（時間制限なし、全4STEP）

`public/js/main.js` はビルド成果物のため、事前に `npm run build:frontend`（または `npm run dev`）で生成する。インターネット接続は Tailwind CDN と Google Fonts の読み込みにのみ使用する。

## ルール

### 左：仕分けゾーン

表示された食材を瞬時に捌く。

| 食材 | 見た目 | 正解の操作 |
| ---- | ------ | ---------- |
| 新鮮ウナギ | 🐍 | 🔥 炒る！（鍋へ、最大5匹） |
| デンキウナギ / 毒ウナギ / 偽ウナギ（アナゴ） | ⚡ / 🟣 / 🐟 | 🗑️ 要らん（ゴミ箱へ破棄） |
| イルカ | 🐬 | 🐬 居る！（海へ開放） |

出現率はおおよそ ウナギ 62% / 危険物・偽物 30% / イルカ 8%。

間違えるとミス扱いになる：

- 危険物を鍋に入れる → 鍋のウナギ全滅＋減点
- 新鮮ウナギを捨てる → 減点
- イルカ以外で「居る！」 → 減点

ミス時はコンボリセット＋画面シェイク。

### 右：調理ゾーン（中華鍋）

- 鍋には最大5匹まで溜められる。追加投入で調理進行が少し戻る
- 焼き加減メーター 50%〜85% が黄金ゾーン（黄色ガイド）
- `85%〜100%` は焦げかけ、`100%` 到達で全滅焦げ
- 「皿へ引き上げる！」または鍋クリックで引き上げ

## スコア仕様

- 炒る！：+60（鍋満タン時は +30）
- 破棄成功：+50
- イルカ救出：+200
- 引き上げ：`200 × 匹数 × 匹数倍率 × コンボ補正`
  - 匹数倍率：1匹 1.0 / 2匹 1.8 / 3匹 2.8 / 4匹 4.0 / 5匹 5.5
  - コンボ補正：`1 + floor(コンボ / 5) × 0.25`
  - 生揚げ（50%未満）時は `25 × 匹数` のみ
- 5匹黄金引き上げで `LEGEND 5-EEL STRIKE` 演出

コンボは連続成功で加算。15コンボごとにフィーバー発動。

### RUSH

イルカ救出時、または15コンボごとに6秒間発動。発動中はウナギ確定出現。ヘッダーにバッジ表示される。

### リザルト・称号

終了時に炒めた数・捨てた数・救った数・焦がした数を集計し、スコアに応じて称号が付く。

- 10000点〜：伝説の爆熱ウナギ炒り神
- 6000点〜：一流ウナギ炒り職人
- 3000点〜：一人前の調理人
- 焦がし4匹〜：ボヤ騒ぎを起こした危険人物
- 上記以外：見習いシェフ

TOP5入りすると名前入力で端末内ランキングに登録できる。X共有ボタンあり。

## 操作一覧

| 操作 | マウス / タッチ | キーボード |
| ---- | --------------- | ---------- |
| 炒る！ | 左ボタン | W / ↑ |
| 要らん | 中央ボタン | S / ↓ |
| 居る！ | 右ボタン | Space |
| 皿へ引き上げる | 引き上げボタン / 鍋クリック | Enter |
| BGM切替 | ヘッダーのBGMボタン | なし |

## BGM・効果音

- ヘッダーのボタンで BGM ON/OFF 切替
- 現状は Web Audio API による合成音のみ（外部音源ファイルなしで鳴る仮実装）
- ブラウザの自動再生制限のため、初回クリック後に有効になる

## 技術構成

- フロント：`frontend/src`（TypeScript）を esbuild で `public/js/main.js` にバンドル。`public/index.html`（Tailwind CDN、Google Fonts、Canvasパーティクル）が読み込む
  - `frontend/src/pure/`：純粋ロジック（ユニットテスト対象）
  - `frontend/src/impl/`：DOM・通信・音声などの副作用
- 共有：`shared/src`（型・スコア計算・称号・API変換）をフロント／バックエンド双方が参照
- 音源：`public/assets/audio/*.mp3` を優先再生、欠落時は Web Audio 合成フォールバック
- API：Workers＋Hono（TypeScript、`backend/src/worker.ts`）
- DB：D1（`scores` テーブル、日次 `season`＝JST日付＋全期間の2軸）
- ランキング：オンライン（D1）優先、取得失敗時は端末内 `localStorage` にフォールバック

## 開発手順

前提：Node.js / Wrangler（`mise.toml` のバージョン）

```sh
npm install
npm run db:migrate:local   # ローカルD1にマイグレーション適用
npm run dev                # esbuild watch + wrangler dev（http://127.0.0.1:8787）
npm run build:frontend     # public/js/main.js を単体ビルド（ブラウザで直接確認する場合）
npm run typecheck          # バックエンドの TypeScript 検査
npm run typecheck:frontend # フロントエンドの TypeScript 検査
npm test                   # ユニットテスト（Vitest）
```

`public/js/main.js` はビルド成果物のため git 管理外。ブラウザや `wrangler dev` で動かす前に `npm run dev` か `npm run build:frontend` で生成する。

本番D1は作成済み（`eeliruiru-db`、APAC、テーブル適用済み）。再作成時のみ：

```sh
npx wrangler d1 create eeliruiru-db
# 表示された database_id を wrangler.jsonc に設定
npx wrangler d1 migrations apply eeliruiru-db --remote
npx wrangler deploy
```

## 音源ファイルの配置

`public/assets/audio/` に以下の6ファイルを置く（128kbps以下・各1MB以下目安）。
存在しない音は自動で合成フォールバックになる。

- `bgm.mp3`、`sizzle.mp3`、`trash.mp3`、`dolphin.mp3`、`pull.mp3`、`miss.mp3`

## スコアAPI仕様

- `GET /api/rankings?scope=daily|alltime&limit=20`（上限50）
- `POST /api/scores`：`{name（1-20文字）, score（0-99999）, rankTitle, fried, discarded, saved, burned}`
  - 物理上限（60000点）超過・不正値は400、同一IP 10req/min超過は429
  - Turnstileなし（IPハッシュ＋レート制限＋サーバー検証のみ）

## 制限事項：スコアアタックについて

現状のランキングは端末内の `localStorage` TOP5のみ。オンラインサーバーが提供されていないため以下はできない：

- 全国・フレンド間のスコア比較
- 不正スコア対策
- 複数端末での記録共有

X共有も自己申告ベースのため、正式なスコアアタック機能としては不十分な状態。

## TODO

- [x] オンラインスコアアタック（Workers＋D1、日次/全期間、不正対策は簡易版）
- [ ] 専用音源ファイルの用意（現状は Web Audio 合成フォールバックで動作中）

## ファイル構成

```text
./
├── frontend/
│   └── src/
│       ├── main.ts            # エントリ（DOMContentLoaded で初期化）
│       ├── pure/              # 純粋ロジック（テスト対象）
│       └── impl/              # DOM・通信・音声など副作用
├── shared/
│   └── src/                   # フロント／バックエンド共用（型・スコア・称号・API変換）
├── backend/
│   └── src/
│       ├── worker.ts         # Hono API（/api/health, /api/rankings, /api/scores）
│       └── db.ts             # D1クエリ層・JST日付
├── tests/                    # Vitest（pure / shared）
├── scripts/
│   └── build-frontend.mjs    # esbuild でのフロントバンドル
├── public/
│   ├── index.html            # ゲーム画面
│   ├── js/main.js            # ビルド成果物（git管理外）
│   └── assets/audio/         # BGM・SE（bgm/sizzle/trash/dolphin/pull/miss.mp3）
├── migrations/
│   └── 0001_create_scores.sql
├── wrangler.jsonc
├── package.json
├── mise.toml
└── README.md
```
