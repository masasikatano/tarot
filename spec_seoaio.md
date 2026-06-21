# TarotScryer SEO / AIO 施策仕様書

> 本ドキュメントは、TarotScryer（`https://tarot.scryer.workers.dev`）の検索エンジン最適化（SEO）と、生成 AI・LLM 検索における被引用性を高める AI 最適化（AIO / GEO）の施策をまとめたものです。  
> 実装優先度と手順を示し、必要に応じて `spec.md`・`spec_x.md` と同様に更新してください。

---

## 1. 目的と対象

### 1.1 サービスの現在地
- **アプリ**: Astro 6 + React 19 Islands + Cloudflare Workers 上のシングルページ体験
- **主要機能**: 1 枚引き（今日のメッセージ）/ 3 枚引き（状況・課題・助言）
- **差別化**: RWS タロット × Method of Levels（MOL）を織り交ぜた現実的・心理学的な内省
- **SNS 連携**: X 投稿スキル（`spec_x.md`）により、トレンド連動の 1 枚引き投稿を実施中

### 1.2 SEO/AIO で解決したい課題
1. **検索流入の獲得**: 現状ほぼ全コンテンツが React クライアントレンダリングのため、クローラーが読み取れる静的コンテンツが少ない。
2. **SNS 共有時の CTR 向上**: OGP 画像・説明文が既定値のまま。
3. **生成 AI への被引用**: カードの意味や MOL 解釈が LLM に蓄積されるような構造化コンテンツが不足。
4. **パフォーマンス・体験**: 画像・フォント・レイアウトの最適化余地あり。

### 1.3 目標 KPI（3 ヶ月後を目安）
| KPI | 現状 | 目標 |
|-----|------|------|
| Google インデックス数 | 1 ページ（トップのみ） | 80 ページ以上（カードページ中心） |
| 検索流入（月間） | ほぼ 0 | 1000 セッション/月 |
| 平均滞在時間 | 測定不能 | 1 分 30 秒以上 |
| SNS シェア CTR | 低 | 2% 以上 |
| Core Web Vitals | 未計測 | LCP ≤ 2.5s、CLS ≤ 0.1、INP ≤ 200ms |

---

## 2. キーワード戦略

### 2.1 ターゲットキーワード階層

| タイプ | キーワード例 | 月間ボリューム目安 | 難易度 | 優先度 |
|--------|-------------|------------------|--------|--------|
| **ブランド** | TarotScryer、タロットスクライヤー | 低 | 低 | 高（保護） |
| **コア** | タロット 無料、タロット 1枚引き、タロット 占い 内省 | 中〜高 | 中 | 高 |
| **スプレッド** | 今日の運勢 タロット、3枚引き タロット 意味、状況 課題 助言 | 中 | 中 | 高 |
| **カード別** | 愚者 タロット 意味、恋人 逆位置、ペンタクルのナイト 正位置 | 中 | 低〜中 | 最高 |
| **MOL/心理** | Method of Levels タロット、タロット 自己分析、心理療法 タロット | 低 | 低 | 中（差別化） |
| **長尾** | タロット 恋愛 相手の気持ち 3枚、タロット 仕事 転職 相談 | 低 | 低 | 中 |

### 2.2 検索意図の分類とコンテンツ設計

| 意図 | ユーザーの状態 | ランディング先 | コンテンツの型 |
|------|---------------|---------------|---------------|
| **情報型** | 「愚者の意味を知りたい」 | `/cards/fool` | カード解説ページ |
| **ツール型** | 「今すぐタロットを引きたい」 | `/` | 占いアプリ本体 |
| **比較型** | 「1枚引きと3枚引きの違い」 | `/spreads` | スプレッドガイド |
| **エンタメ型** | 「今日の運勢を見たい」 | `/` + 結果画面 | 占い体験 + SNS シェア |

### 2.3 ブランド・エンティティ戦略
- 「TarotScryer」は造語であり、検索ボリュームは少ないが **ブランド検索を保護** する。
- 「RWS タロット」「Method of Levels」「ライダー・ウェイト・スミス」といった既存エンティティとの **共起語** を自然に含める。
- X アカウント `@TarotScryer` と運営者 `@shiitake7919` を同一エンティティとして記述し、E-E-A-T（経験・専門性・権威性・信頼性）を担保する。

