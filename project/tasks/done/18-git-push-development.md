# タスク名: git push機能の開発

## 概要

要求定義に基づいて`git_push`ツールを実装する。ローカルリポジトリの変更をリモートリポジトリにプッシュする機能を提供する。

## To-Be(完了条件のチェックリスト)

- [x] `backlog`から`in-progress`へタスクを移動
- [x] `taiki-ssss/ts-knowledge`リポジトリから関連しそうなコードサンプルを探す
- [x] 基本的なpush機能のテストを実行して失敗することを確認
  - [x] `src/features/git-push/tests/lib.test.ts`の作成
  - [x] 基本的なpushのテストケース作成
- [x] 基本的なpush機能のテストを通す最小限のコードを書く
  - [x] `src/features/git-push/types.ts`の作成
  - [x] `src/features/git-push/lib.ts`の実装
- [x] 基本的なpush機能のテストが通っている状態を維持しながら、コードを改善(リファクタリング)
- [x] 高度なpush機能のテストを実行して失敗することを確認
  - [x] 特定ブランチのpush
  - [x] タグのpush
  - [x] 強制push
  - [x] 上流ブランチの設定
  - [x] リモートブランチの削除
- [x] 高度なpush機能のテストを通す最小限のコードを書く
- [x] 高度なpush機能のテストが通っている状態を維持しながら、コードを改善(リファクタリング)
- [x] MCPサーバー統合のテストを実行して失敗することを確認
  - [x] `src/features/git-push/tests/server.test.ts`の作成
  - [x] MCPツールハンドラーのテストケース作成
- [x] MCPサーバー統合のテストを通す最小限のコードを書く
  - [x] `src/features/git-push/server.ts`の実装
  - [x] `src/features/git-push/index.ts`の作成
- [x] MCPサーバー統合のテストが通っている状態を維持しながら、コードを改善(リファクタリング)
- [x] 統合サーバーへの登録
  - [x] `src/features/git/server.ts`に`git_push`ツールを追加
  - [x] エクスポートの追加
- [x] エラーハンドリングのテストを実行して失敗することを確認
  - [x] 認証エラーのシミュレーション
  - [x] ネットワークエラーのハンドリング
  - [x] 競合エラーの処理
- [x] エラーハンドリングのテストを通す最小限のコードを書く
- [x] デバッグログの実装
  - [x] debugパッケージを使用した構造化ログの追加
  - [x] `mcp:git-push`ネームスペースの使用
- [x] テスト全てパス（カバレッジ100%）
- [x] ドキュメント更新
  - [x] README.mdに`git_push`の説明と使用例を追加
  - [x] CLAUDE.mdに実装済み機能として追記
  - [x] project/requirements-definition.mdの更新
- [x] `npm run build`でビルド成功を確認
- [x] `npm run lint`でリントエラーがないことを確認
- [x] `in-progress`から`done`へタスクを移動

## 実装仕様

### ディレクトリ構造

```
src/features/git-push/
├── index.ts          # パブリックAPI
├── server.ts         # MCPツール定義とハンドラー
├── lib.ts           # ビジネスロジック
├── types.ts         # 型定義
└── tests/
    ├── lib.test.ts   # ビジネスロジックのテスト
    └── server.test.ts # MCPハンドラーのテスト
```

### 主要な型定義

```typescript
export interface GitPushInput {
  repoPath: string;
  remote?: string;
  branch?: string;
  tags?: boolean;
  force?: boolean;
  setUpstream?: boolean;
  deleteRemote?: boolean;
}

export interface GitPushOutput {
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

## 作業ログ

- [2025-01-13 10:45]：`backlog`から`in-progress`へタスクを移動した
- [2025-01-13 10:47]：既存のGit機能実装パターンを分析
- [2025-01-13 10:48]：基本的なpush機能のテストを作成して失敗を確認
- [2025-01-13 10:49]：基本的なpush機能の実装（types.ts, lib.ts）
- [2025-01-13 10:51]：MCPサーバー統合の実装（server.ts, index.ts）とGitサーバーへの登録
- [2025-01-13 10:53]：デバッグログの実装とエラーハンドリングの改善
- [2025-01-13 10:55]：ビルドとリントの確認、テストカバレッジ100%達成
- [2025-01-13 10:56]：ドキュメントの更新（README.md、CLAUDE.md、requirements-definition.md）
- [2025-01-13 10:57]：`in-progress`から`done`へタスクを移動した