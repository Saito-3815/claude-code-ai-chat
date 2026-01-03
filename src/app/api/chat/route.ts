import { NextRequest } from "next/server";
import { chatAgent } from "@/lib/mastra/agent";
import type { ChatMessage, ChatRequest, StreamChunk, ImageAttachment } from "@/lib/types";
import { IMAGE_CONFIG } from "@/lib/types";
import type { CoreMessage } from "ai";

const MAX_MESSAGE_LENGTH = 10000;
const MAX_MESSAGES = 50;

/**
 * 画像のバリデーション
 */
function validateImage(image: ImageAttachment): void {
  if (!image.data || !image.mimeType) {
    throw new Error("Invalid image attachment: missing data or mimeType");
  }

  if (!(IMAGE_CONFIG.ALLOWED_TYPES as readonly string[]).includes(image.mimeType)) {
    throw new Error(
      `Invalid image type: ${image.mimeType}. Allowed types: ${IMAGE_CONFIG.ALLOWED_TYPES.join(", ")}`
    );
  }

  // Base64デコードしてサイズを確認
  try {
    const binaryString = atob(image.data);
    const bytes = binaryString.length;
    if (bytes > IMAGE_CONFIG.MAX_SIZE) {
      throw new Error(
        `Image size exceeds maximum allowed size of ${IMAGE_CONFIG.MAX_SIZE / 1024 / 1024}MB`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("exceeds maximum")) {
      throw error;
    }
    throw new Error("Invalid Base64 image data");
  }
}

/**
 * メッセージのバリデーションとサニタイゼーション
 */
function validateAndSanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Messages must be a non-empty array");
  }

  if (messages.length > MAX_MESSAGES) {
    throw new Error(`Too many messages. Maximum ${MAX_MESSAGES} messages allowed`);
  }

  return messages.map((msg, index) => {
    if (!msg.role || !msg.content) {
      throw new Error(`Message at index ${index} is missing role or content`);
    }

    if (!["user", "assistant", "system"].includes(msg.role)) {
      throw new Error(`Invalid role "${msg.role}" at index ${index}`);
    }

    if (typeof msg.content !== "string") {
      throw new Error(`Content at index ${index} must be a string`);
    }

    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(
        `Message at index ${index} exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`
      );
    }

    // 画像がある場合はバリデーション
    if (msg.image) {
      validateImage(msg.image);
    }

    return {
      role: msg.role,
      content: msg.content.trim(),
      image: msg.image,
    };
  });
}

/**
 * ストリーミングレスポンスを作成
 */
async function createStreamingResponse(messages: ChatMessage[]) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ChatMessage[]をCoreMessage[]に変換（マルチモーダル対応）
        const coreMessages: CoreMessage[] = messages.map((msg) => {
          // 画像がある場合はマルチモーダルコンテンツとして扱う
          if (msg.image) {
            return {
              role: msg.role,
              content: [
                {
                  type: "image" as const,
                  image: `data:${msg.image.mimeType};base64,${msg.image.data}`,
                },
                {
                  type: "text" as const,
                  text: msg.content,
                },
              ],
            };
          }

          // テキストのみの場合
          return {
            role: msg.role,
            content: msg.content,
          };
        });

        const mastraStream = await chatAgent.stream(coreMessages);

        for await (const chunk of mastraStream.textStream) {
          const streamChunk: StreamChunk = {
            type: "text",
            content: chunk,
          };
          const data = `data: ${JSON.stringify(streamChunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        const doneChunk: StreamChunk = {
          type: "done",
        };
        const doneData = `data: ${JSON.stringify(doneChunk)}\n\n`;
        controller.enqueue(encoder.encode(doneData));
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        const errorChunk: StreamChunk = {
          type: "error",
          error: errorMessage,
        };
        const errorData = `data: ${JSON.stringify(errorChunk)}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    },
  });

  return stream;
}

/**
 * POSTメソッド: チャットメッセージを受け取り、ストリーミングレスポンスを返す
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;

    const sanitizedMessages = validateAndSanitizeMessages(body.messages);

    const stream = await createStreamingResponse(sanitizedMessages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
