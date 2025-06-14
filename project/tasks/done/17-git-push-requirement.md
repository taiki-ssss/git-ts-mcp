# タスク名: git push機能の要求定義

## 概要

Gitのpush機能をMCPツールとして実装するための要求定義を行う。ローカルリポジトリの変更をリモートリポジトリにプッシュする機能を提供する。

## To-Be(完了条件のチェックリスト)

- [ ] `backlog`から`in-progress`へタスクを移動
- [x] `git_push`ツールの仕様を定義
  - [x] 入力パラメータの定義
  - [x] 出力フォーマットの定義
  - [x] エラーハンドリングの定義
- [x] ユースケースの整理
  - [x] 基本的なpush操作
  - [x] 特定のブランチをpush
  - [x] タグのpush
  - [x] 強制push（--force）
  - [x] リモートブランチの削除
  - [x] 複数のリモートへの対応
- [x] 制約事項の定義
  - [x] 認証方法の制限（SSHキー、HTTPSクレデンシャル）
  - [x] 危険な操作の制御（force push等）
- [x] テストシナリオの定義
- [x] `project/requirements-definition.md`に仕様を追記
- [x] `in-progress`から`done`へタスクを移動

## 仕様概要

### 入力パラメータ

```typescript
{
  repoPath: string;        // リポジトリのパス（必須）
  remote?: string;         // リモート名（デフォルト: "origin"）
  branch?: string;         // プッシュするブランチ（デフォルト: 現在のブランチ）
  tags?: boolean;          // タグもプッシュするか（デフォルト: false）
  force?: boolean;         // 強制プッシュするか（デフォルト: false）
  setUpstream?: boolean;   // 上流ブランチとして設定するか（デフォルト: false）
  deleteRemote?: boolean;  // リモートブランチを削除するか（デフォルト: false）
}
```

### 出力フォーマット

```typescript
{
  success: boolean;
  remote: string;
  branch: string;
  commits: {
    pushed: number;
    hash: string;
    message: string;
  }[];
  tags?: string[];
  message: string;
  warnings?: string[];
}
```

### エラーケース

- リポジトリが存在しない
- Gitリポジトリではない
- リモートが設定されていない
- 認証エラー
- ネットワークエラー
- リモートとの競合
- 権限不足

## ユースケース詳細

### 1. 基本的なpush操作
```bash
# 現在のブランチをoriginにpush
git push
```

### 2. 特定のブランチをpush
```bash
# feature-branchをoriginにpush
git push origin feature-branch
```

### 3. タグのpush
```bash
# 全てのタグをpush
git push --tags
```

### 4. 強制push
```bash
# 履歴を書き換えた場合の強制push
git push --force
```

### 5. 上流ブランチの設定
```bash
# 初回pushで上流ブランチを設定
git push -u origin feature-branch
```

### 6. リモートブランチの削除
```bash
# リモートのfeature-branchを削除
git push origin --delete feature-branch
```

### 7. 複数のリモートへの対応
```bash
# 特定のリモートを指定してpush
git push upstream main
```

## 制約事項詳細

### 1. 認証方法
- **SSHキー**: システムに設定されたSSHキーを自動的に使用
- **HTTPSクレデンシャル**: Git credential helperに依存
- **認証情報の直接指定は不可**: セキュリティ上の理由から、パスワードやトークンを直接パラメータで受け取らない

### 2. 危険な操作の制御
- **force pushの警告**: `force: true`が指定された場合、出力に警告メッセージを含める
- **protectedブランチの考慮**: mainやmasterへの直接pushには注意喚起
- **削除操作の確認**: `deleteRemote: true`の場合、削除対象のブランチ名を明示的に出力

### 3. エラーハンドリング
- **詳細なエラーメッセージ**: 認証エラー、ネットワークエラー、競合エラーをそれぞれ区別
- **リトライ不可**: ネットワークエラーでも自動リトライは行わない（MCPクライアント側で制御）
- **部分的成功の扱い**: 複数コミットのpushで一部失敗した場合の状態を明確に報告

### 4. パフォーマンス考慮
- **大量のオブジェクトのpush**: プログレス情報は簡潔に（開始と完了のみ）
- **タイムアウト**: 長時間のpush操作に対する適切なタイムアウト設定

## テストシナリオ

### 正常系テスト

1. **基本的なpush**
   - ローカルリポジトリでコミットを作成
   - デフォルト設定でpush実行
   - リモートに反映されることを確認

2. **ブランチ指定push**
   - 特定のブランチを指定してpush
   - 指定したブランチのみがリモートに反映されることを確認

3. **タグのpush**
   - タグを作成してpush
   - `tags: true`でタグがリモートに反映されることを確認

4. **上流ブランチ設定**
   - `setUpstream: true`で新規ブランチをpush
   - 追跡ブランチが設定されることを確認

5. **リモートブランチ削除**
   - `deleteRemote: true`でリモートブランチを削除
   - リモートからブランチが削除されることを確認

### 異常系テスト

1. **認証エラー**
   - 無効な認証情報でpush試行
   - 適切なエラーメッセージが返されることを確認

2. **ネットワークエラー**
   - 存在しないリモートURLへのpush
   - ネットワークエラーが適切に処理されることを確認

3. **競合エラー**
   - リモートに新しいコミットがある状態でpush
   - 競合エラーが検出されることを確認

4. **権限エラー**
   - 書き込み権限のないリポジトリへのpush
   - 権限エラーが適切に処理されることを確認

### エッジケーステスト

1. **空のリポジトリへのpush**
   - 初期化直後のリポジトリへの初回push
   - 正常に処理されることを確認

2. **大量のコミット**
   - 100以上のコミットを含むpush
   - タイムアウトせずに完了することを確認

3. **force pushの動作**
   - 履歴を書き換えてforce push
   - 警告メッセージとともに成功することを確認

## 作業ログ

- [2025-01-13 10:30]：`backlog`から`in-progress`へタスクを移動した
- [2025-01-13 10:32]：`git_push`ツールの仕様を定義（入力パラメータ、出力フォーマット、エラーハンドリング）
- [2025-01-13 10:34]：ユースケースの整理（基本push、ブランチ指定、タグ、強制push、上流設定、削除、複数リモート）
- [2025-01-13 10:36]：制約事項の定義（認証方法、危険操作の制御、エラーハンドリング、パフォーマンス）
- [2025-01-13 10:38]：テストシナリオの定義（正常系、異常系、エッジケース）
- [2025-01-13 10:41]：requirements-definition.mdにGit Push機能の仕様を追記
- [2025-01-13 10:42]：`in-progress`から`done`へタスクを移動した