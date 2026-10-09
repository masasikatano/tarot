# TarotScryer

ライダー・ウェイト・スミス（Rider-Waite-Smith）タロットを用いた、現実的で心理学的な内省のための Web サービス。

**Astro 6 + React 19 Islands + Tailwind 4 + Cloudflare Workers + Groq**

- **UI**: ライトモード、携帯特化、背面カードから直感的に選択
- **スプレッド**: 1枚引き（今日のメッセージ）/ 3枚引き（状況・課題・助言）
- **解釈**: Method of Levels（MOL）を織り交ぜた、親しみやすい女性占い師のトーン
- **LLM**: Groq（`openai/gpt-oss-20b`）をサーバーサイドでプロキシ
- **レートリミット**: IP ベース（12リクエスト / 5分）

## 開発

```bash
cp .env.example .env   # GROQ_API_KEY を設定
npm install
npm run check          # 必須
npm run dev            # http://localhost:4321
npm run build          # check + build
npm run deploy         # wrangler deploy
```

**本番シークレット設定**

```bash
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put LLM_MODEL   # openai/gpt-oss-20b（省略時はこのモデル）
npm run deploy
```

## ディレクトリ構成

```
src/
  layouts/Layout.astro
  pages/index.astro
  pages/cards/[name].astro   # 78枚のカード解説ページ（prerender）
  pages/spreads.astro        # スプレッド解説ページ
  pages/about.astro          # サービス・MOL 紹介ページ
  pages/faq.astro            # FAQ ページ
  pages/api/reading.ts
  components/islands/
    TarotApp.tsx
    SpreadSelector.tsx
    WorryInput.tsx
    CardPicker.tsx
    ReadingResult.tsx
  lib/
    tarotData.ts             # 78枚のカードデータ（slug 付き）
    tarotApi.ts              # 外部 Tarot API クライアント
    prompts.ts               # システムプロンプト
    rateLimit.ts
    api-response.ts
  data/
    card-dimensions.json     # ビルド時に生成されるカード画像サイズ
  styles/global.css

public/
  cards/                     # RWS タロット画像 78枚（Wikimedia Commons パブリックドメイン）
  ogp-default.png            # デフォルト OGP 画像（ビルド時生成）
  apple-touch-icon.png       # ホーム画面アイコン（ビルド時生成）
  icon-192.png
  icon-512.png
  robots.txt
  manifest.json

scripts/
  generate-assets.mjs        # OGP / アイコン画像生成
  generate-card-dimensions.ts # card-dimensions.json 生成

wrangler.toml
astro.config.mjs
```

## SEO / AIO

検索エンジン最適化（SEO）と生成 AI / LLM 検索における被引用性向上（AIO）の施策を実装済みです。詳細は `spec_seoaio.md` を参照してください。

- **静的コンテンツ**: 78 枚のカード解説ページ、`/spreads`、`/about`、`/faq` を prerender 生成
- **メタ情報**: `src/layouts/Layout.astro` で title / description / canonical / OGP / Twitter Card / JSON-LD を一元管理
- **サイトマップ**: `@astrojs/sitemap` により `dist/client/sitemap-index.xml` を自動生成
- **構造化データ**: `WebSite` / `WebApplication` / `Article` / `FAQPage` の JSON-LD を各ページに埋め込み
- **生成アセット**: `npm run build` の `prebuild` で OGP 画像・アイコン・カード画像サイズ JSON を自動生成

## 注意事項

- 画像は `public/cards/` にローカル配置した Wikimedia Commons の RWS パブリックドメイン画像を配信
- この結果はエンターテイメント・内省のきっかけであり、専門的な助言ではありません
- `vite` は Astro 6 との互換性のため `^7.3.5` に固定（`package.json` の `overrides` を参照）