---

## 3. テクニカル SEO

### 3.1 インデックス制御とクローラー対応

#### robots.txt
`public/robots.txt` を新設し、以下のように制御する。

```txt
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://tarot.scryer.workers.dev/sitemap-index.xml
```

#### sitemap
- Astro 公式 `@astrojs/sitemap` を導入するか、`src/pages/sitemap-index.xml.ts` で手動生成する。
- 動的ルート `/cards/[name]`（78 枚）、`/spreads`、トップ `/` を含める。
- 更新頻度: カードページは `monthly`、トップは `weekly`、結果ページは含めない。

#### canonical
- 全ページに `<link rel="canonical" href="..." />` を設定する。
- `/cards/fool` などの URL パラメータが増えても正規 URL を統一する。

#### API の noindex
- `/api/reading` は JSON 応答なので、クローラーに見えないことを確認（robots.txt で `Disallow`）。

### 3.2 メタ情報の整備

#### 現状の問題
- `<title>`・`<meta name="description">` は `Layout.astro` に固定。
- OGP / Twitter Card 未設定。
- 各ページでメタ情報が切り替わっていない。

#### 推奨メタタグ（レイアウト共通）
```astro
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalUrl} />

<!-- OGP -->
<meta property="og:site_name" content="TarotScryer" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalUrl} />
<meta property="og:image" content={ogImage} />
<meta property="og:locale" content="ja_JP" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@TarotScryer" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />
```

#### OGP 画像
- サービス全体用の OGP 画像（1200×630）を `public/ogp-default.png` として作成する。
- カード個別ページでは、そのカードの画像を使った OGP 画像を動的生成（Cloudflare Workers 上で Canvas / `@vercel/og` 風実装）する。
- 最低限、デフォルト OGP 画像を即時設定することが最優先。

### 3.3 ファビコン / PWA
- `favicon.svg` は既存。`apple-touch-icon.png`（180×180）と `manifest.json` を追加する。
- PWA 化は必須ではないが、ホーム画面追加を促す場合は検討。

### 3.4 セマンティック HTML と見出し構造

#### 現状の課題
- `TarotApp.tsx` 内の見出しは `<h1>`, `<h2>` など適切に使われているが、**初期ロード時に h1 が React 内にある**ため、クローラーが取得するまでに JS 実行が必要。
- Astro レイアウト側に **静的な h1/description** を含め、クローラーが即座に読めるようにする。

#### 推奨構成（`src/pages/index.astro`）
```astro
<Layout title="TarotScryer — 内省のためのタロット" ...>
  <main>
    <section class="sr-only md:not-sr-only">
      <h1>内省のためのライダー・ウェイト・スミス・タロット</h1>
      <p>1枚引き・3枚引きで、今日の気づきを受け取ります。Method of Levels（MOL）を織り交ぜた現実的で心理学的な解釈を提供します。</p>
    </section>
    <TarotApp client:only="react" />
  </main>
</Layout>
```
- `sr-only` で視覚的に隠しつつ、スクリーンリーダー・クローラーには提示する。
- または、ヒーローセクションを静的 HTML で表示し、React はその下にマウントする。

### 3.5 構造化データ（JSON-LD）

#### WebApplication
トップページに占いアプリとしてのスキーマを埋め込む。

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "TarotScryer",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY"
  },
  "description": "ライダー・ウェイト・スミス（RWS）タロットを用いた、現実的で心理学的な内省のための Web サービス。",
  "url": "https://tarot.scryer.workers.dev",
  "author": {
    "@type": "Person",
    "name": "しいたけ.",
    "sameAs": ["https://x.com/shiitake7919"]
  }
}
```

#### Organization / WebSite
全ページ共通でサイト全体のエンティティを定義する。

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "TarotScryer",
  "url": "https://tarot.scryer.workers.dev",
  "sameAs": ["https://x.com/TarotScryer"]
}
```

