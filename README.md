# Claude Code AI Chat

エンターテインメント系のAIチャットボットWebアプリケーション。ユーザーが気軽に雑談や相談ができる汎用的なアシスタントとして機能します。

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **バックエンド**: Hono
- **AI**: Mastra + Anthropic Claude (Sonnet 4.5)
- **データベース**: MongoDB (Prisma ORM)
- **インフラ**: Google Cloud Run, Docker

## 前提条件

- Node.js 20.x 以上
- Docker Desktop（ローカル開発の場合）
- Anthropic API Key
- MongoDB Atlas アカウント（本番環境の場合）

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd claude-code-ai-chat
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下の内容を設定してください：

```env
# Anthropic API
ANTHROPIC_API_KEY=your_api_key_here

# MongoDB (ローカル開発用)
DATABASE_URL="mongodb://admin:password@localhost:27017/chatbot?authSource=admin"

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Prisma Clientの生成

```bash
npx prisma generate
```

### 5. ローカルMongoDBの起動

Docker Desktopを起動してから、以下のコマンドを実行：

```bash
docker-compose up -d
```

### 6. データベース接続の確認

```bash
npm run db:test
```

成功すると以下のようなメッセージが表示されます：

```
Testing database connection...
✓ Successfully connected to MongoDB
✓ Database query successful. Current user count: 0
✓ All database tests passed!
```

### 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスしてください。

## 利用可能なコマンド

### 開発コマンド

```bash
# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバーの起動
npm start

# リント
npm run lint

# データベース接続テスト
npm run db:test

# Prisma Studio（データベースGUI）
npm run db:studio
```

### GCP・デプロイコマンド

```bash
# GCPの初期セットアップ
npm run gcp:setup

# Secret Manager管理
npm run gcp:secrets list
npm run gcp:secrets show <secret-name>
npm run gcp:secrets update <secret-name>

# Cloud Runへのデプロイ
npm run deploy

# デプロイログの確認
npm run deploy:logs

# 古いイメージのクリーンアップ
npm run deploy:cleanup
```

## プロジェクト構成

```
claude-code-ai-chat/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx              # メインチャット画面
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts      # チャットAPIエンドポイント
│   ├── components/               # Reactコンポーネント
│   ├── lib/
│   │   ├── mastra/               # Mastra設定
│   │   ├── db.ts                 # Prisma Clientインスタンス
│   │   └── types.ts              # 型定義
│   └── hooks/                    # カスタムフック
├── prisma/
│   └── schema.prisma             # MongoDBスキーマ定義
├── scripts/
│   └── test-db-connection.ts    # DB接続テストスクリプト
├── docs/
│   └── database-setup.md        # データベースセットアップガイド
├── docker-compose.yml            # ローカル開発用
└── Dockerfile                    # 本番デプロイ用
```

## ドキュメント

- [プロジェクト仕様書](CLAUDE.md)
- [開発計画 TODO](TODO.md)
- [データベースセットアップガイド](docs/database-setup.md)
- [GCPセットアップガイド](docs/gcp-setup-guide.md)
- [デプロイメントガイド](docs/deployment-guide.md)
- [GitHub Actionsセットアップガイド](docs/GITHUB_ACTIONS_SETUP.md)
- [テストガイド](docs/testing-guide.md)
- [コードレビューレポート](docs/test-review-report.md)

## データベース管理

### ローカルMongoDB

```bash
# コンテナの起動
docker-compose up -d

# コンテナの停止
docker-compose stop

# コンテナの削除（データは保持）
docker-compose down

# コンテナとデータの完全削除
docker-compose down -v

# ログの確認
docker-compose logs mongodb
```

### Prismaコマンド

```bash
# Prisma Clientの生成
npx prisma generate

# Prisma Studioの起動
npm run db:studio

# スキーマのフォーマット
npx prisma format
```

## デプロイ

### ローカルから手動デプロイ

```bash
# GCPの初期セットアップ（初回のみ）
npm run gcp:setup

# Cloud Runへデプロイ
npm run deploy
```

### GitHub Actionsで自動デプロイ

mainブランチへのpush時に自動デプロイされます。

セットアップ方法は [GitHub Actionsセットアップガイド](docs/GITHUB_ACTIONS_SETUP.md) を参照してください。

### 詳細なガイド

- [GCPセットアップガイド](docs/gcp-setup-guide.md)
- [デプロイメントガイド](docs/deployment-guide.md)
- [GitHub Actionsセットアップガイド](docs/GITHUB_ACTIONS_SETUP.md)

## トラブルシューティング

### Dockerが起動しない

Docker Desktopが起動していることを確認してください：

```bash
docker --version
docker ps
```

### データベースに接続できない

1. MongoDBコンテナが起動していることを確認
2. `.env.local`の`DATABASE_URL`が正しいか確認
3. 接続テストを実行: `npm run db:test`

詳細は [データベースセットアップガイド](docs/database-setup.md) を参照してください。

## ライセンス

MIT License

## 開発状況

**完了済みフェーズ:**

- [x] フェーズ1: プロジェクト初期セットアップ
- [x] フェーズ2: データベース設定
- [x] フェーズ3: AIエージェント設定（Mastra）
- [x] フェーズ4: バックエンドAPI実装
- [x] フェーズ5: フロントエンド実装
- [x] フェーズ6: スタイリング
- [x] フェーズ7: テスト・デバッグ（コードレビュー完了）
- [x] フェーズ8: Docker化
- [x] フェーズ9: Google Cloud設定（スクリプト・ドキュメント作成完了）

**次のステップ:**

- [ ] フェーズ10: Cloud Runデプロイ（実際のデプロイ実行）
- [ ] フェーズ11: 最終調整・ドキュメント

詳細な進捗状況は [TODO.md](TODO.md) を参照してください。
