/**
 * Mastra設定ファイル
 * Anthropic Claude APIの設定と基本設定を管理
 */

/**
 * 環境変数からAnthropic API Keyを取得
 * Mastraは自動的にANTHROPIC_API_KEYを読み込むため、
 * このファイルでは設定の定数のみを定義
 */
export const MASTRA_CONFIG = {
  /**
   * 使用するAIモデル
   * Claude Sonnet 4.5を指定
   */
  model: "anthropic/claude-sonnet-4-5-20250929" as const,

  /**
   * エージェントID
   */
  agentId: "chat-assistant" as const,

  /**
   * エージェント名
   */
  agentName: "Chat Assistant" as const,

  /**
   * ストリーミング設定
   */
  streaming: true as const,
} as const;

/**
 * API Key検証関数
 * ビルド時はスキップし、ランタイムでのみ検証
 */
export function validateApiKey(): void {
  // ビルド時はスキップ
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set in environment variables. " +
      "Please add it to your .env.local file."
    );
  }
}
