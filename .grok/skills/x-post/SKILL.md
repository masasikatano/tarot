---
name: x-post
description: >
  TarotScryer（@TarotScryer、運営: しいたけ. @shiitake7919）の X 投稿ドラフトを生成し
  outreach/x/YYYY-MM-DD.md に保存する。Phase1: 日本トレンド1件選出 → ユーザーが悩み欄に入力して
  1枚引き・画像保存 → Phase2: しいたけ口調で文案2本（トレンド+1枚 / Post A連動招待）を出力。
  コピペ用ブロック1つでそのまま投稿できる形式。自動投稿は行わない。
  Use when user runs /x-post or /x, asks for X投稿, Twitter outreach,
  ハッシュタグ投稿, or TarotScryer social media drafts.
  使用方法:
  Phase1: /x-post
  Phase2: /x @/home/masasikatano/download/tarot-result.png 星・逆位置
---

# X 投稿ドラフト生成（/x-post, /x）

仕様の Single Source of Truth: [`spec_x.md`](../../../spec_x.md)

## 禁止事項（必ず遵守）

- X API・サードパーティツールによる**自動投稿をしない**
- 投稿スケジューラ・ボット連携を提案・実装しない
- 画像の生成・合成・コピーをしない（ユーザーが「画像を保存」した PNG を使う）
- `x.com/explore` の直接スクレイピングをしない
- スキルの役割は**ドラフト生成と Markdown 保存のみ**

## 参照ファイル（実行前に読む）

1. [`references/trend-filter.md`](references/trend-filter.md) — Phase 1: トレンド取得・フィルタ・選出
2. [`references/shiitake-voice.md`](references/shiitake-voice.md) — しいたけ. の語り口・3行テンプレ
3. [`references/voice-guide.md`](references/voice-guide.md) — 共通ルール・Post 構成要約
4. [`references/hashtag-seeds.md`](references/hashtag-seeds.md) — Post A/B タグ構成
5. [`references/markdown-template.md`](references/markdown-template.md) — コピペ用ブロック形式

## Phase 判定

| 条件 | フェーズ |
|------|---------|
| 画像パスが**未指定** | **Phase 1**（トレンド選出） |
| 画像パスが**指定済み** | **Phase 2**（文案生成） |

---

## Phase 1: トレンド選出

### Step 1.1: トレンド取得

