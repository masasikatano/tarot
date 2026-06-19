---
name: x-post
description: >
  TarotScryer の X（Twitter）投稿ドラフトを生成し outreach/x/YYYY-MM-DD.md に保存する。
  実リーディングの画像パスとカード情報を入力に、#タロット #今日の運勢 #占い 等の
  タイムラインに溶け込む占い口調の文案2本（今日の1枚 + Post A 連動の招待）を作成する。
  コピペ用ブロック1つでそのまま投稿できる形式。自動投稿は行わない。
  Use when user runs /x-post or /x, asks for X投稿, Twitter outreach,
  ハッシュタグ投稿, or TarotScryer social media drafts.
---

# X 投稿ドラフト生成（/x-post, /x）

仕様の Single Source of Truth: [`spec_x.md`](../../../spec_x.md)

## 禁止事項（必ず遵守）

- X API・サードパーティツールによる**自動投稿をしない**
- 投稿スケジューラ・ボット連携を提案・実装しない
- 画像の生成・合成・コピーをしない（ユーザーが「画像を保存」した PNG を使う）
- スキルの役割は**ドラフト生成と Markdown 保存のみ**

## 参照ファイル（実行前に読む）

1. [`references/voice-guide.md`](references/voice-guide.md) — トーン・3行テンプレ・文字数
2. [`references/hashtag-seeds.md`](references/hashtag-seeds.md) — デフォルト3タグ・調査手順
3. [`references/markdown-template.md`](references/markdown-template.md) — コピペ用ブロック形式

## 実行手順

### Step 1: 入力収集

| 項目 | 必須 | 例 |
|------|------|-----|
| 画像パス | はい | `/home/user/Downloads/tarot-result.png` |
| スプレッド | はい | `single` または `three` |
| カード（日本語名・正逆） | はい | `愚者・正位置` / `状況:塔・逆位置` 等 |
| 投稿時刻帯 | いいえ | 朝 / 昼 / 夜 / 深夜（挨拶選択用） |
| 日付 | いいえ | 省略時は今日の日付 `YYYY-MM-DD` |

画像パスは存在確認する。存在しない場合はユーザーに正しいパスを確認する。

### Step 2: カード文脈の取得

[`src/lib/tarotData.ts`](../../../src/lib/tarotData.ts) から該当カードの `keywords` / `keywordsReversed` を参照する。

### Step 3: ハッシュタグ調査

`WebSearch` を **2〜3回** 実行し、デフォルトタグが有効か確認する。

- **Post A デフォルト**: `#タロット #占い #今日の運勢`（3個固定）
- **Post B デフォルト**: `#タロット #タロット占い #占い`（3個固定）

調査で明らかに優れた代替がある場合のみ、同数・同程度の長さに差し替える。

### Step 4: 文案生成（2本必須）

[`references/voice-guide.md`](references/voice-guide.md) の **3行テンプレ** に従う。

#### Post A: 今日の1枚

コピペ用ブロック（本文 + 空行 + タグ）を1つ生成する。

- 運勢・占い口調、カード名 + 正逆 + キーワードヒント
- ハッシュタグはブロック内に含める（別欄にしない）
- **タグ込み合計 ≤ 140字を目標、150字が上限**
- リンクなし、免責なし、画像添付想定
- 投稿時刻に合った挨拶（`voice-guide.md` 参照）

#### Post B: Post A 連動（招待）

コピペ用ブロック（本文 + URL + 空行 + タグ）を1つ生成する。**Post A と同じセッションの続き**として書く。

- **1文目に Post A と同じカード名を必須**（例: `今日の教皇、もう少し深く見たい方へ。`）
- 1枚引き → 3枚引きへの誘導、または深掘りのきっかけ
- 3枚引き → 状況カード名を使い、悩み入力 + 3枚引きの体験を訴求
- **体験訴求**: 裏向きのカードから直感で選ぶ（TarotScryer 固有の UX）
- `https://tarot.scryer.workers.dev` を1回含める
- 本文に `TarotScryer` サービス名は**入れない**
- 「無料」は補足程度（前面に出さない）
- ハッシュタグはブロック内に含める
- **タグ込み合計 ≤ 220字**
- 画像なし

#### 文字数チェック

Python 等でコピペ用ブロックの文字数を数え、上限超過なら本文を短縮する。
絵文字は X で2字扱いになりうるため、上限付近ではさらに短くする。

### Step 5: Markdown 保存

```bash
mkdir -p outreach/x
```

[`references/markdown-template.md`](references/markdown-template.md) の構造で `outreach/x/YYYY-MM-DD.md` に保存する。

**必須**: 各 Post に `### コピペ用（タグ込み・そのまま X に貼る）` セクションを含める。

同日ファイルが既存の場合は、上書き前にユーザーに確認する。

### Step 6: 完了報告

1. 保存先パス
2. Post A / Post B のタグ込み文字数
3. 「コピペ用ブロックをそのままコピーして投稿」と案内
4. Post B は別日投稿可

## 運用リマインダー

```
1. https://tarot.scryer.workers.dev で占う
2. 「画像を保存」で tarot-result.png を保存
3. /x-post に画像パスとカード情報を渡す
4. outreach/x/YYYY-MM-DD.md の「コピペ用」をそのまま X に貼る
```

## 3枚引きの Post A

- 状況カードを主役に。課題・助言は画像に任せる
- タグ込み150字を超えそうなら状況カードのみに絞る