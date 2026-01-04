/**
 * チャットメッセージの型定義
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * 画像添付の型定義
 */
export interface ImageAttachment {
  data: string; // Base64エンコードされた画像データ
  mimeType: string; // image/jpeg, image/png, etc.
  fileName?: string;
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
  image?: ImageAttachment; // 画像添付（オプション）
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

/**
 * 画像バリデーション設定
 */
export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
} as const;
