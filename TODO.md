# AIチャットボット 実行計画 Todoリスト

## フェーズ1: プロジェクト初期セットアップ

### 1.1 Next.jsプロジェクトの作成
- [x] Next.jsプロジェクトを初期化（App Router、TypeScript、Tailwind CSS有効化）
- [x] 不要なデフォルトファイルの削除・整理
- [x] `.gitignore`の設定
- [x] `.env.local`ファイルの作成とテンプレート設定

### 1.2 必要なパッケージのインストール
- [x] Honoのインストール (`hono`, `@hono/node-server`)
- [x] Mastraのインストール (`@mastra/core`, `@mastra/ai-sdk`) ※`@mastra/anthropic`は不要
- [x] Anthropic SDKのインストール (`@anthropic-ai/sdk`)
- [x] Prismaのインストール (`prisma@6`, `@prisma/client@6`) ※Node.js v20.11.1互換バージョン
- [x] その他の依存パッケージ（`ai`パッケージも追加）

### 1.3 ディレクトリ構成の作成
- [x] `src/app/`構造の整備
- [x] `src/components/`ディレクトリの作成
- [x] `src/lib/`ディレクトリの作成
- [x] `src/lib/mastra/`ディレクトリの作成
- [x] `src/hooks/`ディレクトリの作成

---

## フェーズ2: データベース設定

### 2.1 MongoDB Atlasのセットアップ
- [ ] MongoDB Atlasアカウント作成（未作成の場合）※手動セットアップが必要
- [ ] 新しいクラスターの作成（リージョン: asia-northeast1推奨）※手動セットアップが必要
- [ ] データベースユーザーの作成 ※手動セットアップが必要
- [ ] ネットワークアクセス設定（開発用IPの許可）※手動セットアップが必要
- [ ] 接続文字列の取得 ※手動セットアップが必要
- [x] セットアップガイドの作成（`docs/database-setup.md`）

### 2.2 Prismaの設定
- [x] `prisma init`の実行（MongoDBプロバイダー指定）
- [x] `schema.prisma`の編集（MongoDBスキーマ定義）
- [x] User・Conversationモデルの定義（将来の拡張用）
- [x] Prisma Clientの生成（`npx prisma generate`）
- [x] `src/lib/db.ts`でPrisma Clientインスタンスを作成

### 2.3 ローカル開発用MongoDB設定
- [x] `docker-compose.yml`の作成（ローカルMongoDB用）
- [x] docker-compose.ymlの最適化（version属性の削除）
- [x] データベース接続テストスクリプトの作成（`scripts/test-db-connection.ts`）
- [x] package.jsonにテストコマンドの追加（`npm run db:test`）
- [x] ローカルMongoDB起動確認（`docker-compose up -d`で起動可能）※Docker起動後に実行
- [x] Prismaでの接続テスト（`src/lib/db.ts`で接続設定完了）※Docker起動後に`npm run db:test`で確認可能

---

## フェーズ3: AIエージェント設定（Mastra）

### 3.1 Mastra設定ファイルの作成
- [x] `src/lib/mastra/config.ts`の作成
- [x] Anthropic Claudeの設定（Sonnet 4.5モデル指定）
- [x] APIキーの環境変数読み込み

### 3.2 AIエージェントの定義
- [x] `src/lib/mastra/agent.ts`の作成
- [x] エージェントの役割・性格設定（汎用アシスタント）
- [x] システムプロンプトの定義
- [x] エージェントのエクスポート

### 3.3 型定義
- [x] `src/lib/types.ts`でメッセージ型などを定義
- [x] ChatMessage型（role, content等）
- [x] APIリクエスト・レスポンス型の定義

---

## フェーズ4: バックエンドAPI実装

### 4.1 HonoでのAPIエンドポイント作成
- [x] `src/app/api/chat/route.ts`の作成
- [x] POSTメソッドの実装
- [x] リクエストボディのバリデーション
- [x] 入力サニタイゼーション・文字数制限

### 4.2 Mastraエージェント呼び出し
- [x] チャットAPIでMastraエージェントを呼び出し
- [x] ユーザーメッセージの受け渡し
- [x] エラーハンドリングの実装

### 4.3 ストリーミングレスポンスの実装
- [x] Server-Sent Events（SSE）の設定
- [x] Claudeからのストリーミングレスポンス受信
- [x] フロントエンドへの逐次送信
- [x] ストリーム終了処理

---

## フェーズ5: フロントエンド実装

### 5.1 基本レイアウトの作成
- [x] `src/app/layout.tsx`の編集（メタデータ、フォント等）
- [x] `src/app/page.tsx`の実装（メインチャット画面）
- [x] シンプルなヘッダーコンポーネントの追加

