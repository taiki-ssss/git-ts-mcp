# タスク名: Git Branch Create要求定義

## 概要

MCPサーバーでGit Branchの作成機能を利用できるようにするための要求定義を行う。新しいブランチを現在のHEADから作成する機能を提供する。

## To-Be(完了条件のチェックリスト)

- [x] `backlog`から`in-progress`へタスクを移動
- [x] Git Branch Create機能の要求事項を定義
- [x] 入力パラメータと出力形式を定義
- [x] エラーハンドリングを定義
- [x] 制約事項を明確化
- [x] 要件定義書を更新
- [x] `in-progress`から`done`へタスクを移動

## 作業ログ

- 2025-01-13 10:25：`backlog`から`in-progress`へタスクを移動した
- 2025-01-13 10:25：Git Branch Create機能の要求事項を定義した
- 2025-01-13 10:25：入力パラメータと出力形式を定義した
- 2025-01-13 10:25：エラーハンドリングを定義した
- 2025-01-13 10:25：制約事項を明確化した
- 2025-01-13 10:26：要件定義書を更新した
- 2025-01-13 10:26：`in-progress`から`done`へタスクを移動した
- 2025-01-13 10:27：ベースブランチ指定機能を追加した

### 機能要求
- `git_branch_create`ツールを作成し、新しいブランチを作成できるようにする
- 指定されたベースブランチまたは現在のHEADから新しいブランチを作成する
- ブランチ作成後の確認情報を返す

### 入力パラメータ
- `repoPath` (必須): Gitリポジトリのパス
- `branchName` (必須): 作成するブランチ名
- `baseBranch` (オプション): ベースとなるブランチ名（デフォルト: 現在のHEAD）
- `checkout` (オプション): 作成後にチェックアウトするか（デフォルト: false）

### 出力形式
```json
{
  "success": true,
  "branchName": "feature-new",
  "baseBranch": "main",
  "message": "Created branch 'feature-new' from 'main'",
  "checkedOut": false
}
```

### エラーハンドリング
- リポジトリパスが空の場合: "Repository path cannot be empty"
- リポジトリが存在しない場合: "Repository path does not exist: {path}"
- Gitリポジトリでない場合: "Not a git repository: {path}"
- ブランチ名が空の場合: "Branch name cannot be empty"
- ブランチ名が不正な場合: "Invalid branch name: {name}"
- ブランチが既に存在する場合: "Branch '{name}' already exists"
- ベースブランチが存在しない場合: "Base branch '{name}' does not exist"
- ブランチ作成に失敗した場合: "Failed to create branch: {error}"

### 制約事項
- ローカルブランチのみ作成可能
- ブランチ名はGitの命名規則に従う必要がある
- リモートブランチの直接作成は不可