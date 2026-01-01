"use client";

export function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-3 shadow-md border border-secondary-100">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" />
          <div
            className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
        <span className="text-sm text-secondary-600 font-medium">
          入力中...
        </span>
      </div>
    </div>
  );
}