#### TarotCard（カード個別ページ）
各カードページ `/cards/[name]` に以下のようなスキーマを埋め込む。

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "愚者（The Fool）の意味 — 正位置・逆位置",
  "description": "タロットカード「愚者」の正位置・逆位置のキーワード、MOL を織り交ぜた内省的な解釈、今日からできる小さなアクションを解説します。",
  "image": "https://tarot.scryer.workers.dev/cards/RWS1909%20-%2000%20Fool.jpeg",
  "author": {
    "@type": "Person",
    "name": "TarotScryer"
  },
  "publisher": {
    "@type": "Organization",
    "name": "TarotScryer",
    "logo": {
      "@type": "ImageObject",
      "url": "https://tarot.scryer.workers.dev/favicon.svg"
    }
  }
}
```

#### FAQPage
`/faq` または `/about` に、タロット・MOL・サービスに関する FAQ を設け、`FAQPage` スキーマを付与する。

---

## 4. コンテンツ戦略

### 4.1 カード解説ページ（最重要）

#### 方針
- 78 枚それぞれに **静的な解説ページ**を生成する。
- URL: `/cards/fool`、`/cards/magician` など（英語名を kebab-case に）。
- 日本語名リダイレクト: `/cards/愚者` などは 301 で英語名ページへ統合（URL エンコードの複雑さを避ける）。

#### ページ構成
1. カード画像（正位置）
2. カード名（日本語・英語）
3. 正位置のキーワード・短い解説
4. 逆位置のキーワード・短い解説
5. MOL 的な問いかけ（「このカードが示す高次の目的は？」）
6. 今日からできる小さなアクション
7. 「このカードで 1 枚引きする」CTA → `/` に遷移

#### SEO 効果
- 「[カード名] 意味」「[カード名] 逆位置」などの検索意図に直接応える。
- LLM はカードごとの明確な事実を学習しやすく、生成 AI 検索で引用されやすい。

### 4.2 スプレッドガイドページ
- URL: `/spreads`
- 内容:
  - 1 枚引き（今日のメッセージ）のやり方と解釈の仕方
  - 3 枚引き（状況・課題・助言）のやり方と MOL との関係
  - 質問の例（悩み入力のヒント）
- 狙うキーワード: 「3枚引き タロット 意味」「タロット スプレッド 内省」

### 4.3 About / MOL 解説ページ
- URL: `/about`
- 内容:
  - サービスの理念（未来予知ではなく内省のきっかけ）
  - Method of Levels（MOL）の簡単な解説
  - 運営者 `しいたけ.` のプロフィールと X アカウント
  - 免責事項・専門家への相談を促す文面
- 狙うキーワード: 「Method of Levels タロット」「タロット 自己分析」

### 4.4 FAQ ページ
- URL: `/faq`
- 例:
  - Q. タロットは未来を当てるものですか？
  - Q. 正位置と逆位置の違いは？
  - Q. 占い結果を SNS にシェアできますか？
- `FAQPage` スキーマを付与し、生成 AI 検索での引用を狙う。

### 4.5 ブログ / トピックコンテンツ（将来拡張）
- 季節・トレンドに応じたタロット解説（例:「新月に引きたいカード」「梅雨のモヤモヤを整理する 3 枚引き」）
- X 投稿スキル（`spec_x.md`）の内容を再利用し、ブログ記事化する。
- 頻度: 月 2〜4 記事を目安。

### 4.6 既存 React コンポーネントの SEO 対応
- `TarotApp.tsx` のヒーローテキストを Astro 側に移動 or 重複表示する。
- `ReadingResult.tsx` のカード画像 `alt` は既に `card.nameJp` を使用しているが、正位置/逆位置を含めるとより良い（例:「愚者（逆位置）」）。
- 結果画面の `<h2>`「今日のメッセージ」「内省スプレッド」は適切。不要な `<div>` タイトル化は避ける。

---

## 5. パフォーマンスと Core Web Vitals

### 5.1 画像最適化
- カード画像は `public/cards/*.jpeg` で直接配信。Cloudflare は自動で WebP/AVIF 変換してくれる可能性があるが、**明示的な画像最適化**を検討。
- 各カードに `srcset` / `sizes` を設定し、モバイルで必要なサイズのみ読み込む。
- LCP 対象になりやすいヒーロー画像やカード画像は `loading="eager"`、`fetchpriority="high"` を付与。
- OGP 画像は 1200×630、ファイルサイズ 200KB 以下に圧縮。

### 5.2 フォント最適化
- 現状はシステムフォントのみ。追加 Web フォントを入れる場合は `font-display: swap` を必ず設定。

### 5.3 JavaScript
- React Islands は `client:only` で全画面を占有。初期表示に必要な JS が大きい場合、ヒーロー部分を Astro で静的レンダリングし、React 部分を遅延ロードする。
- `html-to-image` は結果画面でしか使わないため、動的 import（`import('html-to-image')`）にして初期バンドルから除外する。

### 5.4 CLS（Cumulative Layout Shift）
- カード画像に `width`/`height` 属性を設定。
- テキストエリアやボタンが読み込み後にずれないよう、CSS でサイズを固定。
- 広告や外部ウィジェットは現状不要だが、追加する場合は予約領域を確保。

### 5.5 INP（Interaction to Next Paint）
- カード選択アニメーションは `transform`/`opacity` を使用（既にそうしているはずだが、確認）。
- 重いレンダリング（結果画面の Markdown）を必要な範囲のみ更新。

---

## 6. AIO（AI Optimization / Generative Engine Optimization）

### 6.1 AIO の基本方針
生成 AI（ChatGPT、Perplexity、Google SGE、Grok など）が回答を生成する際に、TarotScryer のコンテンツや見解が **引用・参照** されることを目指す。

### 6.2 具体施策

#### 6.2.1 事実型コンテンツの明確化
- 各カードページに **定型的な事実**（正位置・逆位置のキーワード、概要）を箇条書きで記載。
- 独自の解釈（MOL 的問いかけ）も含めるが、事実と意見を区別。

#### 6.2.2 簡潔な回答セクション
- 各ページの先頭に「このページの要約」（〜80 字）を設ける。
- LLM は文書の先頭部分を重視する傾向があるため、問いに対する答えを冒頭に置く。

#### 6.2.3 FAQ / QA 形式
- FAQ ページは LLM が直接引用しやすい形式。
- 各 Q&A は独立して完結する文章にする。

#### 6.2.4 構造化データ
- `Article`、`FAQPage`、`HowTo` スキーマを活用。
- カードの読み方を `HowTo` スキーマでマークアップすると、生成 AI がステップとして理解しやすい。

#### 6.2.5 エンティティと E-E-A-T
- 運営者 `しいたけ.` の実名（可能な範囲）・X アカウント・運営実績を About ページに記載。
- 「このサイトはエンターテイメント・内省のきっかけであり、専門的な助言ではありません」と明記し、信頼性を高める。
- 外部権威サイト（Wikimedia Commons の著作権情報、MOL の学術的出典など）へのリンクを適切に貼る。

#### 6.2.6 ブランド言及の増加
- X 投稿スキルで定期的に `@TarotScryer` を露出。
- 他サイト・ブログで自然な形で言及されるよう、ユニークなコンテンツ（例：「MOL × タロット」の組み合わせ）を発信。

#### 6.2.7 多言語対応（将来）
- 現状は日本語メイン。英語ページ `/en/cards/fool` などを追加すると、Perplexity や ChatGPT の英語検索でも引用される可能性が上がる。
- ただし、MVP 後の拡張として位置づける。

---

## 7. SNS・オフページ SEO

### 7.1 X（Twitter）連携
- `spec_x.md` の運用を継続。投稿からの被リンク・ブランド検索は強力な SEO シグナル。
- プロフィール欄に `https://tarot.scryer.workers.dev` を掲載。
- 投稿時の OGP 画像が正しく表示されるよう、デフォルト OGP 画像を設定。

### 7.2 被リンク獲得
- 占い・スピリチュアル・自己啓発系メディアへの紹介依頼。
- 「MOL × タロット」という独自切り口で、心理学・コーチング系コミュニティに共有。
- カード解説ページは引用しやすく、他ブログからの自然な被リンクを期待。

### 7.3 ディレクトリ・ブックマーク
- 国内の占いサイトディレクトリや、Web サービス紹介サイトへの掲載を検討。

---

## 8. 測定と改善サイクル

### 8.1 導入ツール
| ツール | 用途 |
|--------|------|
| Google Search Console | インデックス状況、検索クエリ、クリック率 |
| Google Analytics 4 | すでに導入済み（G-MCGJFEE12K）。ページ別滞在時間、イベント計測 |
| PageSpeed Insights | Core Web Vitals 計測 |
| Ahrefs / Ubersuggest / Google Keyword Planner | キーワード調査（無料枠で可） |

### 8.2 イベント計測（GA4）
- `spread_selected`（1枚/3枚選択）
- `card_picked`（カード選択）
- `reading_completed`（リーディング完了）
- `result_saved`（画像保存）
- `result_shared`（共有）

### 8.3 改善サイクル
1. 月 1 回 Search Console で検索クエリと CTR を確認。
2. 低 CTR ページのタイトル・メタディスクリプションを改善。
3. 新規キーワードの出現に応じてコンテンツ追加。
4. Core Web Vitals が劣化した場合、画像・JS を見直す。

---

## 9. 実装ロードマップ

### Phase 1: 即効性の高い対応（1〜2 週間）
1. `public/robots.txt` 作成
2. `public/ogp-default.png` 作成と OGP タグ追加
3. `Layout.astro` で title/description/og/twitter/canonical を props 化
4. `src/pages/index.astro` に静的な h1/説明文を追加
5. `public/sitemap-index.xml`（または `@astrojs/sitemap`）導入
6. サイト全体の JSON-LD（WebSite / WebApplication）埋め込み
7. `apple-touch-icon.png` と `manifest.json` 追加
8. 画像 `width`/`height`、alt テキストの見直し

### Phase 2: コンテンツ拡充（2〜6 週間）
1. `/cards/[name].astro` を新設し 78 枚のカードページを生成
2. `/spreads` ページ作成
3. `/about` ページ作成（MOL 解説・運営者紹介）
4. `/faq` ページ作成（FAQPage スキーマ付き）
5. カード個別 OGP 画像の動的生成（最低限、カード画像をそのまま使用）

### Phase 3: 測定・拡張（1〜3 ヶ月）
1. Google Search Console 登録
2. GA4 イベント計測の強化
3. PageSpeed Insights で CWV 改善
4. ブログ・トレンド連動コンテンツの追加
5. 英語ページなど多言語対応の検討

---

## 10. リスクと注意点

### 10.1 コンテンツの質
- LLM 生成したカード解説をそのまま掲載すると、他サイトと重複しやすい。**独自の MOL 解釈や運営者の言葉を加える**ことで差別化する。

### 10.2 免責事項
- 医療・心理・法律に関する助言は行わない方針を、全ページのフッターおよび About ページで明示。
- 「占いはエンターテイメント・内省のきっかけ」との表記を維持。

### 10.3 著作権
- RWS 画像は Wikimedia Commons のパブリックドメイン扱いのものを使用。
- カードページには「画像出典: Wikimedia Commons（パブリックドメイン）」などを記載。

### 10.4 パーソナライズされた結果ページのインデックス化
- `/` の結果表示は URL に状態を持たないためインデックス対象外。問題なし。
- 将来的に「結果を URL 共有」機能を追加する場合は、個別ページを noindex にする。

---

## 11. 参考リソース

- Google Search Central: https://developers.google.com/search/docs
- Schema.org: https://schema.org
- Astro Sitemap: https://docs.astro.build/en/guides/integrations-guide/sitemap/
- Method of Levels（MOL）: https://www.methodoflevels.org/
- `spec.md` / `spec_x.md` / `architecture.md`

---

## 12. 改定履歴

| 日付 | 内容 |
|------|------|
| 2026-06-21 | 初版作成。SEO/AIO 施策を体系化。 |
