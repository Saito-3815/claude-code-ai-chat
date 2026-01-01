#!/bin/bash

# Cloud Run デプロイスクリプト
# Dockerイメージをビルドし、Artifact Registryにプッシュして、Cloud Runにデプロイします。

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}==== $1 ====${NC}"
}

# 設定変数
SERVICE_NAME="ai-chatbot"
REPO_NAME="cloud-run-apps"
IMAGE_NAME="ai-chatbot"
PROJECT_ID="${GCP_PROJECT_ID}"
REGION="${GCP_REGION:-asia-northeast1}"

# Docker設定の確認
check_docker() {
    log_info "Docker環境を確認中..."

    if ! command -v docker &> /dev/null; then
        log_error "Dockerがインストールされていません。"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Dockerデーモンが起動していません。"
        exit 1
    fi

    log_info "Docker: $(docker --version)"
}

# Artifact Registryの認証設定
configure_docker_auth() {
    log_info "Artifact Registryの認証を設定中..."
    gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
    log_info "認証設定が完了しました。"
}

# Dockerイメージのビルド
build_image() {
    log_step "Dockerイメージをビルド中"

    IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"
    BUILD_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:build-$(date +%Y%m%d-%H%M%S)"

    log_info "イメージタグ: $IMAGE_TAG"
    log_info "ビルドタグ: $BUILD_TAG"

    # ビルド実行
    docker build -t $IMAGE_TAG -t $BUILD_TAG .

    log_info "ビルドが完了しました。"
}

# Artifact Registryにプッシュ
push_image() {
    log_step "Artifact Registryにプッシュ中"

    docker push $IMAGE_TAG
    docker push $BUILD_TAG

    log_info "プッシュが完了しました。"
}

# Cloud Runにデプロイ
deploy_to_cloudrun() {
    log_step "Cloud Runにデプロイ中"

    # プロジェクト番号を取得（Secret参照用）
    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

    log_info "サービス名: $SERVICE_NAME"
    log_info "リージョン: $REGION"

    # Cloud Runにデプロイ
    gcloud run deploy $SERVICE_NAME \
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
        --project=$PROJECT_ID

    log_info "デプロイが完了しました。"
}

# デプロイ後の設定
post_deploy() {
    log_step "デプロイ後の設定"

    # サービスURLを取得
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format='value(status.url)')

    log_info "サービスURL: $SERVICE_URL"

    # NEXT_PUBLIC_APP_URLを更新（必要に応じて）
    log_warn "環境変数 NEXT_PUBLIC_APP_URL を設定する場合は、以下のコマンドを実行してください:"
    echo ""
    echo "gcloud run services update $SERVICE_NAME \\"
    echo "  --region=$REGION \\"
    echo "  --update-env-vars=\"NEXT_PUBLIC_APP_URL=$SERVICE_URL\" \\"
    echo "  --project=$PROJECT_ID"
    echo ""
}

# デプロイ情報の表示
show_deployment_info() {
    log_step "デプロイ情報"

    # サービスの詳細を取得
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format='value(status.url)')

    echo ""
    echo "========================================="
    echo "デプロイ完了"
    echo "========================================="
    echo "サービス名: $SERVICE_NAME"
    echo "リージョン: $REGION"
    echo "サービスURL: $SERVICE_URL"
    echo ""
    echo "次のステップ:"
    echo "1. ブラウザで $SERVICE_URL にアクセス"
    echo "2. チャット機能の動作を確認"
    echo "3. ログを確認: gcloud run logs read $SERVICE_NAME --region=$REGION"
    echo "========================================="
    echo ""
}

# ログの確認
show_logs() {
    log_info "最新のログを表示します..."
    gcloud run logs read $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --limit=50
}

# クリーンアップ（古いイメージの削除）
cleanup_old_images() {
    log_step "古いイメージのクリーンアップ"

    log_info "古いビルドイメージを削除中..."

    # 古いビルドタグのイメージを削除（最新5つを残す）
    gcloud artifacts docker images list \
        ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME} \
        --project=$PROJECT_ID \
        --format="get(version)" \
        --filter="tags:build-*" \
        --sort-by="~CREATE_TIME" \
        --limit=100 | tail -n +6 | while read -r version; do
            if [ -n "$version" ]; then
                IMAGE_TO_DELETE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}@${version}"
                log_info "削除中: $IMAGE_TO_DELETE"
                gcloud artifacts docker images delete $IMAGE_TO_DELETE \
                    --project=$PROJECT_ID \
                    --quiet || true
            fi
        done

    log_info "クリーンアップが完了しました。"
}

# メイン処理
main() {
    local skip_build=false
    local skip_push=false
    local only_logs=false
    local cleanup=false

    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-push)
                skip_push=true
                shift
                ;;
            --logs)
                only_logs=true
                shift
                ;;
            --cleanup)
                cleanup=true
                shift
                ;;
            --help|-h)
                echo "Cloud Run デプロイスクリプト"
                echo ""
                echo "使用方法: $0 [options]"
                echo ""
                echo "オプション:"
                echo "  --skip-build    ビルドをスキップ（既存イメージを使用）"
                echo "  --skip-push     プッシュをスキップ（ローカルビルドのみ）"
                echo "  --logs          ログのみ表示"
                echo "  --cleanup       古いイメージを削除"
                echo "  --help, -h      このヘルプを表示"
                echo ""
                exit 0
                ;;
            *)
                log_error "不明なオプション: $1"
                exit 1
                ;;
        esac
    done

    log_info "Cloud Runデプロイスクリプトを開始します..."
    log_info "プロジェクト: $PROJECT_ID"
    log_info "リージョン: $REGION"
    echo ""

    if [ "$only_logs" = true ]; then
        show_logs
        exit 0
    fi

    if [ "$cleanup" = true ]; then
        cleanup_old_images
        exit 0
    fi

    check_docker
    configure_docker_auth

    if [ "$skip_build" = false ]; then
        build_image
    else
        log_warn "ビルドをスキップしました。"
    fi

    if [ "$skip_push" = false ]; then
        push_image
    else
        log_warn "プッシュをスキップしました。"
    fi

    deploy_to_cloudrun
    post_deploy
    show_deployment_info

    log_info "すべての処理が完了しました！"
}

# スクリプト実行
main "$@"
