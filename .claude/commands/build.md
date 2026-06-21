# ビルドと型チェック

このプロジェクトでは `npm run check` と `npm run build` を必ず実行してください。
Astro 6 + React 19 + TypeScript の型チェックを含みます。

```bash
npm run check
npm run build
```

`npm run build` 実行前の `prebuild` で、SEO/AIO 用のアセット（`public/ogp-default.png`、アイコン類、`src/data/card-dimensions.json`）が自動生成されます。これらを手動で変更する必要は通常ありません。

エラーがあれば修正し、再度実行して確認してください。
