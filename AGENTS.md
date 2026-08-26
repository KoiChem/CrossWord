# AGENTS.md

## Project

高校化学「有機化合物」を学ぶクロスワード型Webアプリ。

現在の開発対象は **脂肪族のみ**。

詳細仕様は必ず `SPEC.md` を参照すること。

---

## Core Principles

1. 教育内容の正確性を最優先する。
2. パズルとしての操作感・楽しさを損なわない。
3. PC・iPad・スマートフォンで軽快に動作させる。
4. GitHub Pagesで公開できる静的Webアプリを維持する。
5. 不要な依存関係・フレームワーク・サーバーを増やさない。
6. 用語データとアプリロジックを分離する。
7. 将来、芳香族・天然高分子・合成高分子を追加できる構造にする。
8. 大規模な仕様変更を独断で行わない。

---

## Answer Representation

クロスワード盤面上の答えは原則として

- ひらがな
- 小書きひらがな
- `ゔ`
- 長音符 `ー`

のみを使用する。

例：

- エタノール → `えたのーる`
- 酢酸 → `さくさん`
- 銀鏡反応 → `ぎんきょうはんのう`

長音符・小書き文字も1マスとして扱う。

カタカナ入力を許容する場合は、確定時にひらがなへ正規化してよい。

---

## Japanese IME

日本語IMEのcomposition中に入力値を破壊しないこと。

`compositionstart` / `compositionend` を考慮する。

ひらがな制限のために、変換途中のローマ字や未確定文字を即時削除するような実装は禁止。

IME確定後に正規化・検証する。

---

## Architecture

初期版は静的Webアプリとする。

第一候補：
- HTML
- CSS
- Vanilla JavaScript

React、Vue等の導入は禁止ではないが、採用する場合は
- なぜ必要か
- Vanilla JSより何が改善するか
- bundle sizeや保守性への影響

を説明すること。

サーバー、DB、認証は初期版に導入しない。

---

## Data Separation

教材データをGenerator/Playerのコードへ直接埋め込まない。

最低限、以下を分離する。

```text
data/
  aliphatic.js
```

将来的に

```text
data/
  aromatic.js
  natural-polymer.js
  synthetic-polymer.js
```

を追加できる構造にする。

---

## Crossword Generator

完全な全面埋めクロスワードを目指さない。

化学用語のみを交差させる「疎なクロスワード」を許容する。

Generatorでは以下を重視する。

- 多くの語を配置できる
- 交差が十分ある
- 全体が連結している
- 盤面の偏りが少ない
- 不自然な隣接がない
- familyの偏りが少ない
- 交差文字の質が悪すぎない
- 毎回適度に異なる

候補技術：

- crossing candidate precomputation
- backtracking
- MRV
- random restart
- multi-candidate generation
- score-based selection

過剰なアルゴリズムや大規模ライブラリは必要性が確認されるまで導入しない。

---

## Generator Quality

「配置成功」だけを成功条件にしない。

各配置をスコアリングし、パズルとして品質の高い盤面を採用する。

評価例：

- placedWordCount
- crossingCount
- compactness
- connectedness
- semanticRelatedness
- intersectionQuality
- awkwardAdjacencyPenalty
- isolatedWordPenalty
- familyBiasPenalty
- edgeBiasPenalty

スコアの重みはテスト結果に基づいて変更してよい。

---

## Clues

1つの答えに複数ヒントを持たせる。

種類例：

- 名称・分類
- 構造式・分子式
- 性質
- 反応
- 合成法
- 関連物質

難易度に応じて異なるヒントを選択可能にする。

---

## UX

教材感より「上質なパズルゲーム感」を優先する。

避けること：

- 過剰な分子模様
- 試験管・フラスコ等の装飾過多
- 重いアニメーション
- 極端に小さい文字
- スマホでの狭いタップ領域

重視すること：

- セル選択が直感的
- タテ/ヨコ切替が分かりやすい
- 選択中単語が明確
- ヒントが読みやすい
- 入力が軽快
- 正解時のフィードバックが気持ちよい

---

## Audio / Motion

SE・VFXは軽量にする。

Web Audio APIやCSS Animationを優先。

`prefers-reduced-motion` を尊重する。

音声ファイルや大型アニメーションライブラリを大量に追加しない。

---

## Performance

以下を重視する。

- 初回ロードが軽い
- スマホでも盤面生成が遅くない
- GeneratorがUIスレッドを長時間ブロックしない
- 必要なら生成試行数に上限を設ける
- 無限探索を絶対に起こさない

必要になればWeb Workerを検討してよいが、初期段階から必須としない。

---

## Testing

コード変更後は関連機能を必ず検証する。

Generatorについては自動テストを用意し、

- 100回以上連続生成
- 例外なし
- 盤面外配置なし
- 文字衝突なし
- 不正隣接なし
- 原則連結
- 空盤面なし

を最低条件とする。

可能なら1000回生成テストを用意する。

日本語IMEについては、少なくとも以下を意識する。

- macOS/iOS Safari
- Chrome系ブラウザ
- ひらがな
- カタカナ
- 長音符
- 小書きかな
- Backspace

---

## Development Process

大きな機能は一度に実装しない。

原則：

1. 仕様確認
2. 実装計画
3. 小さい単位で実装
4. テスト
5. 結果確認
6. 次フェーズ

現在の推奨フェーズ：

1. Generator
2. Player
3. UI/UX
4. 本番教材データ
5. QA / optimization

---

## Scope Control

初期版では以下を追加しない。

- サーバー
- ログイン
- クラウドDB
- ランキング
- AIリアルタイム生成
- オンライン対戦
- 本格SRS
- 重い3D演出

キーワード問題、Knowledge Map、学習履歴は将来機能とする。

---

## Change Policy

仕様にない改善を発見した場合：

- 小規模で明らかなバグ修正 → 実施可
- 内部リファクタリング → 挙動を変えない範囲で実施可
- UI構成の大幅変更 → 先に提案
- データモデルの破壊的変更 → 先に提案
- 新しい外部依存追加 → 必要性を説明してから実施
- 初期スコープ外機能追加 → 勝手に実装しない

---

## Documentation

Generatorのアルゴリズムとスコアリングについては、コードだけでなくコメントまたはREADMEに簡潔に説明を残すこと。

特に
- なぜその候補語を選んだか
- なぜその配置を高評価したか
- 再生成条件
- random seedの扱い

が後から追える構造を優先する。

---

## Definition of Done

機能追加は以下を満たして完了とする。

- 仕様を満たす
- 既存機能を壊していない
- モバイル表示が破綻しない
- 必要なテストが通る
- console errorがない
- 不要な依存を追加していない
- GitHub Pagesで動作可能な状態を維持している
