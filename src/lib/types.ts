/**
 * チャットメッセージの型定義
 */
export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

/**
 * APIリクエスト・レスポンスの型定義
 */
export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  error?: string;
}

/**
 * ストリーミングレスポンスのチャンク型
 */
export interface StreamChunk {
  type: "text" | "done" | "error";
  content?: string;
  error?: string;
}
