# タスク名: Git Checkout 機能実装

## 概要

ブランチの切り替えとファイル復元を行う `git_checkout` ツールを実装する。MCPツールとして既存のブランチへの切り替え、強制切り替え、特定ファイルの復元機能を提供する。

## To-Be(完了条件のチェックリスト)

- [x] `backlog`から`in-progress`へタスクを移動
- [x] `taiki-ssss/ts-knowledge`リポジトリから関連しそうなコードサンプルを探す
- [x] `src/features/git-checkout/tests/lib.test.ts` のテストを実行して失敗することを確認
- [x] `src/features/git-checkout/lib.ts` のテストを通す最小限のコードを書く
- [x] `src/features/git-checkout/lib.ts` のテストが通っている状態を維持しながら、コードを改善(リファクタリング)
- [x] `src/features/git-checkout/tests/server.test.ts` のテストを実行して失敗することを確認
- [x] `src/features/git-checkout/server.ts` のテストを通す最小限のコードを書く
- [x] `src/features/git-checkout/server.ts` のテストが通っている状態を維持しながら、コードを改善(リファクタリング)
- [x] `src/features/git-checkout/index.ts` を作成（パブリックAPI）
- [x] `src/features/git/server.ts` に git_checkout ツールを統合
- [x] テスト全てパス
- [x] ドキュメント更新
- [x] `in-progress`から`done`へタスクを移動

## 作業ログ

- [2025-01-13 16:30]：`backlog`から`in-progress`へタスクを移動した
- [2025-01-13 16:31]：既存のGit機能実装を分析し、checkoutパターンを理解した
- [2025-01-13 16:35]：lib.test.tsのテストを作成し、失敗することを確認した
- [2025-01-13 16:36]：lib.tsを実装し、テストが全て通ることを確認した
- [2025-01-13 16:38]：server.test.tsのテストを作成し、server.tsを実装した
- [2025-01-13 16:39]：index.tsを作成し、git/server.tsに統合した
- [2025-01-13 16:45]：追加のテストを作成し、カバレッジを改善した
- [2025-01-13 16:46]：CLAUDE.md、README.md、要件定義書を更新した
- [2025-01-13 16:47]：`in-progress`から`done`へタスクを移動した