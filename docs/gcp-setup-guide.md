# Google Cloud Platform セットアップガイド

このガイドでは、AIチャットボットアプリケーションをGoogle Cloud Runにデプロイするための手順を説明します。

## 前提条件

- Googleアカウント
- gcloud CLIがインストールされていること（[インストールガイド](https://cloud.google.com/sdk/docs/install)）
- Dockerがインストールされていること
- MongoDB Atlasのセットアップが完了していること

## フェーズ9.1: GCPプロジェクト設定

### 1. GCPプロジェクトの作成

新しいプロジェクトを作成する場合：

```bash
# プロジェクトIDを設定（任意の一意なID）
export PROJECT_ID="your-project-id"

# プロジェクトを作成
gcloud projects create $PROJECT_ID --name="AI Chatbot"

# 作成したプロジェクトを選択
gcloud config set project $PROJECT_ID
```

既存のプロジェクトを使用する場合：

```bash
# プロジェクトIDを設定
export PROJECT_ID="your-existing-project-id"

# プロジェクトを選択
gcloud config set project $PROJECT_ID
```

### 2. 請求アカウントの設定

GCPコンソールで請求アカウントを設定：

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 「お支払い」セクションに移動
3. プロジェクトに請求アカウントをリンク

または、gcloud CLIで設定：

```bash
# 利用可能な請求アカウントを確認
gcloud billing accounts list

# プロジェクトに請求アカウントをリンク
gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID
```

### 3. 必要なAPIの有効化

以下のコマンドで必要なAPIをすべて有効化します：

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Artifact Registry API（Container Registryの後継）
gcloud services enable artifactregistry.googleapis.com

# Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Cloud Build API（コンテナビルド用）
gcloud services enable cloudbuild.googleapis.com
```

すべてのAPIを一度に有効化：

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

APIが有効化されたことを確認：

```bash
gcloud services list --enabled
```

## フェーズ9.2: Secret Managerの設定

### 1. Anthropic API Keyをシークレットとして登録

```bash
# Anthropic API Keyをシークレットとして作成
echo -n "your-anthropic-api-key-here" | gcloud secrets create anthropic-api-key \
  --replication-policy="automatic" \
  --data-file=-
```

シークレットが作成されたことを確認：

```bash
gcloud secrets describe anthropic-api-key
```

### 2. MongoDB接続文字列をシークレットとして登録

```bash
# MongoDB接続文字列をシークレットとして作成
echo -n "mongodb+srv://username:password@cluster.mongodb.net/chatbot?retryWrites=true&w=majority" | \
  gcloud secrets create mongodb-uri \
  --replication-policy="automatic" \
  --data-file=-
```

### 3. Cloud RunからのアクセスIAM設定

プロジェクト番号を取得：

```bash
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
```

Compute Service Accountにシークレットアクセス権限を付与：

```bash
# Anthropic API Keyへのアクセス権限
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# MongoDB URIへのアクセス権限
gcloud secrets add-iam-policy-binding mongodb-uri \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

シークレットのIAMポリシーを確認：

```bash
gcloud secrets get-iam-policy anthropic-api-key
gcloud secrets get-iam-policy mongodb-uri
```

## フェーズ9.3: MongoDB Atlasのネットワーク設定更新

### Cloud RunのIPアドレス範囲について

Cloud Runは動的なIPアドレスを使用するため、特定のIPアドレスをホワイトリストに追加することはできません。以下のいずれかの方法を選択してください：

### オプション1: すべてのIPアドレスを許可（開発・テスト用）

MongoDB Atlasのネットワークアクセス設定で：

1. [MongoDB Atlas Console](https://cloud.mongodb.com/)にログイン
2. プロジェクトを選択
3. 「Network Access」タブに移動
4. 「Add IP Address」をクリック
5. 「Allow Access from Anywhere」を選択
6. IPアドレス: `0.0.0.0/0`
7. 説明: "Cloud Run Access"
8. 「Confirm」をクリック

**注意**: この設定はセキュリティリスクがあるため、本番環境では推奨されません。

### オプション2: VPC Serverless Connector経由（本番環境推奨）

より安全な方法として、VPC Serverless Connectorを使用して固定IPアドレス経由でアクセスします。

1. VPC Serverless Connectorを作成：

```bash
gcloud compute networks vpc-access connectors create chatbot-connector \
  --region=asia-northeast1 \
  --network=default \
  --range=10.8.0.0/28
```

2. Cloud NAT用の外部IPアドレスを予約：

```bash
gcloud compute addresses create chatbot-nat-ip \
  --region=asia-northeast1
```

3. 予約したIPアドレスを確認：

```bash
gcloud compute addresses describe chatbot-nat-ip \
  --region=asia-northeast1 \
  --format="get(address)"
```

4. Cloud Routerを作成：

```bash
gcloud compute routers create chatbot-router \
  --network=default \
  --region=asia-northeast1
```

5. Cloud NATを作成：

```bash
gcloud compute routers nats create chatbot-nat \
  --router=chatbot-router \
  --region=asia-northeast1 \
  --nat-external-ip-pool=chatbot-nat-ip \
  --nat-all-subnet-ip-ranges
```

6. MongoDB AtlasのネットワークアクセスにこのIPアドレスを追加

### 接続文字列の確認

MongoDB Atlasで接続文字列を確認：

1. MongoDB Atlasコンソールにログイン
2. クラスターの「Connect」ボタンをクリック
3. 「Connect your application」を選択
4. Node.js 5.5以降を選択
5. 接続文字列をコピー（ユーザー名とパスワードを実際の値に置き換える）

形式: `mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority`

## 環境変数のまとめ

Cloud Runにデプロイする際に必要な環境変数：

| 変数名 | 説明 | 設定方法 |
|--------|------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API Key | Secret Manager経由 |
| `DATABASE_URL` | MongoDB接続文字列 | Secret Manager経由 |
| `NEXT_PUBLIC_APP_URL` | アプリケーションのURL | 環境変数（デプロイ後のCloud Run URL） |

## セットアップ完了確認

すべての設定が完了したら、以下を確認してください：

```bash
# プロジェクトが正しく設定されているか確認
gcloud config get-value project

# 有効化されたAPIを確認
gcloud services list --enabled | grep -E "run|artifact|secret|build"

# シークレットが作成されているか確認
gcloud secrets list

# VPC Connector（作成した場合）を確認
gcloud compute networks vpc-access connectors list --region=asia-northeast1
```

## トラブルシューティング

### APIが有効化できない

- プロジェクトに請求アカウントがリンクされているか確認
- gcloud CLIが最新版か確認: `gcloud components update`

### シークレットにアクセスできない

- IAMポリシーが正しく設定されているか確認
- Compute Service Accountのメールアドレスが正しいか確認

### MongoDBに接続できない

- ネットワークアクセス設定でIPアドレスが許可されているか確認
- 接続文字列のユーザー名・パスワードが正しいか確認
- データベースユーザーが正しく作成されているか確認

## 次のステップ

GCPの設定が完了したら、[デプロイガイド](./deployment-guide.md)に進んでCloud Runへのデプロイを実行してください。
