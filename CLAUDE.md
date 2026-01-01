# AIチャットボット - プロジェクト仕様書

## プロジェクト概要

エンターテインメント系のAIチャットボットWebアプリケーション。ユーザーが気軽に雑談や相談ができる汎用的なアシスタントとして機能する。

### 目的・用途
- **カテゴリー**: エンターテインメント
- **主な機能**: 雑談・相談対応
- **キャラクター設定**: 汎用的なアシスタント（特定のキャラ付けなし）
- **UIデザイン**: ビジネスライク（シンプルで機能的）

## 技術スタック

### フロントエンド・バックエンド
- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript
- **APIフレームワーク**: Hono
- **ORM**: Prisma.js
- **データベース**: MongoDB
- **スタイリング**: Tailwind CSS（推奨）

### AIエージェント
- **AIエージェントフレームワーク**: Mastra
- **AI API**: Anthropic Claude (Sonnet 4.5推奨)

### インフラ・デプロイ
- **クラウドプラットフォーム**: Google Cloud
- **デプロイ先**: Cloud Run
- **コンテナ化**: Docker
- **データベースホスティング**: MongoDB Atlas（推奨）

## 機能要件

### 必須機能

1. **チャット機能**
   - テキストベースの会話機能
   - ストリーミング表示（逐次的に文字が表示される）
   - セッション内での会話コンテキスト保持

2. **UIコンポーネント**
   - チャット入力フィールド
   - メッセージ表示エリア
   - 会話クリアボタン
   - シンプルなヘッダー

### 対応しない機能

- ユーザー認証・ログイン機能
- 会話履歴の永続化（データベース保存）※現時点では未実装
- 画像・ファイルアップロード
- 音声入力・出力
- 会話のエクスポート
- 多言語対応

## アーキテクチャ設計

### システム構成

```
[フロントエンド]
Next.js (App Router) + React + Tailwind CSS
    ↓
[APIレイヤー]
Hono (Next.js API Routes)
    ↓
[AIエージェント]
Mastra → Anthropic Claude API
    ↓
[データベース（将来の拡張用）]
MongoDB (Prisma経由)
    ↓
[ストリーミングレスポンス]
Server-Sent Events
    ↓
[ユーザー画面]
リアルタイム表示
```

### ディレクトリ構成

```
claude-code-ai-chat/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx              # メインチャット画面
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts      # チャットAPIエンドポイント
│   ├── components/
│   │   ├── ChatInterface.tsx     # チャットUI全体
│   │   ├── MessageList.tsx       # メッセージ表示
│   │   ├── MessageInput.tsx      # 入力フィールド
│   │   └── StreamingMessage.tsx  # ストリーミング表示
│   ├── lib/
│   │   ├── mastra/               # Mastra設定
│   │   │   ├── agent.ts          # AIエージェント定義
│   │   │   └── config.ts         # Mastra設定
│   │   ├── db.ts                 # Prisma Clientインスタンス
│   │   └── types.ts              # 型定義
│   └── hooks/
│       └── useChat.ts            # チャット用カスタムフック
├── prisma/
│   └── schema.prisma             # MongoDBスキーマ定義
├── Dockerfile
├── .dockerignore
├── docker-compose.yml            # ローカル開発用（MongoDB含む）
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.local                    # 環境変数
```

## データベース設計

### Prisma + MongoDB構成

**データベース**: MongoDB（MongoDB Atlas推奨）
**ORM**: Prisma.js（MongoDBコネクタ使用）

### スキーマ定義

現時点では会話履歴を保存しないが、将来の拡張に備えて以下のスキーマを定義：

#### Userモデル（将来の拡張用）
- id: ObjectId
- email: String (unique)
- name: String (optional)
- createdAt: DateTime
- updatedAt: DateTime

#### Conversationモデル（将来の拡張用）
- id: ObjectId
- messages: Json[] (メッセージ配列)
- createdAt: DateTime
- updatedAt: DateTime
- userId: String (optional, 将来的にユーザーと紐付け)

