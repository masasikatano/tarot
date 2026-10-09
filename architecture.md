# TarotScryer アーキテクチャ

## 概要

ライダー・ウェイト・スミス（RWS）タロットを用いた、現実的で心理学的な内省のための Web サービス。

**スタック**: Astro 6 + React 19 Islands + Tailwind 4 + Cloudflare Workers + Groq

## システム構成図

```
┌─────────────────────────────────────┐
│           クライアント               │
│  ┌─────────────────────────────┐    │
│  │  React 19 Islands           │    │
│  │  - SpreadSelector           │    │
│  │  - WorryInput               │    │
│  │  - CardPicker               │    │
│  │  - ReadingResult            │    │
│  └─────────────────────────────┘    │
└──────────────┬──────────────────────┘
               │ POST /api/reading
               ▼
┌─────────────────────────────────────┐
│      Cloudflare Workers (Astro)      │
│  ┌─────────────────────────────┐    │
│  │  src/pages/api/reading.ts   │    │
│  │  - レートリミット処理        │    │
│  │  - Groq プロキシ             │    │
│  └─────────────────────────────┘    │
└──────────────┬──────────────────────┘
               │ JSON 応答
               ▼
┌─────────────────────────────────────┐
│               Groq API                │
│       openai/gpt-oss-20b              │
└─────────────────────────────────────┘
```

## 主要コンポーネント

### フロントエンド

- `src/layouts/Layout.astro`：ベースレイアウト
- `src/pages/index.astro`：トップページ
- `src/components/islands/`：インタラクティブな React コンポーネント
  - `TarotApp.tsx`：全体の状態管理
  - `SpreadSelector.tsx`：スプレッド選択（1枚/3枚）
  - `WorryInput.tsx`：悩みの入力
  - `CardPicker.tsx`：背面カードからの直感的選択
  - `ReadingResult.tsx`：解釈結果の表示

### バックエンド

- `src/pages/api/reading.ts`：占いリクエストを処理する API エンドポイント
- `src/lib/rateLimit.ts`：IP ベースのレートリミット（12 リクエスト / 5分）
- `src/lib/tarotApi.ts`：外部 Tarot API クライアント
- `src/lib/prompts.ts`：システムプロンプト（MOL トーン）
- `src/lib/tarotData.ts`：78 枚のカードデータ
- `src/lib/api-response.ts`：API レスポンスユーティリティ

### 静的アセット

- `public/cards/`：RWS タロット画像 78 枚（Wikimedia Commons パブリックドメイン）
- `src/styles/global.css`：Tailwind 4 ベースのスタイル

## データフロー

1. ユーザーがスプレッドを選択
2. 背面カードからカードを選択（ランダムにシャッフルされた位置に対応）
3. 悩みを入力してリクエスト送信
4. サーバー側でレートリミットをチェック
5. Groq API にプロンプトを送信
6. JSON 応答を検証・Markdown に整形してクライアントに返す
7. 親しみやすい女性占い師トーンで解釈を表示

## セキュリティとレート制限

- Groq API キーはサーバーサイドのみで保持
- IP アドレスベースのレートリミットでコストと濫用を抑制
- 本番環境では `wrangler secret put` で機密情報を設定

## SEO / AIO アーキテクチャ

検索エンジンと生成 AI の両方に discoverable な構成を目指している。

### 静的ページ（prerender）

| ページ | 内容 | JSON-LD |
|--------|------|---------|
| `/` | トップ / 占いアプリ | `WebApplication` |
| `/cards/[name]` | 78 枚のカード解説 | `Article` |
| `/spreads` | 1枚引き・3枚引きの解説 | — |
| `/about` | サービス理念・MOL 解説 | — |
| `/faq` | よくある質問 | `FAQPage` |

### メタ情報

- `src/layouts/Layout.astro` で title / description / canonical / OGP / Twitter Card / `WebSite` JSON-LD を一元管理。
- 各ページは props でメタ情報を上書き可能。
- カードページでは、カード画像を `og:image` に指定。

### サイトマップとクローラー制御

- `@astrojs/sitemap` で `sitemap-index.xml` を自動生成。
- `public/robots.txt` で `/api/` を disallow。
- `trailingSlash: 'never'` で URL を統一。

### 生成アセット

ビルド時に生成される SEO/AIO 用アセット：

- `public/ogp-default.png`
- `public/apple-touch-icon.png`
- `public/icon-192.png`
- `public/icon-512.png`
- `src/data/card-dimensions.json`

生成スクリプト：

- `scripts/generate-assets.mjs`
- `scripts/generate-card-dimensions.ts`

## デプロイ

- `npm run build` で Astro の静的ファイルと Workers 用アセットを生成
- `npm run deploy` で Cloudflare Workers にデプロイ
- ビルド時に SEO/AIO 用のアセットとサイトマップも生成される
