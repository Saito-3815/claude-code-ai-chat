# Cloud Run デプロイメントガイド

このガイドでは、AIチャットボットアプリケーションをGoogle Cloud Runにデプロイする手順を説明します。

## 前提条件

以下の設定が完了していることを確認してください：

- [x] GCPプロジェクトの作成
- [x] 必要なAPIの有効化
- [x] Secret Managerの設定
- [x] MongoDB Atlasのセットアップ
- [x] Docker環境のセットアップ
- [x] gcloud CLIのインストールと認証

詳細は[GCPセットアップガイド](./gcp-setup-guide.md)を参照してください。

## デプロイ方法

### 方法1: 自動デプロイスクリプトを使用（推奨）

最も簡単な方法です。

```bash
# スクリプトを実行
./scripts/deploy-to-cloudrun.sh
```

このスクリプトは以下を自動で実行します：

1. Dockerイメージのビルド
2. Artifact Registryへのプッシュ
3. Cloud Runへのデプロイ
4. 環境変数とシークレットの設定

#### スクリプトのオプション

```bash
# ヘルプを表示
./scripts/deploy-to-cloudrun.sh --help

# ビルドをスキップ（既存イメージを使用）
./scripts/deploy-to-cloudrun.sh --skip-build

# ログのみ表示
./scripts/deploy-to-cloudrun.sh --logs

# 古いイメージをクリーンアップ
./scripts/deploy-to-cloudrun.sh --cleanup
```

### 方法2: 手動デプロイ

詳細な制御が必要な場合は、以下の手順で手動デプロイを行います。

#### ステップ1: プロジェクト設定

```bash
# プロジェクトIDを設定
export PROJECT_ID="your-project-id"
export REGION="asia-northeast1"

# プロジェクトを選択
gcloud config set project $PROJECT_ID
```

#### ステップ2: Dockerイメージのビルド

```bash
# イメージタグを設定
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-apps/ai-chatbot:latest"

# ビルド実行
docker build -t $IMAGE_TAG .
```

#### ステップ3: Artifact Registryの認証

```bash
# Docker認証を設定
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

#### ステップ4: イメージのプッシュ

```bash
# Artifact Registryにプッシュ
docker push $IMAGE_TAG
```

#### ステップ5: Cloud Runにデプロイ

```bash
# デプロイ実行
gcloud run deploy ai-chatbot \
  --image=$IMAGE_TAG \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest,DATABASE_URL=mongodb-uri:latest" \
  --project=$PROJECT_ID
```

#### ステップ6: サービスURLの確認

```bash
# サービスURLを取得
gcloud run services describe ai-chatbot \
  --region=$REGION \
  --format='value(status.url)'
```

## デプロイ設定の詳細

### Cloud Run設定パラメータ

| パラメータ | 値 | 説明 |
|-----------|-----|------|
| `--memory` | 1Gi | メモリ割り当て（512Mi〜2Giを推奨） |
| `--cpu` | 1 | CPU割り当て |
| `--timeout` | 300 | タイムアウト（秒）ストリーミング対応のため長めに設定 |
| `--min-instances` | 0 | 最小インスタンス数（コスト削減） |
| `--max-instances` | 10 | 最大インスタンス数 |
| `--allow-unauthenticated` | - | 認証なしでアクセス可能 |

### 環境変数とシークレット

#### 環境変数（`--set-env-vars`）

- `NODE_ENV=production`: 本番環境モード
- `NEXT_PUBLIC_APP_URL`: アプリケーションのURL（必要に応じて設定）

#### シークレット（`--set-secrets`）

Secret Managerから参照する機密情報：

- `ANTHROPIC_API_KEY`: Claude API キー
- `DATABASE_URL`: MongoDB接続文字列

フォーマット: `環境変数名=シークレット名:バージョン`

## デプロイ後の確認

### 1. サービスの状態確認

```bash
# サービスの詳細を表示
gcloud run services describe ai-chatbot --region=$REGION

# サービス一覧を表示
gcloud run services list
```

### 2. ログの確認

```bash
# 最新のログを表示
gcloud run logs read ai-chatbot --region=$REGION --limit=50

# リアルタイムでログを監視
gcloud run logs tail ai-chatbot --region=$REGION
```

### 3. ブラウザでアクセス

サービスURLにアクセスして、チャット機能が正常に動作するか確認します。

```bash
# サービスURLを取得
SERVICE_URL=$(gcloud run services describe ai-chatbot --region=$REGION --format='value(status.url)')

# ブラウザで開く（macOS）
open $SERVICE_URL

# ブラウザで開く（Linux）
xdg-open $SERVICE_URL
```

### 4. 動作確認チェックリスト

- [ ] ページが正常に表示される
- [ ] チャット入力フィールドが表示される
- [ ] メッセージを送信できる
- [ ] AIからのレスポンスがストリーミング表示される
- [ ] エラーが発生しない

## 更新とロールバック

### サービスの更新

コードを更新した場合は、再度デプロイスクリプトを実行します：

```bash
./scripts/deploy-to-cloudrun.sh
```

または、手動で：

```bash
# イメージを再ビルド
docker build -t $IMAGE_TAG .

# プッシュ
docker push $IMAGE_TAG

# Cloud Runを更新（自動的に最新イメージを使用）
gcloud run deploy ai-chatbot \
  --image=$IMAGE_TAG \
  --region=$REGION \
  --project=$PROJECT_ID
```

### ロールバック

以前のリビジョンに戻す場合：

```bash
# リビジョン一覧を表示
gcloud run revisions list --service=ai-chatbot --region=$REGION