### データの保存方針

**現時点の方針**: 会話履歴はデータベースに保存しない
- セッション内でのみ会話を保持（Reactのstate管理）
- ページリロードで会話がクリア
- ブラウザのsessionStorageを利用した一時保存も検討可能

**将来の拡張**: ユーザー認証を追加した際にMongoDBで会話履歴を管理

## 環境変数

`.env.local`に以下を設定：

```
# Anthropic API
ANTHROPIC_API_KEY=your_api_key_here

# MongoDB
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/chatbot?retryWrites=true&w=majority"

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Cloud Platform
GCP_PROJECT_ID=your-gcp-project-id
GCP_REGION=asia-northeast1
```

### MongoDB Atlas設定

1. MongoDB Atlasでクラスターを作成
2. データベースユーザーを作成
3. ネットワークアクセスを設定（Cloud RunのIPを許可）
4. 接続文字列を取得してDATABASE_URLに設定

## デプロイ設定

### Cloud Run設定

- **リージョン**: asia-northeast1（東京）推奨
- **認証**: allow-unauthenticated（誰でもアクセス可能）
- **最小インスタンス**: 0（コスト削減）
- **最大インスタンス**: 10（調整可能）
- **メモリ**: 512MB〜1GB
- **CPU**: リクエスト時のみ割り当て
- **タイムアウト**: 300秒（ストリーミングレスポンス対応）

### 環境変数の設定

Cloud Runに以下の環境変数を設定：
- `ANTHROPIC_API_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`

Secret Managerの使用を推奨（特にAPI Keyは必須）

### デプロイフロー

1. Dockerイメージをビルド
2. Google Container Registryにプッシュ
3. Cloud Runにデプロイ
4. 環境変数・Secretを設定
5. MongoDBのネットワークアクセス設定を更新
6. カスタムドメインの設定（オプション）

## セキュリティ考慮事項

### API Key管理
- Cloud Run Secret Managerでの管理
- 環境変数での参照
- コードに直接埋め込まない

### データベースセキュリティ
- MongoDB Atlasのネットワークアクセス制限
- 強力なデータベースパスワードの使用
- TLS/SSL接続の有効化
- IPホワイトリストの設定

### レート制限
- 同一IPからの過度なリクエストを制限
- Cloud Runの同時実行数制限を設定
- フロントエンドでの送信制限（連打防止）

### 入力検証
- ユーザー入力のサニタイゼーション
- 最大メッセージ長の制限（例: 10,000文字）
- XSS対策（Reactのデフォルトエスケープを活用）
- NoSQLインジェクション対策

## パフォーマンス最適化

### フロントエンド
- React Server Components（RSC）の活用
- クライアントコンポーネントの最小化
- ストリーミング表示による体感速度向上
- 適切なローディング状態の表示

### バックエンド
- Honoの高速性を活用
- ストリーミングレスポンスで逐次送信
- Claude APIのSonnetモデル使用（バランス型）
- Prismaのコネクションプーリング活用（将来の拡張時）

### データベース
- MongoDB Atlasのリージョンを最適化（asia-northeast1推奨）
- インデックスの適切な設定（将来の拡張時）
- コネクションプーリングの設定

### インフラ
- Cloud Runのコールドスタート最適化
- 軽量なDockerイメージの作成
- CDNの活用（静的アセット）

## テスト戦略

### 開発環境
- **単体テスト**: Jest + React Testing Library
- **E2Eテスト**: Playwright
- **型チェック**: TypeScript strict mode

### テスト項目
- チャット送信・受信機能
- ストリーミング表示の動作
- エラーハンドリング
- レスポンシブデザイン
- データベース接続（将来の拡張時）

## Makefileによる開発コマンド

このプロジェクトは`Makefile`で管理されています。以下の4つのコマンドのみ使用：

