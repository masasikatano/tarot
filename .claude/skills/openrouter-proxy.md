# OpenRouter プロキシ

TarotScryer は OpenRouter API をサーバーサイドでプロキシして利用する。

## フロー

1. ユーザーがカード選択と悩みを入力
2. `src/pages/api/reading.ts` がリクエストを受信
3. `src/lib/tarotApi.ts` が OpenRouter API を呼び出し
4. ストリーミングレスポンスをクライアントに返す

## レートリミット

- IP ベースで 12 リクエスト / 5分
- `src/lib/rateLimit.ts` で実装

## モデル

- デフォルト：`openrouter/free`
- 本番環境では `wrangler secret put LLM_MODEL` で変更可能

## セキュリティ

- API キーはクライアントに漏らさない
- サーバーサイドでのみ環境変数から読み取る
