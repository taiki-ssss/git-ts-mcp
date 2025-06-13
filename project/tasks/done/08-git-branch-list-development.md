# タスク名: Git Branch List機能開発

## 概要

MCPサーバーにGit Branchの一覧取得機能を実装する。TypeScriptを使用し、@modelcontextprotocol/sdkとsimple-gitライブラリを活用する。TDD（テスト駆動開発）アプローチで実装を進める。

## To-Be(完了条件のチェックリスト)

- [x] `backlog`から`in-progress`へタスクを移動
- [x] git-branch-list機能のディレクトリ構造を作成
- [x] 型定義ファイル(types.ts)を作成
- [x] ブランチ一覧取得のlibテストを作成して失敗を確認
- [x] ブランチ一覧取得のlibロジックを実装
- [x] MCPツールハンドラーのテストを作成して失敗を確認
- [x] MCPツールハンドラーを実装
- [x] エラーハンドリングのテストを作成
- [x] MCPサーバー統合テストを作成
- [x] git/server.tsにgit_branch_listツールを追加
- [x] テストカバレッジ90%以上を確認
- [x] ビルド成功を確認
- [ ] `in-progress`から`done`へタスクを移動

## 作業ログ

### 2025-01-13 10:19
- タスクをin-progressへ移動
- ディレクトリ構造を作成（src/features/git-branch-list/）
- 型定義ファイル(types.ts)を作成
- lib.test.tsを作成してテストが失敗することを確認
- lib.tsを実装（getBranchList関数）
- server.test.tsを作成してテストが失敗することを確認
- server.tsを実装（createGitBranchListHandler関数）
- error-handling.test.tsを作成（8個のエラーハンドリングテスト）
- mcp-server.test.tsを作成
- index.tsを作成
- git/server.tsにgit_branch_listツールを統合
- 全21個のテストが成功
- git-branch-list単体でカバレッジ100%達成
- ビルド成功を確認