- `WebFetch` で [getdaytrends.com/japan](https://getdaytrends.com/japan/) を取得
- `WebSearch` を 1〜2 回（例: `X 日本 トレンド 今日`）

### Step 1.2: hybrid_filter

[`references/trend-filter.md`](references/trend-filter.md) に従い:

1. 採用候補と除外に分類
2. **占いと自然に接続できるトレンドを 1 つ選出**
3. 短いタグを優先。スポーツ速報・政治・長文プロモは除外

### Step 1.3: 候補 0 件のとき

無関係タグは使わない。explore 目視・再実行・投稿スキップを案内。

### Step 1.4: ユーザーへの提示

以下を出力する:

1. **採用トレンド**（キーワード・ハッシュタグ・理由）
2. **除外したトレンド**（例と理由）
3. **次のアクション**:
   - `https://tarot.scryer.workers.dev` で 1 枚引き
   - 悩み欄に選出キーワードを入力
   - カード選択 → 「画像を保存」
   - `/x-post （画像パス） （カード名）・（正逆）` で Phase 2

### Step 1.5: Markdown 保存（任意）

```bash
mkdir -p outreach/x
```

[`references/markdown-template.md`](references/markdown-template.md) の Phase 1 テンプレで `outreach/x/YYYY-MM-DD.md` に保存可。
同日ファイルが既存の場合は、上書き前にユーザーに確認する。

---

## Phase 2: 文案生成

### Step 2.1: 入力収集

| 項目 | 必須 | 例 |
|------|------|-----|
| 画像パス | はい | `/home/user/Downloads/tarot-result.png` |
| カード（日本語名・正逆） | はい | `星・逆位置` |
| 選出トレンド | はい | Phase 1 のキーワード（未指定なら当日 Markdown から読む） |
| 投稿時刻帯 | いいえ | 朝 / 昼 / 夜 / 深夜 |
| 日付 | いいえ | 省略時は今日 `YYYY-MM-DD` |

- スプレッドは `single` 固定
- 画像パスは存在確認する

### Step 2.2: カード文脈の取得

[`src/lib/tarotData.ts`](../../../src/lib/tarotData.ts) から該当カードの `keywords` / `keywordsReversed` を参照する。

### Step 2.3: 文案生成（2本必須）

[`references/shiitake-voice.md`](references/shiitake-voice.md) に従う。

#### Step 2.3.1: 接続パターンの選定

トレンド種別と悩み入力キーワードの文脈から、Post A のパターンを選ぶ:

| 種別 | パターン |
|------|---------|
| 番組・バラエティ・推し・音楽・エンタメ | **A: ファン感情型**（デフォルト） |
| 季節・天気・恋愛・仕事・生活 | **B: 気分・生活型** |
| 話題性のみ・深掘りしたくない | **C: 観察・一言型** |

基本構造: `[トレンドへの個人的反応] → [引いた] → [橋渡し1文（Aのみ・任意）] → 【カード】→ [ヒント] → [タグ]`

#### Post A: トレンド + 今日の1枚

コピペ用ブロック（本文 + 空行 + タグ）を1つ生成する。

- しいたけ. の体験ベース口調（占い師キャラではない）
- **パターン A** では視聴・推し活の感情から入り、カードとの橋渡し1文 + 「解釈違いは許して」等を許可
- カード名 + 正逆 + `tarotData.ts` のキーワードヒント
- ハッシュタグ: `#（トレンド） #タロット #占い`（3個固定）
- **タグ込み合計 ≤ 140字を目標、150字が上限**（超過時は橋渡し省略 or パターン B/C）
- リンクなし、免責なし、画像添付想定

#### Post B: Post A 連動（招待）— 型3 カードメッセージの橋渡し型

[`references/shiitake-voice.md`](references/shiitake-voice.md) の **Post B 型3** に従う（デフォルト固定）。

```
{Post Aのヒント}、と{カード略称}が言ってた。
{トレンド}の余韻が残ってる人は、同じテーマで3枚引きも試せます。裏向きから直感で。
https://tarot.scryer.workers.dev

#タロット #タロット占い #占い
```

- 1文目: Post A のヒント/キーワード + カード略称（ナイト、教皇 等）
- 2文目: トレンド余韻（エンタメ）または「気になった人は」（生活系）+ 同じテーマで3枚引き
- `https://tarot.scryer.workers.dev` を1回、サービス名は本文に入れない
- ハッシュタグ: `#タロット #タロット占い #占い`（トレンドタグなし）
- **タグ込み合計 ≤ 220字**、画像なし

#### 文字数チェック

Python 等でコピペ用ブロックの文字数を数え、上限超過なら本文を短縮する。

### Step 2.4: Markdown 保存

```bash
mkdir -p outreach/x
```

[`references/markdown-template.md`](references/markdown-template.md) の Phase 2 テンプレで `outreach/x/YYYY-MM-DD.md` に保存する。

**必須**: 各 Post に `### コピペ用（タグ込み・そのまま X に貼る）` セクションを含める。

同日ファイルが既存の場合は、上書き前にユーザーに確認する。

### Step 2.5: 完了報告

1. 保存先パス
2. 選出トレンド
3. Post A / Post B のタグ込み文字数
4. 「コピペ用ブロックをそのままコピーして @TarotScryer に投稿」と案内
5. Post B は別日投稿可

---

## 運用リマインダー

```
1. /x-post（Phase 1）→ トレンド1件が選出される
2. tarot.scryer.workers.dev で悩み欄にキーワード入力 → 1枚引き → 画像保存
3. /x-post （画像パス） （カード名）・（正逆）（Phase 2）
4. outreach/x/YYYY-MM-DD.md の「コピペ用」をそのまま X に貼る
```