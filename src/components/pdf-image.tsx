"use client";

import { useEffect, useRef, useState } from "react";

interface PdfImageProps {
  url: string;
  className?: string;
}

/**
 * Renders a PDF as an image using pdf.js canvas rendering.
 * Shows all pages stacked vertically.
 * Falls back to an <img> tag if pdf.js fails (e.g. the file is actually an image).
 */
export default function PdfImage({ url, className = "" }: PdfImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackToImg, setFallbackToImg] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderPdf() {
      try {
        // First fetch the data to check content type and get the bytes
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch document (HTTP ${response.status}).`);
        }

        const contentType = response.headers.get("content-type") ?? "";
        const arrayBuffer = await response.arrayBuffer();

        if (cancelled) return;

        // If the server tells us it's an image, fall back to <img> immediately
        if (contentType.startsWith("image/")) {
          setFallbackToImg(true);
          setLoading(false);
          return;
        }

        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        if (cancelled || !containerRef.current) return;

        // Clear previous renders
        containerRef.current.innerHTML = "";

        // Render each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const scale = 1.5;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          if (i > 1) canvas.style.marginTop = "8px";

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await page.render({ canvasContext: ctx, viewport } as any).promise;

          if (!cancelled && containerRef.current) {
            containerRef.current.appendChild(canvas);
          }
        }

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error("PDF render error:", err);
          // Fall back to <img> — the file might not be a real PDF
          setFallbackToImg(true);
          setLoading(false);
        }
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Fallback: render as an image instead
  if (fallbackToImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Document preview"
        className={`w-full rounded-md object-contain ${className}`}
        onError={() => {
          setFallbackToImg(false);
          setError("Failed to load document preview.");
        }}
      />
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 p-4 text-sm text-gray-400 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={className}>
      {loading && (
        <div className="flex items-center justify-center py-8">
          <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
      <div ref={containerRef} className="overflow-hidden rounded-md" />
    </div>
  );
}
