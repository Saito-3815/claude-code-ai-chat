"use client";

import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { LoadingIndicator } from "./LoadingIndicator";

export function ChatInterface() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    streamingMessage,
  } = useChat({
    onError: (err) => {
      console.error("Chat error:", err);
    },
  });

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50">
      {/* ヘッダー */}
      <div className="border-b border-secondary-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
            <h1 className="text-lg sm:text-xl font-semibold text-secondary-900 tracking-tight">
              <span className="hidden sm:inline">AI Chat Assistant</span>
              <span className="sm:hidden">AI Chat</span>
            </h1>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              disabled={isLoading}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span className="hidden sm:inline">会話をクリア</span>
              <span className="sm:hidden">クリア</span>
            </button>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-900">エラーが発生しました</p>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* メッセージリスト */}
      <MessageList messages={messages} streamingMessage={streamingMessage} />

      {/* ローディングインジケーター */}
      {isLoading && !streamingMessage && <LoadingIndicator />}

      {/* 入力フィールド */}
      <MessageInput
        value={input}
        onChange={setInput}
        onSend={() => sendMessage()}
        disabled={isLoading}
      />
    </div>
  );
}
