# SEO / AIO 施策

TarotScryer の SEO（検索エンジン最適化）と AIO（AI / 生成検索最適化）に関する作業を行う場合は、まず `spec_seoaio.md` を参照してください。

## 作業の前提

- すべてのページは `src/layouts/Layout.astro` 経由で title / description / canonical / OGP / Twitter Card / JSON-LD を出力する。
- トップページ、カード解説ページ（78枚）、`/spreads`、`/about`、`/faq` は `export const prerender = true` で静的生成する。
- `astro.config.mjs` では `trailingSlash: 'never'`、`@astrojs/sitemap` を有効にしている。
- `npm run build` の `prebuild` で以下が自動生成されるため、通常は手動編集しない：
  - `public/ogp-default.png`
  - `public/apple-touch-icon.png`
  - `public/icon-192.png`
  - `public/icon-512.png`
  - `src/data/card-dimensions.json`

## よくある作業

1. **メタ情報の変更**: `Layout.astro` の props と各ページの `title` / `description` を修正。
2. **新規ページ追加**: `export const prerender = true` を付与し、必要に応じて `ldJson` を渡す。
3. **カードページの追加・変更**: `src/lib/tarotData.ts` の `slug` / キーワードを変更した場合、`npm run build` で静的ページが再生成される。
4. **OGP 画像の変更**: `scripts/generate-assets.mjs` を編集し、`npm run build` で再生成。
5. **FAQ 追加**: `src/pages/faq.astro` の配列を更新。`FAQPage` JSON-LD は自動付与。

## 確認手順

作業後は必ず以下を実行：

```bash
npm run check
npm run build
```

`dist/client/sitemap-index.xml` と各ページの HTML `<head>` に正しいメタ情報が含まれていることを目視確認する。
