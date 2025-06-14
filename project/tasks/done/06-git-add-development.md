# タスク名: Git Add機能のMCPサーバー開発

## 概要

MCPサーバーにGit Add機能を実装する。TypeScriptを使用し、@modelcontextprotocol/sdkとsimple-gitライブラリを活用する。

## To-Be(完了条件のチェックリスト)

- [x] `backlog`から`in-progress`へタスクを移動
- [x] MCPサーバーにgit_addツールを追加するテストを実行して失敗することを確認
- [x] MCPサーバーにgit_addツールを追加する最小限のコードを書く
- [x] Git Add機能の基本テストを実行して失敗することを確認
- [x] Git Add機能の基本テストを通す最小限のコードを書く
- [x] Git Add機能のテストが通っている状態を維持しながら、コードを改善(リファクタリング)
- [x] エラーハンドリングのテストを実行して失敗することを確認
- [x] エラーハンドリングのテストを通す最小限のコードを書く
- [x] エラーハンドリングのテストが通っている状態を維持しながら、コードを改善(リファクタリング)
- [x] テスト全てパス
- [x] カバレッジ90%以上を確認
- [x] ビルド成功を確認
- [ ] ドキュメント更新
- [ ] `in-progress`から`done`へタスクを移動

## 作業ログ

### 2025-01-13 09:45
- タスクをin-progressへ移動
- git_addツールの単体テストファイルを作成
- 型定義ファイル(types.ts)を作成
- performGitAddとcreateGitAddHandlerの実装を完了
- テストが全て成功(9/9)
- git/server.tsにgit_addツールを統合
- ビルドが成功
- タスクを完了