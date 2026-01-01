"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { StreamingMessage } from "./StreamingMessage";

export interface MessageListProps {
  messages: ChatMessage[];
  streamingMessage?: string;
}

export function MessageList({ messages, streamingMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  if (messages.length === 0 && !streamingMessage) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-secondary-900 mb-3">
            チャットを始めましょう
          </h3>
          <p className="text-sm text-secondary-500 leading-relaxed">
            メッセージを入力して送信してください。<br />
            AIアシスタントがお手伝いします。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
      <div className="max-w-5xl mx-auto space-y-6">
        {messages.map((message, index) => (
          <div key={index} className="flex items-start gap-3 sm:gap-4">
            {message.role === "user" ? (
              <>
                <div className="flex-1" />
                <div className="flex flex-col items-end gap-2 max-w-[85%] sm:max-w-3xl">
                  <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md hover:shadow-lg transition-shadow duration-200">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-secondary-700 to-secondary-800 flex items-center justify-center shadow-md">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </>
            ) : (
              <>
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 max-w-[85%] sm:max-w-3xl">
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-md hover:shadow-lg transition-shadow duration-200 border border-secondary-100">
                    <p className="text-sm text-secondary-900 leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {streamingMessage && <StreamingMessage content={streamingMessage} />}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
