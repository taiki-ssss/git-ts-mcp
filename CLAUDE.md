# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

git-small-mcp は Model Context Protocol (MCP) サーバーの実装で、Git操作をMCPツールとして提供します。

## アーキテクチャ

Feature-Sliced Design (FSD) を採用：
- `src/app/` - アプリケーションエントリーポイント（MCPサーバー初期化）
- `src/features/` - Git操作機能（git-commit, git-status, git-add等）
- `src/entities/` - ビジネスエンティティ（現在未使用）
- `src/shared/` - 共有ユーティリティ

各機能モジュールは独立し、下位レイヤーからのみインポート可能。

## 開発コマンド

```bash
# ビルド
npm run build

# リントチェック
npm run lint

# リントフィックス
npm run lint:fix

# テスト実行
npm run test

# テストカバレッジ（100%必須）
npm run test:cov

# 失敗テスト一覧
npm run test:fail

# MCPサーバー起動
npm run start

# 単一テスト実行
npm run test -- path/to/test.ts
```

## 開発ガイドライン

@project/RULE.md
@project/TECK_STACK.md

### 重要な開発ルール

1. **タスク管理**: 作業時は必ず `project/tasks/backlog/` にタスクファイルを作成
2. **TDD実践**: テストを先に書いてから実装
3. **カバレッジ100%維持**: `npm run test:cov` で確認
4. **最小限のファイル作成**: 既存ファイルの編集を優先
5. **タスク完了時**: `npm run build` を実行

### Git機能追加時の構造

新しいGit機能を追加する場合：
```
src/features/git-[feature-name]/
├── index.ts          # パブリックAPI
├── server.ts         # MCP ツール定義
├── lib.ts           # ビジネスロジック
├── types.ts         # 型定義
└── tests/
    ├── lib.test.ts
    └── server.test.ts
```

## 技術スタック

- **TypeScript** - 厳格な型チェック有効
- **@modelcontextprotocol/sdk** - MCPフレームワーク
- **simple-git** - Git操作ライブラリ
- **zod** - スキーマ検証
- **neverthrow** - 関数型エラーハンドリング
- **vitest** - テストフレームワーク
- **debug** - デバッグユーティリティ

## 実装済み機能

- ✅ `git_commit` - コミット作成（自動ステージング付き）
- ✅ `git_status` - リポジトリ状態確認（ブランチ情報、変更ファイル一覧）
- ✅ `git_add` - ステージング管理（個別/全ファイル対応）
- ✅ `git_branch_list` - ブランチ一覧取得（ローカル/リモート対応）
- ✅ `git_branch_create` - ブランチ作成（ベースブランチ指定可能）
- ✅ `git_branch_merge` - ブランチマージ（複数戦略対応）
- ✅ `git_log` - コミット履歴取得（件数/ブランチ指定可能）
- ✅ `git_checkout` - ブランチ切り替え/ファイル復元（強制切り替え対応）

## エラーハンドリング

neverthrowのResult型を使用した関数型エラーハンドリング：
```typescript
import { Result, ok, err } from 'neverthrow';

// 全ての操作は Result<T, Error> を返す
export async function gitOperation(): Promise<Result<Data, Error>> {
  if (error) return err(new Error('詳細なエラーメッセージ'));
  return ok(data);
}
```

## MCPツール実装パターン

新しいGitツールを追加する際の標準パターン：

1. **入力スキーマ定義** (Zod使用)
```typescript
export const gitOperationInputSchema = z.object({
  repoPath: z.string(),
  // その他のパラメータ
});
```

2. **ハンドラー実装**
```typescript
export function createGitOperationHandler() {
  return async (params: any) => {
    const parsed = gitOperationInputSchema.safeParse(params);
    if (!parsed.success) {
      return { content: [{ type: 'text', text: 'Invalid parameters' }] };
    }
    // ビジネスロジック呼び出し
  };
}
```

3. **統合サーバーへの登録** (`src/features/git/server.ts`)
```typescript
server.tool(
  'git_operation',
  '操作の説明',
  { /* Zodスキーマ */ },
  createGitOperationHandler()
);
```

## デバッグ

debugパッケージを使用した構造化ログ：
```bash
# デバッグログを有効化
DEBUG=mcp:* npm run start

# 特定の機能のみ
DEBUG=mcp:git-commit npm run start
```