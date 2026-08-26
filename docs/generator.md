# Generator

## 入力データ

data/aliphatic_master_v0_1.json が脂肪族100語の正本である。Generatorは
enabledByDefault、answer、category、family、learningPriority、
crosswordPriority、selectionWeight を読む。元データは変換せずに保持する。

related はこの版のデータに含まれない。そのためPhase 1の意味的なまとまりは
category を優先することで作る。将来 related が加わった場合も、配置制約では
なく候補語選択の重みとして追加する。

## 配置

1. 盤面に収まる3文字以上の語から、交差可能な候補を作る。
2. priority、selectionWeight、交差次数を使って中心語を選ぶ。
3. 中心語と同じcategoryをやや優先しつつ、family上限内で候補プールを作る。
4. 最初の語を中央付近に置く。
5. 既存語と一致する文字位置から直交配置候補を事前計算する。
6. 配置候補の少ない語を先に試すMRVで、制限付きbacktrackingを行う。

新規語は必ず既存語と交差する。不正な並列接触、語端接触、同方向の重なり、
文字衝突、盤面外配置はその場で拒否するため、完成盤面は連結である。

## family

familyは化学分類ではなく、似た名称・似た出題が同じ盤面に偏るのを防ぐための
グループである。EASYは同じfamilyを1語まで、NORMAL/HARDは2語まで許す。
2語目は品質スコアで軽く減点し、3語目は候補にしない。

## 直近出題語の抑制

ブラウザのlocalStorageに直近6盤面の用語IDだけを保存する。次の盤面では、最新の
盤面で使った語の選択重みを18%に下げ、1盤面古くなるごとに30%、42%、54%、66%、
78%へ緩める。完全除外にはしないため、盤面サイズ・family・交差制約を満たす語が
不足する場合でも生成は止まらない。

履歴はサーバーへ送信しない。同じ盤面を画面内で再生成しても、履歴に重複記録しない。

## 品質選択

必須制約を満たした盤面だけを比較する。スコアは語数、交差、compactness、
盤面・方向・交差次数のバランス、categoryのまとまり、交差文字の情報量、
family超過の順で評価する。上位8候補が目標語数に到達した時点で探索を止める。

## seedと再現

通常は暗号学的乱数から32bit seedを作る。Generator内のランダム処理はすべて
seed付きPRNGを使う。同じseed、データ版、Generator版、プリセット、出題履歴なら
同じ盤面を再現できる。生成結果にはseed、盤面fingerprint、出題履歴の署名、探索
ノード数、停止理由を残す。

## 実行上限

探索は候補プール3回、restart最大12回、総探索ノード40,000件までで停止する。
ただし目標語数を満たす上位8候補が得られたら、無制限に品質を掘り続けずに終了する。
通常テストは node --test tests/data/*.test.js tests/generator/*.test.js
tests/history/*.test.js tests/player/*.test.js を実行する。1000回検証では
RUN_STRESS=1 node --test tests/generator/stress.test.js を実行する。