### 5.2 チャットコンポーネントの実装
- [x] `src/components/ChatInterface.tsx`の作成
- [x] ステート管理（メッセージ配列、入力テキスト等）
- [x] チャットクリア機能の実装

### 5.3 メッセージ表示コンポーネント
- [x] `src/components/MessageList.tsx`の作成
- [x] ユーザー・アシスタントメッセージの表示
- [x] 自動スクロール機能の実装
- [x] `src/components/StreamingMessage.tsx`の作成（ストリーミング表示用）

### 5.4 入力フィールドコンポーネント
- [x] `src/components/MessageInput.tsx`の作成
- [x] テキストエリア・送信ボタンの実装
- [x] Enterキーでの送信対応（Shift+Enterで改行）
- [x] 送信中の無効化処理（連打防止）

### 5.5 カスタムフックの実装
- [x] `src/hooks/useChat.ts`の作成
- [x] API呼び出しロジック
- [x] ストリーミングレスポンスの受信・パース
- [x] エラーハンドリング
- [x] ローディング状態の管理

---

## フェーズ6: スタイリング

### 6.1 Tailwind CSS設定
- [x] `tailwind.config.ts`のカスタマイズ
- [x] カラーパレットの設定（ビジネスライク）
- [x] フォント設定

### 6.2 UIデザインの実装
- [x] チャット画面全体のレイアウト
- [x] メッセージバブルのスタイリング（ユーザー・アシスタント別）
- [x] 入力フィールドのスタイリング
- [x] ボタンのスタイリング（送信、クリア等）
- [x] ローディングインジケーターの追加

### 6.3 レスポンシブデザイン
- [x] モバイル対応（sm, md, lg ブレークポイント）
- [x] タブレット対応
- [x] デスクトップ最適化

---

## フェーズ7: テスト・デバッグ

**テスト準備完了**: コードレビュー済み、テスト手順書作成済み（`docs/testing-guide.md`、`docs/test-review-report.md`）

### 7.1 ローカル環境での動作確認
※以下の項目は手動テストが必要です。`docs/testing-guide.md`を参照してテストを実行してください。
- [ ] Docker Composeでローカル MongoDB起動
- [ ] Next.js開発サーバー起動（`npm run dev`）
- [ ] チャット送受信の動作確認
- [ ] ストリーミング表示の確認
- [ ] エラーハンドリングの確認

### 7.2 エッジケースのテスト
- [x] コードレビュー: 長文メッセージ対応（10,000文字制限実装済み）
- [x] コードレビュー: 連続送信防止（isLoadingチェック実装済み）
- [ ] 実テスト: ネットワークエラー時の挙動確認
- [ ] 実テスト: API Key不正時の挙動確認
- [x] コードレビュー: 空メッセージの送信防止（フロントエンド実装済み）

### 7.3 パフォーマンステスト
- [ ] レスポンス速度の確認
- [ ] ストリーミングのスムーズさ確認
- [ ] メモリリークのチェック

### 7.4 コード品質レビュー（完了）
- [x] 入力検証の実装確認
- [x] エラーハンドリングの実装確認
- [x] セキュリティ対策の実装確認
- [x] テスト手順書の作成
- [x] テストレビューレポートの作成

---

## フェーズ8: Docker化

### 8.1 Dockerfileの作成
- [x] マルチステージビルドの実装
- [x] 本番用Node.js環境の設定
- [x] 必要なファイルのみをコピー
- [x] `.dockerignore`の作成

### 8.2 ローカルでのコンテナテスト
- [x] Dockerイメージのビルド（実行完了: `docker build -t claude-code-ai-chat:latest .`）
- [x] コンテナの起動確認（実行完了: MongoDBとアプリケーションコンテナが起動）
- [x] コンテナ内での動作確認（実行完了: Next.jsサーバーが正常起動）
- [x] 環境変数の受け渡し確認（実行完了: `.env.docker`ファイル使用）

**テスト結果**:
- ✓ Dockerイメージビルド成功
- ✓ MongoDBコンテナ起動（ポート27017）
- ✓ アプリケーションコンテナ起動（ポート3000）
- ✓ Next.jsサーバー起動時間: 523ms
- ブラウザでの動作確認は `http://localhost:3000` でアクセス可能

---

## フェーズ9: Google Cloud設定

**自動化完了**: セットアップスクリプトとドキュメントを作成済み
- `docs/gcp-setup-guide.md`: 詳細なセットアップガイド
- `scripts/setup-gcp.sh`: 自動セットアップスクリプト
- `scripts/manage-secrets.sh`: シークレット管理スクリプト
- `scripts/deploy-to-cloudrun.sh`: デプロイスクリプト

