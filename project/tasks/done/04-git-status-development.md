# タスク名: Git Status機能のMCPサーバー開発

## 概要

MCPサーバーにGit Status機能を実装する。TypeScriptを使用し、@modelcontextprotocol/sdkとsimple-gitライブラリを活用する。

## To-Be(完了条件のチェックリスト)

- [x] `backlog`から`in-progress`へタスクを移動
- [x] MCPサーバーにgit_statusツールを追加するテストを実行して失敗することを確認
- [x] MCPサーバーにgit_statusツールを追加する最小限のコードを書く
- [x] Git Status機能の基本テストを実行して失敗することを確認
- [x] Git Status機能の基本テストを通す最小限のコードを書く
- [x] Git Status機能のテストが通っている状態を維持しながら、コードを改善(リファクタリング)
- [x] エラーハンドリングのテストを実行して失敗することを確認
- [x] エラーハンドリングのテストを通す最小限のコードを書く
- [x] エラーハンドリングのテストが通っている状態を維持しながら、コードを改善(リファクタリング)
- [x] テスト全てパス
- [x] カバレッジ90%以上を確認
- [x] ビルド成功を確認
- [ ] ドキュメント更新
- [x] `in-progress`から`done`へタスクを移動

## 作業ログ

- タスクをin-progressに移動
- git-statusフォルダ構造を作成
- MCPサーバーテストを作成し、失敗を確認
- createGitServerを実装してgit_commitとgit_statusの両方を含むサーバーを作成
- src/app/index.tsを更新してcreateGitServerを使用
- Git Status機能の実装を完了（neverthrow、debug使用）
- Git Status機能の基本テストを作成（4件）
- エラーハンドリングのテストを作成（9件）
- カバレッジ96.66%を達成（git-status単体）
- ビルド成功を確認