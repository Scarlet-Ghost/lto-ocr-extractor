"use client";

import { useCallback, useRef, useState } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Invalid file type. Please upload a JPEG, PNG, or PDF.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "File exceeds 10 MB limit.";
  }
  return null;
}

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export default function UploadZone({
  onFileSelected,
  isLoading = false,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setPreview(null);
        return;
      }

      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreview({ url, type: "image", name: file.name });
      } else {
        setPreview({ url: "", type: "pdf", name: file.name });
      }

      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="relative">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          error
            ? "border-red-400 bg-red-50"
            : isDragOver
              ? "border-primary bg-blue-50"
              : "border-gray-300 bg-neutral-light hover:border-primary/50"
        }`}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80">
            <div className="flex flex-col items-center gap-2">
              <svg
                className="h-8 w-8 animate-spin text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm font-medium text-primary">
                Extracting...
              </span>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview ? (
          <div className="flex flex-col items-center gap-3">
            {preview.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt="Preview"
                className="h-32 w-auto rounded-md object-contain shadow-sm"
              />
            ) : (
              <div className="flex h-32 w-24 items-center justify-center rounded-md bg-red-100 text-red-600">
                <svg
                  className="h-12 w-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h4v2h-4v-2zm0 3h4v2h-4v-2zm-2-3h1v2H8v-2zm0 3h1v2H8v-2z" />
                </svg>
              </div>
            )}
            <p className="text-sm font-medium text-neutral-dark">
              {preview.name}
            </p>
            <p className="text-xs text-gray-500">Click or drop to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="h-10 w-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm font-medium text-neutral-dark">
              Drop OR/CR document here
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG, or PDF up to 10MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Browse button */}
      {!preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mx-auto mt-3 block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          Browse Files
        </button>
      )}

      {/* Error message */}
      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
