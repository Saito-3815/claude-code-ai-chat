# GitHub Actions セットアップガイド

GitHub ActionsでCloud Runへ自動デプロイする設定方法です。

## 1. GCPでサービスアカウントを作成

```bash
# サービスアカウント作成
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --project=YOUR_PROJECT_ID

# 必要な権限を付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# サービスアカウントキーを作成
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## 2. GitHub Secretsを設定

リポジトリの Settings > Secrets and variables > Actions で以下を追加：

- `GCP_PROJECT_ID`: GCPプロジェクトID
- `GCP_SA_KEY`: key.jsonの内容をそのまま貼り付け

## 3. デプロイ

mainブランチにpushすると自動デプロイされます：

```bash
git push origin main
```
