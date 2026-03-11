"use client";

import { useEffect, useState } from "react";

interface PdfImageProps {
  url: string;
  className?: string;
}

/**
 * Renders a PDF preview using the browser's native PDF viewer (iframe).
 * Falls back to a download link if the iframe fails.
 */
export default function PdfImage({ url, className = "" }: PdfImageProps) {
  const [contentType, setContentType] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Check content type to handle misdetected files
  useEffect(() => {
    fetch(url, { method: "HEAD" })
      .then((res) => {
        setContentType(res.headers.get("content-type") ?? "application/pdf");
      })
      .catch(() => {
        setContentType("application/pdf");
      });
  }, [url]);

  if (!contentType) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // If the proxy says it's actually an image, render as img
  if (contentType.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Document preview"
        className={`w-full rounded-md object-contain ${className}`}
      />
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-gray-50 p-6 ${className}`}>
        <p className="text-sm text-gray-400">PDF preview unavailable.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          Open PDF in new tab
        </a>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title="PDF preview"
      className={`min-h-[500px] w-full rounded-md border-0 ${className}`}
      onError={() => setError(true)}
    />
  );
}
