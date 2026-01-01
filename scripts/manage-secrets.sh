#!/bin/bash

# Secret Manager 管理スクリプト
# シークレットの表示、更新、削除を行います。

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

# 設定変数
PROJECT_ID="${GCP_PROJECT_ID}"

# シークレット一覧の表示
list_secrets() {
    log_info "シークレット一覧:"
    echo ""
    gcloud secrets list --project=$PROJECT_ID
}

# シークレットの詳細表示
describe_secret() {
    local secret_name=$1

    if [ -z "$secret_name" ]; then
        log_error "シークレット名を指定してください。"
        return 1
    fi

    log_info "シークレット '$secret_name' の詳細:"
    echo ""
    gcloud secrets describe $secret_name --project=$PROJECT_ID
}

# シークレットの値を表示（マスク付き）
show_secret_value() {
    local secret_name=$1

    if [ -z "$secret_name" ]; then
        log_error "シークレット名を指定してください。"
        return 1
    fi

    log_warn "シークレットの値を表示します。機密情報のため取扱注意！"
    read -p "続行しますか？ (y/n): " confirm

    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        log_info "キャンセルしました。"
        return 0
    fi

    echo ""
    log_info "シークレット '$secret_name' の値:"
    gcloud secrets versions access latest --secret=$secret_name --project=$PROJECT_ID
    echo ""
}

# シークレットの更新
update_secret() {
    local secret_name=$1

    if [ -z "$secret_name" ]; then
        log_error "シークレット名を指定してください。"
        return 1
    fi

    if ! gcloud secrets describe $secret_name --project=$PROJECT_ID &> /dev/null; then
        log_error "シークレット '$secret_name' は存在しません。"
        return 1
    fi

    log_info "シークレット '$secret_name' を更新します。"
    read -s -p "新しい値を入力してください: " new_value
    echo

    if [ -z "$new_value" ]; then
        log_error "値が空です。キャンセルしました。"
        return 1
    fi

    echo -n "$new_value" | gcloud secrets versions add $secret_name \
        --data-file=- \
        --project=$PROJECT_ID

    log_info "シークレット '$secret_name' を更新しました。"
}

# シークレットの作成
create_secret() {
    local secret_name=$1

    if [ -z "$secret_name" ]; then
        read -p "シークレット名を入力してください: " secret_name
    fi

    if gcloud secrets describe $secret_name --project=$PROJECT_ID &> /dev/null; then
        log_error "シークレット '$secret_name' は既に存在します。"
        log_info "更新する場合は update コマンドを使用してください。"
        return 1
    fi

    log_info "シークレット '$secret_name' を作成します。"
    read -s -p "値を入力してください: " secret_value
    echo

    if [ -z "$secret_value" ]; then
        log_error "値が空です。キャンセルしました。"
        return 1
    fi

    echo -n "$secret_value" | gcloud secrets create $secret_name \
        --replication-policy="automatic" \
        --data-file=- \
        --project=$PROJECT_ID

    log_info "シークレット '$secret_name' を作成しました。"

    # IAMポリシーの設定
    read -p "Compute Service Accountにアクセス権限を付与しますか？ (y/n): " grant_iam

    if [[ $grant_iam =~ ^[Yy]$ ]]; then
        PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
        COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

        gcloud secrets add-iam-policy-binding $secret_name \
            --member="serviceAccount:${COMPUTE_SA}" \
            --role="roles/secretmanager.secretAccessor" \
            --project=$PROJECT_ID

        log_info "IAMポリシーを設定しました。"
    fi
}

# シークレットの削除
delete_secret() {
    local secret_name=$1

    if [ -z "$secret_name" ]; then
        log_error "シークレット名を指定してください。"
        return 1
    fi

    if ! gcloud secrets describe $secret_name --project=$PROJECT_ID &> /dev/null; then
        log_error "シークレット '$secret_name' は存在しません。"
        return 1
    fi

    log_warn "シークレット '$secret_name' を削除します。この操作は元に戻せません！"
    read -p "本当に削除しますか？ (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "キャンセルしました。"
        return 0
    fi

    gcloud secrets delete $secret_name --project=$PROJECT_ID --quiet

    log_info "シークレット '$secret_name' を削除しました。"
}

# IAMポリシーの表示
show_iam_policy() {
    local secret_name=$1

    if [ -z "$secret_name" ]; then
        log_error "シークレット名を指定してください。"
        return 1
    fi

    log_info "シークレット '$secret_name' のIAMポリシー:"
    echo ""
    gcloud secrets get-iam-policy $secret_name --project=$PROJECT_ID
}

# ヘルプの表示
show_help() {
    echo "Secret Manager 管理スクリプト"
    echo ""
    echo "使用方法:"
    echo "  $0 <command> [arguments]"
    echo ""
    echo "コマンド:"
    echo -e "  ${BLUE}list${NC}                     - シークレット一覧を表示"
    echo -e "  ${BLUE}describe <name>${NC}          - シークレットの詳細を表示"
    echo -e "  ${BLUE}show <name>${NC}              - シークレットの値を表示（機密情報注意）"
    echo -e "  ${BLUE}create [name]${NC}            - 新しいシークレットを作成"
    echo -e "  ${BLUE}update <name>${NC}            - シークレットの値を更新"
    echo -e "  ${BLUE}delete <name>${NC}            - シークレットを削除"
    echo -e "  ${BLUE}iam <name>${NC}               - シークレットのIAMポリシーを表示"
    echo -e "  ${BLUE}help${NC}                     - このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0 list"
    echo "  $0 describe anthropic-api-key"
    echo "  $0 update mongodb-uri"
    echo "  $0 create my-new-secret"
    echo ""
}

# メイン処理
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    case "$1" in
        list)
            list_secrets
            ;;
        describe)
            describe_secret "$2"
            ;;
        show)
            show_secret_value "$2"
            ;;
        create)
            create_secret "$2"
            ;;
        update)
            update_secret "$2"
            ;;
        delete)
            delete_secret "$2"
            ;;
        iam)
            show_iam_policy "$2"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "不明なコマンド: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# スクリプト実行
main "$@"