# 特定のリビジョンにロールバック
gcloud run services update-traffic ai-chatbot \
  --to-revisions=REVISION_NAME=100 \
  --region=$REGION
```

## 環境変数の更新

### 単一の環境変数を更新

```bash
gcloud run services update ai-chatbot \
  --update-env-vars="NEXT_PUBLIC_APP_URL=https://your-domain.com" \
  --region=$REGION
```

### シークレットの更新

Secret Managerでシークレットを更新した後：

```bash
# 新しいバージョンを反映
gcloud run services update ai-chatbot \
  --update-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest" \
  --region=$REGION
```

または、シークレット管理スクリプトを使用：

```bash
# シークレットを更新
./scripts/manage-secrets.sh update anthropic-api-key

# Cloud Runサービスを再起動（新しいシークレットを読み込む）
gcloud run services update ai-chatbot --region=$REGION
```

## パフォーマンス最適化

### コールドスタート対策

最小インスタンスを1以上に設定（コスト増加に注意）：

```bash
gcloud run services update ai-chatbot \
  --min-instances=1 \
  --region=$REGION
```

### メモリ・CPU調整

負荷に応じてリソースを調整：

```bash
# メモリを2GBに増量
gcloud run services update ai-chatbot \
  --memory=2Gi \
  --region=$REGION

# CPUを2に増量
gcloud run services update ai-chatbot \
  --cpu=2 \
  --region=$REGION
```

### 同時実行数の調整

```bash
# コンテナあたりの同時実行数を設定
gcloud run services update ai-chatbot \
  --concurrency=80 \
  --region=$REGION
```

## カスタムドメインの設定

### ドメインマッピングの追加

```bash
# カスタムドメインをマッピング
gcloud run domain-mappings create \
  --service=ai-chatbot \
  --domain=chat.yourdomain.com \
  --region=$REGION
```

### DNS設定

表示されたCNAMEレコードをDNSプロバイダーに追加します。

## モニタリングとアラート

### Cloud Monitoringでの監視

1. [Cloud Console](https://console.cloud.google.com/)にアクセス
2. 「Operations」→「Monitoring」に移動
3. 「Dashboards」で ai-chatbot を選択

### アラートの設定

エラー率や応答時間のアラートを設定：

```bash
# Cloud Consoleの「Monitoring」→「Alerting」で設定
```

## コスト管理

### コスト見積もり

Cloud Runの料金は以下で構成されます：

- リクエスト数
- コンピューティング時間（CPU時間 + メモリ）
- ネットワーク送信

### コスト削減のヒント

1. **最小インスタンス数を0に設定**：使用していない時は課金されない
2. **適切なメモリ・CPU設定**：過剰なリソース割り当てを避ける
3. **タイムアウトの最適化**：不要に長いタイムアウトを避ける
4. **最大インスタンス数の制限**：予期せぬ負荷での高額請求を防ぐ

## トラブルシューティング

### デプロイが失敗する

```bash
# ビルドログを確認
gcloud builds log --region=$REGION

# サービスのステータスを確認
gcloud run services describe ai-chatbot --region=$REGION
```

### サービスが起動しない

```bash
# ログを確認
gcloud run logs read ai-chatbot --region=$REGION --limit=100

# コンテナがローカルで動作するか確認
docker run -p 3000:3000 --env-file .env.docker $IMAGE_TAG
```

### シークレットにアクセスできない

```bash
# IAMポリシーを確認
./scripts/manage-secrets.sh iam anthropic-api-key

# Compute Service Accountに権限があるか確認
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud secrets get-iam-policy anthropic-api-key | grep "${PROJECT_NUMBER}-compute"
```

### MongoDBに接続できない

1. MongoDB Atlasのネットワークアクセス設定を確認
2. 接続文字列が正しいか確認
3. データベースユーザーの権限を確認

```bash
# シークレットの値を確認
./scripts/manage-secrets.sh show mongodb-uri
```

### タイムアウトエラー

```bash
# タイムアウトを延長
gcloud run services update ai-chatbot \
  --timeout=600 \
  --region=$REGION
```

## セキュリティベストプラクティス

### 1. 認証の追加（将来の拡張）

```bash
# 認証を必須にする
gcloud run services update ai-chatbot \
  --no-allow-unauthenticated \
  --region=$REGION
```

### 2. VPC Connectorの使用

MongoDB接続を安全にするために、VPC Connectorを使用：

```bash
gcloud run services update ai-chatbot \
  --vpc-connector=chatbot-connector \
  --vpc-egress=all-traffic \
  --region=$REGION
```

### 3. サービスアカウントの使用

専用のサービスアカウントを作成：

```bash
# サービスアカウントを作成
gcloud iam service-accounts create ai-chatbot-sa \
  --display-name="AI Chatbot Service Account"

# Cloud Runサービスに適用
gcloud run services update ai-chatbot \
  --service-account=ai-chatbot-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --region=$REGION
```

## 次のステップ

デプロイが完了したら：

1. [ ] 本番環境での動作確認
2. [ ] パフォーマンステスト
3. [ ] モニタリングとアラートの設定
4. [ ] カスタムドメインの設定（オプション）
5. [ ] バックアップとディザスタリカバリ計画の策定

## 参考リンク

- [Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [Artifact Registry ドキュメント](https://cloud.google.com/artifact-registry/docs)
- [Secret Manager ドキュメント](https://cloud.google.com/secret-manager/docs)
- [Cloud Run 料金](https://cloud.google.com/run/pricing)
