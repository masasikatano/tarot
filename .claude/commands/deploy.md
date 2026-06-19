# デプロイ

Cloudflare Workers へのデプロイ手順：

1. `npm run build` でビルド
2. `npm run deploy` で wrangler deploy

```bash
npm run build
npm run deploy
```

本番シークレットは以下のコマンドで設定します。

```bash
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put LLM_MODEL   # openrouter/free
```
