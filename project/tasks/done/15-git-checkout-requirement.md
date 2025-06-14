# タスク名: Git Checkout 要求定義

## 概要

ブランチの切り替えを行う `git checkout` コマンドをMCPツールとして実装する。既存のブランチへの切り替えや、特定ファイルの復元機能を提供する。

## To-Be(完了条件のチェックリスト)

- [x] `backlog`から`in-progress`へタスクを移動
- [x] `git_checkout` ツールの要件を定義
- [x] 入力パラメータの仕様を決定
- [x] 出力フォーマットの仕様を決定
- [x] エラーハンドリングの要件を定義
- [x] 要件定義書（requirements-definition.md）を更新
- [x] ドキュメント更新
- [x] `in-progress`から`done`へタスクを移動

## 作業ログ

- [2025-01-13 16:20]：`backlog`から`in-progress`へタスクを移動した
- [2025-01-13 16:21]：要件詳細を定義し、ブランチ作成機能を削除
- [2025-01-13 16:23]：要件定義書に Git Checkout 機能を追加
- [2025-01-13 16:24]：`in-progress`から`done`へタスクを移動した

## 要件詳細

### 機能要件

1. **基本的なブランチ切り替え**
   - 既存のブランチに切り替え
   - ローカルブランチ、リモートトラッキングブランチに対応

2. **強制切り替え**
   - 変更がある場合でも強制的に切り替えるオプション
   - `-f` オプション相当の機能

3. **ファイル指定チェックアウト**
   - 特定のファイルを指定したブランチ/コミットの状態に戻す
   - ブランチ切り替えではなくファイルの復元

### 入力パラメータ（案）

```typescript
{
  repoPath: string;          // リポジトリのパス（必須）
  target: string;            // ブランチ名またはコミットハッシュ（必須）
  force?: boolean;           // 強制切り替え（デフォルト: false）
  files?: string[];          // 特定のファイルのみチェックアウト（オプション）
}
```

### 出力フォーマット（案）

```typescript
{
  success: boolean;
  previousBranch: string;    // 切り替え前のブランチ
  currentBranch: string;     // 切り替え後のブランチ
  message: string;           // 操作結果のメッセージ
  modifiedFiles?: string[];  // ファイル指定時の変更されたファイル一覧
}
```

### エラーケース

- リポジトリが存在しない
- 指定したブランチが存在しない
- 未コミットの変更がある（forceがfalseの場合）
- ブランチ名が無効
- ファイルが存在しない（files指定時）

### 制約事項

- ブランチ切り替え時は作業ツリーがクリーンである必要がある（forceがfalseの場合）
- ファイル指定チェックアウトとブランチ切り替えは同時に実行できない
- 新規ブランチ作成が必要な場合は `git_branch_create` ツールを使用してから `git_checkout` を使用する