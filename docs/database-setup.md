# データベースセットアップガイド

## ローカル開発環境（Docker Compose）

### 前提条件
- Docker Desktop がインストールされていること
- Docker Desktop が起動していること

### セットアップ手順

1. **Dockerの起動確認**
   ```bash
   docker --version
   docker ps
   ```

2. **MongoDBコンテナの起動**
   ```bash
   docker-compose up -d
   ```

3. **コンテナの起動確認**
   ```bash
   docker ps
   ```
   `claude-code-ai-chat-mongodb` という名前のコンテナが起動していることを確認してください。

4. **データベース接続テスト**
   ```bash
   npm run db:test
   ```
   成功すると以下のようなメッセージが表示されます：
   ```
   Testing database connection...
   ✓ Successfully connected to MongoDB
   ✓ Database query successful. Current user count: 0
   ✓ All database tests passed!
   ```

5. **Prisma Studioの起動（オプション）**
   ```bash
   npm run db:studio
   ```
   ブラウザで http://localhost:5555 にアクセスすると、データベースの内容を視覚的に確認できます。

### MongoDBコンテナの管理

#### コンテナの停止
```bash
docker-compose stop
```

#### コンテナの削除（データは保持）
```bash
docker-compose down
```

#### コンテナとデータの完全削除
```bash
docker-compose down -v
```

#### ログの確認
```bash
docker-compose logs mongodb
```

### 接続情報

- **ホスト**: localhost
- **ポート**: 27017
- **ユーザー名**: admin
- **パスワード**: password
- **データベース**: chatbot
- **接続文字列**: `mongodb://admin:password@localhost:27017/chatbot?authSource=admin`

## 本番環境（MongoDB Atlas）

### セットアップ手順

1. **MongoDB Atlasアカウントの作成**
   - https://www.mongodb.com/cloud/atlas にアクセス
   - アカウントを作成（無料プランあり）

2. **新しいクラスターの作成**
   - クラスタータイプ: Shared（無料）またはDedicated
   - クラウドプロバイダー: Google Cloud
   - リージョン: asia-northeast1（東京）推奨
   - クラスター名: 任意（例: claude-code-ai-chat）

3. **データベースユーザーの作成**
   - Database Access → Add New Database User
   - ユーザー名とパスワードを設定
   - 権限: Read and write to any database

4. **ネットワークアクセスの設定**
   - Network Access → Add IP Address
   - 開発時: Add Current IP Address
   - 本番時: Cloud RunのIPレンジを追加（または `0.0.0.0/0` で全許可）

5. **接続文字列の取得**
   - Clusters → Connect → Connect your application
   - Driver: Node.js
   - Version: 6.0 or later
   - 接続文字列をコピー
   - 例: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatbot?retryWrites=true&w=majority`

6. **環境変数の設定**
   - `.env.local`ファイルの`DATABASE_URL`を更新
   - 本番環境の場合はCloud Run Secret Managerに設定

### MongoDB Atlasの管理

#### データベースの確認
- MongoDB Atlas Dashboard → Browse Collections

#### 監視とログ
- MongoDB Atlas Dashboard → Metrics
- MongoDB Atlas Dashboard → Logs

#### バックアップ
- 無料プランではスナップショットが自動で作成されます
- 有料プランではポイントインタイムリカバリが利用可能

## トラブルシューティング

### ローカルMongoDB

**エラー: Cannot connect to the Docker daemon**
- Docker Desktopが起動していることを確認
- Docker Desktopを再起動

**エラー: Authentication failed**
- `.env.local`の`DATABASE_URL`が正しいか確認
- docker-compose.ymlの認証情報と一致しているか確認

**エラー: Port 27017 is already in use**
- 他のMongoDBインスタンスが起動していないか確認
- `lsof -i :27017` でポートを使用しているプロセスを確認

### MongoDB Atlas

**エラー: IP not whitelisted**
- Network Accessで現在のIPアドレスが許可されているか確認
- VPN使用時は注意

**エラー: Authentication failed**
- ユーザー名とパスワードが正しいか確認
- 接続文字列のエンコーディングに注意（特殊文字はURLエンコード）

**エラー: Connection timeout**
- ネットワーク設定を確認
- ファイアウォールやセキュリティグループの設定を確認

## Prismaコマンド

```bash
# Prisma Clientの生成
npx prisma generate

# Prisma Studioの起動
npm run db:studio

# スキーマのフォーマット
npx prisma format

# データベースのリセット（開発時のみ）
npx prisma db push --force-reset
```

## 参考リンク

- [Prisma MongoDB Documentation](https://www.prisma.io/docs/orm/overview/databases/mongodb)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
