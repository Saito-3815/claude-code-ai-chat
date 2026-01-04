"use client";

import { ImageAttachment } from "@/lib/types";

export interface ImagePreviewProps {
  image: ImageAttachment;
  onRemove?: () => void;
  size?: "small" | "medium" | "large";
  className?: string;
}

export function ImagePreview({
  image,
  onRemove,
  size = "medium",
  className = "",
}: ImagePreviewProps) {
  const sizeClasses = {
    small: "w-20 h-20",
    medium: "w-32 h-32",
    large: "w-48 h-48",
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-lg overflow-hidden border-2 border-secondary-200 shadow-sm`}
      >
        <img
          src={`data:${image.mimeType};base64,${image.data}`}
          alt={image.fileName || "添付画像"}
          className="w-full h-full object-cover"
        />
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors duration-200"
          aria-label="画像を削除"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