```bash
make init    # 初期セットアップ（npm install + MongoDB起動 + Prisma生成）
make dev     # 開発サーバー起動（MongoDB自動起動 + Next.js dev）
make build   # 本番ビルド（Next.js build + Dockerイメージ作成）
make deploy  # Cloud Runデプロイ（GCP設定 + デプロイ実行）
```

**基本的な使い方:**
1. `make init` で初期セットアップ（初回のみ）
2. `.env.local` を編集して環境変数を設定
   - `ANTHROPIC_API_KEY`: Anthropic APIキー
   - `DATABASE_URL`: MongoDB接続文字列
   - `GCP_PROJECT_ID`: Google Cloud プロジェクトID
   - `GCP_REGION`: デプロイ先リージョン（デフォルト: asia-northeast1）
3. `make dev` で開発開始
4. `make build` → `make deploy` で本番リリース

## 開発手順

### 1. 初期セットアップ
- Next.jsプロジェクト作成（App Router、TypeScript、Tailwind CSS）
- 必要なパッケージのインストール
  - hono
  - @mastra/core, @mastra/anthropic
  - @anthropic-ai/sdk
  - prisma（MongoDBコネクタ）
- ディレクトリ構成の作成

### 2. Prisma + MongoDB設定
- `prisma init`の実行
- `schema.prisma`でMongoDBプロバイダーを設定
- MongoDB Atlasのセットアップ
- Prisma Client生成

### 3. 基本実装
- UIコンポーネントの実装
- APIエンドポイントの実装
- Mastraエージェントの設定

### 4. ストリーミング機能
- Server-Sent Eventsの実装
- フロントエンドでのストリーミング受信

### 5. スタイリング
- Tailwind CSSでのUI実装
- レスポンシブデザイン対応
- ビジネスライクなデザイン適用

### 6. ローカルテスト
- docker-composeでMongoDBを起動
- ローカル環境での動作確認

### 7. Docker化
- Dockerfileの作成
- マルチステージビルドの活用
- ローカルでのコンテナテスト

### 8. デプロイ
- GCPプロジェクト設定
- MongoDB Atlasのネットワーク設定
- Cloud Runへのデプロイ
- 環境変数・Secretの設定
- 動作確認

## データフロー

### チャットメッセージ送信フロー

1. ユーザーがメッセージを入力
2. フロントエンド（ChatInterface）がAPIに送信
3. Hono APIエンドポイントが受信
4. Mastraエージェントが呼び出される
5. Claude APIにリクエスト送信
6. ストリーミングレスポンスを受信
7. Server-Sent Eventsでフロントエンドに逐次送信
8. フロントエンドでリアルタイム表示

### データ永続化フロー（将来の拡張時）

1. ユーザーがメッセージを送信
2. 会話履歴をMongoDBに保存
3. レスポンス生成後、アシスタントのメッセージも保存
4. ユーザーが過去の会話を閲覧可能に

## 今後の拡張案

基本機能実装後に検討可能な拡張：

### 短期的拡張
- 会話履歴の永続化（MongoDB活用）
- ユーザー認証機能（NextAuth.js）
- 複数の会話スレッド管理
- ダークモード対応

### 中期的拡張
- 画像アップロード対応（Claude Vision）
- 会話のエクスポート機能（テキスト/PDF）
- フィードバック機能
- 使用統計・分析機能

### 長期的拡張
- 音声入力対応
- 多言語対応
- カスタムキャラクター設定
- プラグインシステム

## 制約・前提条件

### 技術的制約
- Claude APIのレート制限に準拠
- Cloud Runの同時実行数制限
- MongoDB Atlasの無料プランの制限（将来の拡張時）
- ブラウザのsessionStorage容量制限

### ビジネス的制約
- 無料ユーザーのみ（認証なし）
- 会話履歴の保存なし（現時点）
- 基本的なチャット機能のみ提供

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Hono Documentation](https://hono.dev/)
- [Mastra Documentation](https://mastra.ai/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Prisma MongoDB Documentation](https://www.prisma.io/docs/orm/overview/databases/mongodb)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Tailwind CSS](https://tailwindcss.com/)
