# デプロイ

Cloudflare Workers へのデプロイ手順：

1. `npm run build` でビルド
2. `npm run deploy` で wrangler deploy

```bash
npm run build
npm run deploy
```

ビルド時に `robots.txt`、`sitemap-index.xml`、OGP/アイコン画像、カード解説ページなどの SEO/AIO 関連アセットも生成・含まれます。本番公開後は Google Search Console でインデックス状況を確認してください。

本番シークレットは以下のコマンドで設定します。

```bash
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put LLM_MODEL   # openrouter/free
```
