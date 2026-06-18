# ScryTarot

ライダー・ウェイト・スミス（Rider-Waite-Smith）タロットを用いた、現実的で心理学的な内省のための Web サービス。

**Astro 6 + React 19 Islands + Tailwind 4 + Cloudflare Workers + OpenRouter ストリーミング**

- **UI**: ライトモード、携帯特化、背面カードから直感的に選択
- **スプレッド**: 1枚引き（今日のメッセージ）/ 3枚引き（状況・課題・助言）
- **解釈**: Method of Levels（MOL）を織り交ぜた、親しみやすい女性占い師のトーン
- **LLM**: OpenRouter 無料枠（`openrouter/free`）をサーバーサイドでプロキシ
- **レートリミット**: IP ベース（12リクエスト / 5分）

## 開発

```bash
cp .env.example .env   # OPENROUTER_API_KEY を設定
npm install
npm run check          # 必須
npm run dev            # http://localhost:4321
npm run build          # check + build
npm run deploy         # wrangler deploy
```

**本番シークレット設定**

```bash
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put LLM_MODEL   # openrouter/free
npm run deploy
```

## ディレクトリ構成

```
src/
  layouts/Layout.astro
  pages/index.astro
  pages/api/reading.ts
  components/islands/
    TarotApp.tsx
    SpreadSelector.tsx
    WorryInput.tsx
    CardPicker.tsx
    ReadingResult.tsx
  lib/
    tarotData.ts       # 78枚のカードデータ（フォールバック）
    tarotApi.ts        # 外部 Tarot API クライアント
    prompts.ts         # システムプロンプト
    rateLimit.ts
    api-response.ts
  styles/global.css

wrangler.toml
astro.config.mjs
```

## 注意事項

- 画像は Wikimedia Commons の RWS パブリックドメイン画像を参照
- この結果はエンターテイメント・内省のきっかけであり、専門的な助言ではありません
- `vite` は Astro 6 との互換性のため `^7.3.5` に固定（`package.json` の `overrides` を参照）
