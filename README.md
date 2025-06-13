# git-small-mcp

Git操作をMCP (Model Context Protocol) ツールとして提供するサーバー実装

## 機能

### 実装済みのGitツール

- ✅ **git_commit** - Gitコミットを作成（自動ステージング付き）
- ✅ **git_status** - リポジトリの状態を取得（ブランチ情報、変更ファイル一覧）
- ✅ **git_add** - ファイルをステージングエリアに追加（個別/全ファイル対応）
- ✅ **git_branch_list** - ブランチ一覧を取得（ローカル/リモート対応）
- ✅ **git_branch_create** - 新しいブランチを作成（ベースブランチ指定、チェックアウトオプション付き）

## インストール

```bash
npm install
npm run build
```

## 使用方法

MCPサーバーとして起動:

```bash
npm run start
```

## 開発

### コマンド

```bash
# ビルド
npm run build

# テスト実行
npm run test

# テストカバレッジ確認（100%必須）
npm run test:cov

# リント
npm run lint

# リント修正
npm run lint:fix
```

### アーキテクチャ

Feature-Sliced Design (FSD) を採用：

```
src/
├── app/         # アプリケーション層（MCPサーバー初期化）
├── features/    # 機能層（各Git操作）
│   ├── git/                 # 統合サーバー
│   ├── git-commit/          # コミット機能
│   ├── git-status/          # ステータス確認機能
│   ├── git-add/             # ステージング機能
│   ├── git-branch-list/     # ブランチ一覧機能
│   └── git-branch-create/   # ブランチ作成機能
├── entities/    # エンティティ層（未使用）
└── shared/      # 共有層（ユーティリティ）
```

## プロジェクト管理

```
project/
├── RULE.md                    # 開発ルール
├── TECK_STACK.md              # 技術スタック
├── requirements-definition.md # 要件定義書
├── tasks/                     # タスク管理
│   ├── backlog/               # 未着手タスク
│   ├── in-progress/           # 進行中タスク
│   └── done/                  # 完了タスク
└── template/                  # タスクテンプレート
```

## カスタムコマンド

- `/project:rule`: プロジェクトのルールをに確認する
- `/project:task`: タスクの件数を確認する

## 参考リンク

- [Claude Code Manage permissions](https://docs.anthropic.com/en/docs/claude-code/security)
- [Feature-Sliced Design](https://feature-sliced.github.io/documentation/)