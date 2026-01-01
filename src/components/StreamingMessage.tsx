"use client";

export interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  if (!content) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 sm:gap-4">
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
        <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-md border border-secondary-100">
          <p className="text-sm text-secondary-900 leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            <div
              className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
