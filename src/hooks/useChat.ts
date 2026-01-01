"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage, StreamChunk } from "@/lib/types";

export interface UseChatOptions {
  initialMessages?: ChatMessage[];
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content?: string) => Promise<void>;
  clearMessages: () => void;
  streamingMessage: string;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { initialMessages = [], onError } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [streamingMessage, setStreamingMessage] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content?: string) => {
      const messageContent = content || input.trim();

      if (!messageContent || isLoading) {
        return;
      }

      // 新しいユーザーメッセージを作成
      const userMessage: ChatMessage = {
        role: "user",
        content: messageContent,
        timestamp: new Date(),
      };

      // メッセージを追加
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);
      setStreamingMessage("");

      // AbortControllerを作成
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send message");
        }

        // ストリーミングレスポンスを処理
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Response body is not readable");
        }

        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              try {
                const parsed: StreamChunk = JSON.parse(data);

                if (parsed.type === "text" && parsed.content) {
                  assistantContent += parsed.content;
                  setStreamingMessage(assistantContent);
                } else if (parsed.type === "done") {
                  // ストリーミング完了
                  const assistantMessage: ChatMessage = {
                    role: "assistant",
                    content: assistantContent,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  setStreamingMessage("");
                } else if (parsed.type === "error") {
                  throw new Error(parsed.error || "Streaming error occurred");
                }
              } catch (parseError) {
                console.error("Failed to parse stream chunk:", parseError);
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            console.log("Request was aborted");
          } else {
            setError(err);
            onError?.(err);
          }
        } else {
          const unknownError = new Error("An unknown error occurred");
          setError(unknownError);
          onError?.(unknownError);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [input, messages, isLoading, onError]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setInput("");
    setError(null);
    setStreamingMessage("");
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    streamingMessage,
  };
}