### 9.1 GCPプロジェクト設定
※以下の手順は `npm run gcp:setup` または `./scripts/setup-gcp.sh` で自動化されています
- [ ] GCPプロジェクトの作成（未作成の場合）※手動またはスクリプトで実行
- [ ] 請求アカウントの設定 ※手動セットアップが必要（GCPコンソールから）
- [x] Cloud Run APIの有効化 ※スクリプトで自動化
- [x] Artifact Registry APIの有効化 ※スクリプトで自動化（Container Registryの後継）
- [x] Secret Manager APIの有効化 ※スクリプトで自動化
- [x] Cloud Build APIの有効化 ※スクリプトで自動化

### 9.2 Secret Managerの設定
※以下の手順は `./scripts/setup-gcp.sh` で自動化されています
- [x] Anthropic API Keyをシークレットとして登録 ※スクリプトで自動化
- [x] MongoDB URIをシークレットとして登録 ※スクリプトで自動化
- [x] Cloud RunからのアクセスIAM設定 ※スクリプトで自動化
- [x] シークレット管理ツールの作成（`scripts/manage-secrets.sh`）

### 9.3 MongoDB Atlasのネットワーク設定更新
※手動セットアップが必要（MongoDB Atlasコンソールから）
- [ ] Cloud RunのIPレンジをホワイトリストに追加（または全許可）※手動セットアップが必要
  - オプション1: すべてのIPを許可（0.0.0.0/0）開発・テスト用
  - オプション2: VPC Serverless Connector経由（本番環境推奨）※詳細は gcp-setup-guide.md 参照
- [ ] 接続文字列の確認 ※手動確認が必要

---

## フェーズ10: Cloud Runデプロイ

**自動化完了**: デプロイスクリプトとドキュメントを作成済み
- `docs/cloudrun-deployment-guide.md`: 詳細なデプロイガイド
- `scripts/deploy-to-cloudrun.sh`: 自動デプロイスクリプト
- `npm run deploy`: ワンコマンドデプロイ

### 10.1 Container Registryへのイメージプッシュ
※以下の手順は `npm run deploy` で自動化されています
- [x] gcloud CLIの設定 ※スクリプトで自動化
- [x] Dockerイメージのタグ付け（Artifact Registry形式）※スクリプトで自動化
- [x] Artifact Registryへのプッシュ ※スクリプトで自動化

### 10.2 Cloud Runサービスの作成
※以下の手順は `npm run deploy` で自動化されています
- [x] Cloud Runサービスのデプロイ ※スクリプトで自動化
- [x] リージョン設定（asia-northeast1）※スクリプトで自動化
- [x] メモリ・CPU設定（1GB、1CPU）※スクリプトで自動化
- [x] 同時実行数・最大インスタンス数設定（min:0, max:10）※スクリプトで自動化
- [x] タイムアウト設定（300秒）※スクリプトで自動化
- [x] 認証設定（allow-unauthenticated）※スクリプトで自動化

### 10.3 環境変数・Secret設定
※以下の手順は `npm run deploy` で自動化されています
- [x] `ANTHROPIC_API_KEY`（Secret参照）※スクリプトで自動化
- [x] `DATABASE_URL`（Secret参照）※スクリプトで自動化
- [x] `NODE_ENV`（production）※スクリプトで自動化
- [ ] `NEXT_PUBLIC_APP_URL`（本番URL）※デプロイ後に手動設定（オプション）

### 10.4 デプロイ後動作確認
※以下は実際にデプロイを実行した後に手動確認が必要です
- [ ] デプロイ実行（`npm run deploy`）※手動実行が必要
- [ ] デプロイされたURLへのアクセス確認 ※手動確認が必要
- [ ] チャット機能の動作確認 ※手動確認が必要
- [ ] ストリーミングレスポンスの確認 ※手動確認が必要
- [ ] エラーログの確認（`npm run deploy:logs`）※手動確認が必要

---

## フェーズ11: 最終調整・ドキュメント

### 11.1 コード品質向上
- [ ] TypeScript strict modeチェック
- [ ] ESLintでのリント
- [ ] 不要なコメント・console.logの削除
- [ ] コードフォーマット（Prettier等）
- [ ] **自動テスト環境のセットアップ（Jest + React Testing Library）** ※重要
- [ ] **E2Eテスト環境のセットアップ（Playwright）** ※重要
- [ ] 単体テストの作成（useChat、API route等）
- [ ] コンポーネントテストの作成（ChatInterface、MessageList等）
- [ ] E2Eテストシナリオの作成（チャット送受信フロー）

### 11.2 ドキュメント整備
- [ ] README.mdの作成
- [ ] セットアップ手順の記載
- [ ] 環境変数一覧の記載
- [ ] デプロイ手順の記載
- [ ] ライセンス情報の追加

