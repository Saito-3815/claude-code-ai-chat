# Cloud Run デプロイガイド

このガイドでは、AIチャットボットアプリケーションをGoogle Cloud Runにデプロイする手順を説明します。

## 目次

1. [前提条件](#前提条件)
2. [デプロイの準備](#デプロイの準備)
3. [デプロイの実行](#デプロイの実行)
4. [デプロイ後の確認](#デプロイ後の確認)
5. [トラブルシューティング](#トラブルシューティング)
6. [更新とロールバック](#更新とロールバック)

---

## 前提条件

デプロイを開始する前に、以下が完了していることを確認してください：

### 1. GCPプロジェクトの設定

- [ ] GCPプロジェクトが作成されている
- [ ] 請求アカウントが設定されている
- [ ] 必要なAPIが有効化されている（フェーズ9で実施済み）
  - Cloud Run API
  - Artifact Registry API
  - Secret Manager API
  - Cloud Build API

### 2. Secret Managerの設定

- [ ] Anthropic API KeyがSecret Managerに登録されている（`anthropic-api-key`）
- [ ] MongoDB URIがSecret Managerに登録されている（`mongodb-uri`）
- [ ] Secret ManagerへのIAM権限が設定されている

フェーズ9のセットアップスクリプトを実行していない場合は、以下を実行してください：

```bash
# セットアップスクリプトの実行
./scripts/setup-gcp.sh

# または手動でシークレットを設定
./scripts/manage-secrets.sh set anthropic-api-key "your_api_key_here"
./scripts/manage-secrets.sh set mongodb-uri "your_mongodb_uri_here"
```

### 3. MongoDB Atlasの設定

- [ ] MongoDB Atlasクラスターが作成されている
- [ ] データベースユーザーが作成されている
- [ ] ネットワークアクセス設定が完了している

**重要**: Cloud RunからMongoDBに接続できるようにするため、MongoDB Atlasのネットワークアクセス設定で以下のいずれかを設定してください：

**オプション1: 全IPアドレスを許可（開発・テスト用）**
```
0.0.0.0/0
```

**オプション2: VPC Serverless Connector経由（本番環境推奨）**
- VPC Serverless Connectorの作成
- Cloud RunサービスにVPCコネクターを設定
- VPCのIPレンジをMongoDB Atlasに追加

詳細は `gcp-setup-guide.md` の「MongoDB Atlasネットワーク設定」を参照してください。

### 4. ローカル環境

- [ ] Docker Desktopがインストールされ、起動している
- [ ] gcloud CLIがインストールされている
- [ ] gcloud CLIでGCPプロジェクトが設定されている

```bash
# プロジェクトの確認
gcloud config get-value project

# プロジェクトの設定（必要に応じて）
gcloud config set project YOUR_PROJECT_ID

# 認証の確認
gcloud auth list

# ログイン（必要に応じて）
gcloud auth login
```

---

## デプロイの準備

### 1. プロジェクトのビルド確認

デプロイ前にローカルでビルドが成功することを確認します：

```bash
# Next.jsのビルド
npm run build

# Dockerイメージのビルド（ローカルテスト）
docker build -t ai-chatbot:local .
```

ビルドエラーがある場合は、まず解決してからデプロイを進めてください。

### 2. 環境変数の確認

デプロイ時に設定される環境変数を確認します：

| 環境変数 | 説明 | 設定方法 |
|---------|------|---------|
| `NODE_ENV` | Node.js環境（production） | デプロイ時に自動設定 |
| `ANTHROPIC_API_KEY` | Anthropic APIキー | Secret Manager参照 |
| `DATABASE_URL` | MongoDB接続文字列 | Secret Manager参照 |
| `NEXT_PUBLIC_APP_URL` | アプリケーションURL | デプロイ後に設定（オプション） |

### 3. デプロイスクリプトの実行権限

```bash
# スクリプトに実行権限を付与
chmod +x scripts/deploy-to-cloudrun.sh
```

---

## デプロイの実行

### 方法1: 自動デプロイスクリプトを使用（推奨）

最も簡単な方法は、用意されているデプロイスクリプトを使用することです：

```bash
# フルデプロイ（ビルド、プッシュ、デプロイ）
npm run deploy

# または直接スクリプトを実行
./scripts/deploy-to-cloudrun.sh
```

スクリプトは以下の処理を自動で実行します：

1. ✅ プロジェクトIDの取得と確認
2. ✅ Docker環境の確認
3. ✅ Artifact Registryの認証設定
4. ✅ Dockerイメージのビルド
5. ✅ Artifact Registryへのプッシュ
6. ✅ Cloud Runへのデプロイ
7. ✅ デプロイ情報の表示

#### デプロイスクリプトのオプション

```bash
# ヘルプを表示
./scripts/deploy-to-cloudrun.sh --help

# ビルドをスキップ（既存イメージを使用）
./scripts/deploy-to-cloudrun.sh --skip-build

# プッシュをスキップ（ローカルビルドのみ）
./scripts/deploy-to-cloudrun.sh --skip-push

# ログのみ表示
./scripts/deploy-to-cloudrun.sh --logs

# 古いイメージをクリーンアップ
./scripts/deploy-to-cloudrun.sh --cleanup
```

### 方法2: 手動デプロイ

手動で各ステップを実行する場合：

#### ステップ1: Artifact Registryの認証設定

```bash
gcloud auth configure-docker asia-northeast1-docker.pkg.dev --quiet
```

#### ステップ2: Dockerイメージのビルド

```bash
# プロジェクトIDを取得
PROJECT_ID=$(gcloud config get-value project)

# イメージタグを設定
IMAGE_TAG="asia-northeast1-docker.pkg.dev/${PROJECT_ID}/cloud-run-apps/ai-chatbot:latest"

# ビルド実行
docker build -t $IMAGE_TAG .
```

#### ステップ3: Artifact Registryにプッシュ

```bash
docker push $IMAGE_TAG
```

#### ステップ4: Cloud Runにデプロイ

```bash
# プロジェクトIDを取得
PROJECT_ID=$(gcloud config get-value project)

# デプロイ実行
gcloud run deploy ai-chatbot \
  --image=asia-northeast1-docker.pkg.dev/${PROJECT_ID}/cloud-run-apps/ai-chatbot:latest \
  --platform=managed \
  --region=asia-northeast1 \
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

### 方法3: Cloud Buildを使用（CI/CDパイプライン）

Cloud Buildを使った自動デプロイの場合：

```bash
# cloudbuild.yamlを使ってビルド＆デプロイ
gcloud builds submit --config cloudbuild.yaml
```

*注: `cloudbuild.yaml`は別途作成が必要です（オプション機能）*

---

## デプロイ後の確認

### 1. デプロイステータスの確認

デプロイが成功すると、以下のような出力が表示されます：

```
=========================================
デプロイ完了
=========================================
サービス名: ai-chatbot
リージョン: asia-northeast1
サービスURL: https://ai-chatbot-xxxxx-an.a.run.app

次のステップ:
1. ブラウザで https://ai-chatbot-xxxxx-an.a.run.app にアクセス
2. チャット機能の動作を確認
3. ログを確認: gcloud run logs read ai-chatbot --region=asia-northeast1
=========================================
```

### 2. サービスURLへのアクセス

表示されたサービスURLにブラウザでアクセスし、チャット機能が正常に動作することを確認します。

#### 確認項目

- [ ] ページが正常に表示される
- [ ] メッセージを送信できる
- [ ] AIからのストリーミングレスポンスが表示される
- [ ] エラーメッセージが表示されない
- [ ] 会話クリア機能が動作する

### 3. ログの確認

デプロイ後のアプリケーションログを確認します：

```bash
# 最新50件のログを表示
gcloud run logs read ai-chatbot --region=asia-northeast1 --limit=50

# リアルタイムでログを監視
gcloud run logs tail ai-chatbot --region=asia-northeast1

# 特定の期間のログを表示
gcloud run logs read ai-chatbot \
  --region=asia-northeast1 \
  --since="2024-01-01T00:00:00Z" \
  --until="2024-01-01T23:59:59Z"
```

#### 確認すべきログ

- ✅ Next.jsサーバーの起動ログ
- ✅ MongoDB接続の成功ログ
- ✅ チャットAPIのリクエスト/レスポンスログ
- ❌ エラーやWarningがないか

### 4. Cloud Runコンソールでの確認

GCPコンソールでも確認できます：

1. [Cloud Runコンソール](https://console.cloud.google.com/run)にアクセス
2. `ai-chatbot`サービスをクリック
3. 以下を確認：
   - サービスのステータスが「Ready」
   - メトリクス（リクエスト数、レイテンシ、エラー率）
   - リビジョン履歴
   - ログエクスプローラー

### 5. MongoDB接続の確認

Cloud RunからMongoDB Atlasへの接続を確認します：

```bash
# アプリケーションログで接続エラーがないか確認
gcloud run logs read ai-chatbot --region=asia-northeast1 | grep -i "mongo\|database\|connection"
```

**接続エラーが出る場合**:
- MongoDB Atlasのネットワークアクセス設定を確認
- `0.0.0.0/0`が許可されているか確認
- DATABASE_URLシークレットが正しく設定されているか確認

### 6. NEXT_PUBLIC_APP_URLの設定（オプション）

Next.jsアプリケーションで本番URLを参照する必要がある場合：

```bash
# サービスURLを取得
SERVICE_URL=$(gcloud run services describe ai-chatbot \
  --region=asia-northeast1 \
  --format='value(status.url)')

# 環境変数を更新
gcloud run services update ai-chatbot \
  --region=asia-northeast1 \
  --update-env-vars="NEXT_PUBLIC_APP_URL=$SERVICE_URL"
```

---

## トラブルシューティング

### デプロイが失敗する

#### 問題: Artifact Registryへのプッシュに失敗する

```
Error: denied: Permission denied
```

**解決策**:
```bash
# Artifact Registryの認証を再設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev --quiet

# gcloud CLIで認証されているか確認
gcloud auth list

# 必要に応じて再ログイン
gcloud auth login
```

#### 問題: Secret Managerからシークレットを取得できない

```
Error: failed to retrieve secret
```

**解決策**:
```bash
# シークレットが存在するか確認
gcloud secrets list

# IAM権限を確認・設定
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding mongodb-uri \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### アプリケーションが起動しない

#### 問題: コンテナが起動に失敗する

```
Error: Container failed to start
```

**解決策**:
```bash
# ログを確認
gcloud run logs read ai-chatbot --region=asia-northeast1 --limit=100

# ローカルでDockerコンテナをテスト
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY="your_key" \
  -e DATABASE_URL="your_mongodb_uri" \
  asia-northeast1-docker.pkg.dev/${PROJECT_ID}/cloud-run-apps/ai-chatbot:latest
```

#### 問題: MongoDBに接続できない

```
Error: MongoServerSelectionError: connection refused
```

**解決策**:
1. MongoDB Atlasのネットワークアクセス設定を確認
   - `0.0.0.0/0`が許可リストに追加されているか
2. DATABASE_URLが正しいか確認
   ```bash
   gcloud secrets versions access latest --secret="mongodb-uri"
   ```
3. MongoDB Atlasクラスターが起動しているか確認

### パフォーマンスの問題

#### 問題: コールドスタートが遅い

**解決策**:
```bash
# 最小インスタンス数を1に設定（コスト増加に注意）
gcloud run services update ai-chatbot \
  --region=asia-northeast1 \
  --min-instances=1
```

#### 問題: メモリ不足エラー

```
Error: Memory limit exceeded
```

**解決策**:
```bash
# メモリを増やす（1Gi → 2Gi）
gcloud run services update ai-chatbot \
  --region=asia-northeast1 \
  --memory=2Gi
```

#### 問題: タイムアウトエラー

```
Error: Timeout
```

**解決策**:
```bash
# タイムアウトを延長（300秒 → 600秒）
gcloud run services update ai-chatbot \
  --region=asia-northeast1 \
  --timeout=600
```

### ログの確認方法

詳細なログを確認する場合：

```bash
# エラーログのみ表示
gcloud run logs read ai-chatbot --region=asia-northeast1 | grep -i "error"

# 特定の文字列を含むログを検索
gcloud run logs read ai-chatbot --region=asia-northeast1 | grep "Claude"

# JSON形式でログを取得
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=ai-chatbot" \
  --limit=50 \
  --format=json
```

---

## 更新とロールバック

### アプリケーションの更新

コードを変更した後、再デプロイする手順：

```bash
# 1. 変更をコミット（オプション）
git add .
git commit -m "Update: feature description"

# 2. 再デプロイ
npm run deploy
```

デプロイスクリプトが自動で以下を実行します：
- 新しいDockerイメージのビルド
- Artifact Registryへのプッシュ
- Cloud Runへのデプロイ（新しいリビジョンが作成される）

### リビジョンの管理

Cloud Runは各デプロイで新しいリビジョンを作成します。

```bash
# リビジョン一覧を表示
gcloud run revisions list --service=ai-chatbot --region=asia-northeast1

# 特定のリビジョンにトラフィックを送る
gcloud run services update-traffic ai-chatbot \
  --region=asia-northeast1 \
  --to-revisions=ai-chatbot-00001-abc=100
```

### ロールバック

問題が発生した場合、前のリビジョンにロールバックできます：

```bash
# 1. 利用可能なリビジョンを確認
gcloud run revisions list --service=ai-chatbot --region=asia-northeast1

# 2. 前のリビジョン名をコピー（例: ai-chatbot-00005-xyz）

# 3. ロールバック実行
gcloud run services update-traffic ai-chatbot \
  --region=asia-northeast1 \
  --to-revisions=ai-chatbot-00005-xyz=100

# 4. 動作確認
# サービスURLにアクセスして確認

# 5. ログで確認
gcloud run logs read ai-chatbot --region=asia-northeast1 --limit=50
```

### カナリアデプロイ

新しいリビジョンを段階的にロールアウトする場合：

```bash
# 新しいリビジョンに10%のトラフィックを送る
gcloud run services update-traffic ai-chatbot \
  --region=asia-northeast1 \
  --to-revisions=ai-chatbot-00006-new=10,ai-chatbot-00005-old=90

# 問題がなければ徐々に増やす
gcloud run services update-traffic ai-chatbot \
  --region=asia-northeast1 \
  --to-revisions=ai-chatbot-00006-new=50,ai-chatbot-00005-old=50

# 最終的に100%に
gcloud run services update-traffic ai-chatbot \
  --region=asia-northeast1 \
  --to-latest
```

### 古いリビジョンの削除

```bash
# 古いリビジョンを削除（トラフィックを受けていないもの）
gcloud run revisions delete ai-chatbot-00001-abc --region=asia-northeast1
```

---

## モニタリングとメトリクス

### Cloud Runメトリクスの確認

GCPコンソールでメトリクスを確認：

1. [Cloud Runコンソール](https://console.cloud.google.com/run)
2. `ai-chatbot`サービスをクリック
3. 「メトリクス」タブで以下を確認：
   - リクエスト数
   - レイテンシ（P50, P95, P99）
   - エラー率
   - インスタンス数
   - CPU使用率
   - メモリ使用率

### アラート設定

重要なメトリクスにアラートを設定：

```bash
# エラー率が5%を超えたらアラート
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Cloud Run Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=60s
```

### ログベースのメトリクス

特定のログパターンを監視：

```bash
# "Error"を含むログの数を監視
gcloud logging metrics create error_count \
  --description="Count of error logs" \
  --log-filter='resource.type="cloud_run_revision" AND severity="ERROR"'
```

---

## カスタムドメインの設定（オプション）

独自ドメインを使用する場合：

### 1. ドメインマッピングの作成

```bash
# カスタムドメインをマッピング
gcloud run domain-mappings create \
  --service=ai-chatbot \
  --domain=chat.yourdomain.com \
  --region=asia-northeast1
```

### 2. DNSレコードの設定

上記コマンド実行後、表示されるDNS設定をドメインレジストラで設定します。

### 3. SSL証明書の自動発行

Cloud Runが自動的にSSL証明書を発行し、HTTPSを有効にします（数分かかる場合があります）。

### 4. 動作確認

```bash
# カスタムドメインでアクセス
curl https://chat.yourdomain.com
```

---

## コスト最適化

### 推奨設定

- **最小インスタンス数**: 0（コールドスタート許容）
- **最大インスタンス数**: 10（トラフィックに応じて調整）
- **メモリ**: 1Gi（必要に応じて512MB or 2Giに調整）
- **CPU**: 1（Always allocated推奨）

### コストを抑えるヒント

1. **最小インスタンス数を0に設定** - アイドル時のコストを削減
2. **適切なメモリサイズを選択** - 過剰なメモリを避ける
3. **リクエストベースのCPU割り当て** - アイドル時のCPU課金を回避
4. **古いコンテナイメージの削除** - Artifact Registryのストレージコストを削減

```bash
# 古いイメージをクリーンアップ
./scripts/deploy-to-cloudrun.sh --cleanup
```

---

## セキュリティのベストプラクティス

### 1. Secret Managerの使用

APIキーなどの機密情報は必ずSecret Managerで管理してください。

### 2. IAM権限の最小化

Cloud Runサービスアカウントには必要最小限の権限のみを付与します。

### 3. 認証の設定

パブリックアクセスが不要な場合：

```bash
# 認証を要求
gcloud run services update ai-chatbot \
  --region=asia-northeast1 \
  --no-allow-unauthenticated
```

### 4. VPCネットワーク

本番環境では、VPC Serverless Connectorを使用してプライベートネットワーク経由でMongoDBに接続することを推奨します。

---

## まとめ

このガイドで以下を実施しました：

✅ Cloud Runへのデプロイ手順
✅ デプロイ後の動作確認
✅ トラブルシューティング
✅ 更新とロールバック
✅ モニタリング設定
✅ カスタムドメイン設定
✅ コスト最適化
✅ セキュリティ対策

## 次のステップ

- [ ] カスタムドメインの設定（オプション）
- [ ] モニタリング・アラートの設定
- [ ] CI/CDパイプラインの構築（Cloud BuildまたはGitHub Actions）
- [ ] パフォーマンスチューニング
- [ ] セキュリティ監査

---

## 参考リンク

- [Cloud Run公式ドキュメント](https://cloud.google.com/run/docs)
- [Artifact Registry公式ドキュメント](https://cloud.google.com/artifact-registry/docs)
- [Secret Manager公式ドキュメント](https://cloud.google.com/secret-manager/docs)
- [Next.js on Cloud Run](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service)
- [Cloud Runのベストプラクティス](https://cloud.google.com/run/docs/best-practices)

## サポート

問題が発生した場合は、以下を確認してください：

1. `gcp-setup-guide.md` - GCPの初期セットアップ
2. `database-setup.md` - MongoDB Atlasの設定
3. `testing-guide.md` - テスト手順
4. Cloud Runのログ - `gcloud run logs read ai-chatbot --region=asia-northeast1`
