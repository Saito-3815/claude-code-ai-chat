"use client";

import { KeyboardEvent, useRef, useEffect, useState } from "react";
import { ImageAttachment, IMAGE_CONFIG } from "@/lib/types";
import { ImagePreview } from "./ImagePreview";

export interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  image?: ImageAttachment | null;
  onImageChange?: (image: ImageAttachment | null) => void;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "メッセージを入力...",
  image,
  onImageChange,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      if ((value.trim() || image) && !disabled) {
        onSend();
      }
    }
  };

  // 画像ファイルのバリデーションとBase64変換
  const processImageFile = async (file: File): Promise<void> => {
    setUploadError(null);

    // ファイルサイズチェック
    if (file.size > IMAGE_CONFIG.MAX_SIZE) {
      setUploadError(`画像サイズは${IMAGE_CONFIG.MAX_SIZE / 1024 / 1024}MB以下にしてください`);
      return;
    }

    // MIMEタイプチェック
    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
      setUploadError("JPEG, PNG, GIF, WebP形式の画像のみアップロード可能です");
      return;
    }

    try {
      // Base64エンコード
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1]; // data:image/...;base64, の部分を除去

        const imageAttachment: ImageAttachment = {
          data: base64Data,
          mimeType: file.type,
          fileName: file.name,
        };

        onImageChange?.(imageAttachment);
      };

      reader.onerror = () => {
        setUploadError("画像の読み込みに失敗しました");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setUploadError("画像の処理中にエラーが発生しました");
    }
  };

  // ファイル選択ハンドラー
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImageFile(file);
    }
    // input要素をリセット（同じファイルを再選択可能にする）
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ドラッグ&ドロップハンドラー
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      await processImageFile(file);
    } else {
      setUploadError("画像ファイルをドロップしてください");
    }
  };

  // 画像削除ハンドラー
  const handleRemoveImage = () => {
    onImageChange?.(null);
    setUploadError(null);
  };

  return (
    <div className="border-t border-secondary-200 bg-white/80 backdrop-blur-sm p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* 画像プレビュー */}
        {image && (
          <div className="mb-3">
            <ImagePreview image={image} onRemove={handleRemoveImage} size="medium" />
          </div>
        )}

        {/* エラーメッセージ */}
        {uploadError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {uploadError}
          </div>
        )}

        <div
          className={`flex items-end gap-2 sm:gap-3 ${
            isDragging ? "ring-2 ring-primary-500 rounded-xl" : ""
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* 画像アップロードボタン */}
          <div className="flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_CONFIG.ALLOWED_TYPES.join(",")}
              onChange={handleFileChange}
              disabled={disabled}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-10 h-10 rounded-xl bg-secondary-100 hover:bg-secondary-200 text-secondary-600 hover:text-secondary-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              aria-label="画像を添付"
              title="画像を添付（5MB以下）"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>

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
            disabled={disabled || (!value.trim() && !image)}
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
          で改行 / ドラッグ&ドロップで画像添付
        </p>
      </div>
    </div>
  );
}
