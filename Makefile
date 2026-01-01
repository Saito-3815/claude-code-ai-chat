# Makefile for claude-code-ai-chat
# Usage: make <command>
#   init   - 初期セットアップ（依存関係インストール、DB起動、Prisma設定）
#   dev    - 開発サーバー起動
#   build  - 本番ビルド
#   deploy - Cloud Runにデプロイ

# Variables
PROJECT_NAME := claude-code-ai-chat
DOCKER_IMAGE := $(PROJECT_NAME):latest

# Colors
GREEN := \033[0;32m
YELLOW := \033[0;33m
CYAN := \033[0;36m
NC := \033[0m

.PHONY: init dev build deploy help clean

.DEFAULT_GOAL := help

# ========================================
# Main Commands
# ========================================

init: ## 初期セットアップ（npm install + DB起動 + Prisma設定）
	@echo "$(GREEN)=== 初期セットアップを開始します ===$(NC)"
	@echo "$(CYAN)[1/4] 依存パッケージをインストール中...$(NC)"
	@npm install
	@echo "$(CYAN)[2/4] MongoDBコンテナを起動中...$(NC)"
	@docker-compose up -d
	@echo "$(CYAN)[3/4] Prisma Clientを生成中...$(NC)"
	@npx prisma generate
	@echo "$(CYAN)[4/4] 環境変数を確認中...$(NC)"
	@if [ ! -f .env.local ]; then \
		echo "$(YELLOW)⚠ .env.localが見つかりません。.env.exampleをコピーして設定してください$(NC)"; \
	else \
		echo "$(GREEN)✓ .env.localが存在します$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)✓ 初期セットアップが完了しました！$(NC)"
	@echo "$(YELLOW)次のステップ:$(NC)"
	@echo "  1. .env.localファイルを編集して環境変数を設定"
	@echo "  2. make dev を実行して開発サーバーを起動"

dev: ## 開発サーバー起動（MongoDB自動起動 + Next.js dev server）
	@echo "$(GREEN)=== 開発サーバーを起動します ===$(NC)"
	@echo "$(CYAN)MongoDBの状態を確認中...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ MongoDB起動完了$(NC)"
	@echo "$(CYAN)Next.js開発サーバーを起動中...$(NC)"
	@npm run dev

build: ## 本番ビルド（Next.js build + Docker image作成）
	@echo "$(GREEN)=== 本番ビルドを開始します ===$(NC)"
	@echo "$(CYAN)[1/2] Next.jsアプリケーションをビルド中...$(NC)"
	@npm run build
	@echo "$(CYAN)[2/2] Dockerイメージを作成中...$(NC)"
	@docker build -t $(DOCKER_IMAGE) .
	@echo ""
	@echo "$(GREEN)✓ ビルドが完了しました！$(NC)"
	@echo "$(YELLOW)確認方法:$(NC)"
	@echo "  ローカルで実行: docker run -p 3000:3000 --env-file .env.local $(DOCKER_IMAGE)"

deploy: ## Cloud Runにデプロイ（GCPセットアップ + Secrets設定 + デプロイ）
	@echo "$(GREEN)=== Cloud Runへのデプロイを開始します ===$(NC)"
	@export $$(cat .env.local | grep -v '^#' | xargs) && \
		gcloud config set project $$GCP_PROJECT_ID && \
		gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project=$$GCP_PROJECT_ID && \
		./scripts/deploy-to-cloudrun.sh
	@echo "$(GREEN)✓ デプロイが完了しました！$(NC)"

# ========================================
# Helper Commands
# ========================================

help: ## ヘルプを表示
	@echo "$(CYAN)claude-code-ai-chat - Makefile コマンド一覧$(NC)"
	@echo ""
	@echo "$(GREEN)メインコマンド:$(NC)"
	@echo "  $(CYAN)make init$(NC)   - 初期セットアップ（最初に1回実行）"
	@echo "  $(CYAN)make dev$(NC)    - 開発サーバー起動"
	@echo "  $(CYAN)make build$(NC)  - 本番ビルド"
	@echo "  $(CYAN)make deploy$(NC) - Cloud Runにデプロイ"
	@echo ""
	@echo "$(GREEN)その他のコマンド:$(NC)"
	@echo "  $(CYAN)make clean$(NC)  - ビルド成果物とnode_modulesを削除"
	@echo "  $(CYAN)make logs$(NC)   - MongoDBのログを表示"
	@echo "  $(CYAN)make stop$(NC)   - MongoDBコンテナを停止"
	@echo ""
	@echo "$(YELLOW)使用例:$(NC)"
	@echo "  1. make init      # 初回セットアップ"
	@echo "  2. make dev       # 開発開始"
	@echo "  3. make build     # 本番ビルド"
	@echo "  4. make deploy    # 本番環境にデプロイ"

clean: ## クリーンアップ（ビルド成果物削除）
	@echo "$(YELLOW)クリーンアップ中...$(NC)"
	@rm -rf .next
	@rm -rf node_modules
	@rm -rf .turbo
	@docker-compose down -v
	@echo "$(GREEN)✓ クリーンアップ完了$(NC)"

stop: ## MongoDBコンテナを停止
	@echo "$(YELLOW)MongoDBを停止中...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ MongoDB停止完了$(NC)"

logs: ## MongoDBのログを表示
	@docker-compose logs -f
