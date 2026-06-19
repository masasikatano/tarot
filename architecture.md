# TarotScryer アーキテクチャ

## 概要

ライダー・ウェイト・スミス（RWS）タロットを用いた、現実的で心理学的な内省のための Web サービス。

**スタック**: Astro 6 + React 19 Islands + Tailwind 4 + Cloudflare Workers + OpenRouter ストリーミング

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
│  │  - OpenRouter プロキシ       │    │
│  └─────────────────────────────┘    │
└──────────────┬──────────────────────┘
               │ ストリーミング
               ▼
┌─────────────────────────────────────┐
│           OpenRouter API             │
│        openrouter/free               │
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
- `src/lib/tarotApi.ts`：OpenRouter API クライアント
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
5. OpenRouter API にプロンプトを送信
6. ストリーミングレスポンスをクライアントに返す
7. 親しみやすい女性占い師トーンで解釈を表示

## セキュリティとレート制限

- OpenRouter API キーはサーバーサイドのみで保持
- IP アドレスベースのレートリミットでコストと濫用を抑制
- 本番環境では `wrangler secret put` で機密情報を設定

## デプロイ

- `npm run build` で Astro の静的ファイルと Workers 用アセットを生成
- `npm run deploy` で Cloudflare Workers にデプロイ
