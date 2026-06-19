# Astro + Cloudflare Workers スタック

TarotScryer の実行環境に関する知識。

## Astro 6

- Islands アーキテクチャ：デフォルトで静的 HTML、必要な部分のみ JS ハイドレーション
- `src/pages/api/reading.ts` で API エンドポイントを定義
- `astro.config.mjs` でアダプタ設定（`@astrojs/cloudflare`）

## React 19 Islands

- `src/components/islands/` にインタラクティブコンポーネントを配置
- `client:*` ディレクティブでハイドレーションを制御

## Cloudflare Workers

- `wrangler.toml` で設定
- `npm run deploy` で Workers へデプロイ
- 環境変数は `wrangler secret put` で設定

## 注意点

- `vite` は Astro 6 との互換性のため `^7.3.5` に固定
- `npm run check` を必ず実行
