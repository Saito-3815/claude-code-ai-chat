#!/bin/bash

# Google Cloud Platform セットアップスクリプト
# このスクリプトは、Cloud Runへのデプロイに必要なGCPリソースを設定します。

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 必須コマンドのチェック
check_requirements() {
    log_info "必須コマンドの確認中..."

    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLIがインストールされていません。"
        log_error "インストールガイド: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi

    log_info "gcloud CLI: $(gcloud --version | head -n 1)"
}

# 設定変数
PROJECT_ID="${GCP_PROJECT_ID}"
REGION="${GCP_REGION:-asia-northeast1}"

# 必要なAPIの有効化
enable_apis() {
    log_info "必要なAPIを有効化中..."

    APIS=(
        "run.googleapis.com"
        "artifactregistry.googleapis.com"
        "secretmanager.googleapis.com"
        "cloudbuild.googleapis.com"
    )

    for api in "${APIS[@]}"; do
        log_info "有効化中: $api"
        gcloud services enable $api --project=$PROJECT_ID
    done

    log_info "すべてのAPIが有効化されました。"
}

# Secret Managerの設定
setup_secrets() {
    log_info "Secret Managerの設定を開始します..."

    # Anthropic API Key
    if gcloud secrets describe anthropic-api-key --project=$PROJECT_ID &> /dev/null; then
        log_warn "シークレット 'anthropic-api-key' は既に存在します。"
        read -p "更新しますか？ (y/n): " update_secret

        if [[ $update_secret =~ ^[Yy]$ ]]; then
            read -s -p "Anthropic API Keyを入力してください: " ANTHROPIC_KEY
            echo
            echo -n "$ANTHROPIC_KEY" | gcloud secrets versions add anthropic-api-key \
                --data-file=- \
                --project=$PROJECT_ID
            log_info "シークレット 'anthropic-api-key' を更新しました。"
        fi
    else
        read -s -p "Anthropic API Keyを入力してください: " ANTHROPIC_KEY
        echo
        echo -n "$ANTHROPIC_KEY" | gcloud secrets create anthropic-api-key \
            --replication-policy="automatic" \
            --data-file=- \
            --project=$PROJECT_ID
        log_info "シークレット 'anthropic-api-key' を作成しました。"
    fi

    # MongoDB URI
    if gcloud secrets describe mongodb-uri --project=$PROJECT_ID &> /dev/null; then
        log_warn "シークレット 'mongodb-uri' は既に存在します。"
        read -p "更新しますか？ (y/n): " update_mongo

        if [[ $update_mongo =~ ^[Yy]$ ]]; then
            read -s -p "MongoDB接続文字列を入力してください: " MONGO_URI
            echo
            echo -n "$MONGO_URI" | gcloud secrets versions add mongodb-uri \
                --data-file=- \
                --project=$PROJECT_ID
            log_info "シークレット 'mongodb-uri' を更新しました。"
        fi
    else
        read -s -p "MongoDB接続文字列を入力してください: " MONGO_URI
        echo
        echo -n "$MONGO_URI" | gcloud secrets create mongodb-uri \
            --replication-policy="automatic" \
            --data-file=- \
            --project=$PROJECT_ID
        log_info "シークレット 'mongodb-uri' を作成しました。"
    fi
}

# IAMポリシーの設定
setup_iam() {
    log_info "IAMポリシーを設定中..."

    # プロジェクト番号を取得
    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
    COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

    log_info "Compute Service Account: $COMPUTE_SA"

    # Secret Accessorロールを付与
    gcloud secrets add-iam-policy-binding anthropic-api-key \
        --member="serviceAccount:${COMPUTE_SA}" \
        --role="roles/secretmanager.secretAccessor" \
        --project=$PROJECT_ID

    gcloud secrets add-iam-policy-binding mongodb-uri \
        --member="serviceAccount:${COMPUTE_SA}" \
        --role="roles/secretmanager.secretAccessor" \
        --project=$PROJECT_ID

    log_info "IAMポリシーを設定しました。"
}

# Artifact Registryリポジトリの作成
setup_artifact_registry() {
    log_info "Artifact Registryリポジトリを確認中..."

    REPO_NAME="cloud-run-apps"

    if gcloud artifacts repositories describe $REPO_NAME \
        --location=$REGION \
        --project=$PROJECT_ID &> /dev/null; then
        log_info "リポジトリ '$REPO_NAME' は既に存在します。"
    else
        log_info "リポジトリ '$REPO_NAME' を作成中..."
        gcloud artifacts repositories create $REPO_NAME \
            --repository-format=docker \
            --location=$REGION \
            --description="Cloud Run applications repository" \
            --project=$PROJECT_ID
        log_info "リポジトリ '$REPO_NAME' を作成しました。"
    fi
}

# 設定の確認
verify_setup() {
    log_info "設定の確認中..."

    echo ""
    echo "========================================="
    echo "セットアップ完了"
    echo "========================================="
    echo "プロジェクトID: $PROJECT_ID"
    echo "リージョン: $REGION"
    echo ""

    log_info "有効化されたAPI:"
    gcloud services list --enabled --project=$PROJECT_ID | grep -E "run|artifact|secret|build" || true

    echo ""
    log_info "作成されたシークレット:"
    gcloud secrets list --project=$PROJECT_ID

    echo ""
    log_info "Artifact Registryリポジトリ:"
    gcloud artifacts repositories list --location=$REGION --project=$PROJECT_ID

    echo ""
    echo "========================================="
    echo "次のステップ:"
    echo "1. MongoDB Atlasのネットワークアクセスを設定"
    echo "2. docs/gcp-setup-guide.md を参照"
    echo "3. scripts/deploy-to-cloudrun.sh でデプロイ"
    echo "========================================="
}

# メイン処理
main() {
    log_info "GCPセットアップスクリプトを開始します..."
    log_info "プロジェクト: $PROJECT_ID"
    log_info "リージョン: $REGION"
    echo ""

    check_requirements
    gcloud config set project $PROJECT_ID
    enable_apis
    setup_secrets
    setup_iam
    setup_artifact_registry
    verify_setup

    log_info "セットアップが完了しました！"
}

# スクリプト実行
main
