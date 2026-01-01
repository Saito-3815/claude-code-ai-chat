"use client";

import { KeyboardEvent, useRef, useEffect } from "react";

export interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "メッセージを入力...",
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // テキストエリアの高さを自動調整
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  // Enterキーで送信（Shift+Enterで改行）
  // IME変換中（日本語入力の変換中）は送信しない
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="border-t border-secondary-200 bg-white/80 backdrop-blur-sm p-3 sm:p-4 md:p-6">
      <div className="flex items-end gap-2 sm:gap-3 max-w-5xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="w-full resize-none rounded-xl border-2 border-secondary-200 px-3 py-2.5 sm:px-4 sm:py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-secondary-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            style={{ maxHeight: "200px", overflowY: "auto" }}
          />
        </div>
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="group rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 px-4 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-white hover:from-primary-700 hover:to-primary-800 disabled:from-secondary-300 disabled:to-secondary-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-sm flex items-center gap-1.5 sm:gap-2"
        >
          <span className="hidden sm:inline">送信</span>
          <svg
            className="w-4 h-4 sm:group-hover:translate-x-0.5 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
      <p className="hidden sm:block text-xs text-secondary-500 mt-3 text-center">
        <kbd className="px-2 py-0.5 bg-secondary-100 rounded text-secondary-700 font-mono text-xs">
          Enter
        </kbd>{" "}
        で送信 /{" "}
        <kbd className="px-2 py-0.5 bg-secondary-100 rounded text-secondary-700 font-mono text-xs">
          Shift + Enter
        </kbd>{" "}
        で改行
      </p>
    </div>
  );
}