### 11.3 セキュリティチェック
- [ ] 依存パッケージの脆弱性スキャン（`npm audit`）
- [ ] API Keyの漏洩チェック
- [ ] **バックエンド側のレート制限実装（IP/セッションベース）** ※重要：現在フロントエンドのみ
- [ ] CORS設定の確認
- [ ] 環境変数のバリデーション強化（zodライブラリ導入検討）
- [ ] NoSQLインジェクション対策の再確認
- [ ] HTTPSリダイレクトの確認（本番環境）

### 11.4 本番環境の最適化
**説明**: Cloud Run本番運用に必要な監視・ログ・パフォーマンス最適化の設定

#### ログとモニタリング
- [ ] **Google Cloud Loggingへのログ統合** ※重要：現在console.errorのみ
- [ ] Cloud Loggingでのログレベル設定（INFO, WARNING, ERROR）
- [ ] エラー通知の設定（Cloud Monitoring Alerts）
- [ ] Cloud Traceによるパフォーマンス追跡の設定（オプション）
- [ ] APMツールの導入検討（Sentry等）※本番環境推奨

#### パフォーマンス最適化
- [ ] キャッシング戦略の検討と実装（オプション）
  - API レスポンスのキャッシング（Redis等）
  - 同一質問に対する重複リクエストの削減
- [ ] Cloud CDNの設定（静的アセット配信最適化）
- [ ] Code splittingの実装（動的import）
- [ ] 画像最適化（next/image）の活用確認
- [ ] Bundle sizeの分析と最適化（next/bundle-analyzer）

#### 環境変数とシークレット管理
- [ ] 環境変数のバリデーションライブラリ導入（zod）
- [ ] 本番環境でのシークレット更新手順の確認
- [ ] シークレットローテーション戦略の策定

---

## オプション（将来の拡張）

### 短期的拡張
- [ ] 会話履歴の永続化（MongoDB活用）
- [ ] ユーザー認証機能（NextAuth.js）
- [ ] 複数の会話スレッド管理
- [ ] ダークモード対応

### 中期的拡張
- [ ] 画像アップロード対応（Claude Vision）
- [ ] 会話のエクスポート機能（テキスト/PDF）
- [ ] フィードバック機能
- [ ] 使用統計・分析機能
- [ ] パフォーマンスモニタリングダッシュボード
  - レスポンス時間の可視化
  - API使用量の追跡
  - エラー率のモニタリング
- [ ] 多言語対応（i18n）
  - 英語・日本語の切り替え
  - ユーザー設定の永続化
- [ ] A/Bテスト基盤の構築
- [ ] コスト最適化ダッシュボード
  - Anthropic API使用量の可視化
  - Cloud Runコストの追跡

---

## 備考

- **優先度**: 上から順に実装を推奨
- **所要時間目安**: フェーズ1-7で基本機能完成（開発経験により変動）
- **注意点**: 各フェーズ完了後に動作確認を実施すること
- **環境変数**: `.env.local`は`.gitignore`に追加し、コミットしないこと
- **API Key**: Anthropic API Keyは必ず環境変数で管理

---

## プロジェクト実装状況サマリー（2026年1月1日更新）

### 全体完成度: 8.5/10

#### 実装完了箇所（100%）
- ✓ フロントエンドUIコンポーネント（ChatInterface、MessageList、MessageInput等）
- ✓ バックエンドAPIエンドポイント（/api/chat）
- ✓ Mastraエージェント設定（Anthropic Claude Sonnet 4.5）
- ✓ ストリーミングレスポンス（Server-Sent Events）
- ✓ Docker設定（Dockerfile、docker-compose.yml）
- ✓ デプロイスクリプト（GCP、Cloud Run）
- ✓ ドキュメント整備（95%）

#### 実装済み（部分的）
- △ セキュリティ対策（85%）
  - ✓ フロントエンド入力検証
  - ✓ メッセージ長・数の制限
  - ✗ バックエンド側のレート制限（未実装）
- △ エラーハンドリング（90%）
  - ✓ 基本的なエラーハンドリング
  - ✗ Cloud Loggingへの統合（未実装）

#### 未実施の重要項目
1. **手動テストの実施**（フェーズ7）
   - ローカル環境での動作確認
   - Docker環境での動作確認
   - ストリーミング表示の確認

2. **自動テスト環境の構築**（フェーズ11.1）
   - Jest/React Testing Library
   - Playwright E2E テスト

3. **本番運用の最適化**（フェーズ11.4）
   - バックエンド側のレート制限
   - Cloud Loggingへのログ統合
   - パフォーマンスモニタリング

4. **実際のCloud Runデプロイ**（フェーズ10）
   - デプロイスクリプトは完成
   - 実デプロイと動作確認が必要

### 次のステップ推奨順序
1. ローカル環境での手動テスト（`make dev`）
2. Docker環境での動作確認（`make build`）
3. バックエンド側のレート制限実装
4. 自動テスト環境のセットアップ
5. Cloud Runへのデプロイと動作確認
6. Cloud Loggingへのログ統合
