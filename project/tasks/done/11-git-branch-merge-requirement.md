# 11-git-branch-merge-requirement

## 概要
Git Branch Merge機能の要求タスク

## 目的
MCPクライアントからGitリポジトリのブランチをマージできる機能を実装する

## 要件

### 機能要件
- MCPツールとして `git_branch_merge` を提供する
- 指定されたブランチを現在のブランチにマージできる
- マージ戦略を選択できる（通常マージ、fast-forward、squash）
- マージコンフリクトが発生した場合は適切にエラーを返す
- マージメッセージをカスタマイズできる

### 入力パラメータ
- `repoPath`: Gitリポジトリのパス（必須）
- `sourceBranch`: マージ元のブランチ名（必須）
- `targetBranch`: マージ先のブランチ名（オプション、デフォルト: 現在のブランチ）
- `strategy`: マージ戦略（オプション、デフォルト: 'merge'）
  - 'merge': 通常のマージコミットを作成
  - 'fast-forward': fast-forwardマージのみ許可
  - 'squash': squashマージ（コミットを1つにまとめる）
- `message`: マージコミットメッセージ（オプション、デフォルト: 自動生成）
- `noCommit`: マージ後にコミットしない（オプション、デフォルト: false）

### 出力
- `success`: マージ成功フラグ
- `mergeType`: 実行されたマージのタイプ（'fast-forward', 'merge', 'squash'）
- `targetBranch`: マージ先のブランチ名
- `sourceBranch`: マージ元のブランチ名
- `commitHash`: マージコミットのハッシュ（noCommitがfalseの場合）
- `conflicts`: コンフリクトファイルのリスト（コンフリクトが発生した場合）

### エラーハンドリング
- 指定されたパスがGitリポジトリでない場合
- ソースブランチが存在しない場合
- ターゲットブランチが存在しない場合
- マージコンフリクトが発生した場合
- 権限不足の場合
- fast-forwardマージが指定されたが不可能な場合

### 制約事項
- 指定されたパスがGitリポジトリであること
- 書き込み権限があること
- ブランチ名が有効なGitブランチ名であること

## To-Be
- [x] 要件定義書の更新（`project/requirements-definition.md`）
- [x] この要求タスクをin-progressフォルダに移動
- [ ] この要求タスクをdoneフォルダに移動