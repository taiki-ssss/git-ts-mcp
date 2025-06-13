# git-ts-mcp

Git操作をMCP (Model Context Protocol) ツールとして提供するサーバー実装。
Claudeやその他のAIアシスタントからGitコマンドを安全に実行できるようにするMCPサーバーです。

## 概要

本プロジェクトは、Model Context Protocol (MCP) を使用してGit操作をツールとして提供するサーバー実装です。AIアシスタントがGitリポジトリに対して様々な操作を実行できるようになります。

## 主な特徴

- 🔧 9つの主要なGit操作をMCPツールとして実装
- 🏗️ Feature-Sliced Design (FSD) アーキテクチャを採用
- 🧪 100%のテストカバレッジを維持
- 🔍 Zod によるスキーマバリデーション
- ⚡ neverthrow による型安全なエラーハンドリング

## 実装済みのGitツール

- ✅ **git_commit** - Gitコミットを作成（自動ステージング付き）
- ✅ **git_status** - リポジトリの状態を取得（ブランチ情報、変更ファイル一覧）
- ✅ **git_add** - ファイルをステージングエリアに追加（個別/全ファイル対応）
- ✅ **git_branch_list** - ブランチ一覧を取得（ローカル/リモート対応）
- ✅ **git_branch_create** - 新しいブランチを作成（ベースブランチ指定、チェックアウトオプション付き）
- ✅ **git_branch_merge** - ブランチをマージ（複数のマージ戦略対応）
- ✅ **git_log** - コミット履歴を取得（件数制限、ブランチ指定可能）
- ✅ **git_checkout** - ブランチを切り替えまたはファイルを復元（強制切り替え、ファイル指定対応）
- ✅ **git_push** - 変更をリモートリポジトリにプッシュ（タグ、強制プッシュ、上流設定、ブランチ削除対応）


## セットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール手順

1. リポジトリをクローン:
```bash
git clone https://github.com/yourusername/git-small-mcp.git
cd git-small-mcp
```

2. 依存関係をインストール:
```bash
npm install
```

3. ビルド:
```bash
npm run build
```

## MCPセットアップ

### Claude Desktop

1. Claude Desktopの設定ファイルを開きます：
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. 以下の設定を追加します：

```json
{
  "mcpServers": {
    "git-ts-mcp": {
      "command": "node",
      "args": ["/path/to/git-ts-mcp/dist/index.js"],
      "cwd": "/path/to/your/git/project"
    }
  }
}
```

3. Claude Desktopを再起動します。

### VS Code

1. MCP拡張機能をインストール
2. 設定でMCPサーバーを追加：

```json
{
  "mcp.servers": {
    "git-ts-mcp": {
      "command": "node",
      "args": ["/path/to/git-ts-mcp/dist/index.js"],
      "env": {
        "DEBUG": "mcp:*"
      }
    }
  }
}
```

### 環境変数（オプション）

- `DEBUG=mcp:*` - デバッグログを有効化（debugパッケージを使用）
  - 特定機能のみ: `DEBUG=mcp:git-commit`
  - 複数機能: `DEBUG=mcp:git-commit,mcp:git-status`

## アーキテクチャ

本プロジェクトはFeature-Sliced Design (FSD) を採用しており、以下の層構造で構成されています：

```
src/
├── app/         # アプリケーション層（MCPサーバー初期化）
├── features/    # 機能層（各Git操作）
│   ├── git/                 # 統合サーバー
│   ├── git-commit/          # コミット機能
│   ├── git-status/          # ステータス確認機能
│   ├── git-add/             # ステージング機能
│   ├── git-branch-list/     # ブランチ一覧機能
│   ├── git-branch-create/   # ブランチ作成機能
│   ├── git-branch-merge/    # ブランチマージ機能
│   ├── git-log/             # コミット履歴取得機能
│   ├── git-checkout/        # ブランチ切り替え/ファイル復元機能
│   └── git-push/            # リモートへのプッシュ機能
├── entities/    # エンティティ層（未使用）
└── shared/      # 共有層（ユーティリティ）
```

各機能モジュールは独立しており、下位レイヤーからのみインポート可能です。

## 技術スタック

- **TypeScript**: 厳格な型チェックを有効化
- **@modelcontextprotocol/sdk**: MCPフレームワーク
- **simple-git**: Git操作ライブラリ
- **zod**: スキーマバリデーション
- **neverthrow**: 関数型エラーハンドリング
- **vitest**: テストフレームワーク
- **debug**: デバッグユーティリティ


## 使用方法

### スタンドアロンモード

```bash
npm run start
```

### プログラマティックな使用

```typescript
import { createGitMCPServer } from 'git-ts-mcp';

const server = createGitMCPServer();
await server.start();
```

## ツール使用例

### git_log

コミット履歴を取得:

```json
{
  "tool": "git_log",
  "arguments": {
    "repoPath": "/path/to/repo",
    "maxCount": 20,
    "branch": "main"
  }
}
```

レスポンス例:

```json
{
  "logs": [
    {
      "hash": "abc123def456...",
      "date": "2024-01-01T12:00:00+09:00",
      "message": "Add new feature",
      "author": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

### git_push

変更をリモートにプッシュ:

```json
{
  "tool": "git_push",
  "arguments": {
    "repoPath": "/path/to/repo",
    "remote": "origin",
    "branch": "feature-branch",
    "setUpstream": true
  }
}
```

強制プッシュ:

```json
{
  "tool": "git_push",
  "arguments": {
    "repoPath": "/path/to/repo",
    "force": true
  }
}
```

タグをプッシュ:

```json
{
  "tool": "git_push",
  "arguments": {
    "repoPath": "/path/to/repo",
    "tags": true
  }
}
```

レスポンス例:

```json
{
  "success": true,
  "remote": "origin",
  "branch": "feature-branch",
  "commits": {
    "pushed": 3,
    "hash": "abc123",
    "message": "Latest commit message"
  },
  "message": "Successfully pushed 3 commit(s) to origin/feature-branch"
}
```

### git_checkout

ブランチを切り替え:

```json
{
  "tool": "git_checkout",
  "arguments": {
    "repoPath": "/path/to/repo",
    "target": "feature-branch",
    "force": false
  }
}
```

特定のファイルを復元:

```json
{
  "tool": "git_checkout",
  "arguments": {
    "repoPath": "/path/to/repo",
    "target": "main",
    "files": ["src/file1.js", "src/file2.js"]
  }
}
```

レスポンス例:

```json
{
  "success": true,
  "previousBranch": "main",
  "currentBranch": "feature-branch",
  "message": "Switched to branch 'feature-branch'"
}
```


## トラブルシューティング

### デバッグログの有効化

```bash
# 全てのデバッグログを表示
DEBUG=mcp:* npm run start

# 特定の機能のみ
DEBUG=mcp:git-commit npm run start
```

## ライセンス

MIT License

## 参考リンク

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Claude Code Manage permissions](https://docs.anthropic.com/en/docs/claude-code/security)
- [Feature-Sliced Design](https://feature-sliced.github.io/documentation/)