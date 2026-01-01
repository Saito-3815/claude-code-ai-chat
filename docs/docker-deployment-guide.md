# Dockerデプロイメントガイド

このドキュメントは、AIチャットボットアプリケーションをDockerコンテナとしてビルド・デプロイする手順を説明します。

## 前提条件

- Docker Desktop（Mac/Windows）またはDocker Engine（Linux）がインストールされている
- プロジェクトルートで実行していること

## Dockerイメージのビルド

### 1. 基本的なビルド

```bash
docker build -t claude-code-ai-chat:latest .
```

### 2. タグを指定したビルド

```bash
# バージョン番号を指定
docker build -t claude-code-ai-chat:v1.0.0 .

# GCR用（Google Container Registry）
docker build -t gcr.io/YOUR_PROJECT_ID/claude-code-ai-chat:latest .

# Artifact Registry用（推奨）
docker build -t asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/REPOSITORY/claude-code-ai-chat:latest .
```

## ローカル環境でのテスト

### 1. 環境変数ファイルの準備

`.env.docker`ファイルを作成（`.env.local`をベースに）：

```bash
# .env.docker
ANTHROPIC_API_KEY=your_api_key_here
DATABASE_URL=mongodb://mongo:27017/chatbot?retryWrites=true&w=majority
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. ローカルMongoDBと一緒に起動

Docker Composeを使用する場合：

```bash
# MongoDBとアプリを同時起動
docker-compose up -d
```

### 3. 単体でコンテナを起動

```bash
# MongoDBが別途起動している場合
docker run -d \
  --name claude-chat \
  --env-file .env.docker \
  -p 3000:3000 \
  claude-code-ai-chat:latest
```

### 4. コンテナの動作確認

```bash
# ログの確認
docker logs claude-chat

# コンテナ内に入る
docker exec -it claude-chat sh

# コンテナの停止
docker stop claude-chat

# コンテナの削除
docker rm claude-chat
```

## Google Cloud Runへのデプロイ

### 1. Google Cloud CLIの設定

```bash
# gcloud CLIのインストール確認
gcloud --version

# プロジェクトの設定
gcloud config set project YOUR_PROJECT_ID

# 認証設定
gcloud auth login
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

### 2. Artifact Registryリポジトリの作成

```bash
gcloud artifacts repositories create claude-chat \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="Claude AI Chat Application"
```

### 3. イメージのビルドとプッシュ

```bash
# イメージをビルド
docker build -t asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/claude-chat/claude-code-ai-chat:latest .

# Artifact Registryにプッシュ
docker push asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/claude-chat/claude-code-ai-chat:latest
```

### 4. Cloud Runへデプロイ

```bash
gcloud run deploy claude-ai-chat \
  --image=asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/claude-chat/claude-code-ai-chat:latest \
  --platform=managed \
  --region=asia-northeast1 \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=10 \
  --min-instances=0 \
  --set-env-vars="NEXT_PUBLIC_APP_URL=https://your-service-url.run.app" \
  --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest,DATABASE_URL=database-url:latest"
```

**注意**:
- `--set-secrets`を使用するには、事前にSecret Managerでシークレットを作成する必要があります
- `YOUR_PROJECT_ID`を実際のGCPプロジェクトIDに置き換えてください
- `your-service-url`は実際のCloud Run URLに置き換えてください

### 5. Secret Managerでのシークレット作成

```bash
# API Keyのシークレット作成
echo -n "your_actual_api_key" | gcloud secrets create anthropic-api-key --data-file=-

# Database URLのシークレット作成
echo -n "your_actual_database_url" | gcloud secrets create database-url --data-file=-

# Cloud Runサービスアカウントに権限付与
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## トラブルシューティング

### ビルドエラー

**エラー**: `npm ci` fails during build

**解決策**:
```bash
# package-lock.jsonを再生成
rm package-lock.json
npm install
```

### コンテナ起動エラー

**エラー**: Container exits immediately

**解決策**:
```bash
# ログを確認
docker logs claude-chat

# 環境変数を確認
docker inspect claude-chat | grep -A 20 Env
```

### データベース接続エラー

**エラー**: Cannot connect to MongoDB

**解決策**:
1. MongoDB Atlasのネットワークアクセス設定を確認
2. DATABASE_URL環境変数が正しいか確認
3. MongoDBが起動しているか確認（ローカルの場合）

### Cloud Runデプロイエラー

**エラー**: Permission denied

**解決策**:
```bash
# 必要なIAM権限を付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/run.admin"
```

## パフォーマンス最適化

### イメージサイズの削減

現在のDockerfileは以下の最適化を実施しています：

1. **マルチステージビルド**: 最終イメージに不要なビルドツールを含めない
2. **Alpine Linux**: 軽量なベースイメージを使用
3. **Standalone出力**: Next.jsの最小限のファイルのみを含める
4. **レイヤーキャッシング**: 変更頻度の低いファイルを先にコピー

### ビルドキャッシュの活用

```bash
# BuildKitを有効化してビルド
DOCKER_BUILDKIT=1 docker build -t claude-code-ai-chat:latest .

# キャッシュをクリアしてビルド
docker build --no-cache -t claude-code-ai-chat:latest .
```

## セキュリティベストプラクティス

1. **非rootユーザーでの実行**: Dockerfileでnextjsユーザーを作成して使用
2. **シークレット管理**: 環境変数ではなくSecret Managerを使用
3. **最小権限の原則**: 必要最小限のファイルのみをコピー
4. **定期的な更新**: ベースイメージとパッケージを定期的に更新

```bash
# セキュリティスキャン
docker scan claude-code-ai-chat:latest
```

## CI/CDパイプライン（参考）

### GitHub Actionsの例

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}

      - name: Build and Push
        run: |
          gcloud builds submit \
            --tag asia-northeast1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/claude-chat/claude-code-ai-chat:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy claude-ai-chat \
            --image asia-northeast1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/claude-chat/claude-code-ai-chat:${{ github.sha }} \
            --platform managed \
            --region asia-northeast1
```

## 参考リンク

- [Docker Documentation](https://docs.docker.com/)
- [Next.js Docker Deployment](https://nextjs.org/docs/app/building-your-application/deploying/docker)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
