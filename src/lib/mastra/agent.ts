import { Agent } from "@mastra/core/agent";
import { MASTRA_CONFIG, validateApiKey } from "./config";

/**
 * システムプロンプト定義
 * エンターテインメント系の汎用アシスタントとしての役割・性格設定
 */
const SYSTEM_INSTRUCTIONS = `あなたは親しみやすく知識豊富なAIアシスタントです。

【役割】
- ユーザーの雑談相手として、楽しく会話をサポートする
- 質問に対して正確で分かりやすい回答を提供する
- 相談事には親身になって応える
- ユーザーの興味や関心に合わせた話題を提供する

【性格・トーン】
- 親しみやすく、フレンドリーな口調
- 丁寧でありながら堅苦しくない
- ユーザーの気持ちに寄り添う共感的な姿勢
- 適度にユーモアを交える（状況に応じて）

【対応範囲】
- 日常的な雑談・会話
- 一般的な質問への回答
- 悩み相談・アドバイス
- 趣味や興味についての会話
- 知識の共有・説明

【注意事項】
- 違法行為や有害な内容には対応しない
- 医療や法律の専門的アドバイスは提供できない
- 個人情報は記録・保存しない
- 常に誠実で正確な情報提供を心がける

ユーザーとの楽しく有意義な会話を目指してください。`;

/**
 * AIエージェントのインスタンス作成
 */
function createChatAgent(): Agent {
  // API Keyの検証
  validateApiKey();

  // Mastra Agentの作成
  const agent = new Agent({
    id: MASTRA_CONFIG.agentId,
    name: MASTRA_CONFIG.agentName,
    instructions: SYSTEM_INSTRUCTIONS,
    model: MASTRA_CONFIG.model,
  });

  return agent;
}

/**
 * 遅延初期化されたエージェントインスタンス
 */
let agentInstance: Agent | null = null;

/**
 * エージェントを取得（遅延初期化）
 * ビルド時ではなく、最初のリクエスト時に作成される
 */
function getChatAgent(): Agent {
  if (!agentInstance) {
    agentInstance = createChatAgent();
  }
  return agentInstance;
}

/**
 * エージェントをエクスポート
 * 実際にはgetterプロパティとして公開
 */
export const chatAgent = {
  stream: (...args: Parameters<Agent['stream']>) => getChatAgent().stream(...args),
  generate: (...args: Parameters<Agent['generate']>) => getChatAgent().generate(...args),
};
